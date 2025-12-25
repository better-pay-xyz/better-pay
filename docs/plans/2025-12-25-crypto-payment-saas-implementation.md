# Crypto Payment SaaS - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Stripe-like crypto payment SaaS on Tempo blockchain with one-time payments and subscription autopay

**Architecture:** Hybrid architecture with Next.js 16 frontend, Hono backend, Drizzle ORM + PostgreSQL 17, and Tempo smart contracts

**Tech Stack:**
- Frontend: Next.js 16, Tailwind, shadcn/ui, Viem
- Backend: Node.js 20+, Hono, Drizzle ORM
- Database: PostgreSQL 17
- Blockchain: Tempo Testnet, Solidity 0.8.20
- Monorepo: Bun Workspaces

---

## Phase 1: Foundation

### Task 1.1: Initialize Monorepo

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `bun.lockb` (auto-generated)

**Step 1: Initialize Bun workspace**

```bash
cd /Users/daoleno/workspace/better-pay
bun init -y
```

Expected: Creates basic `package.json`

**Step 2: Configure workspace**

Edit `package.json`:

```json
{
  "name": "better-pay",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "bun run --filter='apps/*' dev",
    "build": "bun run --filter='apps/*' build",
    "test": "bun test",
    "db:generate": "bun run --filter='@better-pay/database' generate",
    "db:migrate": "bun run --filter='@better-pay/database' migrate",
    "db:studio": "bun run --filter='@better-pay/database' studio"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

**Step 3: Create .gitignore**

Create `.gitignore`:

```
# Dependencies
node_modules/
.pnp
.pnp.js
bun.lockb

# Testing
coverage/

# Next.js
.next/
out/

# Production
build/
dist/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Drizzle
drizzle/

# Logs
*.log
npm-debug.log*
```

**Step 4: Create directory structure**

```bash
mkdir -p apps/{api,checkout,dashboard}
mkdir -p packages/{contracts,database,shared}
```

**Step 5: Commit**

```bash
git add .
git commit -m "chore: initialize monorepo with Bun workspaces"
```

---

### Task 1.2: Setup Database Package

**Files:**
- Create: `packages/database/package.json`
- Create: `packages/database/drizzle.config.ts`
- Create: `packages/database/src/index.ts`
- Create: `packages/database/src/schema/index.ts`
- Create: `packages/database/src/schema/merchants.ts`
- Create: `packages/database/src/schema/orders.ts`
- Create: `packages/database/src/schema/subscriptions.ts`
- Create: `packages/database/src/schema/customers.ts`
- Create: `packages/database/src/schema/payments.ts`
- Create: `packages/database/src/schema/idempotency-keys.ts`

**Step 1: Initialize database package**

Create `packages/database/package.json`:

```json
{
  "name": "@better-pay/database",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "studio": "drizzle-kit studio"
  },
  "dependencies": {
    "drizzle-orm": "^0.29.1",
    "postgres": "^3.4.3"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.9"
  }
}
```

**Step 2: Configure Drizzle**

Create `packages/database/drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!
  }
} satisfies Config
```

**Step 3: Create merchant schema**

Create `packages/database/src/schema/merchants.ts`:

```typescript
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const merchants = pgTable('merchants', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  tempoAddress: text('tempo_address').notNull(),
  apiKeyHash: text('api_key_hash').notNull(),
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),
  gasSponsored: boolean('gas_sponsored').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export type Merchant = typeof merchants.$inferSelect
export type NewMerchant = typeof merchants.$inferInsert
```

**Step 4: Create orders schema**

Create `packages/database/src/schema/orders.ts`:

```typescript
import { pgTable, text, timestamp, json } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { merchants } from './merchants'

export const orderStatus = ['pending', 'paid', 'expired', 'cancelled'] as const
export type OrderStatus = typeof orderStatus[number]

export const orders = pgTable('orders', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `ord_${createId()}`),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id),
  amount: text('amount').notNull(), // BigInt as string
  currency: text('currency').notNull(),
  memo: text('memo').notNull().unique(),
  status: text('status').notNull().$type<OrderStatus>().default('pending'),
  paymentUrl: text('payment_url').notNull(),
  customerAddress: text('customer_address'),
  txHash: text('tx_hash'),
  paidAt: timestamp('paid_at'),
  expiresAt: timestamp('expires_at').notNull(),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
