import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const customers = pgTable('customers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `cus_${createId()}`),
  tempoAddress: text('tempo_address').notNull().unique(),
  passkeyId: text('passkey_id'),
  email: text('email'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
