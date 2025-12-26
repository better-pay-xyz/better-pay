# Payment Page with Passkeys - Design Document

> **Domain**: better-pay.xyz
> **Created**: 2025-12-26

## Overview

Customer-facing payment page that enables seamless crypto payments using Tempo's native Passkey (WebAuthn) authentication. No wallet extensions, no seed phrases - just biometric authentication.

**User Journey:**
```
访问 /pay/[memo] → 查看订单详情 → 点击 Passkey 支付 →
生物识别验证 → 执行 AlphaUSD 转账 → 成功动画 → 自动跳转商户
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Wallet Support | Passkey-only | MVP 聚焦 Tempo 独特体验 |
| Payment Token | AlphaUSD (测试网) | Tempo 官方测试稳定币 |
| Success Flow | 自动跳转 (2-3s) | 流畅的支付体验 |
| Passkey Entry | 统一入口 | 自动检测新/老用户 |

---

## Tempo Integration

### Network Configuration

```typescript
// Tempo Testnet
export const tempoTestnet = {
  id: 42429,
  name: 'Tempo Testnet',
  network: 'tempo-testnet',
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
}
```

### Test Stablecoins

| Token | Address | Decimals |
|-------|---------|----------|
| AlphaUSD | `0x20c0000000000000000000000000000000000001` | 6 |
| BetaUSD | `0x20c0000000000000000000000000000000000002` | 6 |
| ThetaUSD | `0x20c0000000000000000000000000000000000003` | 6 |

### SDK Setup

```bash
pnpm add tempo.ts wagmi viem @tanstack/react-query
```

```typescript
import { webauthn, KeyManager } from 'tempo.ts/wagmi'
import { createConfig, http } from 'wagmi'
import { tempoTestnet } from './chains'

export const config = createConfig({
  chains: [tempoTestnet],
  connectors: [
    webauthn({
      keyManager: KeyManager.localStorage(),
    }),
  ],
  transports: {
    [tempoTestnet.id]: http(),
  },
})
```

---

## Page States

```
┌─────────────────────────────────────────────────────────────┐
│  State        │ UI                     │ Actions            │
├─────────────────────────────────────────────────────────────┤
│  loading      │ Skeleton loader        │ Fetch order        │
│  ready        │ Order card + Pay btn   │ Wait for click     │
│  authenticating│ "验证中..." spinner   │ WebAuthn prompt    │
│  processing   │ "支付中..." + tx hash  │ Send transaction   │
│  success      │ ✓ + countdown          │ Redirect           │
│  error        │ Error message + retry  │ Show error         │
│  expired      │ "订单已过期"           │ No action          │
│  not_found    │ "订单不存在"           │ No action          │
└─────────────────────────────────────────────────────────────┘
```

---

## UI Layout

```
┌─────────────────────────────────────────┐
│  [🚰 领取测试币]              BetterPay │  ← Header
├─────────────────────────────────────────┤
│                                         │
│              商户名称                    │
│                                         │
│         ┌───────────────────┐           │
│         │                   │           │
│         │    $10.00         │           │  ← Order Card
│         │    AlphaUSD       │           │
│         │                   │           │
│         │  订单 #ORD-123    │           │
│         │  14:59 后过期     │           │
│         │                   │           │
│         └───────────────────┘           │
│                                         │
│      ┌─────────────────────────┐        │
│      │  🔐 使用 Passkey 支付   │        │  ← Pay Button
│      └─────────────────────────┘        │
│                                         │
│          Powered by Tempo               │
│                                         │
└─────────────────────────────────────────┘
```

---

## File Structure

```
apps/checkout/
├── app/
│   ├── pay/
│   │   └── [memo]/
│   │       ├── page.tsx              # Payment page (RSC)
│   │       └── payment-client.tsx    # Client component
│   ├── api/
│   │   └── orders/
│   │       └── [memo]/
│   │           └── route.ts          # GET order by memo
│   ├── layout.tsx
│   ├── globals.css
│   └── providers.tsx                 # Wagmi + React Query
│
├── components/
│   ├── payment/
│   │   ├── order-card.tsx            # Order info display
│   │   ├── pay-button.tsx            # Passkey payment trigger
│   │   ├── payment-status.tsx        # Status display
│   │   ├── countdown-timer.tsx       # Expiry countdown
│   │   └── faucet-link.tsx           # Testnet faucet link
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── spinner.tsx
│       └── icons.tsx
│
├── lib/
│   ├── tempo/
│   │   ├── config.ts                 # Wagmi config with tempo.ts
│   │   ├── chains.ts                 # Tempo chain definition
│   │   └── tokens.ts                 # Token addresses & ABIs
│   ├── api.ts                        # API client
│   └── utils.ts                      # Helpers (format, etc.)
│
├── hooks/
│   ├── use-order.ts                  # Order fetching
│   ├── use-payment.ts                # Payment execution
│   └── use-countdown.ts              # Timer hook
│
└── stores/
    └── payment-store.ts              # Zustand state
