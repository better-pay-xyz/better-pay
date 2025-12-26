# Features A, B, C Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Passkey payment execution, Merchant Dashboard UI, and Smart Contract deployment

**Architecture:**
- Feature A: Replace custom chain config with tempo.ts SDK, add webAuthn connector for Passkey auth
- Feature B: Build dashboard pages with sidebar navigation, API key management, and merchant settings
- Feature C: Deploy existing PaymentRegistry.sol to Tempo testnet using Foundry

**Tech Stack:** tempo.ts, wagmi 2.x, viem, React, Tailwind, Foundry/Forge

---

## Feature A: Passkey Payment Execution

### Task A1: Update wagmi config to use tempo.ts chain and webAuthn connector

**Files:**
- Modify: `apps/checkout/lib/tempo/config.ts`
- Delete: `apps/checkout/lib/tempo/chains.ts` (no longer needed)

**Step 1: Update config.ts with tempo.ts SDK**

```typescript
// apps/checkout/lib/tempo/config.ts
import { createConfig, http } from 'wagmi'
import { tempo } from 'tempo.ts/chains'
import { KeyManager, webAuthn } from 'tempo.ts/wagmi'

// Fee token is AlphaUSD for testnet
const FEE_TOKEN = '0x20c0000000000000000000000000000000000001'

export const tempoChain = tempo({ feeToken: FEE_TOKEN })

export const wagmiConfig = createConfig({
  chains: [tempoChain],
  connectors: [
    webAuthn({
      keyManager: KeyManager.localStorage(),
    }),
  ],
  multiInjectedProviderDiscovery: false,
  transports: {
    [tempoChain.id]: http(),
  },
  ssr: true,
})
```

**Step 2: Delete chains.ts (now using tempo.ts/chains)**

```bash
rm apps/checkout/lib/tempo/chains.ts
```

**Step 3: Update tokens.ts imports**

The tokens.ts file references tempoTestnet - update to use the new config:

```typescript
// apps/checkout/lib/tempo/tokens.ts
// No changes needed - tokens are independent of chain config
```

**Step 4: Test that the app compiles**

```bash
cd apps/checkout && pnpm dev
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat(checkout): use tempo.ts chain and webAuthn connector"
```

---

### Task A2: Update PaymentClient to handle Sign Up vs Sign In

**Files:**
- Modify: `apps/checkout/app/pay/[memo]/payment-client.tsx`

**Step 1: Update payment flow with proper sign-up/sign-in handling**

