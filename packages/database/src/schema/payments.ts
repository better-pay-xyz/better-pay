import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { merchants } from './merchants'
import { customers } from './customers'
import { orders } from './orders'
import { subscriptions } from './subscriptions'

export const paymentStatus = ['success', 'failed', 'pending'] as const
export type PaymentStatus = typeof paymentStatus[number]

export const payments = pgTable('payments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `pay_${createId()}`),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
  subscriptionId: text('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  amount: text('amount').notNull(),
  currency: text('currency').notNull(),
  txHash: text('tx_hash').notNull(),
  status: text('status').notNull().$type<PaymentStatus>().default('pending'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
