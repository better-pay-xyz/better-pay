import { z } from 'zod'
import { router, protectedProcedure } from '../server'
import { db, orders } from '@better-pay/database'
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm'

export const ordersRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().default(0),
        status: z.enum(['pending', 'paid', 'expired', 'cancelled']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional()
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20
      const offset = input?.offset ?? 0

      let query = db
        .select()
        .from(orders)
        .where(eq(orders.merchantId, ctx.merchant.id))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset)

      const data = await query

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(eq(orders.merchantId, ctx.merchant.id))

      return {
        data,
        total: count,
        hasMore: offset + data.length < count
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [order] = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.id, input.id),
            eq(orders.merchantId, ctx.merchant.id)
          )
        )
        .limit(1)

      return order || null
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Get order statistics
    const [stats] = await db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        paidOrders: sql<number>`count(*) filter (where status = 'paid')::int`,
        pendingOrders: sql<number>`count(*) filter (where status = 'pending')::int`,
        totalRevenue: sql<string>`coalesce(sum(amount::numeric) filter (where status = 'paid'), 0)::text`
      })
      .from(orders)
      .where(eq(orders.merchantId, ctx.merchant.id))

    return stats
  })
})
