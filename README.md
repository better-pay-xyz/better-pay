# BetterPay

A modern cryptocurrency payment gateway built on Tempo blockchain with Passkey authentication.

## Features

- **Passkey Authentication** - Passwordless biometric login using WebAuthn
- **Tempo Blockchain** - Fast payments on Tempo testnet
- **Merchant Dashboard** - Complete order management, API keys, webhooks, and analytics
- **Payment Links** - Create shareable payment links for products
- **Smart Contracts** - On-chain payment records and verification
- **Modern UI** - Built with Next.js 15, Tailwind CSS, and shadcn/ui

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Blockchain**: Tempo Testnet + tempo.ts SDK
- **Authentication**: WebAuthn / Passkeys
- **Web3**: wagmi 2.x + viem
- **Smart Contracts**: Solidity + Foundry
- **Database**: PostgreSQL + Drizzle ORM
- **API**: tRPC (Dashboard) + Hono (External API)
- **Package Manager**: Bun
- **Monorepo**: Bun workspaces

## Project Structure

```
better-pay/
├── apps/
│   ├── api/               # External merchant API (Hono)
│   ├── checkout/          # Payment page app (Next.js)
│   └── dashboard/         # Merchant dashboard app (Next.js)
├── packages/
│   ├── contracts/         # Smart contracts (Foundry)
│   ├── database/          # Database schema (Drizzle)
│   └── shared/            # Shared utilities and ABIs
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- [Foundry](https://getfoundry.sh) (for contract development)
- PostgreSQL database

### Installation

```bash
# Install dependencies
bun install

# Configure environment variables
cp apps/dashboard/.env.example apps/dashboard/.env.local
cp apps/checkout/.env.example apps/checkout/.env.local
# Edit .env.local files with your database connection and other settings

# Push database schema
cd packages/database
DATABASE_URL='your-database-url' bunx drizzle-kit push:pg
```

### Development

```bash
# Start all apps
bun run dev

# Or start individually
cd apps/dashboard && bun run dev   # http://localhost:3001
cd apps/checkout && bun run dev    # http://localhost:3002
cd apps/api && bun run dev         # http://localhost:3003
```

### Build

```bash
bun run build
```

## Smart Contracts

PaymentRegistry contract deployed to Tempo testnet:

- **Contract Address**: `0x8719442721893D17c508Cd05Ae550CaC8897c507`
- **Explorer**: https://scout.tempo.xyz/address/0x8719442721893D17c508Cd05Ae550CaC8897c507
- **Network**: Tempo Testnet (Chain ID: 42429)

### Contract Development

```bash
cd packages/contracts

# Build contracts
forge build

# Run tests
forge test

# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url tempo_testnet --broadcast
```

## Payment Flow

### Via API
1. Merchant creates an order via API
2. User visits payment page (`/pay/[memo]`)
3. User authenticates with Passkey (auto-creates Tempo wallet)
4. User confirms payment (ERC20 token transfer)
5. Backend verifies transaction and updates order status
6. Optional: Redirect to merchant's success URL

### Via Payment Links
1. Merchant creates a Payment Link in Dashboard
2. Merchant shares the link with customers
3. Customer visits the product page
4. Customer clicks "Pay Now" to initiate payment
5. Payment flow continues as above

## API Usage

### Create Order

```bash
POST http://localhost:3003/api/v1/orders
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "amount": "10.00",
  "currency": "USDC",
  "metadata": {
    "success_url": "https://your-site.com/success"
  }
}
```

### Get Order Status

```bash
GET http://localhost:3003/api/v1/orders/[orderId]
X-API-Key: YOUR_API_KEY
```

## Dashboard Features

- **Overview**: Real-time stats and recent orders
- **Orders**: Full order list with status tracking
- **Payment Links**: Create and manage shareable payment links
- **API Keys**: Generate and manage API keys
- **Webhooks**: Configure webhook endpoints for payment events
- **Analytics**: Revenue trends and transaction metrics
- **Settings**: Business info and payment configuration

## Passkey Authentication

BetterPay uses WebAuthn standard for Passkey authentication:

- Face ID / Touch ID (iOS/macOS)
- Windows Hello (Windows)
- Hardware security keys (YubiKey, etc.)
- No passwords to remember, more secure

## Environment Variables

### Dashboard (`apps/dashboard/.env.local`)

```env
DATABASE_URL="postgresql://..."
ENCRYPTION_KEY="your-32-char-key"
BETTER_AUTH_SECRET="your-secret"
NEXT_PUBLIC_API_URL="http://localhost:3003"
```

### Checkout (`apps/checkout/.env.local`)

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_TEMPO_RPC_URL="https://rpc.testnet.tempo.xyz"
NEXT_PUBLIC_PAYMENT_REGISTRY_ADDRESS="0x8719442721893D17c508Cd05Ae550CaC8897c507"
NEXT_PUBLIC_USDC_ADDRESS="0x20c0000000000000000000000000000000000001"
```

## Contributing

Issues and Pull Requests are welcome!

## License

MIT
