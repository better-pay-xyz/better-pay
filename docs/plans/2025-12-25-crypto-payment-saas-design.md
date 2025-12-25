# Crypto Payment SaaS - Design Document

## Overview

A Stripe-like payment SaaS built on Tempo blockchain, enabling merchants to accept crypto payments with modern UX (Passkeys) and advanced features (subscription autopay via Access Keys).

**Inspired by**: [Onchain Direct Debit Demo](https://direct-debit-onchain.vercel.app/)

**MVP Scope**:
- **One-time payments**: Hosted payment pages with Passkey authentication
- **Subscription autopay**: Recurring payments using Tempo's Access Keys

---

## Architecture

### Hybrid Architecture (Recommended)

**Philosophy**: Critical operations onchain, business logic offchain

**Components**:

1. **Frontend Layer**
   - Merchant Dashboard (Next.js 15)
   - Checkout Pages (Next.js 15 + Passkey auth)

2. **Backend Service** (Hono + Bun)
   - RESTful API
   - Payment engine
   - Subscription scheduler
   - Webhook service

3. **Smart Contracts** (Solidity on Tempo)
   - PaymentRegistry: Immutable audit log for orders/subscriptions/payments

4. **Data Storage**
   - PostgreSQL: Business data
   - Redis: Cache + task queue

5. **Tempo Integration**
   - Passkey accounts (WebAuthn)
   - Access Keys (delegated permissions)
   - Gas sponsorship (merchants pay user fees)

---

## Data Model

### Merchant
```typescript
{
  id: string
  name: string
  email: string
  tempoAddress: string        // Receiving address
  apiKey: string              // Encrypted
  webhookUrl?: string
  gasSponsored: boolean       // Pay gas for users
  createdAt: timestamp
}
```

### PaymentOrder
```typescript
{
  id: string                  // Public order ID
  merchantId: string
  amount: string              // BigInt string
  currency: string            // USDC, USDT, etc.
  memo: string                // Unique identifier for onchain matching
  status: enum                // pending | paid | expired | cancelled
  paymentUrl: string
  customerAddress?: string
  txHash?: string
  paidAt?: timestamp
  expiresAt: timestamp
  metadata: json              // Merchant custom data
  createdAt: timestamp
}
```

### Subscription
```typescript
{
  id: string
  merchantId: string
  customerId: string
  planId: string
  amount: string
  currency: string
  interval: enum              // daily | weekly | monthly | yearly
  status: enum                // active | paused | cancelled | expired
  accessKeyId: string         // User-authorized Access Key
  accessKeyLimit: string      // Spending limit
  accessKeyExpiry: timestamp
  nextPaymentAt: timestamp
  startedAt: timestamp
  cancelledAt?: timestamp
  metadata: json
  createdAt: timestamp
}
```

### Customer
```typescript
{
  id: string
  tempoAddress: string        // Tempo account
  passkeyId?: string          // Passkey credential ID
  email?: string
  createdAt: timestamp
}
```

### Payment
```typescript
{
  id: string
  orderId?: string            // For one-time payments
  subscriptionId?: string     // For subscription payments
  merchantId: string
  customerId: string
  amount: string
  currency: string
  txHash: string
  status: enum                // success | failed | pending
  failureReason?: string
  createdAt: timestamp
}
```

### IdempotencyKey
```typescript
{
  id: string
  key: string                 // Unique idempotency key
  response: json              // Cached API response
  createdAt: timestamp
  expiresAt: timestamp        // Auto-delete after 24h
}
```

---

## Core Flows

### Flow A: One-Time Payment

**1. Merchant creates order**
```
POST /api/orders
→ Generate order ID + unique memo
→ Smart contract: emit OrderCreated event
→ Return payment URL
```

**2. User visits payment page**
```
Open payment URL
→ Display order details
→ User creates/connects Tempo account (Passkey)
→ Passkey authentication (biometric)
```

**3. Execute payment**
```
User clicks "Pay"
→ transferWithMemo(merchantAddress, amount, memo)
→ Gas sponsorship (if enabled)
→ Sub-second confirmation on Tempo
```

**4. Payment confirmation**
```
Backend listens for onchain transfer events
→ Match payment via memo
→ Update order status to 'paid'
→ Smart contract: emit PaymentCompleted event
→ Trigger webhook to merchant
→ Show success page to user
```

---

### Flow B: Subscription Autopay

**1. Merchant creates subscription plan**
```
POST /api/subscription-plans
→ Generate plan ID
→ Return subscription URL
```

**2. User subscribes**
```
User visits subscription page
→ Passkey login to Tempo account
→ Review subscription (e.g., $10/month autopay)
→ Click "Enable Autopay"
```

**3. Authorize Access Key**
```
Frontend generates temp Access Key
→ Set spending limit: amount × 12 (annual budget)
→ Set expiry: 1 year
→ User root key (Passkey) signs authorization
→ Submit Access Key to backend (encrypted)
→ Smart contract: emit SubscriptionCreated event
```

**4. Auto-charge execution**
```
Cron job scans subscriptions due for payment
→ Backend uses Access Key to execute transfer
→ transferWithMemo(merchantAddress, amount, subscriptionId)
→ Update nextPaymentAt
→ Record Payment + onchain event
→ Trigger webhook
```

**5. User manages subscription**
```
User dashboard shows all subscriptions
→ Pause/cancel subscription
→ Cancel: stop charging, Access Key expires naturally
→ Optional: actively revoke Access Key (Tempo's revokeKey)
```

---

## Technical Implementation

### 1. Tempo SDK Integration

**Frontend (Checkout)**
```typescript
import { createTempoClient } from 'viem/tempo'
import { passkeyAccount } from 'viem/accounts'

// Create Passkey account
const account = await passkeyAccount.create({
  name: 'My Payment Account',
  domain: 'pay.yourdomain.com'
})

// Execute payment with memo
const hash = await client.sendTransaction({
  account,
  to: merchantAddress,
  value: amount,
  data: encodeMemo(orderId)
})
```

**Backend (Subscription)**
```typescript
import { privateKeyToAccount } from 'viem/accounts'

// Load encrypted Access Key
const accessKey = decrypt(subscription.accessKeyId)
const account = privateKeyToAccount(accessKey)

// Execute auto-charge
const hash = await client.sendTransaction({
  account,
  to: merchantAddress,
  value: subscription.amount,
  data: encodeMemo(subscription.id)
})
```

---

### 2. Access Key Management

**Authorization (Frontend)**
```typescript
// 1. Generate temp Access Key
const tempKey = generatePrivateKey()
const keyId = privateKeyToAddress(tempKey)

// 2. Build authorization
const authorization = {
  chainId: TEMPO_CHAIN_ID,
  keyType: 1, // P256
  keyId: keyId,
  expiry: Date.now() + 365 * 24 * 3600, // 1 year
  spendingLimit: {
    token: USDC_ADDRESS,
    amount: subscription.amount * 12n
  }
}

// 3. User root key signs
const signature = await account.signAuthorization(authorization)

// 4. Submit to backend
await fetch('/api/subscriptions/authorize', {
  method: 'POST',
  body: JSON.stringify({
    subscriptionId,
    accessKey: tempKey, // Encrypted in transit
    authorization,
    signature
  })
})
```

**Storage (Backend)**
```typescript
// Encrypt Access Key with AES-256-GCM
await db.subscription.update({
  where: { id: subscriptionId },
  data: {
    accessKeyId: keyId,
    accessKeyEncrypted: encrypt(tempKey),
    accessKeyLimit: authorization.spendingLimit.amount,
    accessKeyExpiry: authorization.expiry,
    status: 'active'
  }
})
```

---

### 3. Smart Contract (PaymentRegistry)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PaymentRegistry {
    event OrderCreated(
        string indexed orderId,
        address indexed merchant,
        uint256 amount,
        string currency
    );

    event PaymentCompleted(
        string indexed orderId,
        address indexed customer,
        uint256 amount,
        string memo
    );

    event SubscriptionCreated(
        string indexed subscriptionId,
        address indexed merchant,
        address indexed customer,
        uint256 amount,
        uint256 interval
    );

    event SubscriptionPayment(
        string indexed subscriptionId,
        uint256 amount,
        uint256 timestamp
    );

    function registerOrder(
        string calldata orderId,
        uint256 amount,
        string calldata currency
    ) external {
        emit OrderCreated(orderId, msg.sender, amount, currency);
    }

    function recordPayment(
        string calldata orderId,
        string calldata memo,
        uint256 amount
    ) external {
        emit PaymentCompleted(orderId, msg.sender, amount, memo);
    }

    function registerSubscription(
        string calldata subscriptionId,
        address customer,
        uint256 amount,
        uint256 interval
    ) external {
        emit SubscriptionCreated(
            subscriptionId,
            msg.sender,
            customer,
            amount,
            interval
        );
    }

    function recordSubscriptionPayment(
        string calldata subscriptionId,
        uint256 amount
    ) external {
        emit SubscriptionPayment(subscriptionId, amount, block.timestamp);
    }
}
```

---

## API Design

### Authentication
```
Authorization: Bearer sk_live_xxxxxxxxxxxx
```

### Endpoints

**Create Payment Order**
```http
POST /v1/orders
Content-Type: application/json

