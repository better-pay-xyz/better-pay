'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Users, Activity, Calendar } from 'lucide-react'
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

function StatCard({ title, value, change, changeType, icon: Icon, description, isLoading }: any) {
  const isUp = changeType === 'up'
  return (
    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <div>
              <p className="text-3xl font-black text-slate-900 leading-tight">
                {isLoading ? <span className="inline-block w-24 h-8 bg-slate-100 animate-pulse rounded" /> : value}
              </p>
              {!isLoading && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black border ${
                    isUp ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {change}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{description}</span>
                </div>
              )}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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
      description: 'Vs last month'
    },
    {
      title: 'Transactions',
      value: overview?.totalOrders?.toLocaleString() || '0',
      change: '+15.3%',
      changeType: 'up' as const,
      icon: CreditCard,
      description: 'Vs last month'
    },
    {
      title: 'Active Customers',
      value: overview?.uniqueCustomers?.toLocaleString() || '0',
      change: '+8.2%',
      changeType: 'up' as const,
      icon: Users,
      description: 'Vs last month'
    },
    {
      title: 'Success Rate',
      value: overview ? `${overview.successRate}%` : '0%',
      change: overview && Number(overview.successRate) >= 95 ? '+2.1%' : '-2.4%',
      changeType: overview && Number(overview.successRate) >= 95 ? 'up' : 'down' as const,
      icon: Activity,
      description: 'Vs last month'
    }
  ]

  // Format revenue data for chart
  const chartData = revenueData?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: Number(item.revenue),
    orders: item.orders
  })) || []

  return (
    <div className="space-y-8 p-1 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Analytics</h1>
        <p className="text-slate-500 font-medium">Performance insights and real-time payment data.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <StatCard key={metric.title} {...metric} isLoading={isOverviewLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900">Revenue Growth</CardTitle>
                <CardDescription className="font-medium">Gross volume across all payment methods</CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white shadow-sm rounded-lg text-slate-900 transition-all">30 Days</button>
                <button className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">90 Days</button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isRevenueLoading ? (
              <div className="h-[350px] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing with blockchain...</p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                <p className="text-sm text-slate-400 font-bold">No data points available yet</p>
              </div>
            ) : (
              <div className="h-[350px] -ml-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3ECF8E" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3ECF8E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      className="text-slate-400 uppercase tracking-widest"
                      dy={10}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      className="text-slate-400 uppercase tracking-widest"
                      tickFormatter={(value) => `$${value}`}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }}
                      itemStyle={{
                        fontSize: '12px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: 'hsl(var(--primary))'
                      }}
                      labelStyle={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'hsl(var(--slate-500))',
                        marginBottom: '4px'
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3ECF8E"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Section: Activity & Distribution */}
        <div className="space-y-8">
          {/* Daily Orders */}
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900">Daily Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {isRevenueLoading ? (
                <div className="h-[180px] bg-slate-50 animate-pulse rounded-2xl" />
              ) : (
                <div className="h-[180px] -ml-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="date" hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(10px)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="orders" fill="#3ECF8E" radius={[6, 6, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Feed */}
          <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-black tracking-tight">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isTransactionsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="py-8 text-center opacity-40 italic text-sm">No activity records.</div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction, index) => (
                    <div key={transaction.id} className="flex items-center justify-between group/item">
                      <div className="flex flex-col">
                        <p className="text-xs font-mono font-bold text-slate-300 group-hover/item:text-primary transition-colors">
                          {transaction.customerAddress
                            ? `${transaction.customerAddress.slice(0, 6)}...${transaction.customerAddress.slice(-4)}`
                            : 'Anonymous'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-2.5 h-2.5 text-slate-600" />
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-white">${transaction.amount}</p>
                        <Badge className={`text-[8px] h-4 px-1 font-black uppercase leading-none border-none ${
                          transaction.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
