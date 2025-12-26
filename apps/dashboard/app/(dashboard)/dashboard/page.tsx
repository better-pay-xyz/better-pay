import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
}

function StatCard({ title, value, change, changeType = 'neutral', icon }: StatCardProps) {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-500'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function DashboardOverviewPage() {
  // Placeholder stats - will be replaced with real data
  const stats = [
    {
      title: 'Total Revenue',
      value: '$12,345.67',
      change: '+12.5% from last month',
      changeType: 'positive' as const,
      icon: <DollarSign className="w-6 h-6 text-blue-600" />
    },
    {
      title: 'Orders',
      value: '156',
      change: '+8.2% from last month',
      changeType: 'positive' as const,
      icon: <ShoppingCart className="w-6 h-6 text-blue-600" />
    },
    {
      title: 'Customers',
      value: '89',
      change: '+15.3% from last month',
      changeType: 'positive' as const,
      icon: <Users className="w-6 h-6 text-blue-600" />
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: '-1.1% from last month',
      changeType: 'negative' as const,
      icon: <TrendingUp className="w-6 h-6 text-blue-600" />
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here is your payment activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Orders will appear here once customers start making payments
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
