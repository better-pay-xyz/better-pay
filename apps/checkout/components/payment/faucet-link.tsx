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
