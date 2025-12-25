import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const merchants = pgTable('merchants', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  passwordHash: text('password_hash'), // Null if OAuth only
  tempoAddress: text('tempo_address'), // Can be set later
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),
  gasSponsored: boolean('gas_sponsored').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export type Merchant = typeof merchants.$inferSelect
export type NewMerchant = typeof merchants.$inferInsert
