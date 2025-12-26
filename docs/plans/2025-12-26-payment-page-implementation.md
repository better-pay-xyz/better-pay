# Payment Page with Passkeys - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a customer-facing payment page with Tempo Passkey authentication for seamless crypto payments

**Architecture:** Next.js 15 checkout app with tempo.ts SDK for Passkey wallet, wagmi for transaction execution, Server Components for order fetching, Client Components for payment flow

**Tech Stack:** Next.js 15, React 19, tempo.ts, wagmi 2.x, viem 2.x, Tailwind CSS, Zustand

---

## Task 1: Install Dependencies

**Files:**
- Modify: `apps/checkout/package.json`

**Step 1: Install tempo.ts and wagmi**

```bash
cd /Users/daoleno/workspace/better-pay/apps/checkout
bun add tempo.ts wagmi@^2.14.0 lucide-react
```

**Step 2: Verify installation**

```bash
cat package.json | grep -E "(tempo|wagmi|lucide)"
```

Expected: Shows tempo.ts, wagmi, and lucide-react in dependencies

**Step 3: Commit**

```bash
git add apps/checkout/package.json
git commit -m "feat(checkout): add tempo.ts and wagmi dependencies"
```

---

## Task 2: Configure Tempo Chain & Tokens

**Files:**
- Create: `apps/checkout/lib/tempo/chains.ts`
- Create: `apps/checkout/lib/tempo/tokens.ts`
- Create: `apps/checkout/lib/tempo/config.ts`

**Step 1: Create Tempo chain definition**

Create `apps/checkout/lib/tempo/chains.ts`:

```typescript
import { defineChain } from 'viem'

export const tempoTestnet = defineChain({
  id: 42429,
  name: 'Tempo Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Tempo',
    symbol: 'TEMPO',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.tempo.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Tempo Explorer', url: 'https://explore.tempo.xyz' },
  },
  testnet: true,
})
```

**Step 2: Create token constants**

Create `apps/checkout/lib/tempo/tokens.ts`:

```typescript
export const ALPHA_USD = {
  address: '0x20c0000000000000000000000000000000000001' as const,
  symbol: 'AlphaUSD',
  decimals: 6,
}

export const BETA_USD = {
  address: '0x20c0000000000000000000000000000000000002' as const,
  symbol: 'BetaUSD',
  decimals: 6,
}

export const THETA_USD = {
  address: '0x20c0000000000000000000000000000000000003' as const,
  symbol: 'ThetaUSD',
  decimals: 6,
}

// Map currency codes to token addresses
export const CURRENCY_TO_TOKEN: Record<string, typeof ALPHA_USD> = {
  'USDC': ALPHA_USD,
  'AlphaUSD': ALPHA_USD,
  'USDT': BETA_USD,
  'BetaUSD': BETA_USD,
  'ThetaUSD': THETA_USD,
}

// Standard ERC20 ABI for transfers
export const erc20Abi = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const
```

**Step 3: Create wagmi config**

Create `apps/checkout/lib/tempo/config.ts`:

```typescript
import { createConfig, http } from 'wagmi'
import { tempoTestnet } from './chains'

// Note: tempo.ts webauthn connector will be added when available
// For now, use standard wagmi config - passkey integration TBD based on tempo.ts API
export const wagmiConfig = createConfig({
  chains: [tempoTestnet],
  transports: {
    [tempoTestnet.id]: http(),
  },
  ssr: true,
})
```

**Step 4: Commit**

```bash
git add apps/checkout/lib/tempo/
git commit -m "feat(checkout): add Tempo chain config and token constants"
```

---

## Task 3: Create Providers Component

**Files:**
- Create: `apps/checkout/app/providers.tsx`
- Modify: `apps/checkout/app/layout.tsx`

**Step 1: Create Providers component**

Create `apps/checkout/app/providers.tsx`:

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { useState, type ReactNode } from 'react'
import { wagmiConfig } from '@/lib/tempo/config'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
          },
        },
      })
  )

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

**Step 2: Update layout.tsx**

