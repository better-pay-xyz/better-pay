import { NextResponse } from 'next/server'
import { db, paymentLinks, orders, merchants } from '@better-pay/database'
import { eq, and, sql } from 'drizzle-orm'
import { generateMemo } from '@better-pay/shared/utils'

interface RouteParams {
  params: Promise<{ linkId: string }>
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { linkId } = await params

    // Get the payment link with merchant info
    const [link] = await db
      .select({
        id: paymentLinks.id,
        merchantId: paymentLinks.merchantId,
        title: paymentLinks.title,
        amount: paymentLinks.amount,
        currency: paymentLinks.currency,
        isActive: paymentLinks.isActive,
        tempoAddress: merchants.tempoAddress
      })
      .from(paymentLinks)
      .innerJoin(merchants, eq(paymentLinks.merchantId, merchants.id))
      .where(and(eq(paymentLinks.id, linkId), eq(paymentLinks.isActive, true)))
      .limit(1)

    if (!link) {
      return NextResponse.json({ error: 'Payment link not found or inactive' }, { status: 404 })
    }

    // Validate merchant has configured a valid wallet address
    if (!link.tempoAddress || link.tempoAddress === ZERO_ADDRESS) {
      return NextResponse.json(
        { error: 'Merchant has not configured a payment wallet. Please contact the merchant.' },
        { status: 400 }
      )
    }

    // Generate unique memo for this order
    const memo = generateMemo()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        merchantId: link.merchantId,
        paymentLinkId: link.id,
        amount: link.amount,
        currency: link.currency,
        memo,
        status: 'pending',
        paymentUrl: `/pay/${memo}`,
        expiresAt,
        metadata: {
          paymentLinkTitle: link.title,
          paymentLinkId: link.id
        }
      })
      .returning()

    // Update payment link stats (increment payment count will be done when payment succeeds)
    // For now, we just created the order

    return NextResponse.json({
      orderId: order.id,
      paymentUrl: `/pay/${memo}`
    })
  } catch (error) {
    console.error('Error creating order from payment link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
