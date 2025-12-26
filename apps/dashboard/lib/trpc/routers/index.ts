import { router } from '../server'
import { paymentLinksRouter } from './paymentLinks'
import { ordersRouter } from './orders'
import { apiKeysRouter } from './apiKeys'
import { webhooksRouter } from './webhooks'
import { analyticsRouter } from './analytics'

export const appRouter = router({
  paymentLinks: paymentLinksRouter,
  orders: ordersRouter,
  apiKeys: apiKeysRouter,
  webhooks: webhooksRouter,
  analytics: analyticsRouter
})

export type AppRouter = typeof appRouter
