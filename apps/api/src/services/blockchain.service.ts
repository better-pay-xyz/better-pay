import { createPublicClient, http } from 'viem'
import { PAYMENT_REGISTRY_ADDRESS_TESTNET, TEMPO_TESTNET_RPC } from '@better-pay/shared/constants'

const tempoTestnet = {
  id: 41144,
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

  constructor() {
    this.publicClient = createPublicClient({
      chain: tempoTestnet,
      transport: http()
    })
  }

  // Placeholder for blockchain interactions
  // Will be implemented when contract is deployed
  async registerOrder(orderId: string, amount: string, currency: string): Promise<string> {
    console.log('TODO: Register order onchain', { orderId, amount, currency })
    return '0x...'
  }
}

export const blockchainService = new BlockchainService()
