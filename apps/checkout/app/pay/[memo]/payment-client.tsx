'use client'

import { useState } from 'react'
import { useAccount, useConnect, useConnectors, useSendTransaction } from 'wagmi'
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
  const [showSignUpOption, setShowSignUpOption] = useState(false)

  const { isConnected, address } = useAccount()
  const { connectAsync } = useConnect()
  const connectors = useConnectors()
  const { sendTransactionAsync } = useSendTransaction()

  // Get the webAuthn connector
  const webAuthnConnector = connectors[0]

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

  // Handle connection with sign-up or sign-in capability
  const handleConnect = async (isSignUp: boolean) => {
    try {
      setError(undefined)
      setState('connecting')

      if (!webAuthnConnector) {
        throw new Error('Passkey connector not available')
      }

      // Connect with sign-up or sign-in capability
      await connectAsync({
        connector: webAuthnConnector,
        ...(isSignUp ? { capabilities: { type: 'sign-up' } } : {}),
      })

      setShowSignUpOption(false)
      setState('idle')
    } catch (err) {
      console.error('Connection error:', err)
      // If sign-in fails, offer sign-up option
      if (!isSignUp && err instanceof Error && err.message.includes('not found')) {
        setShowSignUpOption(true)
      }
      setError(err instanceof Error ? err.message : 'Connection failed')
      setState('error')
    }
  }

  const handlePay = async () => {
    try {
      setError(undefined)

      // Step 1: Connect wallet if not connected
      if (!isConnected) {
        // Try sign-in first (for existing users)
        await handleConnect(false)
        return // User needs to click pay again after connecting
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
      setError(err instanceof Error ? err.message : 'Payment failed')
      setState('error')
    }
  }

  const handleRetry = () => {
    setState('idle')
    setError(undefined)
    setShowSignUpOption(false)
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
          <div className="w-full max-w-sm space-y-4">
            <PaymentStatus
              status="error"
              errorMessage={error}
              onRetry={handleRetry}
            />
            {showSignUpOption && (
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">No account found?</p>
                <button
                  onClick={() => handleConnect(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create new Passkey account
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <OrderCard
              order={order}
              onExpire={() => setIsExpired(true)}
            />

            {/* Show connected address if connected */}
            {isConnected && address && (
              <div className="text-sm text-gray-500">
                Paying from: {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}

            <PayButton
              onClick={handlePay}
              loading={state === 'connecting' || state === 'processing'}
              disabled={state === 'connecting' || state === 'processing'}
              label={
                !isConnected
                  ? 'Connect Passkey'
                  : state === 'processing'
                  ? 'Processing...'
                  : 'Pay Now'
              }
            />

            {/* Sign up option for new users */}
            {!isConnected && (
              <button
                onClick={() => handleConnect(true)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                New user? Create Passkey account
              </button>
            )}
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
