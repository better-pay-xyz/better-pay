# Phase 2: Merchant Auth & Dashboard - Implementation Plan

> **For Claude:** This extends the main implementation plan with merchant authentication and dashboard features.

**Goal:** Implement merchant registration, login (Email/Password + Google OAuth + Dev mode), and dashboard with API key management

**Tech Stack:**
- Auth: Better Auth
- Frontend: Next.js 16 (Dashboard app)
- Backend: Node.js 20+ with Hono
- Database: PostgreSQL 17 with Drizzle ORM

---

## Phase 2: Merchant Auth & Dashboard

### Task 2.1: Update Database Schema for Auth

**Files:**
- Modify: `packages/database/src/schema/merchants.ts`
- Create: `packages/database/src/schema/api-keys.ts`
- Create: `packages/database/src/schema/sessions.ts`
- Create: `packages/database/src/schema/accounts.ts`
- Modify: `packages/database/src/schema/index.ts`

**Step 1: Update merchants schema**

Modify `packages/database/src/schema/merchants.ts`:

```typescript
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const merchants = pgTable('merchants', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  passwordHash: text('password_hash'), // Null if OAuth only
  tempoAddress: text('tempo_address'), // Can be set later
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),
  gasSponsored: boolean('gas_sponsored').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export type Merchant = typeof merchants.$inferSelect
export type NewMerchant = typeof merchants.$inferInsert
```

**Step 2: Create API keys schema**

Create `packages/database/src/schema/api-keys.ts`:

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { merchants } from './merchants'

export const apiKeyEnvironment = ['test', 'live'] as const
export type ApiKeyEnvironment = typeof apiKeyEnvironment[number]

export const apiKeys = pgTable('api_keys', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // e.g., "Production", "Staging"
  keyHash: text('key_hash').notNull(),
  keyPrefix: text('key_prefix').notNull(), // First 10 chars for lookup
  environment: text('environment').notNull().$type<ApiKeyEnvironment>(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert
```

**Step 3: Create sessions schema (Better Auth)**

Create `packages/database/src/schema/sessions.ts`:

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { merchants } from './merchants'

export const sessions = pgTable('sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
```

**Step 4: Create accounts schema (Better Auth OAuth)**

Create `packages/database/src/schema/accounts.ts`:

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { merchants } from './merchants'

export const accounts = pgTable('accounts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => merchants.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(), // Provider's user ID
  providerId: text('provider_id').notNull(), // "google", "github", etc.
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
```

**Step 5: Update schema index**

Modify `packages/database/src/schema/index.ts`:

```typescript
export * from './merchants'
export * from './api-keys'
export * from './sessions'
export * from './accounts'
export * from './orders'
export * from './subscriptions'
export * from './customers'
export * from './payments'
export * from './idempotency-keys'
```

**Step 6: Generate and run migration**

```bash
cd packages/database
bun run generate
bun run migrate
```

Expected: New tables created

**Step 7: Commit**

```bash
git add packages/database
git commit -m "feat(database): add auth tables (sessions, accounts, api_keys)"
```

---

### Task 2.2: Setup Dashboard App with Better Auth

**Files:**
- Create: `apps/dashboard/package.json`
- Create: `apps/dashboard/tsconfig.json`
- Create: `apps/dashboard/next.config.js`
- Create: `apps/dashboard/tailwind.config.ts`
- Create: `apps/dashboard/postcss.config.js`
- Create: `apps/dashboard/app/layout.tsx`
- Create: `apps/dashboard/app/globals.css`
- Create: `apps/dashboard/lib/auth.ts`
- Create: `apps/dashboard/.env.example`

**Step 1: Initialize dashboard package**

Create `apps/dashboard/package.json`:

```json
{
  "name": "@better-pay/dashboard",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint"
  },
  "dependencies": {
    "@better-pay/database": "workspace:*",
    "@better-pay/shared": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "better-auth": "^1.0.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.7",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/bcrypt": "^5.0.2",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3"
  }
}
```

**Step 2: Configure Next.js**

Create `apps/dashboard/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@better-pay/database', '@better-pay/shared'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
}

export default nextConfig
```

**Step 3: Configure Tailwind**

Create `apps/dashboard/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}

export default config
```

Create `apps/dashboard/postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

**Step 4: Setup Better Auth**

Create `apps/dashboard/lib/auth.ts`:

```typescript
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
```

**Step 5: Create environment example**

Create `apps/dashboard/.env.example`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/better_pay_dev
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NODE_ENV=development
```

**Step 6: Create root layout**

Create `apps/dashboard/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dashboard - BetterPay',
  description: 'Merchant dashboard for crypto payments'
}

export default function RootLayout({
  children
}: {
  children: React.NodeNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  )
}
```

Create `apps/dashboard/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 7: Create tsconfig**

Create `apps/dashboard/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 8: Install dependencies**

```bash
cd apps/dashboard
bun install
```

**Step 9: Setup Google OAuth**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

**Step 10: Commit**

```bash
git add apps/dashboard
git commit -m "feat(dashboard): setup Next.js app with Better Auth"
```

---

### Task 2.3: Implement Registration Page

**Files:**
- Create: `apps/dashboard/app/(auth)/register/page.tsx`
- Create: `apps/dashboard/app/(auth)/layout.tsx`
- Create: `apps/dashboard/app/api/auth/[...all]/route.ts`
- Create: `apps/dashboard/components/auth/register-form.tsx`

**Step 1: Create auth API route**

Create `apps/dashboard/app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from '@/lib/auth'

export const { GET, POST } = auth.handler
```

**Step 2: Create auth layout**

Create `apps/dashboard/app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">BetterPay</h1>
          <p className="mt-2 text-gray-600">Crypto Payment Platform</p>
        </div>
        {children}
      </div>
    </div>
  )
}
```

**Step 3: Create registration form component**

Create `apps/dashboard/components/auth/register-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEmailRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Registration failed')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleRegister() {
    window.location.href = '/api/auth/signin/google'
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Email/Password Form */}
      <form onSubmit={handleEmailRegister} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogleRegister}
        type="button"
        className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      {/* Dev Mode (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => router.push('/api/auth/dev-bypass')}
          type="button"
          className="w-full py-2 px-4 border-2 border-dashed border-orange-300 rounded-md bg-orange-50 text-sm font-medium text-orange-700 hover:bg-orange-100"
        >
          🔓 Skip Auth (Dev Only)
        </button>
      )}
    </div>
  )
}
```

**Step 4: Create registration page**

Create `apps/dashboard/app/(auth)/register/page.tsx`:

```typescript
import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Create your account</h2>
      <RegisterForm />
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
```

**Step 5: Test registration page**

```bash
cd apps/dashboard
bun run dev
```

Visit `http://localhost:3000/register`

Expected: Registration form displays with Email/Password, Google OAuth, and Dev mode button

**Step 6: Commit**

```bash
git add apps/dashboard
git commit -m "feat(dashboard): add registration page with Better Auth"
```

---

## Summary

Phase 2 implementation plan includes:
- ✅ Task 2.1: Update database schema for auth (sessions, accounts, api_keys)
- ✅ Task 2.2: Setup Dashboard app with Better Auth
- ✅ Task 2.3: Implement registration page (Email/Password + Google + Dev mode)
- 🔜 Task 2.4: Implement login page with dev mode
- 🔜 Task 2.5: Dashboard layout and navigation
- 🔜 Task 2.6: API key management UI

**Next steps:**
- Implement login page
- Build dashboard layout
- Create API key generation UI
- Then proceed to Phase 3 (One-Time Payments)
