import { pgTable, text, timestamp, json } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const idempotencyKeys = pgTable('idempotency_keys', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  key: text('key').notNull().unique(),
  response: json('response').$type<Record<string, any>>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull()
})

export type IdempotencyKey = typeof idempotencyKeys.$inferSelect
export type NewIdempotencyKey = typeof idempotencyKeys.$inferInsert
