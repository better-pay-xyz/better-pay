'use client'

import { Button } from '@/components/ui/button'
import { ShieldCheck, Loader2 } from 'lucide-react'

interface PayButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  error?: string
  label?: string
}

export function PayButton({
  onClick,
  loading,
  disabled,
  error,
  label = 'Pay with Passkey'
}: PayButtonProps) {
  return (
    <div className="w-full max-w-sm space-y-4">
      <Button
        onClick={onClick}
        disabled={disabled || loading}
        size="lg"
        className="w-full h-14 text-lg font-bold transition-all duration-300 active:scale-[0.98] shadow-lg hover:shadow-primary/20"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        ) : (
          <ShieldCheck className="h-5 w-5 mr-2" />
        )}
        {loading ? 'Processing...' : label}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-600 text-center font-medium">{error}</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-1 opacity-60">
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">
          Powered by Tempo Network
        </p>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-primary" />
          <div className="w-1 h-1 rounded-full bg-primary" />
          <div className="w-1 h-1 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )
}
