import { pgTable, text, timestamp, json } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { merchants } from './merchants'

export const orderStatus = ['pending', 'paid', 'expired', 'cancelled'] as const
export type OrderStatus = typeof orderStatus[number]

export const orders = pgTable('orders', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `ord_${createId()}`),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  amount: text('amount').notNull(),
  currency: text('currency').notNull(),
  memo: text('memo').notNull().unique(),
  status: text('status').notNull().$type<OrderStatus>().default('pending'),
  paymentUrl: text('payment_url').notNull(),
  customerAddress: text('customer_address'),
  txHash: text('tx_hash'),
  paidAt: timestamp('paid_at'),
  expiresAt: timestamp('expires_at').notNull(),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