{
  "amount": "10.00",
  "currency": "USDC",
  "metadata": {
    "order_id": "ORDER-123",
    "customer_email": "user@example.com"
  },
  "success_url": "https://merchant.com/success",
  "cancel_url": "https://merchant.com/cancel",
  "expires_in": 3600
}

Response:
{
  "id": "ord_xxxxxxxxxxxxxx",
  "status": "pending",
  "payment_url": "https://pay.yourdomain.com/ord_xxxxxxxxxxxxxx",
  "amount": "10.00",
  "currency": "USDC",
  "created_at": "2025-12-25T10:00:00Z",
  "expires_at": "2025-12-25T11:00:00Z"
}
```

**Get Order Status**
```http
GET /v1/orders/:orderId

Response:
{
  "id": "ord_xxxxxxxxxxxxxx",
  "status": "paid",
  "amount": "10.00",
  "currency": "USDC",
  "customer_address": "0x1234...",
  "tx_hash": "0xabcd...",
  "paid_at": "2025-12-25T10:05:00Z"
}
```

**Create Subscription Plan**
```http
POST /v1/subscription-plans

{
  "name": "Premium Plan",
  "amount": "9.99",
  "currency": "USDC",
  "interval": "monthly",
  "trial_days": 7
}

Response:
{
  "id": "plan_xxxxxxxxxxxxxx",
  "name": "Premium Plan",
  "amount": "9.99",
  "currency": "USDC",
  "interval": "monthly",
  "subscription_url": "https://pay.yourdomain.com/subscribe/plan_xxxxxxxxxxxxxx"
}
```

**List Subscriptions**
```http
GET /v1/subscriptions?limit=20&starting_after=sub_xxx

