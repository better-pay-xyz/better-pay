import { serve } from '@hono/node-server'
import { config } from 'dotenv'
import { createApp } from './app'

// Load environment variables
config()

const app = createApp()

const port = parseInt(process.env.API_PORT || '3001')

console.log(`Starting API server on port ${port}...`)

serve({
  fetch: app.fetch,
  port
})

console.log(`API server running on http://localhost:${port}`)
