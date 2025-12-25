import { Context, Next } from 'hono'
import { db } from '@better-pay/database'
import { eq } from 'drizzle-orm'
import { merchants } from '@better-pay/database'
import bcrypt from 'bcrypt'

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401)
  }

  const apiKey = authHeader.substring(7)

  if (!apiKey.startsWith('sk_test_') && !apiKey.startsWith('sk_live_')) {
    return c.json({ error: 'Invalid API key format' }, 401)
  }

  try {
    // Query merchants with similar API key prefix
    const prefix = apiKey.substring(0, 10)
    const merchantList = await db.query.merchants.findMany({
      where: (merchants, { like }) => like(merchants.apiKeyHash, `${prefix}%`)
    })

    // Find exact match by comparing hash
    let authenticatedMerchant = null
    for (const merchant of merchantList) {
      if (await bcrypt.compare(apiKey, merchant.apiKeyHash)) {
        authenticatedMerchant = merchant
        break
      }
    }

    if (!authenticatedMerchant) {
      return c.json({ error: 'Invalid API key' }, 401)
    }

    // Attach merchant to context
    c.set('merchant', authenticatedMerchant)

    await next()
  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
}
