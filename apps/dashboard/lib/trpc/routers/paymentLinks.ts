import { z } from 'zod'
import { router, protectedProcedure } from '../server'
import { db, paymentLinks } from '@better-pay/database'
import { eq, and, desc } from 'drizzle-orm'

export const paymentLinksRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional()
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20

      const links = await db
        .select()
        .from(paymentLinks)
        .where(eq(paymentLinks.merchantId, ctx.merchant.id))
        .orderBy(desc(paymentLinks.createdAt))
        .limit(limit + 1)

      let hasMore = false
      if (links.length > limit) {
        links.pop()
        hasMore = true
      }

      return {
        data: links,
        hasMore
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [link] = await db
        .select()
        .from(paymentLinks)
        .where(
          and(
            eq(paymentLinks.id, input.id),
            eq(paymentLinks.merchantId, ctx.merchant.id)
          )
        )
        .limit(1)

      return link || null
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        imageUrl: z.string().url().optional().or(z.literal('')),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
        currency: z.string().default('USDC')
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [link] = await db
        .insert(paymentLinks)
        .values({
          merchantId: ctx.merchant.id,
          title: input.title,
          description: input.description || null,
          imageUrl: input.imageUrl || null,
          amount: input.amount,
          currency: input.currency
        })
        .returning()

      return link
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        imageUrl: z.string().url().optional().or(z.literal('')),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        currency: z.string().optional(),
        isActive: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      // Remove undefined values
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      )

      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update')
      }

      const [link] = await db
        .update(paymentLinks)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(paymentLinks.id, id),
            eq(paymentLinks.merchantId, ctx.merchant.id)
          )
        )
        .returning()

      return link
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(paymentLinks)
        .where(
          and(
            eq(paymentLinks.id, input.id),
            eq(paymentLinks.merchantId, ctx.merchant.id)
          )
        )

      return { success: true }
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [link] = await db
        .update(paymentLinks)
        .set({
          isActive: input.isActive,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(paymentLinks.id, input.id),
            eq(paymentLinks.merchantId, ctx.merchant.id)
          )
        )
        .returning()

      return link
    })
})