Response:
{
  "data": [
    {
      "id": "sub_xxxxxxxxxxxxxx",
      "customer_id": "cus_xxxxxxxxxxxxxx",
      "plan_id": "plan_xxxxxxxxxxxxxx",
      "status": "active",
      "next_payment_at": "2025-12-31T23:59:59Z"
    }
  ],
  "has_more": true
}
```

**Cancel Subscription**
```http
DELETE /v1/subscriptions/:subscriptionId

Response:
{
  "id": "sub_xxxxxxxxxxxxxx",
  "status": "cancelled",
  "cancelled_at": "2025-12-25T10:00:00Z"
}
```

**Webhooks**
```http
POST https://merchant.com/webhook
X-Signature: sha256=xxxxxxxxxxxxx

{
  "type": "order.paid",
  "data": {
    "id": "ord_xxxxxxxxxxxxxx",
    "status": "paid",
    "amount": "10.00",
    "tx_hash": "0xabcd..."
  }
}

Event Types:
- order.created
- order.paid
- order.expired
- subscription.created
- subscription.payment_succeeded
- subscription.payment_failed
- subscription.cancelled
```

---

## Error Handling & Security

### Error Handling

**Payment Failure Retry**
```typescript
const RETRY_STRATEGY = {
  maxAttempts: 3,
  intervals: [1, 24, 72] // 1h, 1d, 3d
}

