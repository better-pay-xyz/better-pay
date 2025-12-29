'use client'

import { LogOut, User, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-100 px-6 bg-white/50 backdrop-blur-md sticky top-0 z-20">
      <SidebarTrigger className="text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors" />
      
      <div className="flex-1 flex items-center justify-end gap-3">
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 rounded-full">
          <Bell className="w-5 h-5" />
        </Button>

        <div className="w-px h-6 bg-slate-100 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-2 pr-1 h-10 rounded-full hover:bg-slate-50 gap-3 group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">{merchantName}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{merchantEmail.split('@')[0]}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
                <User className="w-4 h-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 border-slate-100 shadow-xl rounded-2xl p-2">
            <DropdownMenuLabel className="font-bold text-slate-900 px-3 py-2">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-50" />
            <DropdownMenuItem className="rounded-xl px-3 py-2 cursor-pointer font-medium text-slate-600 hover:text-primary focus:text-primary focus:bg-primary/5">
              <User className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleLogout}
              className="rounded-xl px-3 py-2 cursor-pointer font-medium text-rose-600 hover:text-rose-700 focus:text-rose-700 focus:bg-rose-50 mt-1"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