```typescript
// apps/checkout/app/pay/[memo]/payment-client.tsx
'use client'

import { useState } from 'react'
import { useAccount, useConnect, useConnectors, useSendTransaction } from 'wagmi'
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
  const [showSignUpOption, setShowSignUpOption] = useState(false)

  const { isConnected, address } = useAccount()
  const { connectAsync } = useConnect()
  const connectors = useConnectors()
  const { sendTransactionAsync } = useSendTransaction()

  // Get the webAuthn connector
  const webAuthnConnector = connectors[0]

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

  const handleConnect = async (isSignUp: boolean) => {
    try {
      setError(undefined)
      setState('connecting')

      if (!webAuthnConnector) {
        throw new Error('Passkey connector not available')
      }

      // Connect with sign-up or sign-in capability
      await connectAsync({
        connector: webAuthnConnector,
        ...(isSignUp ? { capabilities: { type: 'sign-up' } } : {}),
      })

      setShowSignUpOption(false)
      setState('idle')
    } catch (err) {
      console.error('Connection error:', err)
      // If sign-in fails, offer sign-up option
      if (!isSignUp && err instanceof Error && err.message.includes('not found')) {
        setShowSignUpOption(true)
      }
      setError(err instanceof Error ? err.message : 'Connection failed')
      setState('error')
    }
  }

  const handlePay = async () => {
    try {
      setError(undefined)

      // Step 1: Connect wallet if not connected
      if (!isConnected) {
        // Try sign-in first (for existing users)
        await handleConnect(false)
        return // User needs to click pay again after connecting
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
      setError(err instanceof Error ? err.message : 'Payment failed')
      setState('error')
    }
  }

  const handleRetry = () => {
    setState('idle')
    setError(undefined)
    setShowSignUpOption(false)
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
          <div className="w-full max-w-sm space-y-4">
            <PaymentStatus
              status="error"
              errorMessage={error}
              onRetry={handleRetry}
            />
            {showSignUpOption && (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">No account found?</p>
                <button
                  onClick={() => handleConnect(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create new Passkey account
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <OrderCard
              order={order}
              onExpire={() => setIsExpired(true)}
            />

            {/* Show connected address if connected */}
            {isConnected && address && (
              <div className="text-sm text-gray-500">
                Paying from: {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}

            <PayButton
              onClick={handlePay}
              loading={state === 'connecting' || state === 'processing'}
              disabled={state === 'connecting' || state === 'processing'}
              label={
                !isConnected
                  ? 'Connect Passkey'
                  : state === 'processing'
                  ? 'Processing...'
                  : 'Pay Now'
              }
            />

            {/* Sign up option for new users */}
            {!isConnected && (
              <button
                onClick={() => handleConnect(true)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                New user? Create Passkey account
              </button>
            )}
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

**Step 2: Update PayButton to accept custom label**

```typescript
// apps/checkout/components/payment/pay-button.tsx
// Add label prop to PayButton interface and use it instead of hardcoded text
```

**Step 3: Test the flow in browser**

```bash
cd apps/checkout && pnpm dev
# Visit http://localhost:3002/pay/test_memo_123
# Test: Click "Create Passkey account" - should trigger WebAuthn prompt
# Test: After connecting, "Pay Now" button should execute transfer
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(checkout): implement Passkey sign-up/sign-in flow"
```

---

### Task A3: Update PayButton component for flexible labels

**Files:**
- Modify: `apps/checkout/components/payment/pay-button.tsx`

**Step 1: Add label prop**

```typescript
// apps/checkout/components/payment/pay-button.tsx
'use client'

import { Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PayButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  error?: string
  label?: string
}

export function PayButton({
  onClick,
  loading,
  disabled,
  error,
  label = '使用 Passkey 支付'
}: PayButtonProps) {
  return (
    <div className="w-full max-w-sm space-y-3">
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        size="lg"
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Lock className="h-4 w-4 mr-2" />
        )}
        {label}
      </Button>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <p className="text-xs text-gray-400 text-center">
        Powered by Tempo
      </p>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat(checkout): make PayButton label configurable"
```

---

### Task A4: Add faucet funding hook for testnet

**Files:**
- Create: `apps/checkout/hooks/use-faucet.ts`
- Modify: `apps/checkout/components/payment/faucet-link.tsx`

**Step 1: Create faucet hook using tempo.ts**

```typescript
// apps/checkout/hooks/use-faucet.ts
'use client'

import { Hooks } from 'tempo.ts/wagmi'
import { useAccount } from 'wagmi'

export function useFaucet() {
  const { address } = useAccount()
  const { mutate, isPending, isSuccess, error } = Hooks.faucet.useFundSync()

  const fundAccount = () => {
    if (address) {
      mutate({ account: address })
    }
  }

  return {
    fundAccount,
    isPending,
    isSuccess,
    error,
    canFund: !!address,
  }
}
```

**Step 2: Update FaucetLink to show inline funding option**

```typescript
// apps/checkout/components/payment/faucet-link.tsx
'use client'

import { ExternalLink, Loader2, Check } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useFaucet } from '@/hooks/use-faucet'

export function FaucetLink() {
  const { isConnected } = useAccount()
  const { fundAccount, isPending, isSuccess, canFund } = useFaucet()

  // If connected, show inline fund button
  if (isConnected && canFund) {
    return (
      <button
        onClick={fundAccount}
        disabled={isPending || isSuccess}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Funding...</span>
          </>
        ) : isSuccess ? (
          <>
            <Check className="h-3 w-3 text-green-600" />
            <span className="text-green-600">Funded!</span>
          </>
        ) : (
          <>
            <span>🚰</span>
            <span>Get Test Tokens</span>
          </>
        )}
      </button>
    )
  }

  // Not connected - show link to faucet docs
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

