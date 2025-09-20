import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe/client'
import { prisma } from '@/lib/db/prisma'
import { PaymentStatus } from '@prisma/client'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

    // Construct and verify the event
    const event = await constructWebhookEvent(body, signature)

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object as Stripe.Charge)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent

  if (metadata?.appointmentId) {
    // Update appointment payment
    await prisma.payment.updateMany({
      where: {
        appointment_id: metadata.appointmentId,
        stripe_payment_intent_id: paymentIntent.id,
      },
      data: {
        status: PaymentStatus.COMPLETED,
        paid_at: new Date(),
        gateway_response: paymentIntent as any,
      },
    })

    // Update appointment status
    await prisma.appointment.update({
      where: { id: metadata.appointmentId },
      data: { status: 'CONFIRMED' },
    })
  }

  if (metadata?.orderId) {
    // Update order payment
    await prisma.ecommercePayment.updateMany({
      where: {
        order_id: metadata.orderId,
        stripe_payment_intent_id: paymentIntent.id,
      },
      data: {
        status: PaymentStatus.COMPLETED,
        processed_at: new Date(),
        gateway_response: paymentIntent as any,
      },
    })

    // Update order status
    await prisma.ecommerceOrder.update({
      where: { id: metadata.orderId },
      data: {
        status: 'CONFIRMED',
        payment_status: PaymentStatus.COMPLETED,
      },
    })
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent

  if (metadata?.appointmentId) {
    await prisma.payment.updateMany({
      where: {
        appointment_id: metadata.appointmentId,
        stripe_payment_intent_id: paymentIntent.id,
      },
      data: {
        status: PaymentStatus.FAILED,
        failed_at: new Date(),
        gateway_response: paymentIntent as any,
      },
    })
  }

  if (metadata?.orderId) {
    await prisma.ecommercePayment.updateMany({
      where: {
        order_id: metadata.orderId,
        stripe_payment_intent_id: paymentIntent.id,
      },
      data: {
        status: PaymentStatus.FAILED,
        failed_at: new Date(),
        gateway_response: paymentIntent as any,
      },
    })
  }
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  // Update payment records with charge ID
  const { metadata } = charge

  if (metadata?.appointmentId) {
    await prisma.payment.updateMany({
      where: {
        appointment_id: metadata.appointmentId,
        stripe_payment_intent_id: charge.payment_intent as string,
      },
      data: {
        reference_number: charge.id,
        gateway_response: charge as any,
      },
    })
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const { metadata, refunds } = charge

  if (metadata?.appointmentId && refunds) {
    const refundAmount = refunds.data.reduce((sum, r) => sum + r.amount, 0) / 100

    // Create refund record
    await prisma.refund.create({
      data: {
        payment_id: metadata.paymentId,
        refund_number: refunds.data[0].id,
        amount: refundAmount,
        status: 'COMPLETED',
        gateway_response: refunds as any,
        processed_at: new Date(),
      },
    })

    // Update payment status
    if (refundAmount === charge.amount / 100) {
      await prisma.payment.update({
        where: { id: metadata.paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          refunded_at: new Date(),
        },
      })
    } else {
      await prisma.payment.update({
        where: { id: metadata.paymentId },
        data: {
          status: PaymentStatus.PARTIALLY_REFUNDED,
        },
      })
    }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const { metadata } = subscription

  if (metadata?.customerId) {
    await prisma.subscription.create({
      data: {
        tenant_id: metadata.tenantId,
        customer_id: metadata.customerId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        status: mapStripeStatus(subscription.status),
        interval: mapInterval(subscription.items.data[0].price?.recurring?.interval),
        interval_count: subscription.items.data[0].price?.recurring?.interval_count || 1,
        price_per_cycle: (subscription.items.data[0].price?.unit_amount || 0) / 100,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        metadata: subscription as any,
      },
    })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripe_subscription_id: subscription.id },
    data: {
      status: mapStripeStatus(subscription.status),
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      metadata: subscription as any,
      updated_at: new Date(),
    },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripe_subscription_id: subscription.id },
    data: {
      status: 'CANCELLED',
      cancelled_at: new Date(),
      ended_at: new Date(),
      cancellation_reason: subscription.cancellation_details?.reason,
    },
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const { subscription, metadata } = invoice

  if (subscription) {
    // Update subscription billing
    await prisma.subscriptionBilling.create({
      data: {
        subscription_id: metadata?.subscriptionId,
        billing_date: new Date(),
        amount: (invoice.amount_paid || 0) / 100,
        status: 'SUCCESS',
        stripe_invoice_id: invoice.id,
        paid_at: new Date(),
      },
    })

    // Update subscription metrics
    await prisma.subscription.updateMany({
      where: { stripe_subscription_id: subscription as string },
      data: {
        successful_payments: { increment: 1 },
        total_revenue: { increment: (invoice.amount_paid || 0) / 100 },
      },
    })
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const { subscription, metadata } = invoice

  if (subscription) {
    // Record failed payment
    await prisma.subscriptionBilling.create({
      data: {
        subscription_id: metadata?.subscriptionId,
        billing_date: new Date(),
        amount: (invoice.amount_due || 0) / 100,
        status: 'FAILED',
        stripe_invoice_id: invoice.id,
        failed_at: new Date(),
        failure_reason: 'Payment failed',
      },
    })

    // Update subscription metrics
    await prisma.subscription.updateMany({
      where: { stripe_subscription_id: subscription as string },
      data: {
        failed_payments: { increment: 1 },
        status: 'PAYMENT_FAILED',
      },
    })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { metadata } = session

  if (metadata?.type === 'appointment' && metadata?.appointmentId) {
    // Handle appointment booking payment
    await prisma.appointment.update({
      where: { id: metadata.appointmentId },
      data: {
        status: 'CONFIRMED',
      },
    })
  }

  if (metadata?.type === 'order' && metadata?.orderId) {
    // Handle e-commerce order payment
    await prisma.ecommerceOrder.update({
      where: { id: metadata.orderId },
      data: {
        status: 'CONFIRMED',
        payment_status: PaymentStatus.COMPLETED,
      },
    })

    // Clear cart if exists
    if (metadata?.cartId) {
      await prisma.cart.update({
        where: { id: metadata.cartId },
        data: {
          status: 'CONVERTED',
          converted_at: new Date(),
          order_id: metadata.orderId,
        },
      })
    }
  }
}

// Helper functions

function mapStripeStatus(status: string): any {
  const statusMap: Record<string, any> = {
    active: 'ACTIVE',
    past_due: 'PAYMENT_FAILED',
    canceled: 'CANCELLED',
    unpaid: 'PAYMENT_FAILED',
    trialing: 'ACTIVE',
    paused: 'PAUSED',
  }
  return statusMap[status] || 'ACTIVE'
}

function mapInterval(interval?: string): any {
  const intervalMap: Record<string, any> = {
    day: 'DAILY',
    week: 'WEEKLY',
    month: 'MONTHLY',
    year: 'YEARLY',
  }
  return intervalMap[interval || 'month'] || 'MONTHLY'
}