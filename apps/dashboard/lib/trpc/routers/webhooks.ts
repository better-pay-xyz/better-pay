import { z } from 'zod'
import { router, protectedProcedure } from '../server'
import { db, webhooks } from '@better-pay/database'
import { eq, and, desc } from 'drizzle-orm'
import crypto from 'crypto'

// Generate webhook secret
function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`
}

const webhookEventTypes = [
  'payment.succeeded',
  'payment.failed',
  'payment.refunded',
  'payment.cancelled'
] as const

export const webhooksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const hooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.merchantId, ctx.merchant.id))
      .orderBy(desc(webhooks.createdAt))

    return hooks
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [hook] = await db
        .select()
        .from(webhooks)
        .where(
          and(
            eq(webhooks.id, input.id),
            eq(webhooks.merchantId, ctx.merchant.id)
          )
        )
        .limit(1)

      return hook || null
    }),

  create: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.enum(webhookEventTypes)).min(1)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const secret = generateWebhookSecret()

      const [hook] = await db
        .insert(webhooks)
        .values({
          merchantId: ctx.merchant.id,
          url: input.url,
          events: input.events,
          secret,
          isActive: true
        })
        .returning()

      // Return secret only on creation
      return {
        ...hook,
        secret
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        url: z.string().url().optional(),
        events: z.array(z.enum(webhookEventTypes)).min(1).optional(),
        isActive: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      )

      const [hook] = await db
        .update(webhooks)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(webhooks.id, id),
            eq(webhooks.merchantId, ctx.merchant.id)
          )
        )
        .returning()

      return hook
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(webhooks)
        .where(
          and(
            eq(webhooks.id, input.id),
            eq(webhooks.merchantId, ctx.merchant.id)
          )
        )

      return { success: true }
    }),

  rotateSecret: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const newSecret = generateWebhookSecret()

      const [hook] = await db
        .update(webhooks)
        .set({
          secret: newSecret,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(webhooks.id, input.id),
            eq(webhooks.merchantId, ctx.merchant.id)
          )
        )
        .returning()

      return {
        ...hook,
        secret: newSecret
      }
    })
})