```

**Step 5: Create subscriptions schema**

Create `packages/database/src/schema/subscriptions.ts`:

```typescript
import { pgTable, text, timestamp, json } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { merchants } from './merchants'
import { customers } from './customers'

export const subscriptionInterval = ['daily', 'weekly', 'monthly', 'yearly'] as const
export type SubscriptionInterval = typeof subscriptionInterval[number]

export const subscriptionStatus = ['active', 'paused', 'cancelled', 'expired'] as const
export type SubscriptionStatus = typeof subscriptionStatus[number]

export const subscriptionPlans = pgTable('subscription_plans', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `plan_${createId()}`),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id),
  name: text('name').notNull(),
  amount: text('amount').notNull(),
  currency: text('currency').notNull(),
  interval: text('interval').notNull().$type<SubscriptionInterval>(),
  trialDays: text('trial_days'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export const subscriptions = pgTable('subscriptions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `sub_${createId()}`),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id),
  planId: text('plan_id')
    .notNull()
    .references(() => subscriptionPlans.id),
  amount: text('amount').notNull(),
  currency: text('currency').notNull(),
  interval: text('interval').notNull().$type<SubscriptionInterval>(),
  status: text('status').notNull().$type<SubscriptionStatus>().default('active'),
  accessKeyId: text('access_key_id'),
  accessKeyEncrypted: text('access_key_encrypted'),
  accessKeyLimit: text('access_key_limit'),
  accessKeyExpiry: timestamp('access_key_expiry'),
  nextPaymentAt: timestamp('next_payment_at').notNull(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert
export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
```

**Step 6: Create customers schema**

Create `packages/database/src/schema/customers.ts`:

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const customers = pgTable('customers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `cus_${createId()}`),
  tempoAddress: text('tempo_address').notNull().unique(),
  passkeyId: text('passkey_id'),
  email: text('email'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
```

**Step 7: Create payments schema**

Create `packages/database/src/schema/payments.ts`:

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { merchants } from './merchants'
import { customers } from './customers'
import { orders } from './orders'
import { subscriptions } from './subscriptions'

export const paymentStatus = ['success', 'failed', 'pending'] as const
export type PaymentStatus = typeof paymentStatus[number]

export const payments = pgTable('payments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `pay_${createId()}`),
  orderId: text('order_id').references(() => orders.id),
  subscriptionId: text('subscription_id').references(() => subscriptions.id),
  merchantId: text('merchant_id')
    .notNull()
    .references(() => merchants.id),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id),
  amount: text('amount').notNull(),
  currency: text('currency').notNull(),
  txHash: text('tx_hash').notNull(),
  status: text('status').notNull().$type<PaymentStatus>().default('pending'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
```

**Step 8: Create idempotency keys schema**

Create `packages/database/src/schema/idempotency-keys.ts`:

```typescript
import { pgTable, text, timestamp, json } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const idempotencyKeys = pgTable('idempotency_keys', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  key: text('key').notNull().unique(),
  response: json('response').$type<Record<string, any>>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull()
})

export type IdempotencyKey = typeof idempotencyKeys.$inferSelect
export type NewIdempotencyKey = typeof idempotencyKeys.$inferInsert
```

**Step 9: Create schema index**

Create `packages/database/src/schema/index.ts`:

```typescript
export * from './merchants'
export * from './orders'
export * from './subscriptions'
export * from './customers'
export * from './payments'
export * from './idempotency-keys'
```

**Step 10: Create database client**

Create `packages/database/src/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const client = postgres(connectionString)
export const db = drizzle(client, { schema })

export * from './schema'
```

**Step 11: Install dependencies**

```bash
cd packages/database
bun install
bun add @paralleldrive/cuid2
```

**Step 12: Commit**

```bash
git add packages/database
git commit -m "feat(database): add Drizzle schemas for all entities"
```

---

### Task 1.3: Setup Shared Package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/constants/tempo.ts`
- Create: `packages/shared/src/utils/crypto.ts`
- Create: `packages/shared/src/utils/id.ts`

**Step 1: Initialize shared package**

Create `packages/shared/package.json`:

```json
{
  "name": "@better-pay/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./constants": "./src/constants/index.ts",
    "./utils": "./src/utils/index.ts"
  },
  "dependencies": {
    "@paralleldrive/cuid2": "^2.2.2",
    "zod": "^3.22.4"
  }
}
```

**Step 2: Create shared types**

Create `packages/shared/src/types/index.ts`:

```typescript
import { z } from 'zod'

// API Request/Response types
export const createOrderSchema = z.object({
  amount: z.string().regex(/^\d+\.?\d*$/),
  currency: z.string(),
  metadata: z.record(z.any()).optional(),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
  expires_in: z.number().int().positive().default(3600)
})

export type CreateOrderRequest = z.infer<typeof createOrderSchema>

export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1),
  amount: z.string().regex(/^\d+\.?\d*$/),
  currency: z.string(),
  interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  trial_days: z.number().int().nonnegative().optional(),
  metadata: z.record(z.any()).optional()
})

export type CreateSubscriptionPlanRequest = z.infer<typeof createSubscriptionPlanSchema>

// Webhook event types
export type WebhookEventType =
  | 'order.created'
  | 'order.paid'
  | 'order.expired'
  | 'subscription.created'
  | 'subscription.payment_succeeded'
  | 'subscription.payment_failed'
  | 'subscription.cancelled'

export interface WebhookEvent {
  type: WebhookEventType
  data: Record<string, any>
  created_at: string
}
```

**Step 3: Create constants**

Create `packages/shared/src/constants/tempo.ts`:

```typescript
export const TEMPO_TESTNET_CHAIN_ID = 41144 // Placeholder - update with actual chain ID
export const TEMPO_MAINNET_CHAIN_ID = 0 // Placeholder

export const TEMPO_TESTNET_RPC = 'https://rpc.testnet.tempo.xyz' // Placeholder
export const TEMPO_MAINNET_RPC = 'https://rpc.tempo.xyz' // Placeholder

export const USDC_ADDRESS_TESTNET = '0x...' // Placeholder
export const USDT_ADDRESS_TESTNET = '0x...' // Placeholder

export const PAYMENT_REGISTRY_ADDRESS_TESTNET = '0x...' // Will be updated after deployment
```

Create `packages/shared/src/constants/index.ts`:

```typescript
export * from './tempo'
```

**Step 4: Create crypto utilities**

Create `packages/shared/src/utils/crypto.ts`:

```typescript
import { createCipheriv, createDecipheriv, randomBytes, createHmac, timingSafeEqual } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

export function encrypt(plaintext: string, key: string): string {
  const keyBuffer = Buffer.from(key, 'hex')
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(ciphertext: string, key: string): string {
  const keyBuffer = Buffer.from(key, 'hex')
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export function signWebhook(payload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = signWebhook(payload, secret)

  try {
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex')
}
```

**Step 5: Create ID utilities**

Create `packages/shared/src/utils/id.ts`:

```typescript
import { createId } from '@paralleldrive/cuid2'

export function generateOrderId(): string {
  return `ord_${createId()}`
}

export function generateSubscriptionId(): string {
  return `sub_${createId()}`
}

export function generatePlanId(): string {
  return `plan_${createId()}`
}

export function generateCustomerId(): string {
  return `cus_${createId()}`
}

export function generatePaymentId(): string {
  return `pay_${createId()}`
}

export function generateMemo(): string {
  return createId()
}
```

Create `packages/shared/src/utils/index.ts`:

```typescript
export * from './crypto'
export * from './id'
```

**Step 6: Create main index**

Create `packages/shared/src/index.ts`:

```typescript
export * from './types'
export * from './constants'
export * from './utils'
```

**Step 7: Install dependencies**

```bash
cd packages/shared
bun install
```

**Step 8: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): add shared types, constants, and utilities"
```

---

### Task 1.4: Setup Smart Contracts Package

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/hardhat.config.ts`
- Create: `packages/contracts/contracts/PaymentRegistry.sol`
- Create: `packages/contracts/scripts/deploy.ts`
- Create: `packages/contracts/test/PaymentRegistry.test.ts`
- Create: `packages/contracts/.env.example`

**Step 1: Initialize contracts package**

Create `packages/contracts/package.json`:

```json
{
  "name": "@better-pay/contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "deploy:testnet": "hardhat run scripts/deploy.ts --network tempo-testnet",
    "verify": "hardhat verify --network tempo-testnet"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@types/node": "^20.10.0",
    "hardhat": "^2.19.4",
    "typescript": "^5.3.3"
  }
}
```

**Step 2: Configure Hardhat**

Create `packages/contracts/hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    'tempo-testnet': {
      url: process.env.TEMPO_TESTNET_RPC || 'https://rpc.testnet.tempo.xyz',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
}

export default config
```

**Step 3: Write PaymentRegistry contract**

Create `packages/contracts/contracts/PaymentRegistry.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PaymentRegistry
 * @notice Immutable audit log for payment orders and subscriptions
 * @dev Events provide onchain transparency without storing state
 */
contract PaymentRegistry {
    event OrderCreated(
        string indexed orderId,
        address indexed merchant,
        uint256 amount,
        string currency,
        uint256 timestamp
    );

    event PaymentCompleted(
        string indexed orderId,
        address indexed customer,
        uint256 amount,
        string memo,
        uint256 timestamp
    );

    event SubscriptionCreated(
        string indexed subscriptionId,
        address indexed merchant,
        address indexed customer,
        uint256 amount,
        uint256 interval,
        uint256 timestamp
    );

    event SubscriptionPayment(
        string indexed subscriptionId,
        address indexed customer,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @notice Register a new payment order
     * @param orderId Unique order identifier
     * @param amount Payment amount
     * @param currency Currency symbol (e.g., "USDC")
     */
    function registerOrder(
        string calldata orderId,
        uint256 amount,
        string calldata currency
    ) external {
        emit OrderCreated(
            orderId,
            msg.sender,
            amount,
            currency,
            block.timestamp
        );
    }

    /**
     * @notice Record a completed payment
     * @param orderId Order identifier
     * @param memo Payment memo for matching
     * @param amount Payment amount
     */
    function recordPayment(
        string calldata orderId,
        string calldata memo,
        uint256 amount
    ) external {
        emit PaymentCompleted(
            orderId,
            msg.sender,
            amount,
            memo,
            block.timestamp
        );
    }

    /**
     * @notice Register a new subscription
     * @param subscriptionId Unique subscription identifier
     * @param customer Customer address
     * @param amount Subscription amount per interval
     * @param interval Billing interval in seconds
     */
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
            interval,
            block.timestamp
        );
    }

    /**
     * @notice Record a subscription payment
     * @param subscriptionId Subscription identifier
     * @param amount Payment amount
     */
    function recordSubscriptionPayment(
        string calldata subscriptionId,
        uint256 amount
    ) external {
        emit SubscriptionPayment(
            subscriptionId,
            msg.sender,
            amount,
            block.timestamp
        );
    }
}
```

**Step 4: Write contract tests**

Create `packages/contracts/test/PaymentRegistry.test.ts`:

```typescript
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { PaymentRegistry } from '../typechain-types'

describe('PaymentRegistry', () => {
  let registry: PaymentRegistry
  let merchant: any
  let customer: any

  beforeEach(async () => {
    [merchant, customer] = await ethers.getSigners()

    const PaymentRegistryFactory = await ethers.getContractFactory('PaymentRegistry')
    registry = await PaymentRegistryFactory.deploy()
    await registry.waitForDeployment()
  })

  describe('registerOrder', () => {
    it('should emit OrderCreated event', async () => {
      const orderId = 'ord_test123'
      const amount = ethers.parseUnits('10', 18)
      const currency = 'USDC'

      await expect(registry.connect(merchant).registerOrder(orderId, amount, currency))
        .to.emit(registry, 'OrderCreated')
        .withArgs(orderId, merchant.address, amount, currency, await ethers.provider.getBlockNumber() + 1)
    })
  })

  describe('recordPayment', () => {
    it('should emit PaymentCompleted event', async () => {
      const orderId = 'ord_test123'
      const memo = 'memo_abc'
      const amount = ethers.parseUnits('10', 18)

      await expect(registry.connect(customer).recordPayment(orderId, memo, amount))
        .to.emit(registry, 'PaymentCompleted')
        .withArgs(orderId, customer.address, amount, memo, await ethers.provider.getBlockNumber() + 1)
    })
  })

  describe('registerSubscription', () => {
    it('should emit SubscriptionCreated event', async () => {
      const subscriptionId = 'sub_test123'
      const amount = ethers.parseUnits('10', 18)
      const interval = 2592000 // 30 days in seconds

      await expect(
        registry.connect(merchant).registerSubscription(
          subscriptionId,
          customer.address,
          amount,
          interval
        )
      )
        .to.emit(registry, 'SubscriptionCreated')
        .withArgs(
          subscriptionId,
          merchant.address,
          customer.address,
          amount,
          interval,
          await ethers.provider.getBlockNumber() + 1
        )
    })
  })

  describe('recordSubscriptionPayment', () => {
    it('should emit SubscriptionPayment event', async () => {
      const subscriptionId = 'sub_test123'
      const amount = ethers.parseUnits('10', 18)

      await expect(
        registry.connect(customer).recordSubscriptionPayment(subscriptionId, amount)
      )
        .to.emit(registry, 'SubscriptionPayment')
        .withArgs(
          subscriptionId,
          customer.address,
          amount,
          await ethers.provider.getBlockNumber() + 1
        )
    })
  })
})
```

**Step 5: Create deployment script**

Create `packages/contracts/scripts/deploy.ts`:

```typescript
import { ethers } from 'hardhat'

async function main() {
  console.log('Deploying PaymentRegistry...')

  const PaymentRegistry = await ethers.getContractFactory('PaymentRegistry')
  const registry = await PaymentRegistry.deploy()

  await registry.waitForDeployment()

  const address = await registry.getAddress()
  console.log(`PaymentRegistry deployed to: ${address}`)

  // Save the address to update constants
  console.log('\nUpdate packages/shared/src/constants/tempo.ts with:')
  console.log(`export const PAYMENT_REGISTRY_ADDRESS_TESTNET = '${address}'`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
```

**Step 6: Create .env.example**

Create `packages/contracts/.env.example`:

```
TEMPO_TESTNET_RPC=https://rpc.testnet.tempo.xyz
PRIVATE_KEY=your_private_key_here
```

**Step 7: Install dependencies**

```bash
cd packages/contracts
bun install
```

**Step 8: Run tests**

```bash
bunx hardhat test
```

Expected: All tests pass

**Step 9: Commit**

```bash
git add packages/contracts
git commit -m "feat(contracts): add PaymentRegistry contract with tests"
```

---

### Task 1.5: Setup Docker Compose for Local Development

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

**Step 1: Create docker-compose.yml**

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    container_name: better-pay-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: better_pay_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

**Step 2: Create .env.example**

Create `.env.example`:

```
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/better_pay_dev

# Encryption
ENCRYPTION_KEY=generate_with_openssl_rand_hex_32

# Tempo
TEMPO_TESTNET_RPC=https://rpc.testnet.tempo.xyz
TEMPO_CHAIN_ID=41144

# API
API_PORT=3001
NODE_ENV=development

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_PAYMENT_URL=http://localhost:3002
```

**Step 3: Start PostgreSQL**

```bash
docker-compose up -d
```

Expected: PostgreSQL container starts

**Step 4: Create .env file**

```bash
cp .env.example .env
# Generate encryption key
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env
```

**Step 5: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "chore: add Docker Compose for local development"
```

---

## Phase 2: One-Time Payments

### Task 2.1: Setup API Service

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/middleware/auth.ts`
- Create: `apps/api/src/middleware/error.ts`

**Step 1: Initialize API package**

Create `apps/api/package.json`:

```json
{
  "name": "@better-pay/api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "@better-pay/database": "workspace:*",
    "@better-pay/shared": "workspace:*",
    "hono": "^3.12.0",
    "@hono/node-server": "^1.7.0",
    "bcrypt": "^5.1.1",
    "dotenv": "^16.3.1",
    "pino": "^8.17.2",
    "pino-pretty": "^10.3.1",
    "zod": "^3.22.4",
    "node-cron": "^3.0.3",
    "viem": "^2.0.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/node": "^20.10.0",
    "@types/node-cron": "^3.0.11",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.1.0"
  }
}
```

**Step 2: Create tsconfig**

Create `apps/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create auth middleware**

Create `apps/api/src/middleware/auth.ts`:

```typescript
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
```

**Step 4: Create error middleware**

Create `apps/api/src/middleware/error.ts`:

```typescript
import { Context } from 'hono'
import { ZodError } from 'zod'

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err)

  if (err instanceof ZodError) {
    return c.json(
      {
        error: 'Validation error',
        details: err.errors
      },
      400
    )
  }

  return c.json(
    {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    },
    500
  )
}
```

**Step 5: Create app setup**

Create `apps/api/src/app.ts`:

```typescript
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
```

**Step 6: Create entry point**

Create `apps/api/src/index.ts`:

```typescript
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
```

**Step 7: Install dependencies**

```bash
cd apps/api
bun install
```

**Step 8: Run migration**

```bash
cd packages/database
bun run generate
bun run migrate
```

**Step 9: Test the server**

```bash
cd apps/api
bun run dev
```

Open another terminal:

```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok","timestamp":"..."}`

