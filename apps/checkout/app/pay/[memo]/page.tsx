import { notFound } from 'next/navigation'
import { db, orders, merchants } from '@better-pay/database'
import { eq } from 'drizzle-orm'
import { PaymentClient } from './payment-client'

interface PageProps {
  params: Promise<{ memo: string }>
}

export default async function PaymentPage({ params }: PageProps) {
  const { memo } = await params

  // Fetch order with merchant info
  const result = await db
    .select({
      id: orders.id,
      memo: orders.memo,
      amount: orders.amount,
      currency: orders.currency,
      status: orders.status,
      expiresAt: orders.expiresAt,
      metadata: orders.metadata,
      merchantName: merchants.name,
      merchantAddress: merchants.tempoAddress,
    })
    .from(orders)
    .leftJoin(merchants, eq(orders.merchantId, merchants.id))
    .where(eq(orders.memo, memo))
    .limit(1)

  const orderData = result[0]

  if (!orderData || !orderData.merchantAddress) {
    notFound()
  }

  // Transform to expected shape
  const order = {
    id: orderData.id,
    memo: orderData.memo,
    amount: orderData.amount,
    currency: orderData.currency,
    status: orderData.status,
    expiresAt: orderData.expiresAt.toISOString(),
    merchant: {
      name: orderData.merchantName || 'Unknown Merchant',
      tempoAddress: orderData.merchantAddress,
    },
    metadata: orderData.metadata as { success_url?: string } | null,
  }

  return <PaymentClient order={order} />
}
