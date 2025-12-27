import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { db } from '@better-pay/database'
import { merchants } from '@better-pay/database'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

// Context type - includes the authenticated merchant
export interface Context {
  merchant: {
    id: string
    name: string
    email: string
  } | null
}

// Create context for each request
export async function createContext(): Promise<Context> {
  // Development mode: use a mock merchant for testing
  if (process.env.NODE_ENV === 'development') {
    // Check if we have a real merchantId cookie first
    const cookieStore = await cookies()
    const merchantId = cookieStore.get('merchantId')?.value

    if (merchantId) {
      const [merchant] = await db
        .select({
          id: merchants.id,
          name: merchants.name,
          email: merchants.email
        })
        .from(merchants)
        .where(eq(merchants.id, merchantId))
        .limit(1)

      if (merchant) {
        return { merchant }
      }
    }

    // Dev fallback: get or create a test merchant
    let [testMerchant] = await db
      .select({
        id: merchants.id,
        name: merchants.name,
        email: merchants.email
      })
      .from(merchants)
      .where(eq(merchants.email, 'test@betterpay.dev'))
      .limit(1)

    if (!testMerchant) {
      // Create test merchant if it doesn't exist
      // Note: tempoAddress is left null - set it in Settings before testing payments
      const [created] = await db
        .insert(merchants)
        .values({
          name: 'Test Merchant',
          email: 'test@betterpay.dev',
          apiKeyHash: 'dev_test_key_hash_placeholder'
          // tempoAddress: null - must be configured in Settings before accepting payments
        })
        .returning({
          id: merchants.id,
          name: merchants.name,
          email: merchants.email
        })
      testMerchant = created
    }

    return { merchant: testMerchant }
  }

  // Production: require real auth
  const cookieStore = await cookies()
  const merchantId = cookieStore.get('merchantId')?.value

  if (!merchantId) {
    return { merchant: null }
  }

  const [merchant] = await db
    .select({
      id: merchants.id,
      name: merchants.name,
      email: merchants.email
    })
    .from(merchants)
    .where(eq(merchants.id, merchantId))
    .limit(1)

  return { merchant: merchant || null }
}

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: null
      }
    }
  }
})

// Export reusable router and procedure helpers
export const router = t.router
export const publicProcedure = t.procedure

// Protected procedure - requires authenticated merchant
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.merchant) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource'
    })
  }
  return next({
    ctx: {
      ...ctx,
      merchant: ctx.merchant
    }
  })
})
