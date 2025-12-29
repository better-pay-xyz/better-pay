'use client'

import { DollarSign, ShoppingCart, Users, TrendingUp, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'

interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  isLoading?: boolean
}

function StatCard({ title, value, change, changeType = 'neutral', icon, isLoading }: StatCardProps) {
  const changeVariants: Record<string, "success" | "destructive" | "secondary"> = {
    positive: 'success',
    negative: 'destructive',
    neutral: 'secondary'
  }

  return (
    <Card className="hover:shadow-md transition-all duration-300 group">
      <CardContent className="pt-8">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <div>
              <p className="text-3xl font-black text-slate-900 leading-tight">
                {isLoading ? (
                  <span className="inline-block w-24 h-8 bg-slate-100 animate-pulse rounded" />
                ) : (
                  value
                )}
              </p>
              {change && !isLoading && (
                <div className="mt-2">
                  <Badge variant={changeVariants[changeType]}>
                    {change}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function truncateAddress(address: string): string {
  if (!address) return '-'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function DashboardOverviewPage() {
  const { data: overview, isLoading: isOverviewLoading } = trpc.analytics.getOverview.useQuery()
  const { data: ordersData, isLoading: isOrdersLoading } = trpc.orders.list.useQuery({ limit: 5 })

  const orders = ordersData?.data ?? []

  const stats = [
    {
      title: 'Total Revenue',
      value: overview ? `$${Number(overview.totalRevenue).toLocaleString()}` : '$0',
      change: '+12.5% from last month',
      changeType: 'positive' as const,
      icon: <DollarSign className="w-6 h-6" />
    },
    {
      title: 'Total Orders',
      value: overview?.totalOrders?.toString() || '0',
      change: '+8.2% from last month',
      changeType: 'positive' as const,
      icon: <ShoppingCart className="w-6 h-6" />
    },
    {
      title: 'Customers',
      value: overview?.uniqueCustomers?.toString() || '0',
      change: '+15.3% from last month',
      changeType: 'positive' as const,
      icon: <Users className="w-6 h-6" />
    },
    {
      title: 'Success Rate',
      value: overview ? `${overview.successRate}%` : '0%',
      change: Number(overview?.successRate || 0) >= 95 ? '+1.1% from last month' : '-1.1% from last month',
      changeType: Number(overview?.successRate || 0) >= 95 ? 'positive' : 'negative' as const,
      icon: <TrendingUp className="w-6 h-6" />
    }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 font-medium">Monitoring your payment performance and activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} isLoading={isOverviewLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Section */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest crypto payments through BetterPay</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="font-bold">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isOrdersLoading ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100 mt-4">
                <div className="p-4 bg-white rounded-full w-fit mx-auto shadow-sm mb-4">
                  <ShoppingCart className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-900 font-bold">No transactions yet</p>
                <p className="text-sm text-slate-500 font-medium max-w-[200px] mx-auto mt-1">
                  Start accepting payments to see them appear here.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-primary/10 hover:bg-white hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${
                        order.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 
                        order.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono text-xs uppercase tracking-wider">#{order.id.slice(-6)}</span>
                          <Badge
                            variant={
                              order.status === 'paid'
                                ? 'success'
                                : order.status === 'pending'
                                ? 'warning'
                                : 'destructive'
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                          {order.customerAddress
                            ? truncateAddress(order.customerAddress)
                            : 'Awaiting customer...'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-black text-slate-900">
                          ${order.amount} <span className="text-[10px] text-slate-400 font-bold uppercase">{order.currency}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      {order.txHash && (
                        <a
                          href={`https://explore.tempo.xyz/tx/${order.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Integration Card */}
        <Card className="bg-primary/5 border border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <TrendingUp className="w-32 h-32 text-primary" />
          </div>
          <CardHeader>
            <CardTitle>Quick Integration</CardTitle>
            <CardDescription>Start collecting payments in minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-white rounded-2xl border border-primary/10 space-y-2 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your API Link</p>
              <code className="text-[11px] font-mono text-primary block break-all font-bold">
                https://api.betterpay.xyz/v1/checkout
              </code>
            </div>
            <Button className="w-full">
              View API Documentation
            </Button>
            <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-[0.2em]">
              Tempo • Ethereum • Polygon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