**Step 10: Commit**

```bash
git add apps/api packages/database/drizzle
git commit -m "feat(api): setup Hono API server with auth middleware"
```

---

### Task 2.2: Implement Orders API

**Files:**
- Create: `apps/api/src/routes/orders.ts`
- Create: `apps/api/src/services/order.service.ts`
- Create: `apps/api/src/services/blockchain.service.ts`
- Modify: `apps/api/src/app.ts`

**Step 1: Create order service**

Create `apps/api/src/services/order.service.ts`:

```typescript
import { db, NewOrder, Order, orderStatus } from '@better-pay/database'
import { generateMemo } from '@better-pay/shared/utils'
import { eq, and } from 'drizzle-orm'
import { orders } from '@better-pay/database'

export class OrderService {
  async createOrder(
    merchantId: string,
    data: {
      amount: string
      currency: string
      metadata?: Record<string, any>
      expiresIn: number
    }
  ): Promise<Order> {
    const memo = generateMemo()
    const expiresAt = new Date(Date.now() + data.expiresIn * 1000)

    const [order] = await db
      .insert(orders)
      .values({
        merchantId,
        amount: data.amount,
        currency: data.currency,
        memo,
        status: 'pending',
        paymentUrl: `${process.env.NEXT_PUBLIC_PAYMENT_URL}/pay/${memo}`,
        expiresAt,
        metadata: data.metadata
      })
      .returning()

    return order
  }

  async getOrder(orderId: string, merchantId: string): Promise<Order | null> {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.merchantId, merchantId)))
      .limit(1)

    return order || null
  }

  async getOrderByMemo(memo: string): Promise<Order | null> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.memo, memo))
      .limit(1)

    return order || null
  }

  async updateOrderStatus(
    orderId: string,
    status: typeof orderStatus[number],
    data?: {
      customerAddress?: string
      txHash?: string
      paidAt?: Date
    }
  ): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status,
        ...data
      })
      .where(eq(orders.id, orderId))
      .returning()

    return updatedOrder
  }

  async listOrders(
    merchantId: string,
    limit: number = 20,
    startingAfter?: string
  ): Promise<Order[]> {
    let query = db
      .select()
      .from(orders)
      .where(eq(orders.merchantId, merchantId))
      .orderBy(orders.createdAt)
      .limit(limit)

    if (startingAfter) {
      // Add cursor-based pagination
      query = query.where(
        and(
          eq(orders.merchantId, merchantId),
          // gt(orders.createdAt, subquery to get createdAt of startingAfter)
        )
      )
    }

    return query
  }
}

export const orderService = new OrderService()
```

