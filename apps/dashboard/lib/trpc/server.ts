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
  // TODO: Replace with real auth logic (e.g., better-auth session)
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
