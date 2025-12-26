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
      title: '支付成功!',
      description: redirectUrl
        ? `${countdown} 秒后返回商户...`
        : '感谢您的付款',
    },
    error: {
      icon: XCircle,
      iconClass: 'text-red-500',
      title: '支付失败',
      description: errorMessage || '请重试',
    },
    expired: {
      icon: Clock,
      iconClass: 'text-orange-500',
      title: '订单已过期',
      description: '请联系商户获取新的支付链接',
    },
    already_paid: {
      icon: AlertCircle,
      iconClass: 'text-blue-500',
      title: '订单已支付',
      description: '此订单已经完成支付',
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
          查看交易 ↗
        </a>
      )}

      {status === 'error' && onRetry && (
        <Button onClick={onRetry} variant="secondary">
          重试
        </Button>
      )}
    </div>
  )
}