**Step 2: Create blockchain service**

Create `apps/api/src/services/blockchain.service.ts`:

```typescript
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { PAYMENT_REGISTRY_ADDRESS_TESTNET, TEMPO_TESTNET_RPC } from '@better-pay/shared/constants'

const tempoTestnet = {
  id: 41144, // Placeholder
  name: 'Tempo Testnet',
  network: 'tempo-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Tempo',
    symbol: 'TEMPO'
  },
  rpcUrls: {
    default: { http: [TEMPO_TESTNET_RPC] },
    public: { http: [TEMPO_TESTNET_RPC] }
  }
}

export class BlockchainService {
  private publicClient
  private registryAbi = parseAbi([
    'event OrderCreated(string indexed orderId, address indexed merchant, uint256 amount, string currency, uint256 timestamp)',
    'event PaymentCompleted(string indexed orderId, address indexed customer, uint256 amount, string memo, uint256 timestamp)',
    'function registerOrder(string calldata orderId, uint256 amount, string calldata currency) external',
    'function recordPayment(string calldata orderId, string calldata memo, uint256 amount) external'
  ])

  constructor() {
    this.publicClient = createPublicClient({
      chain: tempoTestnet,
      transport: http()
    })
  }

  async registerOrder(
    merchantPrivateKey: string,
    orderId: string,
    amount: bigint,
    currency: string
  ): Promise<string> {
    const account = privateKeyToAccount(merchantPrivateKey as `0x${string}`)

    const walletClient = createWalletClient({
      account,
      chain: tempoTestnet,
      transport: http()
    })

    const hash = await walletClient.writeContract({
      address: PAYMENT_REGISTRY_ADDRESS_TESTNET as `0x${string}`,
      abi: this.registryAbi,
      functionName: 'registerOrder',
      args: [orderId, amount, currency]
    })

    return hash
  }

  async listenForPayments(
    callback: (orderId: string, customer: string, amount: bigint, memo: string) => void
  ) {
    // Set up event listener for PaymentCompleted events
    this.publicClient.watchContractEvent({
      address: PAYMENT_REGISTRY_ADDRESS_TESTNET as `0x${string}`,
      abi: this.registryAbi,
      eventName: 'PaymentCompleted',
      onLogs: (logs) => {
        for (const log of logs) {
          const { orderId, customer, amount, memo } = log.args as any
          callback(orderId, customer, amount, memo)
        }
      }
    })
  }
}

export const blockchainService = new BlockchainService()
```