Modify `apps/checkout/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'BetterPay Checkout',
  description: 'Secure crypto payment processing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

**Step 3: Add path alias to tsconfig**

Modify `apps/checkout/tsconfig.json` to add `@/*` alias:

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
    },
    "baseUrl": "."
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 4: Test the app starts**

```bash
cd /Users/daoleno/workspace/better-pay/apps/checkout
bun run dev
```

Visit http://localhost:3002 - should load without errors

**Step 5: Commit**

```bash
git add apps/checkout/app/providers.tsx apps/checkout/app/layout.tsx apps/checkout/tsconfig.json
git commit -m "feat(checkout): add wagmi and react-query providers"
```

---

## Task 4: Build UI Components

**Files:**
- Create: `apps/checkout/components/ui/button.tsx`
- Create: `apps/checkout/components/ui/card.tsx`
- Create: `apps/checkout/components/ui/spinner.tsx`
- Create: `apps/checkout/components/payment/faucet-link.tsx`
- Create: `apps/checkout/components/payment/order-card.tsx`
- Create: `apps/checkout/components/payment/countdown-timer.tsx`

**Step 1: Create Button component**

Create `apps/checkout/components/ui/button.tsx`:

```typescript
import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

**Step 2: Create Card component**

Create `apps/checkout/components/ui/card.tsx`:

```typescript
import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}
```

**Step 3: Create Spinner component**

Create `apps/checkout/components/ui/spinner.tsx`:

```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <svg
      className={`animate-spin text-blue-600 ${sizes[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
```

**Step 4: Create FaucetLink component**

Create `apps/checkout/components/payment/faucet-link.tsx`:

```typescript
import { ExternalLink } from 'lucide-react'

export function FaucetLink() {
  return (
    <a
      href="https://docs.tempo.xyz/quickstart/faucet"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
    >
      <span>🚰</span>
      <span>领取测试币</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}
```

**Step 5: Create CountdownTimer component**

Create `apps/checkout/components/payment/countdown-timer.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  expiresAt: Date
  onExpire?: () => void
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const diff = expiry - now

      if (diff <= 0) {
        setIsExpired(true)
        setTimeLeft('已过期')
        onExpire?.()
        return
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, onExpire])

  return (
    <span className={isExpired ? 'text-red-600' : 'text-gray-500'}>
      {isExpired ? '已过期' : `${timeLeft} 后过期`}
    </span>
  )
}
```

**Step 6: Create OrderCard component**

Create `apps/checkout/components/payment/order-card.tsx`:

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { CountdownTimer } from './countdown-timer'

interface OrderCardProps {
  order: {
    id: string
    amount: string
    currency: string
    expiresAt: Date | string
    merchant: {
      name: string
    }
    metadata?: Record<string, unknown> | null
  }
  onExpire?: () => void
}

export function OrderCard({ order, onExpire }: OrderCardProps) {
  const expiresAt = typeof order.expiresAt === 'string'
    ? new Date(order.expiresAt)
    : order.expiresAt

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-6 text-center space-y-4">
        <div className="text-gray-600 font-medium">
          {order.merchant.name}
        </div>

        <div className="space-y-1">
          <div className="text-4xl font-bold text-gray-900">
            ${order.amount}
          </div>
          <div className="text-gray-500">
            {order.currency}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 space-y-1 text-sm">
          <div className="text-gray-500">
            订单 #{order.id.slice(-8).toUpperCase()}
          </div>
          <CountdownTimer expiresAt={expiresAt} onExpire={onExpire} />
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 7: Commit**

```bash
git add apps/checkout/components/
git commit -m "feat(checkout): add UI components for payment page"
```

---

## Task 5: Create Payment Page Route

**Files:**
- Create: `apps/checkout/app/pay/[memo]/page.tsx`
- Create: `apps/checkout/app/pay/[memo]/payment-client.tsx`
- Create: `apps/checkout/components/payment/pay-button.tsx`
- Create: `apps/checkout/components/payment/payment-status.tsx`

**Step 1: Create PayButton component**

Create `apps/checkout/components/payment/pay-button.tsx`:

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

interface PayButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  error?: string
}

export function PayButton({ onClick, loading, disabled, error }: PayButtonProps) {
  return (
    <div className="w-full max-w-sm space-y-3">
      <Button
        onClick={onClick}
        loading={loading}
        disabled={disabled}
        size="lg"
        className="w-full"
      >
        <Lock className="h-4 w-4 mr-2" />
        使用 Passkey 支付
      </Button>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <p className="text-xs text-gray-400 text-center">
        Powered by Tempo
      </p>
    </div>
  )
}
```

**Step 2: Create PaymentStatus component**

Create `apps/checkout/components/payment/payment-status.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Status = 'success' | 'error' | 'expired' | 'already_paid'

interface PaymentStatusProps {
  status: Status
  txHash?: string
  redirectUrl?: string
  errorMessage?: string
  onRetry?: () => void
}

export function PaymentStatus({
  status,
  txHash,
  redirectUrl,
  errorMessage,
  onRetry,
}: PaymentStatusProps) {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (status === 'success' && redirectUrl) {
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer)
            window.location.href = redirectUrl
          }
          return c - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [status, redirectUrl])

  const configs = {
    success: {
      icon: CheckCircle,
      iconClass: 'text-green-500',
      title: '支付成功!',
      description: redirectUrl
        ? `${countdown} 秒后返回商户...`
        : '感谢您的付款',
    },
    error: {
      icon: XCircle,
      iconClass: 'text-red-500',
      title: '支付失败',
      description: errorMessage || '请重试',
    },
    expired: {
      icon: Clock,
      iconClass: 'text-orange-500',
      title: '订单已过期',
      description: '请联系商户获取新的支付链接',
    },
    already_paid: {
      icon: AlertCircle,
      iconClass: 'text-blue-500',
      title: '订单已支付',
      description: '此订单已经完成支付',
    },
  }

  const config = configs[status]
  const Icon = config.icon

  return (
    <div className="text-center space-y-4 animate-fade-in">
      <Icon className={`w-16 h-16 mx-auto ${config.iconClass}`} />
      <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
      <p className="text-gray-500">{config.description}</p>

      {status === 'success' && txHash && (
        <a
          href={`https://explore.tempo.xyz/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-blue-600 hover:underline"
        >
          查看交易 ↗
        </a>
      )}

      {status === 'error' && onRetry && (
        <Button onClick={onRetry} variant="secondary">
          重试
        </Button>
      )}
    </div>
  )
}
```

**Step 3: Create PaymentClient component**

Create `apps/checkout/app/pay/[memo]/payment-client.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useAccount, useConnect, useSendTransaction } from 'wagmi'
import { encodeFunctionData, parseUnits } from 'viem'
import { OrderCard } from '@/components/payment/order-card'
import { PayButton } from '@/components/payment/pay-button'
import { PaymentStatus } from '@/components/payment/payment-status'
import { FaucetLink } from '@/components/payment/faucet-link'
import { CURRENCY_TO_TOKEN, erc20Abi, ALPHA_USD } from '@/lib/tempo/tokens'

type PaymentState = 'idle' | 'connecting' | 'processing' | 'success' | 'error'

interface Order {
  id: string
  memo: string
  amount: string
  currency: string
  status: string
  expiresAt: string
  merchant: {
    name: string
    tempoAddress: string
  }
  metadata?: {
    success_url?: string
  } | null
}

interface PaymentClientProps {
  order: Order
}

export function PaymentClient({ order }: PaymentClientProps) {
  const [state, setState] = useState<PaymentState>('idle')
  const [txHash, setTxHash] = useState<string>()
  const [error, setError] = useState<string>()
  const [isExpired, setIsExpired] = useState(false)

  const { isConnected, address } = useAccount()
  const { connectAsync, connectors } = useConnect()
  const { sendTransactionAsync } = useSendTransaction()

  // Check if order is already paid or expired
  if (order.status === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PaymentStatus status="already_paid" />
      </div>
    )
  }

  if (isExpired || new Date(order.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PaymentStatus status="expired" />
      </div>
    )
  }

  const handlePay = async () => {
    try {
      setError(undefined)

      // Step 1: Connect wallet if not connected
      if (!isConnected) {
        setState('connecting')
        // Use first available connector (will be webauthn in production)
        const connector = connectors[0]
        if (!connector) {
          throw new Error('No wallet connector available')
        }
        await connectAsync({ connector })
      }

      // Step 2: Execute payment
      setState('processing')

      // Get token config
      const token = CURRENCY_TO_TOKEN[order.currency] || ALPHA_USD

      // Build transfer transaction
      const hash = await sendTransactionAsync({
        to: token.address,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [
            order.merchant.tempoAddress as `0x${string}`,
            parseUnits(order.amount, token.decimals),
          ],
        }),
      })

      setTxHash(hash)

      // Step 3: Confirm payment with backend
      await fetch(`/api/orders/${order.memo}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: hash,
          customerAddress: address,
        }),
      })

      setState('success')
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : '支付失败，请重试')
      setState('error')
    }
  }

  const handleRetry = () => {
    setState('idle')
    setError(undefined)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-4">
        <FaucetLink />
        <span className="text-lg font-semibold text-gray-900">BetterPay</span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 space-y-6">
        {state === 'success' ? (
          <PaymentStatus
            status="success"
            txHash={txHash}
            redirectUrl={order.metadata?.success_url}
          />
        ) : state === 'error' ? (
          <PaymentStatus
            status="error"
            errorMessage={error}
            onRetry={handleRetry}
          />
        ) : (
          <>
            <OrderCard
              order={order}
              onExpire={() => setIsExpired(true)}
            />
            <PayButton
              onClick={handlePay}
              loading={state === 'connecting' || state === 'processing'}
              error={error}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-gray-400">
        Secure payments powered by Tempo
      </footer>
    </div>
  )
}
```

**Step 4: Create payment page (Server Component)**

Create `apps/checkout/app/pay/[memo]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { db, orders, merchants } from '@better-pay/database'
import { eq } from 'drizzle-orm'
import { PaymentClient } from './payment-client'

interface PageProps {
  params: Promise<{ memo: string }>
}

export default async function PaymentPage({ params }: PageProps) {
  const { memo } = await params

  // Fetch order with merchant info
  const result = await db
    .select({
      id: orders.id,
      memo: orders.memo,
      amount: orders.amount,
      currency: orders.currency,
      status: orders.status,
      expiresAt: orders.expiresAt,
      metadata: orders.metadata,
      merchantName: merchants.name,
      merchantAddress: merchants.tempoAddress,
    })
    .from(orders)
    .leftJoin(merchants, eq(orders.merchantId, merchants.id))
    .where(eq(orders.memo, memo))
    .limit(1)

  const orderData = result[0]

  if (!orderData || !orderData.merchantAddress) {
    notFound()
  }

  // Transform to expected shape
  const order = {
    id: orderData.id,
    memo: orderData.memo,
    amount: orderData.amount,
    currency: orderData.currency,
    status: orderData.status,
    expiresAt: orderData.expiresAt.toISOString(),
    merchant: {
      name: orderData.merchantName || 'Unknown Merchant',
      tempoAddress: orderData.merchantAddress,
    },
    metadata: orderData.metadata as { success_url?: string } | null,
  }

  return <PaymentClient order={order} />
}
```

**Step 5: Add fade-in animation to globals.css**

Modify `apps/checkout/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

**Step 6: Commit**

```bash
git add apps/checkout/app/pay/ apps/checkout/components/payment/ apps/checkout/app/globals.css
git commit -m "feat(checkout): add payment page with Passkey flow"
```

---

## Task 6: Create Order Confirmation API

**Files:**
- Create: `apps/checkout/app/api/orders/[memo]/confirm/route.ts`

**Step 1: Create confirmation API**

Create `apps/checkout/app/api/orders/[memo]/confirm/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db, orders } from '@better-pay/database'
import { eq } from 'drizzle-orm'

interface ConfirmRequest {
  txHash: string
  customerAddress: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memo: string }> }
) {
  try {
    const { memo } = await params
    const body: ConfirmRequest = await request.json()

    if (!body.txHash || !body.customerAddress) {
      return NextResponse.json(
        { error: 'Missing txHash or customerAddress' },
        { status: 400 }
      )
    }

    // Update order status
    const [updated] = await db
      .update(orders)
      .set({
        status: 'paid',
        txHash: body.txHash,
        customerAddress: body.customerAddress,
        paidAt: new Date(),
      })
      .where(eq(orders.memo, memo))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // TODO: Trigger webhook to merchant

    return NextResponse.json({
      success: true,
      order: {
        id: updated.id,
        status: updated.status,
        txHash: updated.txHash,
      },
    })
  } catch (error) {
    console.error('Confirm order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add apps/checkout/app/api/
git commit -m "feat(checkout): add order confirmation API endpoint"
```

---

## Task 7: Add Not Found Page

**Files:**
- Create: `apps/checkout/app/pay/[memo]/not-found.tsx`

**Step 1: Create not-found page**

Create `apps/checkout/app/pay/[memo]/not-found.tsx`:

```typescript
import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <FileQuestion className="w-16 h-16 text-gray-400 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">订单不存在</h2>
      <p className="text-gray-500 mb-6">
        请检查支付链接是否正确，或联系商户获取新的链接
      </p>
      <Link href="/">
        <Button variant="secondary">返回首页</Button>
      </Link>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add apps/checkout/app/pay/
git commit -m "feat(checkout): add not-found page for invalid orders"
```

---

## Task 8: End-to-End Test

**Step 1: Start PostgreSQL**

```bash
cd /Users/daoleno/workspace/better-pay
docker-compose up -d
```

**Step 2: Create test data**

```bash
docker exec -it better-pay-postgres psql -U postgres -d better_pay_dev -c "
INSERT INTO merchants (id, name, email, api_key_hash, tempo_address)
VALUES (
  'test_merchant_001',
  'Test Shop',
  'shop@test.com',
  '\$2b\$10\$test',
  '0x1234567890123456789012345678901234567890'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, merchant_id, amount, currency, memo, status, payment_url, expires_at)
VALUES (
  'ord_test001',
  'test_merchant_001',
  '10.00',
  'AlphaUSD',
  'test_memo_123',
  'pending',
  'http://localhost:3002/pay/test_memo_123',
  NOW() + INTERVAL '1 hour'
) ON CONFLICT (id) DO NOTHING;
"
```

**Step 3: Start checkout app**

```bash
cd /Users/daoleno/workspace/better-pay/apps/checkout
bun run dev
```

**Step 4: Test payment page**

Visit http://localhost:3002/pay/test_memo_123

Expected:
- Order card shows "Test Shop", "$10.00 AlphaUSD"
- Countdown timer shows remaining time
- "使用 Passkey 支付" button is visible
- Faucet link in header works

**Step 5: Test not-found**

Visit http://localhost:3002/pay/invalid_memo

Expected: Shows "订单不存在" page

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat(checkout): complete payment page MVP

- Tempo testnet integration
- Passkey payment flow (pending tempo.ts connector)
- Order card with countdown timer
- Payment confirmation API
- Error and not-found states"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Install dependencies | package.json |
| 2 | Tempo chain & tokens config | lib/tempo/* |
| 3 | Wagmi/React Query providers | providers.tsx, layout.tsx |
| 4 | UI components | components/ui/*, components/payment/* |
| 5 | Payment page route | app/pay/[memo]/* |
| 6 | Confirmation API | app/api/orders/[memo]/confirm/* |
| 7 | Not found page | app/pay/[memo]/not-found.tsx |
| 8 | End-to-end test | Manual testing |

**Note:** The Passkey (WebAuthn) connector from tempo.ts needs to be integrated once the API is confirmed. Current implementation uses standard wagmi connectors as placeholder.

---

*Generated: 2025-12-26*
