import { db, NewOrder, Order, orderStatus } from '@better-pay/database'
import { generateMemo } from '@better-pay/shared/utils'
import { eq, and, desc } from 'drizzle-orm'
import { orders } from '@better-pay/database'

export class OrderService {
  async createOrder(
    merchantId: string,
    data: {
      amount: string
      currency: string
      metadata?: Record<string, any>
      expiresIn: number
    }
  ): Promise<Order> {
    const memo = generateMemo()
    const expiresAt = new Date(Date.now() + data.expiresIn * 1000)

    const [order] = await db
      .insert(orders)
      .values({
        merchantId,
        amount: data.amount,
        currency: data.currency,
        memo,
        status: 'pending',
        paymentUrl: `${process.env.NEXT_PUBLIC_PAYMENT_URL}/pay/${memo}`,
        expiresAt,
        metadata: data.metadata
      })
      .returning()

    return order
  }

  async getOrder(orderId: string, merchantId: string): Promise<Order | null> {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)))
      .limit(1)

    return order || null
  }

  async getOrderByMemo(memo: string): Promise<Order | null> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.memo, memo))
      .limit(1)

    return order || null
  }

  async updateOrderStatus(
    orderId: string,
    status: typeof orderStatus[number],
    data?: {
      customerAddress?: string
      txHash?: string
      paidAt?: Date
    }
  ): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status,
        ...data
      })
      .where(eq(orders.id, orderId))
      .returning()

    return updatedOrder
  }

  async listOrders(
    merchantId: string,
    limit: number = 20
  ): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.merchantId, merchantId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
  }
}

export const orderService = new OrderService()
