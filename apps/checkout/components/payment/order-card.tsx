import { Card, CardContent } from '@/components/ui/card'
import { CountdownTimer } from './countdown-timer'
import { ShieldCheck, ShoppingBag } from 'lucide-react'

interface OrderCardProps {
  order: {
    id: string
    amount: string
    currency: string
    expiresAt: Date | string
    merchant: {
      name: string
    }
    metadata?: Record<string, unknown> | null
  }
  onExpire?: () => void
}

export function OrderCard({ order, onExpire }: OrderCardProps) {
  const expiresAt = typeof order.expiresAt === 'string'
    ? new Date(order.expiresAt)
    : order.expiresAt

  return (
    <Card className="w-full max-w-sm overflow-hidden border-none shadow-2xl bg-white/80 backdrop-blur-xl">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
      <CardContent className="p-8 text-center space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-primary/10 rounded-full">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <div className="text-lg font-semibold text-gray-800 tracking-tight">
            {order.merchant.name}
          </div>
        </div>

        <div className="space-y-1 py-4">
          <div className="text-sm text-muted-foreground uppercase tracking-widest font-medium">
            Amount to Pay
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-black text-gray-900 tracking-tighter">
              ${order.amount}
            </span>
            <span className="text-lg font-bold text-gray-500 uppercase">
              {order.currency}
            </span>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100/80 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-mono font-medium text-gray-600">
              #{order.id.slice(-8).toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="font-medium text-gray-700">Waiting for Payment</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Expires In</span>
            <CountdownTimer expiresAt={expiresAt} onExpire={onExpire} />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
          <ShieldCheck className="w-3 h-3" />
          Secured by BetterPay
        </div>
      </CardContent>
    </Card>
  )
}