```

---

## Core Components

### 1. Payment Page (RSC)

```typescript
// app/pay/[memo]/page.tsx
import { notFound } from 'next/navigation'
import { db } from '@better-pay/database'
import { PaymentClient } from './payment-client'

export default async function PaymentPage({
  params
}: {
  params: { memo: string }
}) {
  const order = await db.query.orders.findFirst({
    where: (orders, { eq }) => eq(orders.memo, params.memo),
    with: { merchant: true }
  })

  if (!order) return notFound()

  return <PaymentClient order={order} />
}
```

### 2. Payment Client Component

```typescript
// app/pay/[memo]/payment-client.tsx
'use client'

import { useAccount, useConnect } from 'wagmi'
import { webauthn } from 'tempo.ts/wagmi'
import { OrderCard } from '@/components/payment/order-card'
import { PayButton } from '@/components/payment/pay-button'
import { PaymentStatus } from '@/components/payment/payment-status'
import { usePayment } from '@/hooks/use-payment'

export function PaymentClient({ order }) {
  const { isConnected, address } = useAccount()
  const { connect } = useConnect()
  const { status, execute, txHash, error } = usePayment(order)

  const handlePay = async () => {
    if (!isConnected) {
      // Will trigger Passkey creation/login
      await connect({ connector: webauthn() })
    }
    await execute()
  }

  if (order.status === 'paid') {
    return <PaymentStatus status="already_paid" />
  }

  if (new Date() > order.expiresAt) {
    return <PaymentStatus status="expired" />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <OrderCard order={order} />

      {status === 'success' ? (
        <PaymentStatus
          status="success"
          txHash={txHash}
          redirectUrl={order.metadata?.success_url}
        />
      ) : (
        <PayButton
          onClick={handlePay}
          loading={status === 'authenticating' || status === 'processing'}
          error={error}
        />
      )}
    </div>
  )
}
```

### 3. Payment Hook

```typescript
// hooks/use-payment.ts
import { useState } from 'react'
import { useAccount, useSendTransaction, useWaitForTransaction } from 'wagmi'
import { parseUnits, encodeFunctionData } from 'viem'
import { ALPHA_USD_ADDRESS, erc20Abi } from '@/lib/tempo/tokens'

