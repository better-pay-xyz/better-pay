'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'

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
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <div className="flex flex-1 items-center justify-end gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{merchantName}</p>
          <p className="text-xs text-muted-foreground">{merchantEmail}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