**Step 3: Create orders routes**

Create `apps/api/src/routes/orders.ts`:

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { orderService } from '../services/order.service'
import { createOrderSchema } from '@better-pay/shared/types'
import type { Merchant } from '@better-pay/database'

const orders = new Hono()

// Create order
orders.post('/', authMiddleware, async (c) => {
  const merchant = c.get('merchant') as Merchant
  const body = await c.req.json()

  // Validate request
  const validated = createOrderSchema.parse(body)

  // Create order
  const order = await orderService.createOrder(merchant.id, {
    amount: validated.amount,
    currency: validated.currency,
    metadata: validated.metadata,
    expiresIn: validated.expires_in
  })

  // TODO: Register order onchain

  return c.json({
    id: order.id,
    status: order.status,
    payment_url: order.paymentUrl,
    amount: order.amount,
    currency: order.currency,
    created_at: order.createdAt.toISOString(),
    expires_at: order.expiresAt.toISOString()
  })
})

// Get order
orders.get('/:orderId', authMiddleware, async (c) => {
  const merchant = c.get('merchant') as Merchant
  const orderId = c.req.param('orderId')

  const order = await orderService.getOrder(orderId, merchant.id)

  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }

  return c.json({
    id: order.id,
    status: order.status,
    amount: order.amount,
    currency: order.currency,
    customer_address: order.customerAddress,
    tx_hash: order.txHash,
    paid_at: order.paidAt?.toISOString(),
    created_at: order.createdAt.toISOString(),
    expires_at: order.expiresAt.toISOString(),
    metadata: order.metadata
  })
})

