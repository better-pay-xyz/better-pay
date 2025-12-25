import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { orderService } from '../services/order.service'
import { createOrderSchema } from '@better-pay/shared/types'
import type { Merchant } from '@better-pay/database'

type Variables = {
  merchant: Merchant
}

const orders = new Hono<{ Variables: Variables }>()

// Create order
orders.post('/', authMiddleware, async (c) => {
  const merchant = c.get('merchant') as Merchant
  const body = await c.req.json()

  // Validate request
  const validated = createOrderSchema.parse(body)

  // Create order
  const order = await orderService.createOrder(merchant.id, {
    amount: validated.amount,
    currency: validated.currency,
    metadata: validated.metadata,
    expiresIn: validated.expires_in
  })

  // TODO: Register order onchain

  return c.json({
    id: order.id,
    status: order.status,
    payment_url: order.paymentUrl,
    amount: order.amount,
    currency: order.currency,
    created_at: order.createdAt.toISOString(),
    expires_at: order.expiresAt.toISOString()
  })
})

// Get order
orders.get('/:orderId', authMiddleware, async (c) => {
  const merchant = c.get('merchant') as Merchant
  const orderId = c.req.param('orderId')

  const order = await orderService.getOrder(orderId, merchant.id)

  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }

  return c.json({
    id: order.id,
    status: order.status,
    amount: order.amount,
    currency: order.currency,
    customer_address: order.customerAddress,
    tx_hash: order.txHash,
    paid_at: order.paidAt?.toISOString(),
    created_at: order.createdAt.toISOString(),
    expires_at: order.expiresAt.toISOString(),
    metadata: order.metadata
  })
})

// List orders
orders.get('/', authMiddleware, async (c) => {
  const merchant = c.get('merchant') as Merchant
  const limit = parseInt(c.req.query('limit') || '20')

  const ordersList = await orderService.listOrders(merchant.id, limit)

  return c.json({
    data: ordersList.map((order) => ({
      id: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      created_at: order.createdAt.toISOString()
    })),
    has_more: ordersList.length === limit
  })
})

export default orders
