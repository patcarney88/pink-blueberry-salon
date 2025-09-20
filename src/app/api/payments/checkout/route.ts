import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// POST create checkout session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { type, items, appointmentId } = await request.json()

    let line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    let metadata: any = { userId, type }

    if (type === 'appointment' && appointmentId) {
      // Payment for appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { service: true },
      })

      if (!appointment || appointment.customerId !== userId) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        )
      }

      line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: appointment.service.name,
              description: appointment.service.description,
            },
            unit_amount: Math.round(appointment.price * 100),
          },
          quantity: 1,
        },
      ]
      metadata.appointmentId = appointmentId
    } else if (type === 'products' && items) {
      // Payment for products
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      })

      if (!cart || cart.items.length === 0) {
        return NextResponse.json(
          { error: 'Cart is empty' },
          { status: 400 }
        )
      }

      line_items = cart.items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            description: item.product.description,
          },
          unit_amount: Math.round(item.product.price * 100),
        },
        quantity: item.quantity,
      }))

      // Create order
      const total = cart.items.reduce(
        (sum, item) => sum + (item.product.price * item.quantity),
        0
      )

      const order = await prisma.order.create({
        data: {
          userId,
          total,
          status: 'PENDING',
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      })

      metadata.orderId = order.id
    } else {
      return NextResponse.json(
        { error: 'Invalid payment type' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payment-cancelled`,
      metadata,
      customer_email: session.user.email || undefined,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}