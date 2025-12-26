'use client'

import { DollarSign, ShoppingCart, Users, TrendingUp, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-muted-foreground'
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {isLoading ? '...' : value}
            </p>
            {change && (
              <p className={`text-sm mt-1 ${changeColors[changeType]}`}>
                {change}
              </p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
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
      icon: <DollarSign className="w-6 h-6 text-primary" />
    },
    {
      title: 'Orders',
      value: overview?.totalOrders?.toString() || '0',
      change: '+8.2% from last month',
      changeType: 'positive' as const,
      icon: <ShoppingCart className="w-6 h-6 text-primary" />
    },
    {
      title: 'Customers',
      value: overview?.uniqueCustomers?.toString() || '0',
      change: '+15.3% from last month',
      changeType: 'positive' as const,
      icon: <Users className="w-6 h-6 text-primary" />
    },
    {
      title: 'Success Rate',
      value: overview ? `${overview.successRate}%` : '0%',
      change: Number(overview?.successRate || 0) >= 95 ? '+1.1% from last month' : '-1.1% from last month',
      changeType: Number(overview?.successRate || 0) >= 95 ? 'positive' : 'negative' as const,
      icon: <TrendingUp className="w-6 h-6 text-primary" />
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here is your payment activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} isLoading={isOverviewLoading} />
        ))}
      </div>

      {/* Recent Orders Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isOrdersLoading ? (
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
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{order.id}</span>
                      <Badge
                        variant={
                          order.status === 'paid'
                            ? 'default'
                            : order.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.customerAddress
                        ? truncateAddress(order.customerAddress)
                        : 'No customer yet'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${order.amount} {order.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {order.txHash && (
                    <a
                      href={`https://explore.tempo.xyz/tx/${order.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
