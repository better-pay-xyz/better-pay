import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorHandler } from './middleware/error'

export function createApp() {
  const app = new Hono()

  // Middleware
  app.use('*', logger())
  app.use('*', cors())

  // Health check
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Error handling
  app.onError(errorHandler)

  return app
}