// List orders
orders.get('/', authMiddleware, async (c) => {
  const merchant = c.get('merchant') as Merchant
  const limit = parseInt(c.req.query('limit') || '20')
  const startingAfter = c.req.query('starting_after')

  const ordersList = await orderService.listOrders(merchant.id, limit, startingAfter)

  return c.json({
    data: ordersList.map((order) => ({
      id: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      created_at: order.createdAt.toISOString()
    })),
    has_more: ordersList.length === limit
  })
})

export default orders
```

**Step 4: Update app.ts to include routes**

Modify `apps/api/src/app.ts`:

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorHandler } from './middleware/error'
import orders from './routes/orders'

export function createApp() {
  const app = new Hono()

  // Middleware
  app.use('*', logger())
  app.use('*', cors())

  // Health check
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // API routes
  app.route('/v1/orders', orders)

  // Error handling
  app.onError(errorHandler)

  return app
}
```

**Step 5: Test orders API**

First, create a test merchant in the database:

```bash
# Connect to PostgreSQL
docker exec -it better-pay-postgres psql -U postgres -d better_pay_dev

# Insert test merchant
INSERT INTO merchants (id, name, email, tempo_address, api_key_hash, gas_sponsored)
VALUES (
  'merch_test123',
  'Test Merchant',
  'merchant@test.com',
  '0x1234567890123456789012345678901234567890',
  '$2b$10$abcdefghijklmnopqrstuvwxyz123456', -- bcrypt hash of 'sk_test_abc123'
  false
);
```

