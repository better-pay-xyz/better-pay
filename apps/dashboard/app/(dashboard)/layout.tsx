import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  // TODO: Fetch actual merchant data from session
  // For now, using placeholder data

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          merchantName="Demo Merchant"
          merchantEmail="demo@example.com"
        />
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
