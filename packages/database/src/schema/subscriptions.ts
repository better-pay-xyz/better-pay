import { pgTable, text, timestamp, json } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { merchants } from './merchants'
import { customers } from './customers'

export const subscriptionInterval = ['daily', 'weekly', 'monthly', 'yearly'] as const
export type SubscriptionInterval = typeof subscriptionInterval[number]

export const subscriptionStatus = ['active', 'paused', 'cancelled', 'expired'] as const
export type SubscriptionStatus = typeof subscriptionStatus[number]

export const subscriptionPlans = pgTable('subscription_plans', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `plan_${createId()}`),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  amount: text('amount').notNull(),
  currency: text('currency').notNull(),
  interval: text('interval').notNull().$type<SubscriptionInterval>(),
  trialDays: text('trial_days'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export const subscriptions = pgTable('subscriptions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `sub_${createId()}`),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  planId: text('plan_id')
    .notNull()
    .references(() => subscriptionPlans.id, { onDelete: 'cascade' }),
  amount: text('amount').notNull(),
  currency: text('currency').notNull(),
  interval: text('interval').notNull().$type<SubscriptionInterval>(),
  status: text('status').notNull().$type<SubscriptionStatus>().default('active'),
  accessKeyId: text('access_key_id'),
  accessKeyEncrypted: text('access_key_encrypted'),
  accessKeyLimit: text('access_key_limit'),
  accessKeyExpiry: timestamp('access_key_expiry'),
  nextPaymentAt: timestamp('next_payment_at').notNull(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