**Step 3: Test faucet integration**

```bash
cd apps/checkout && pnpm dev
# Connect wallet, then click "Get Test Tokens"
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(checkout): add inline faucet funding for connected users"
```

---

## Feature B: Merchant Dashboard

### Task B1: Create dashboard layout with sidebar navigation

**Files:**
- Create: `apps/dashboard/app/(dashboard)/layout.tsx`
- Create: `apps/dashboard/components/sidebar.tsx`
- Create: `apps/dashboard/components/header.tsx`

**Step 1: Create sidebar component**

```typescript
// apps/dashboard/components/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  CreditCard,
  Key,
  Settings,
  BarChart3,
  Webhook
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Orders', href: '/dashboard/orders', icon: CreditCard },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'Webhooks', href: '/dashboard/webhooks', icon: Webhook },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">BetterPay</h1>
        <p className="text-sm text-gray-400">Merchant Dashboard</p>
      </div>

      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

**Step 2: Create header component**

```typescript
// apps/dashboard/components/header.tsx
'use client'

import { LogOut, User } from 'lucide-react'

interface HeaderProps {
  merchantName?: string
  merchantEmail?: string
}

export function Header({ merchantName, merchantEmail }: HeaderProps) {
  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {merchantName || 'Dashboard'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{merchantName}</p>
          <p className="text-xs text-gray-500">{merchantEmail}</p>
        </div>
        <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
```

**Step 3: Create dashboard layout**

```typescript
// apps/dashboard/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Step 4: Create dashboard overview page**

```typescript
// apps/dashboard/app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value="$0.00" change="+0%" />
        <StatCard title="Orders" value="0" change="+0%" />
        <StatCard title="Customers" value="0" change="+0%" />
        <StatCard title="Success Rate" value="0%" change="+0%" />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        <p className="text-gray-500">No orders yet</p>
      </div>
    </div>
  )
}

function StatCard({ title, value, change }: { title: string; value: string; change: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-sm text-green-600 mt-1">{change}</p>
    </div>
  )
}
```

**Step 5: Test dashboard layout**

```bash
cd apps/dashboard && pnpm dev
# Visit http://localhost:3000/dashboard
```

**Step 6: Commit**

```bash
git add -A && git commit -m "feat(dashboard): add dashboard layout with sidebar navigation"
```

---

### Task B2: Create API Keys management page

**Files:**
- Create: `apps/dashboard/app/(dashboard)/dashboard/api-keys/page.tsx`
- Create: `apps/dashboard/components/api-key-card.tsx`
- Create: `apps/dashboard/app/api/keys/route.ts`

**Step 1: Create API key card component**

```typescript
// apps/dashboard/components/api-key-card.tsx
'use client'

import { useState } from 'react'
import { Copy, Eye, EyeOff, Trash2 } from 'lucide-react'

interface ApiKeyCardProps {
  id: string
  name: string
  keyPrefix: string
  environment: 'test' | 'live'
  lastUsedAt?: string
  createdAt: string
  onDelete?: (id: string) => void
}

export function ApiKeyCard({
  id,
  name,
  keyPrefix,
  environment,
  lastUsedAt,
  createdAt,
  onDelete,
}: ApiKeyCardProps) {
  const [showKey, setShowKey] = useState(false)

  const maskedKey = `${keyPrefix}${'*'.repeat(32)}`

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{name}</h3>
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                environment === 'live'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {environment}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
              {showKey ? maskedKey : `${keyPrefix}...`}
            </code>
            <button
              onClick={() => setShowKey(!showKey)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(maskedKey)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Created: {new Date(createdAt).toLocaleDateString()}
            {lastUsedAt && ` • Last used: ${new Date(lastUsedAt).toLocaleDateString()}`}
          </p>
        </div>
        <button
          onClick={() => onDelete?.(id)}
          className="text-red-500 hover:text-red-700 p-2"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Create API keys page**

```typescript
// apps/dashboard/app/(dashboard)/dashboard/api-keys/page.tsx
'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ApiKeyCard } from '@/components/api-key-card'

export default function ApiKeysPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyEnv, setNewKeyEnv] = useState<'test' | 'live'>('test')
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  // Mock data - replace with actual API call
  const apiKeys = [
    {
      id: '1',
      name: 'Production',
      keyPrefix: 'sk_live_abc',
      environment: 'live' as const,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Development',
      keyPrefix: 'sk_test_xyz',
      environment: 'test' as const,
      lastUsedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ]

  const handleCreateKey = async () => {
    // TODO: Call API to create key
    const mockKey = `sk_${newKeyEnv}_${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`
    setCreatedKey(mockKey)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Key
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> API keys grant access to your account. Keep them secure and never expose them in client-side code.
        </p>
      </div>

      <div className="space-y-4">
        {apiKeys.map((key) => (
          <ApiKeyCard key={key.id} {...key} />
        ))}
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            {createdKey ? (
              <>
                <h2 className="text-lg font-semibold mb-4">API Key Created</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Copy this key now. You won't be able to see it again.
                </p>
                <code className="block bg-gray-100 p-3 rounded text-sm break-all">
                  {createdKey}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdKey)
                    setShowCreateModal(false)
                    setCreatedKey(null)
                    setNewKeyName('')
                  }}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg"
                >
                  Copy & Close
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4">Create API Key</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production, Staging"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Environment</label>
                    <select
                      value={newKeyEnv}
                      onChange={(e) => setNewKeyEnv(e.target.value as 'test' | 'live')}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="test">Test</option>
                      <option value="live">Live</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 border py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKey}
                    disabled={!newKeyName}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 3: Test API keys page**

```bash
cd apps/dashboard && pnpm dev
# Visit http://localhost:3000/dashboard/api-keys
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat(dashboard): add API keys management page"
```

---

### Task B3: Create Settings page with Tempo address

**Files:**
- Create: `apps/dashboard/app/(dashboard)/dashboard/settings/page.tsx`

**Step 1: Create settings page**

```typescript
// apps/dashboard/app/(dashboard)/dashboard/settings/page.tsx
'use client'

import { useState } from 'react'
import { Save, Check } from 'lucide-react'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    name: 'Test Merchant',
    email: 'test@merchant.com',
    tempoAddress: '',
    webhookUrl: '',
    gasSponsored: false,
  })

  const handleSave = async () => {
    // TODO: Call API to save settings
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold">Business Information</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Business Name</label>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold">Payment Settings</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Tempo Wallet Address</label>
          <p className="text-xs text-gray-500 mb-2">
            This is where you'll receive payments. Must be a valid Tempo address.
          </p>
          <input
            type="text"
            value={settings.tempoAddress}
            onChange={(e) => setSettings({ ...settings, tempoAddress: e.target.value })}
            placeholder="0x..."
            className="w-full border rounded-lg px-3 py-2 font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="gasSponsored"
            checked={settings.gasSponsored}
            onChange={(e) => setSettings({ ...settings, gasSponsored: e.target.checked })}
            className="h-4 w-4"
          />
          <label htmlFor="gasSponsored" className="text-sm">
            <span className="font-medium">Sponsor gas fees</span>
            <p className="text-gray-500">Pay transaction fees for your customers (recommended)</p>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold">Webhooks</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Webhook URL</label>
          <p className="text-xs text-gray-500 mb-2">
            We'll send POST requests to this URL when payment events occur.
          </p>
          <input
            type="url"
            value={settings.webhookUrl}
            onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
            placeholder="https://your-server.com/webhook"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  )
}
```

**Step 2: Test settings page**

```bash
cd apps/dashboard && pnpm dev
# Visit http://localhost:3000/dashboard/settings
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat(dashboard): add settings page with Tempo address config"
```

---

### Task B4: Create Orders list page

**Files:**
- Create: `apps/dashboard/app/(dashboard)/dashboard/orders/page.tsx`

**Step 1: Create orders page**

```typescript
// apps/dashboard/app/(dashboard)/dashboard/orders/page.tsx
'use client'

import { ExternalLink } from 'lucide-react'

export default function OrdersPage() {
  // Mock data - replace with actual API call
  const orders = [
    {
      id: 'ord_abc123',
      amount: '10.00',
      currency: 'USDC',
      status: 'paid',
      customerAddress: '0x1234...5678',
      txHash: '0xabcd...efgh',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ord_def456',
      amount: '25.00',
      currency: 'USDC',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ]

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      expired: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    return styles[status as keyof typeof styles] || styles.pending
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Order ID</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Amount</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Customer</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">TX</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm">{order.id}</td>
                <td className="px-6 py-4">
                  ${order.amount} {order.currency}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-sm">
                  {order.customerAddress || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {order.txHash && (
                    <a
                      href={`https://explore.tempo.xyz/tx/${order.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No orders yet. Create your first order via API.
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat(dashboard): add orders list page"
```

---

## Feature C: Smart Contract Deployment

### Task C1: Configure Foundry for Tempo testnet

**Files:**
- Modify: `packages/contracts/foundry.toml`
- Create: `packages/contracts/.env`

**Step 1: Update foundry.toml**

```toml
# packages/contracts/foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.20"

[rpc_endpoints]
tempo_testnet = "https://rpc.testnet.tempo.xyz"

[etherscan]
tempo_testnet = { key = "", url = "https://scout.tempo.xyz/api/" }
```

**Step 2: Create .env file (copy from .env.example)**

```bash
# packages/contracts/.env
PRIVATE_KEY=your_private_key_here
```

**Step 3: Commit foundry config**

```bash
git add packages/contracts/foundry.toml && git commit -m "chore(contracts): configure Foundry for Tempo testnet"
```

---

### Task C2: Get testnet funds and deploy contract

**Step 1: Generate a new wallet (if needed)**

```bash
cd packages/contracts
cast wallet new
# Save the private key to .env
```

**Step 2: Fund wallet with testnet tokens**

```bash
export TEMPO_RPC_URL=https://rpc.testnet.tempo.xyz
cast rpc tempo_fundAddress <YOUR_WALLET_ADDRESS> --rpc-url $TEMPO_RPC_URL
```

**Step 3: Deploy PaymentRegistry**

```bash
cd packages/contracts

# Load private key
source .env

# Deploy
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.testnet.tempo.xyz \
  --broadcast \
  --verify
```

**Step 4: Save deployed address**

```typescript
// packages/shared/src/constants/tempo.ts
export const PAYMENT_REGISTRY_ADDRESS_TESTNET = '0x...' // From deploy output
```

**Step 5: Commit deployed address**

```bash
git add packages/shared/src/constants/tempo.ts && git commit -m "feat(contracts): deploy PaymentRegistry to Tempo testnet"
```

---

### Task C3: Add contract ABI export for frontend

**Files:**
- Create: `packages/contracts/src/abi.ts`

**Step 1: Export ABI from compiled contract**

```typescript
// packages/contracts/src/abi.ts
export const PaymentRegistryABI = [
  {
    type: 'event',
    name: 'OrderCreated',
    inputs: [
      { name: 'orderId', type: 'string', indexed: true },
      { name: 'merchant', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'currency', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PaymentCompleted',
    inputs: [
      { name: 'orderId', type: 'string', indexed: true },
      { name: 'customer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'memo', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'registerOrder',
    inputs: [
      { name: 'orderId', type: 'string' },
      { name: 'amount', type: 'uint256' },
      { name: 'currency', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'recordPayment',
    inputs: [
      { name: 'orderId', type: 'string' },
      { name: 'memo', type: 'string' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat(contracts): export PaymentRegistry ABI for frontend"
```

---

## Summary

**Feature A (Passkey Payment):**
- A1: Update wagmi config with tempo.ts chain and webAuthn connector
- A2: Update PaymentClient with sign-up/sign-in flow
- A3: Make PayButton label configurable
- A4: Add inline faucet funding

**Feature B (Dashboard):**
- B1: Create dashboard layout with sidebar
- B2: Create API keys management page
- B3: Create settings page
- B4: Create orders list page

**Feature C (Smart Contract):**
- C1: Configure Foundry for Tempo testnet
- C2: Deploy PaymentRegistry contract
- C3: Export ABI for frontend use

---

*Generated: 2025-12-26*
