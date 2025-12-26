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
