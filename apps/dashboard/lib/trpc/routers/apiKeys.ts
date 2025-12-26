import { z } from 'zod'
import { router, protectedProcedure } from '../server'
import { db, apiKeys } from '@better-pay/database'
import { eq, and, desc } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import crypto from 'crypto'

// Generate a secure API key
function generateApiKey(): string {
  return `sk_live_${createId()}${crypto.randomBytes(16).toString('hex')}`
}

// Hash API key for storage
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export const apiKeysRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
        keyPrefix: apiKeys.keyPrefix
      })
      .from(apiKeys)
      .where(eq(apiKeys.merchantId, ctx.merchant.id))
      .orderBy(desc(apiKeys.createdAt))

    return keys
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        environment: z.enum(['test', 'live']).default('live')
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rawKey = generateApiKey()
      const hashedKey = hashApiKey(rawKey)
      const keyPrefix = rawKey.slice(0, 12) + '...'

      const [key] = await db
        .insert(apiKeys)
        .values({
          merchantId: ctx.merchant.id,
          name: input.name,
          keyHash: hashedKey,
          keyPrefix,
          environment: input.environment
        })
        .returning({
          id: apiKeys.id,
          name: apiKeys.name,
          keyPrefix: apiKeys.keyPrefix,
          createdAt: apiKeys.createdAt
        })

      // Return the raw key only once - it won't be retrievable later
      return {
        ...key,
        secretKey: rawKey
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(apiKeys)
        .where(
          and(
            eq(apiKeys.id, input.id),
            eq(apiKeys.merchantId, ctx.merchant.id)
          )
        )

      return { success: true }
    }),

  rename: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [key] = await db
        .update(apiKeys)
        .set({ name: input.name })
        .where(
          and(
            eq(apiKeys.id, input.id),
            eq(apiKeys.merchantId, ctx.merchant.id)
          )
        )
        .returning()

      return key
    })
})
