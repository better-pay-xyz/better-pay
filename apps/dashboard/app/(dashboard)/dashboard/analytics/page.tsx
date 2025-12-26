'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Users, Activity } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

export default function AnalyticsPage() {
  const { data: overview, isLoading: isOverviewLoading } = trpc.analytics.getOverview.useQuery()
  const { data: revenueData, isLoading: isRevenueLoading } = trpc.analytics.getRevenueByPeriod.useQuery({ period: '30d' })
  const { data: transactions, isLoading: isTransactionsLoading } = trpc.analytics.getRecentTransactions.useQuery({ limit: 5 })

  const metrics = [
    {
      title: 'Total Revenue',
      value: overview ? `$${Number(overview.totalRevenue).toLocaleString()}` : '$0',
      change: '+20.1%',
      changeType: 'up' as const,
      icon: DollarSign,
      description: 'From last month'
    },
    {
      title: 'Transactions',
      value: overview?.totalOrders?.toLocaleString() || '0',
      change: '+15.3%',
      changeType: 'up' as const,
      icon: CreditCard,
      description: 'From last month'
    },
    {
      title: 'Active Customers',
      value: overview?.uniqueCustomers?.toLocaleString() || '0',
      change: '+8.2%',
      changeType: 'up' as const,
      icon: Users,
      description: 'From last month'
    },
    {
      title: 'Success Rate',
      value: overview ? `${overview.successRate}%` : '0%',
      change: overview && Number(overview.successRate) >= 95 ? '+2.1%' : '-2.4%',
      changeType: overview && Number(overview.successRate) >= 95 ? 'up' : 'down' as const,
      icon: Activity,
      description: 'From last month'
    }
  ]

  // Format revenue data for chart
  const chartData = revenueData?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: Number(item.revenue),
    orders: item.orders
  })) || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your payment performance and gain insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.title}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>{metric.title}</CardDescription>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isOverviewLoading ? '...' : metric.value}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {metric.changeType === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm ${
                      metric.changeType === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {metric.change}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {metric.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Daily revenue over the past 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {isRevenueLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                No revenue data available yet
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3ECF8E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3ECF8E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3ECF8E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Orders</CardTitle>
            <CardDescription>Number of orders per day</CardDescription>
          </CardHeader>
          <CardContent>
            {isRevenueLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center border border-dashed border-border rounded-lg">
                <p className="text-sm text-muted-foreground">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="orders" fill="#3ECF8E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest payment activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isTransactionsLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : !transactions || transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction, index) => (
                  <div key={transaction.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium font-mono">
                          {transaction.customerAddress
                            ? `${transaction.customerAddress.slice(0, 6)}...${transaction.customerAddress.slice(-4)}`
                            : 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          ${transaction.amount} {transaction.currency}
                        </span>
                        <Badge
                          variant={transaction.status === 'paid' ? 'default' : 'destructive'}
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                    {index < transactions.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
