'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PaymentLink } from '@better-pay/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldCheck, Loader2, ArrowRight, ShoppingBag } from 'lucide-react'

interface Props {
  link: PaymentLink
}

export function PaymentLinkCheckout({ link }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayNow = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/link/${link.id}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create order')
      }

      const { paymentUrl } = await response.json()
      router.push(paymentUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl overflow-hidden rounded-[2rem]">
      {/* Product Image */}
      {link.imageUrl ? (
        <div className="aspect-video bg-slate-100 relative group overflow-hidden">
          <img
            src={link.imageUrl}
            alt={link.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      ) : (
        <div className="aspect-video bg-slate-50 flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-slate-200" />
        </div>
      )}

      {/* Product Info */}
      <CardContent className="p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{link.title}</h1>
          {link.description && (
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{link.description}</p>
          )}
        </div>

        {/* Price Display */}
        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 text-center space-y-1">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Amount</div>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">
              ${link.amount}
            </span>
            <span className="text-lg font-bold text-slate-400 uppercase">{link.currency}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold text-center animate-shake">
            {error}
          </div>
        )}

        {/* Pay Button */}
        <Button
          onClick={handlePayNow}
          disabled={isLoading}
          size="lg"
          className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
          {isLoading ? 'Processing...' : 'Proceed to Payment'}
          {!isLoading && <ArrowRight className="h-4 w-4 ml-1 opacity-50" />}
        </Button>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-2 pt-2 opacity-50">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Tempo Decentralized Protocol
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
