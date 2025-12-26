import { Card, CardContent } from '@/components/ui/card'
import { CountdownTimer } from './countdown-timer'

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
    <Card className="w-full max-w-sm">
      <CardContent className="p-6 text-center space-y-4">
        <div className="text-gray-600 font-medium">
          {order.merchant.name}
        </div>

        <div className="space-y-1">
          <div className="text-4xl font-bold text-gray-900">
            ${order.amount}
          </div>
          <div className="text-gray-500">
            {order.currency}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 space-y-1 text-sm">
          <div className="text-gray-500">
            订单 #{order.id.slice(-8).toUpperCase()}
          </div>
          <CountdownTimer expiresAt={expiresAt} onExpire={onExpire} />
        </div>
      </CardContent>
    </Card>
  )
}
