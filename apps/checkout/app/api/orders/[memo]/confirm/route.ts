import { NextRequest, NextResponse } from 'next/server'
import { db, orders } from '@better-pay/database'
import { eq } from 'drizzle-orm'

interface ConfirmRequest {
  txHash: string
  customerAddress: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memo: string }> }
) {
  try {
    const { memo } = await params
    const body: ConfirmRequest = await request.json()

    if (!body.txHash || !body.customerAddress) {
      return NextResponse.json(
        { error: 'Missing txHash or customerAddress' },
        { status: 400 }
      )
    }

    // Update order status
    const [updated] = await db
      .update(orders)
      .set({
        status: 'paid',
        txHash: body.txHash,
        customerAddress: body.customerAddress,
        paidAt: new Date(),
      })
      .where(eq(orders.memo, memo))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // TODO: Trigger webhook to merchant

    return NextResponse.json({
      success: true,
      order: {
        id: updated.id,
        status: updated.status,
        txHash: updated.txHash,
      },
    })
  } catch (error) {
    console.error('Confirm order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
