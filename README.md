# BetterPay

现代化的加密货币支付网关，基于 Tempo 区块链和 Passkey 认证。

## 特性

- 🔐 **Passkey 认证** - 使用 WebAuthn 实现无密码的生物识别登录
- ⚡ **Tempo 区块链** - 基于 Tempo 测试网的快速支付
- 💳 **商家仪表板** - 完整的订单管理、API Keys 和设置面板
- 🔗 **智能合约** - 链上支付记录和订阅管理
- 🎨 **现代化 UI** - 使用 Next.js 14 和 Tailwind CSS

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **区块链**: Tempo 测试网 + tempo.ts SDK
- **认证**: WebAuthn / Passkeys
- **Web3**: wagmi 2.x + viem
- **智能合约**: Solidity + Foundry
- **数据库**: PostgreSQL + Prisma
- **包管理**: Bun
- **Monorepo**: Bun workspaces

## 项目结构

```
better-pay/
├── apps/
│   ├── checkout/          # 支付页面应用
│   └── dashboard/         # 商家仪表板应用
├── packages/
│   ├── contracts/         # 智能合约 (Foundry)
│   ├── database/          # 数据库 schema (Prisma)
│   └── shared/            # 共享代码和 ABI
└── docs/                  # 文档和设计方案
```

## 快速开始

### 前置要求

- [Bun](https://bun.sh) >= 1.0.0
- [Foundry](https://getfoundry.sh) (用于合约开发)
- PostgreSQL 数据库

### 安装

```bash
# 安装依赖
bun install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库连接等信息

# 运行数据库迁移
bun run db:migrate
```

### 开发

```bash
# 启动所有应用
bun run dev

# 或分别启动
cd apps/checkout && bun run dev    # http://localhost:3000
cd apps/dashboard && bun run dev   # http://localhost:3001
```

### 构建

```bash
bun run build
```

## 智能合约

PaymentRegistry 合约已部署到 Tempo 测试网：

- **合约地址**: `0x8719442721893D17c508Cd05Ae550CaC8897c507`
- **浏览器**: https://scout.tempo.xyz/address/0x8719442721893D17c508Cd05Ae550CaC8897c507
- **网络**: Tempo Testnet (Chain ID: 42429)

### 合约开发

```bash
cd packages/contracts

# 编译合约
forge build

# 运行测试
forge test

# 部署到测试网
forge script script/Deploy.s.sol --rpc-url tempo_testnet --broadcast
```

## 支付流程

1. 商家创建订单（通过 API）
2. 用户访问支付页面 (`/pay/[memo]`)
3. 用户使用 Passkey 登录（自动创建 Tempo 钱包）
4. 用户确认支付（转账 ERC20 代币）
5. 后端确认交易并更新订单状态
6. 可选：重定向到商家指定的成功页面

## API 使用

### 创建订单

```bash
POST /api/orders
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "amount": "10.00",
  "currency": "USDC",
  "metadata": {
    "success_url": "https://your-site.com/success"
  }
}
```

### 获取订单状态

```bash
GET /api/orders/[orderId]
Authorization: Bearer YOUR_API_KEY
```

## Passkey 认证

BetterPay 使用 WebAuthn 标准实现 Passkey 认证：

- 支持 Face ID / Touch ID (iOS/macOS)
- 支持 Windows Hello (Windows)
- 支持硬件安全钥匙 (YubiKey 等)
- 无需记忆密码，更安全

## 开发工具

```bash
# 数据库管理
bun run db:studio        # 打开 Prisma Studio

# 生成 Prisma client
bun run db:generate

# 运行测试
bun test
```

## 环境变量

参考 `.env.example` 文件配置以下变量：

```env
# 数据库
DATABASE_URL="postgresql://..."

# 认证
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Tempo 区块链
NEXT_PUBLIC_TEMPO_RPC_URL="https://rpc.testnet.tempo.xyz"
NEXT_PUBLIC_PAYMENT_REGISTRY_ADDRESS="0x8719442721893D17c508Cd05Ae550CaC8897c507"
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