export function usePayment(order: Order) {
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [txHash, setTxHash] = useState<string>()
  const [error, setError] = useState<string>()

  const { address } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()

  const execute = async () => {
    try {
      setStatus('processing')
      setError(undefined)

      // ERC20 transfer to merchant
      const hash = await sendTransactionAsync({
        to: ALPHA_USD_ADDRESS,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [
            order.merchant.tempoAddress,
            parseUnits(order.amount, 6) // AlphaUSD has 6 decimals
          ]
        })
      })

      setTxHash(hash)

      // Update order status via API
      await fetch(`/api/orders/${order.memo}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ txHash: hash, customerAddress: address })
      })

      setStatus('success')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return { status, txHash, error, execute }
}
```

---

## API Endpoints

### GET /api/orders/[memo]

Returns order details for the payment page.

```typescript
// app/api/orders/[memo]/route.ts
import { NextResponse } from 'next/server'
import { db } from '@better-pay/database'

export async function GET(
  request: Request,
  { params }: { params: { memo: string } }
) {
  const order = await db.query.orders.findFirst({
    where: (orders, { eq }) => eq(orders.memo, params.memo),
    with: { merchant: { columns: { name: true, tempoAddress: true } } }
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    expiresAt: order.expiresAt,
    merchant: {
      name: order.merchant.name,
      address: order.merchant.tempoAddress
    },
    metadata: order.metadata
  })
}
```

### POST /api/orders/[memo]/confirm

Updates order after successful payment.

```typescript
// app/api/orders/[memo]/confirm/route.ts
import { NextResponse } from 'next/server'
import { db, orders } from '@better-pay/database'
import { eq } from 'drizzle-orm'

export async function POST(
  request: Request,
  { params }: { params: { memo: string } }
) {
  const { txHash, customerAddress } = await request.json()

  const [updated] = await db
    .update(orders)
    .set({
      status: 'paid',
      txHash,
      customerAddress,
      paidAt: new Date()
    })
    .where(eq(orders.memo, params.memo))
    .returning()

  // TODO: Trigger webhook to merchant

  return NextResponse.json({ success: true, order: updated })
}
```

---

## Success Flow

After payment confirmation:

1. Show success checkmark animation
2. Display transaction hash (linked to explorer)
3. Start 3-second countdown
4. Auto-redirect to `success_url` (or show "支付成功" if no URL)

```typescript
// components/payment/payment-status.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export function PaymentStatus({ status, txHash, redirectUrl }) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (status === 'success' && redirectUrl) {
      const timer = setInterval(() => {
        setCountdown(c => {
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

  if (status === 'success') {
    return (
      <div className="text-center space-y-4 animate-fade-in">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold">支付成功!</h2>
        {txHash && (
          <a
            href={`https://explore.tempo.xyz/tx/${txHash}`}
            target="_blank"
            className="text-sm text-blue-500 hover:underline"
          >
            查看交易 ↗
          </a>
        )}
        {redirectUrl && (
          <p className="text-gray-500">{countdown} 秒后返回商户...</p>
        )}
      </div>
    )
  }
  // ... other statuses
}
```

---

## Faucet Integration

Header component with testnet faucet link:

```typescript
// components/payment/faucet-link.tsx
export function FaucetLink() {
  return (
    <a
      href="https://docs.tempo.xyz/quickstart/faucet"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
    >
      <span>🚰</span>
      <span>领取测试币</span>
    </a>
  )
}
```

---

## Error Handling

| Error | Message | Action |
|-------|---------|--------|
| Order not found | "订单不存在" | Show error page |
| Order expired | "订单已过期" | Show expired state |
| Insufficient balance | "余额不足，请先领取测试币" | Show faucet link |
| User cancelled | "已取消" | Reset to ready state |
| Transaction failed | "交易失败: {reason}" | Show retry button |
| Network error | "网络错误，请重试" | Show retry button |

---

## Dependencies

```json
{
  "dependencies": {
    "tempo.ts": "latest",
    "wagmi": "^2.0.0",
    "viem": "^2.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "lucide-react": "^0.300.0"
  }
}
```

---

## Implementation Tasks

### Phase 1: Setup (Task 1)
- [ ] Install tempo.ts, wagmi, viem dependencies
- [ ] Configure wagmi with Tempo testnet + WebAuthn connector
- [ ] Create Providers component with QueryClient + WagmiProvider
- [ ] Update layout.tsx to wrap with Providers

### Phase 2: Core Components (Task 2)
- [ ] Create tempo chain config (lib/tempo/chains.ts)
- [ ] Create token constants (lib/tempo/tokens.ts)
- [ ] Build OrderCard component
- [ ] Build PayButton component
- [ ] Build PaymentStatus component
- [ ] Build FaucetLink component

### Phase 3: Payment Flow (Task 3)
- [ ] Create /pay/[memo] page (RSC)
- [ ] Create PaymentClient component
- [ ] Implement usePayment hook
- [ ] Handle Passkey authentication flow
- [ ] Execute ERC20 transfer

### Phase 4: API & Confirmation (Task 4)
- [ ] Create GET /api/orders/[memo] endpoint
- [ ] Create POST /api/orders/[memo]/confirm endpoint
- [ ] Implement success redirect with countdown
- [ ] Add error handling and retry logic

### Phase 5: Polish (Task 5)
- [ ] Add loading skeletons
- [ ] Add animations (fade-in, success checkmark)
- [ ] Mobile responsive design
- [ ] Test full flow end-to-end

---

## Sources

- [Tempo GitHub](https://github.com/tempoxyz/tempo)
- [tempo-ts SDK](https://github.com/tempoxyz/tempo-ts)
- [Tempo Faucet](https://docs.tempo.xyz/quickstart/faucet)
- [Tempo Explorer](https://explore.tempo.xyz)

---

*Generated: 2025-12-26*
