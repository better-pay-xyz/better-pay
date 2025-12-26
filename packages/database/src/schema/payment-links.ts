import { pgTable, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { merchants } from './merchants'

export const paymentLinks = pgTable('payment_links', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `pl_${createId()}`),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),

  // Product info
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  amount: text('amount').notNull(),
  currency: text('currency').notNull().default('USDC'),

  // Status and stats
  isActive: boolean('is_active').notNull().default(true),
  viewCount: integer('view_count').notNull().default(0),
  paymentCount: integer('payment_count').notNull().default(0),
  totalAmount: text('total_amount').notNull().default('0'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export type PaymentLink = typeof paymentLinks.$inferSelect
export type NewPaymentLink = typeof paymentLinks.$inferInsert
