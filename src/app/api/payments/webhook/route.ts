import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, type, appointmentId, orderId } = session.metadata!

        if (type === 'appointment' && appointmentId) {
          // Update appointment status
          await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CONFIRMED' },
          })

          // Create payment record
          await prisma.payment.create({
            data: {
              appointmentId,
              amount: session.amount_total! / 100,
              status: 'SUCCEEDED',
              method: 'stripe',
              stripePaymentId: session.payment_intent as string,
            },
          })

          // Award loyalty points (10% of purchase)
          const points = Math.floor((session.amount_total! / 100) * 0.1)
          await prisma.loyaltyPoints.upsert({
            where: { userId },
            create: {
              userId,
              points,
            },
            update: {
              points: { increment: points },
            },
          })
        } else if (type === 'products' && orderId) {
          // Update order status
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'PROCESSING' },
          })

          // Create payment record
          await prisma.payment.create({
            data: {
              orderId,
              amount: session.amount_total! / 100,
              status: 'SUCCEEDED',
              method: 'stripe',
              stripePaymentId: session.payment_intent as string,
            },
          })

          // Clear the user's cart
          const cart = await prisma.cart.findUnique({
            where: { userId },
          })
          if (cart) {
            await prisma.cartItem.deleteMany({
              where: { cartId: cart.id },
            })
          }

          // Update product stock
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          })
          if (order) {
            for (const item of order.items) {
              await prisma.product.update({
                where: { id: item.productId },
                data: {
                  stock: { decrement: item.quantity },
                },
              })
            }
          }

          // Award loyalty points (10% of purchase)
          const points = Math.floor((session.amount_total! / 100) * 0.1)
          await prisma.loyaltyPoints.upsert({
            where: { userId },
            create: {
              userId,
              points,
            },
            update: {
              points: { increment: points },
            },
          })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id)
        // Handle failed payment (update order/appointment status)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}