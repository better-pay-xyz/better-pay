'use client'

import { useState } from 'react'
import { useAccount, useConnect, useSendTransaction } from 'wagmi'
import { encodeFunctionData, parseUnits } from 'viem'
import { OrderCard } from '@/components/payment/order-card'
import { PayButton } from '@/components/payment/pay-button'
import { PaymentStatus } from '@/components/payment/payment-status'
import { FaucetLink } from '@/components/payment/faucet-link'
import { CURRENCY_TO_TOKEN, erc20Abi, ALPHA_USD } from '@/lib/tempo/tokens'

type PaymentState = 'idle' | 'connecting' | 'processing' | 'success' | 'error'

interface Order {
  id: string
  memo: string
  amount: string
  currency: string
  status: string
  expiresAt: string
  merchant: {
    name: string
    tempoAddress: string
  }
  metadata?: {
    success_url?: string
  } | null
}

interface PaymentClientProps {
  order: Order
}

export function PaymentClient({ order }: PaymentClientProps) {
  const [state, setState] = useState<PaymentState>('idle')
  const [txHash, setTxHash] = useState<string>()
  const [error, setError] = useState<string>()
  const [isExpired, setIsExpired] = useState(false)

  const { isConnected, address } = useAccount()
  const { connectAsync, connectors } = useConnect()
  const { sendTransactionAsync } = useSendTransaction()

  // Check if order is already paid or expired
  if (order.status === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PaymentStatus status="already_paid" />
      </div>
    )
  }

  if (isExpired || new Date(order.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <PaymentStatus status="expired" />
      </div>
    )
  }

  const handlePay = async () => {
    try {
      setError(undefined)

      // Step 1: Connect wallet if not connected
      if (!isConnected) {
        setState('connecting')
        // Use first available connector (will be webauthn in production)
        const connector = connectors[0]
        if (!connector) {
          throw new Error('No wallet connector available')
        }
        await connectAsync({ connector })
      }

      // Step 2: Execute payment
      setState('processing')

      // Get token config
      const token = CURRENCY_TO_TOKEN[order.currency] || ALPHA_USD

      // Build transfer transaction
      const hash = await sendTransactionAsync({
        to: token.address,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [
            order.merchant.tempoAddress as `0x${string}`,
            parseUnits(order.amount, token.decimals),
          ],
        }),
      })

      setTxHash(hash)

      // Step 3: Confirm payment with backend
      await fetch(`/api/orders/${order.memo}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: hash,
          customerAddress: address,
        }),
      })

      setState('success')
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : '支付失败，请重试')
      setState('error')
    }
  }

  const handleRetry = () => {
    setState('idle')
    setError(undefined)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-4">
        <FaucetLink />
        <span className="text-lg font-semibold text-gray-900">BetterPay</span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 space-y-6">
        {state === 'success' ? (
          <PaymentStatus
            status="success"
            txHash={txHash}
            redirectUrl={order.metadata?.success_url}
          />
        ) : state === 'error' ? (
          <PaymentStatus
            status="error"
            errorMessage={error}
            onRetry={handleRetry}
          />
        ) : (
          <>
            <OrderCard
              order={order}
              onExpire={() => setIsExpired(true)}
            />
            <PayButton
              onClick={handlePay}
              loading={state === 'connecting' || state === 'processing'}
              error={error}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-gray-400">
        Secure payments powered by Tempo
      </footer>
    </div>
  )
}