Then test the API:

```bash
# Create order
curl -X POST http://localhost:3001/v1/orders \
  -H "Authorization: Bearer sk_test_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10.00",
    "currency": "USDC",
    "metadata": {"order_id": "ORDER-123"}
  }'

# Get order (use returned order ID)
curl http://localhost:3001/v1/orders/ord_xxx \
  -H "Authorization: Bearer sk_test_abc123"
```

**Step 6: Commit**

```bash
git add apps/api
git commit -m "feat(api): implement orders API endpoints"
```

---

## Phase 3: Checkout Frontend

### Task 3.1: Setup Checkout App

**Files:**
- Create: `apps/checkout/package.json`
- Create: `apps/checkout/tsconfig.json`
- Create: `apps/checkout/next.config.js`
- Create: `apps/checkout/tailwind.config.ts`
- Create: `apps/checkout/postcss.config.js`
- Create: `apps/checkout/app/layout.tsx`
- Create: `apps/checkout/app/globals.css`

**Step 1: Initialize checkout package**

Create `apps/checkout/package.json`:

```json
{
  "name": "@better-pay/checkout",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002",
    "lint": "next lint"
  },
  "dependencies": {
    "@better-pay/shared": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "viem": "^2.0.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3"
  }
}
```

**Step 2: Configure Next.js**