async function processSubscriptionPayment(subscription) {
  for (let attempt = 1; attempt <= RETRY_STRATEGY.maxAttempts; attempt++) {
    try {
      const txHash = await executePayment(subscription)
      await recordPayment(subscription, txHash, 'success')
      return
    } catch (error) {
      if (error.code === 'INSUFFICIENT_BALANCE') {
        await notifyCustomer(subscription, 'insufficient_balance')
      } else if (error.code === 'ACCESS_KEY_EXPIRED') {
        await pauseSubscription(subscription, 'key_expired')
        return
      } else if (error.code === 'SPENDING_LIMIT_EXCEEDED') {
        await pauseSubscription(subscription, 'limit_exceeded')
        return
      }

      if (attempt < RETRY_STRATEGY.maxAttempts) {
        await scheduleRetry(subscription, RETRY_STRATEGY.intervals[attempt])
      } else {
        await pauseSubscription(subscription, 'payment_failed')
      }
    }
  }
}
```

**Idempotency**
```typescript
// Use PostgreSQL for idempotency (no Redis needed for MVP)
app.post('/v1/orders', async (c) => {
  const idempotencyKey = c.req.header('idempotency-key')

  if (idempotencyKey) {
    // Check existing request
    const existing = await db.idempotencyKey.findUnique({
      where: {
        key: idempotencyKey,
        createdAt: { gte: new Date(Date.now() - 86400000) } // 24h
      }
    })
    if (existing) return c.json(existing.response)
  }

  const order = await createOrder(await c.req.json())

  if (idempotencyKey) {
    // Store idempotency record
    await db.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        response: order,
        createdAt: new Date()
      }
    })
  }

  return c.json(order)
})
```

---

### Security

**API Key Security**
```typescript
// Generate API keys with prefix
function generateApiKey(env: 'test' | 'live') {
  const prefix = env === 'test' ? 'sk_test_' : 'sk_live_'
  return prefix + crypto.randomBytes(32).toString('hex')
}

// Store only hash
const apiKeyHash = await bcrypt.hash(apiKey, 10)

