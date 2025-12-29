'use client'

import { useState } from 'react'
import { useAccount, useConnect, useConnectors, useSendTransaction } from 'wagmi'
import { encodeFunctionData, parseUnits } from 'viem'
import { OrderCard } from '@/components/payment/order-card'
import { PayButton } from '@/components/payment/pay-button'
import { PaymentStatus } from '@/components/payment/payment-status'
import { FaucetLink } from '@/components/payment/faucet-link'
import { CURRENCY_TO_TOKEN, erc20Abi, ALPHA_USD } from '@/lib/tempo/tokens'
import { User, PlusCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
        <PaymentStatus status="already_paid" />
      </div>
    )
  }

  if (isExpired || new Date(order.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
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
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="flex justify-between items-center p-6 relative z-10 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">BetterPay</span>
        </div>
        <FaucetLink />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 space-y-8 relative z-10 max-w-sm mx-auto w-full animate-fade-in">
        {state === 'success' ? (
          <PaymentStatus
            status="success"
            txHash={txHash}
            redirectUrl={order.metadata?.success_url}
          />
        ) : state === 'error' ? (
          <div className="w-full space-y-4">
            <PaymentStatus
              status="error"
              errorMessage={error}
              onRetry={handleRetry}
            />
            {showSignUpOption && (
              <Card className="p-8 text-center space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900">No account found</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">It looks like you don&apos;t have a passkey account yet.</p>
                </div>
                <Button
                  onClick={() => handleConnect(true)}
                  className="w-full"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Passkey Account
                </Button>
              </Card>
            )}
          </div>
        ) : (
          <>
            <OrderCard
              order={order}
              onExpire={() => setIsExpired(true)}
            />

            <div className="w-full space-y-4">
              {/* Show connected address if connected */}
              {isConnected && address ? (
                <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/50 backdrop-blur-sm rounded-full border border-slate-100 shadow-sm mx-auto w-fit">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold font-mono text-slate-600 tracking-tight">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => handleConnect(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    New user? Create a Passkey
                  </button>
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
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="p-8 text-center relative z-10">
        <div className="flex items-center justify-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <span>Secure</span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <span>Decentralized</span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <span>Instant</span>
        </div>
      </footer>
    </div>
  )
}
