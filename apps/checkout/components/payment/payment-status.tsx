'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      icon: CheckCircle,
      iconClass: 'text-green-500',
      title: 'Payment Successful!',
      description: redirectUrl
        ? `Redirecting to merchant in ${countdown}s...`
        : 'Thank you for your payment',
    },
    error: {
      icon: XCircle,
      iconClass: 'text-red-500',
      title: 'Payment Failed',
      description: errorMessage || 'Please try again',
    },
    expired: {
      icon: Clock,
      iconClass: 'text-orange-500',
      title: 'Order Expired',
      description: 'Please contact the merchant for a new payment link',
    },
    already_paid: {
      icon: AlertCircle,
      iconClass: 'text-blue-500',
      title: 'Order Already Paid',
      description: 'This order has already been paid',
    },
  }

  const config = configs[status]
  const Icon = config.icon

  return (
    <div className="text-center space-y-4 animate-fade-in">
      <Icon className={`w-16 h-16 mx-auto ${config.iconClass}`} />
      <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
      <p className="text-gray-500">{config.description}</p>

      {status === 'success' && txHash && (
        <a
          href={`https://explore.tempo.xyz/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-blue-600 hover:underline"
        >
          View Transaction ↗
        </a>
      )}

      {status === 'error' && onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Retry
        </Button>
      )}
    </div>
  )
}
