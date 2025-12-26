'use client'

import { ExternalLink, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { trpc } from '@/lib/trpc/client'

type OrderStatus = 'paid' | 'pending' | 'expired' | 'cancelled'

interface StatusBadgeProps {
  status: OrderStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<OrderStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    paid: {
      variant: 'default',
      label: 'Paid'
    },
    pending: {
      variant: 'secondary',
      label: 'Pending'
    },
    expired: {
      variant: 'outline',
      label: 'Expired'
    },
    cancelled: {
      variant: 'destructive',
      label: 'Cancelled'
    }
  }

  const config = variants[status]

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}

function truncateAddress(address: string): string {
  if (!address) return '-'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

export default function OrdersPage() {
  const { data, isLoading } = trpc.orders.list.useQuery()
  const orders = data?.data ?? []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your payment history
        </p>
      </div>

      {/* Orders Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            A list of all payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Orders will appear here once customers start making payments
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium text-sm">
                      {order.id}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${order.amount} {order.currency}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status as OrderStatus} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {truncateAddress(order.customerAddress || '')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(new Date(order.createdAt))}
                    </TableCell>
                    <TableCell>
                      {order.txHash ? (
                        <a
                          href={`https://explore.tempo.xyz/tx/${order.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-mono text-primary hover:underline"
                        >
                          {truncateAddress(order.txHash)}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
