'use client'

import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

interface PayButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  error?: string
}

export function PayButton({ onClick, loading, disabled, error }: PayButtonProps) {
  return (
    <div className="w-full max-w-sm space-y-3">
      <Button
        onClick={onClick}
        loading={loading}
        disabled={disabled}
        size="lg"
        className="w-full"
      >
        <Lock className="h-4 w-4 mr-2" />
        使用 Passkey 支付
      </Button>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <p className="text-xs text-gray-400 text-center">
        Powered by Tempo
      </p>
    </div>
  )
}
