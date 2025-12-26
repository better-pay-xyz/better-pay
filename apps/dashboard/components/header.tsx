'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  merchantName?: string
  merchantEmail?: string
}

export function Header({ merchantName = 'Merchant', merchantEmail = 'merchant@example.com' }: HeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/register')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Page title area */}
        <div>
          {/* Can be used for breadcrumbs or page title */}
        </div>

        {/* Right side - User info and logout */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{merchantName}</p>
            <p className="text-xs text-gray-500">{merchantEmail}</p>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
