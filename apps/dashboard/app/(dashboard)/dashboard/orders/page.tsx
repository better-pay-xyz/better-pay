'use client'

import { ExternalLink, ShoppingCart, Calendar, User, DollarSign } from 'lucide-react'
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
import { Button } from '@/components/ui/button'

type OrderStatus = 'paid' | 'pending' | 'expired' | 'cancelled'

interface StatusBadgeProps {
  status: OrderStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<OrderStatus, "success" | "warning" | "secondary" | "destructive"> = {
    paid: 'success',
    pending: 'warning',
    expired: 'secondary',
    cancelled: 'destructive'
  }

  return (
    <Badge variant={variants[status]}>
      {status}
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
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Orders</h1>
        <p className="text-slate-500 font-medium">Detailed history of all crypto payment transactions.</p>
      </div>

      {/* Orders Table Card */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-50 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Order History</CardTitle>
              <CardDescription>Total of {orders.length} transactions found</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Filter
              </Button>
              <Button variant="outline" size="sm">
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-24 space-y-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading transactions...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-24 bg-slate-50/30">
              <div className="p-6 bg-white rounded-full w-fit mx-auto shadow-sm mb-4 text-slate-200">
                <ShoppingCart className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">No orders found</h3>
              <p className="text-sm text-slate-500 font-medium mt-1 max-w-[250px] mx-auto">
                Transactions will appear here once you start receiving payments.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-50">
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-8 h-14">Order Details</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 h-14">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 h-14">Amount</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 h-14 text-right pr-8">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell className="pl-8 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <User className="w-3 h-3" />
                          <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">
                            {order.customerAddress ? truncateAddress(order.customerAddress) : 'Awaiting...'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status as OrderStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-primary/10 transition-colors">
                          <DollarSign className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900">${order.amount}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{order.currency}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-300" />
                          {formatDate(new Date(order.createdAt)).split(',')[0]}
                        </div>
                        {order.txHash ? (
                          <a
                            href={`https://explore.tempo.xyz/tx/${order.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors bg-primary/5 px-2 py-0.5 rounded-full"
                          >
                            Explore
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">No Hash</span>
                        )}
                      </div>
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
