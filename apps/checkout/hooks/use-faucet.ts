'use client'

import { Hooks } from 'tempo.ts/wagmi'
import { useAccount } from 'wagmi'

export function useFaucet() {
  const { address } = useAccount()
  const { mutate, isPending, isSuccess, error } = Hooks.faucet.useFundSync()

  const fundAccount = () => {
    if (address) {
      mutate({ account: address })
    }
  }

  return {
    fundAccount,
    isPending,
    isSuccess,
    error,
    canFund: !!address,
  }
}