Create `apps/checkout/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@better-pay/shared'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
}

export default nextConfig
```

**Step 3: Configure Tailwind**

Create `apps/checkout/tailwind.config.ts`:

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

Create `apps/checkout/postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

**Step 4: Create root layout**

Create `apps/checkout/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Payment Checkout - BetterPay',
  description: 'Complete your payment securely with crypto'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
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

Create `apps/checkout/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
  }
}
```

Create `apps/checkout/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">BetterPay Checkout</h1>
        <p className="text-gray-600">Secure crypto payment processing</p>
      </div>
    </div>
  )
}
```

**Step 5: Create tsconfig**

Create `apps/checkout/tsconfig.json`:

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

**Step 6: Install dependencies**

```bash
cd apps/checkout
bun install
```

**Step 7: Test the app**

```bash
bun run dev
```

Visit `http://localhost:3002`

Expected: Homepage displays

**Step 8: Commit**

```bash
git add apps/checkout
git commit -m "feat(checkout): setup Next.js 16 checkout app"
```

---

## Summary

This implementation plan covers:
- ✅ Phase 1: Foundation (monorepo, database, contracts, API setup)
- ✅ Phase 2: Orders API
- ✅ Phase 3: Checkout app setup

**Next steps** (to be continued):
- Task 3.2: Payment page with Passkey authentication
- Task 3.3: Payment execution with Tempo
- Phase 4: Subscriptions
- Phase 5: Dashboard

**Execution options:**

1. **Subagent-Driven (this session)** - Use @superpowers:subagent-driven-development for task-by-task execution with review
2. **Parallel Session (separate)** - Open new session with @superpowers:executing-plans for batch execution

**Which approach would you like?**
