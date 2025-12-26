import { z } from 'zod'
import { router, protectedProcedure } from '../server'
import { db, orders, paymentLinks } from '@better-pay/database'
import { eq, sql, gte, and } from 'drizzle-orm'

export const analyticsRouter = router({
  getOverview: protectedProcedure.query(async ({ ctx }) => {
    // Get overall stats
    const [orderStats] = await db
      .select({
        totalRevenue: sql<string>`coalesce(sum(amount::numeric) filter (where status = 'paid'), 0)::text`,
        totalOrders: sql<number>`count(*)::int`,
        paidOrders: sql<number>`count(*) filter (where status = 'paid')::int`,
        pendingOrders: sql<number>`count(*) filter (where status = 'pending')::int`,
        failedOrders: sql<number>`count(*) filter (where status IN ('expired', 'cancelled'))::int`
      })
      .from(orders)
      .where(eq(orders.merchantId, ctx.merchant.id))

    // Get unique customers (by wallet address)
    const [customerStats] = await db
      .select({
        uniqueCustomers: sql<number>`count(distinct customer_address) filter (where customer_address is not null)::int`
      })
      .from(orders)
      .where(eq(orders.merchantId, ctx.merchant.id))

    // Calculate success rate
    const successRate = orderStats.totalOrders > 0
      ? ((orderStats.paidOrders / orderStats.totalOrders) * 100).toFixed(1)
      : '0'

    return {
      totalRevenue: orderStats.totalRevenue,
      totalOrders: orderStats.totalOrders,
      paidOrders: orderStats.paidOrders,
      pendingOrders: orderStats.pendingOrders,
      failedOrders: orderStats.failedOrders,
      uniqueCustomers: customerStats.uniqueCustomers,
      successRate
    }
  }),

  getRevenueByPeriod: protectedProcedure
    .input(
      z.object({
        period: z.enum(['7d', '30d', '90d']).default('30d')
      })
    )
    .query(async ({ ctx, input }) => {
      const days = input.period === '7d' ? 7 : input.period === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const data = await db
        .select({
          date: sql<string>`date_trunc('day', created_at)::date::text`,
          revenue: sql<string>`coalesce(sum(amount::numeric) filter (where status = 'paid'), 0)::text`,
          orders: sql<number>`count(*) filter (where status = 'paid')::int`
        })
        .from(orders)
        .where(
          and(
            eq(orders.merchantId, ctx.merchant.id),
            gte(orders.createdAt, startDate)
          )
        )
        .groupBy(sql`date_trunc('day', created_at)`)
        .orderBy(sql`date_trunc('day', created_at)`)

      return data
    }),

  getPaymentLinkStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await db
      .select({
        id: paymentLinks.id,
        title: paymentLinks.title,
        viewCount: paymentLinks.viewCount,
        paymentCount: paymentLinks.paymentCount,
        totalAmount: paymentLinks.totalAmount,
        isActive: paymentLinks.isActive
      })
      .from(paymentLinks)
      .where(eq(paymentLinks.merchantId, ctx.merchant.id))
      .orderBy(sql`payment_count desc`)
      .limit(10)

    return stats
  }),

  getRecentTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10)
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 10

      const transactions = await db
        .select({
          id: orders.id,
          amount: orders.amount,
          currency: orders.currency,
          status: orders.status,
          customerAddress: orders.customerAddress,
          createdAt: orders.createdAt,
          paidAt: orders.paidAt
        })
        .from(orders)
        .where(eq(orders.merchantId, ctx.merchant.id))
        .orderBy(sql`created_at desc`)
        .limit(limit)

      return transactions
    })
})
