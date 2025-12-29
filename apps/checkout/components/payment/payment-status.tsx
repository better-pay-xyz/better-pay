'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type Status = 'success' | 'error' | 'expired' | 'already_paid'

interface PaymentStatusProps {
  status: Status
  txHash?: string
  redirectUrl?: string
  errorMessage?: string
  onRetry?: () => void
}

export function PaymentStatus({
  status,
  txHash,
  redirectUrl,
  errorMessage,
  onRetry,
}: PaymentStatusProps) {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (status === 'success' && redirectUrl) {
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer)
            window.location.href = redirectUrl
          }
          return c - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [status, redirectUrl])

  const configs = {
    success: {
      icon: CheckCircle2,
      iconClass: 'text-emerald-500',
      bgClass: 'bg-emerald-50',
      title: 'Payment Successful!',
      description: redirectUrl
        ? `Redirecting to merchant in ${countdown}s...`
        : 'Thank you for your payment. Your transaction has been confirmed on the blockchain.',
    },
    error: {
      icon: XCircle,
      iconClass: 'text-rose-500',
      bgClass: 'bg-rose-50',
      title: 'Payment Failed',
      description: errorMessage || 'Something went wrong with your transaction. Please check your balance and try again.',
    },
    expired: {
      icon: Clock,
      iconClass: 'text-amber-500',
      bgClass: 'bg-amber-50',
      title: 'Order Expired',
      description: 'The time limit for this payment has reached its end. Please contact the merchant for a new link.',
    },
    already_paid: {
      icon: AlertCircle,
      iconClass: 'text-sky-500',
      bgClass: 'bg-sky-50',
      title: 'Order Already Paid',
      description: 'This order has already been processed successfully. No further action is required.',
    },
  }

  const config = configs[status]
  const Icon = config.icon

  return (
    <Card className="max-w-sm animate-fade-in overflow-hidden">
      <CardContent className="p-10 text-center space-y-8">
        <div className={`w-24 h-24 mx-auto rounded-full ${config.bgClass} flex items-center justify-center animate-bounce-subtle`}>
          <Icon className={`w-12 h-12 ${config.iconClass}`} />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{config.title}</h2>
          <p className="text-base text-slate-500 leading-relaxed font-medium">{config.description}</p>
        </div>

        <div className="pt-4">
          {status === 'success' && txHash && (
            <a
              href={`https://explore.tempo.xyz/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all border border-slate-100 shadow-sm"
            >
              <span>View Transaction</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {status === 'error' && onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              className="w-full gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}

          {(status === 'expired' || status === 'already_paid') && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Back to Merchant
            </Button>
          )}
        </div>

        {status === 'success' && !redirectUrl && (
          <div className="pt-4 flex items-center justify-center gap-2 text-[10px] text-emerald-600 uppercase tracking-[0.2em] font-black">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed by Tempo
          </div>
        )}
      </CardContent>
    </Card>
  )
}
