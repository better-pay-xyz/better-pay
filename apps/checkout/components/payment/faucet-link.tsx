'use client'

import { ExternalLink, Loader2, Check } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useFaucet } from '@/hooks/use-faucet'

export function FaucetLink() {
  const { isConnected } = useAccount()
  const { fundAccount, isPending, isSuccess, canFund } = useFaucet()

  // When connected, show inline funding button
  if (isConnected) {
    return (
      <button
        onClick={fundAccount}
        disabled={isPending || isSuccess || !canFund}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>🚰</span>
        {isPending ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>领取中...</span>
          </>
        ) : isSuccess ? (
          <>
            <Check className="h-3 w-3" />
            <span>已领取</span>
          </>
        ) : (
          <span>领取测试币</span>
        )}
      </button>
    )
  }

  // When not connected, show external link to faucet docs
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
