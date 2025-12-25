import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@better-pay/database'
import { merchants, sessions, accounts } from '@better-pay/database'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: merchants,
      session: sessions,
      account: accounts
    }
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false // MVP: skip email verification
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // Update session every 24 hours
  }
})

export type AuthSession = typeof auth.$Infer.Session