// Authenticate requests
async function authenticateRequest(c) {
  const apiKey = c.req.header('authorization')?.replace('Bearer ', '')
  const merchant = await db.merchant.findFirst({
    where: { apiKeyHash: { contains: apiKey.slice(0, 10) } }
  })

  if (!merchant || !await bcrypt.compare(apiKey, merchant.apiKeyHash)) {
    throw new Error('Invalid API key')
  }

  return merchant
}
```

**Access Key Encryption**
```typescript
// AES-256-GCM encryption
function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':')
  const decipher = createDecipheriv(
    'aes-256-gcm',
    ENCRYPTION_KEY,
    Buffer.from(ivHex, 'hex')
  )
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
```

**Webhook Signatures**
```typescript
// Sign webhook payload
function signWebhook(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

// Merchant verifies signature
function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = signWebhook(payload, secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}
```

**Onchain Transaction Verification**
```typescript
async function verifyPayment(orderId: string, txHash: string) {
  const tx = await tempoClient.getTransaction({ hash: txHash })
  const receipt = await tempoClient.getTransactionReceipt({ hash: txHash })

  // Verify status
  if (receipt.status !== 'success') {
    throw new Error('Transaction failed')
  }

  // Verify recipient
  const order = await db.order.findUnique({ where: { id: orderId } })
  const merchant = await db.merchant.findUnique({ where: { id: order.merchantId } })

  if (tx.to.toLowerCase() !== merchant.tempoAddress.toLowerCase()) {
    throw new Error('Invalid recipient')
  }

  // Verify amount
  if (BigInt(tx.value) < BigInt(order.amount)) {
    throw new Error('Insufficient amount')
  }

  // Verify memo
  const memo = decodeMemo(tx.data)
  if (memo !== orderId) {
    throw new Error('Invalid memo')
  }

  return true
}
```

---

## Tech Stack

**Frontend**
- Framework: Next.js 16 (App Router)
- UI: Tailwind CSS + shadcn/ui
- Blockchain: Viem (Tempo support)
- State: React Query + Zustand
- Forms: React Hook Form + Zod

**Backend**
- Runtime: Bun
- Framework: Hono
- ORM: Drizzle ORM
- Queue: Bun's built-in cron (no Redis for MVP)
- Logging: Pino

**Database**
- Primary: PostgreSQL 17
- Cache: PostgreSQL (no Redis for MVP)

**Blockchain**
- Network: Tempo Testnet → Mainnet
- Contracts: Solidity 0.8.20 + Hardhat
- Events: Viem + WebSocket

**Monorepo**
- Tool: Bun Workspaces
- Package Manager: Bun

---

## Project Structure

```
better-pay/
├── apps/
│   ├── dashboard/             # Merchant dashboard (Next.js 15)
│   │   ├── app/
│   │   │   ├── (dashboard)/
│   │   │   └── (auth)/
│   │   └── components/
│   │
│   ├── checkout/              # Payment pages (Next.js 15)
│   │   ├── app/
│   │   │   ├── pay/[orderId]/
│   │   │   └── subscribe/[planId]/
│   │   ├── components/
│   │   │   ├── passkey-auth/
│   │   │   ├── payment-form/
│   │   │   └── subscription-setup/
│   │   └── lib/
│   │       └── tempo/
│   │
│   └── api/                   # Backend API (Hono + Bun)
│       ├── src/
│       │   ├── routes/
│       │   │   ├── orders.ts
│       │   │   ├── subscriptions.ts
│       │   │   └── webhooks.ts
│       │   ├── services/
│       │   │   ├── payment.service.ts
│       │   │   ├── subscription.service.ts
│       │   │   └── webhook.service.ts
│       │   ├── workers/
│       │   │   ├── subscription-processor.ts
│       │   │   └── event-listener.ts
│       │   └── middleware/
│       │       ├── auth.ts
│       │       └── rate-limit.ts
│       └── drizzle/
│           └── schema.ts
│
├── packages/
│   ├── contracts/             # Smart contracts
│   │   ├── contracts/
│   │   │   └── PaymentRegistry.sol
│   │   ├── scripts/
│   │   │   └── deploy.ts
│   │   └── test/
│   │
│   ├── database/              # Drizzle schema & migrations
│   │   ├── schema/
│   │   └── migrations/
│   │
│   └── shared/                # Shared code
│       ├── types/
│       ├── constants/
│       └── utils/
│
├── bun.lockb
├── package.json               # Workspace root
└── docker-compose.yml
```

---

## MVP Milestones

### Phase 1: Foundation (Week 1-2)
- [ ] Setup monorepo with Bun Workspaces
- [ ] Setup database (PostgreSQL + Drizzle)
- [ ] Deploy smart contract to Tempo testnet
- [ ] Basic merchant authentication

### Phase 2: One-Time Payments (Week 3-4)
- [ ] Merchant API (create orders, query status)
- [ ] Checkout page with Passkey authentication
- [ ] Payment execution with Tempo
- [ ] Onchain event listening & verification
- [ ] Webhook notifications

### Phase 3: Subscriptions (Week 5-6)
- [ ] Subscription plan API
- [ ] Access Key authorization UI
- [ ] Backend Access Key encryption & storage
- [ ] Subscription scheduler (cron jobs)
- [ ] Auto-charge execution
- [ ] User subscription management

### Phase 4: Dashboard & Polish (Week 7-8)
- [ ] Merchant dashboard (order/subscription views)
- [ ] Analytics & reporting
- [ ] Gas sponsorship feature
- [ ] Error handling & retry logic
- [ ] Documentation & deployment

---

## Key Innovations

1. **Passkey Authentication**: No passwords, biometric login for crypto payments
2. **Access Keys**: Secure delegated permissions for subscription autopay
3. **Gas Sponsorship**: Merchants pay fees, users have zero-friction experience
4. **Hybrid Architecture**: Balance transparency (onchain audit) with flexibility (offchain logic)
5. **Tempo Native**: Leverages Tempo's protocol-level features vs. complex smart contracts

---

## Future Enhancements

- JavaScript SDK for merchant integration
- Payment links (shareable URLs)
- Multi-chain support (expand beyond Tempo)
- Invoice management
- Refunds & disputes
- Multi-currency pricing
- Payment analytics dashboard

---

*Generated: 2025-12-25*
