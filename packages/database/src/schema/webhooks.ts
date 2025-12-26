import { pgTable, text, timestamp, boolean, json } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { merchants } from './merchants'

export const webhookEventTypes = [
  'payment.succeeded',
  'payment.failed',
  'payment.refunded',
  'payment.cancelled'
] as const
export type WebhookEventType = typeof webhookEventTypes[number]

export const webhooks = pgTable('webhooks', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `wh_${createId()}`),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),

  url: text('url').notNull(),
  events: json('events').$type<WebhookEventType[]>().notNull(),
  secret: text('secret').notNull(),
  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export type Webhook = typeof webhooks.$inferSelect
export type NewWebhook = typeof webhooks.$inferInsert
