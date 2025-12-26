import { createConfig, http } from 'wagmi'
import { tempoTestnet } from 'viem/chains'
import { KeyManager, webAuthn } from 'tempo.ts/wagmi'

// Fee token is AlphaUSD for testnet
const FEE_TOKEN = '0x20c0000000000000000000000000000000000001'

export const tempoChain = tempoTestnet.extend({ feeToken: FEE_TOKEN })

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
