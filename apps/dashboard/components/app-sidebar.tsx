'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CreditCard,
  Key,
  Webhook,
  BarChart3,
  Settings,
  Link2,
  ShieldCheck
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/dashboard/orders', icon: CreditCard },
  { name: 'Payment Links', href: '/dashboard/payment-links', icon: Link2 },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'Webhooks', href: '/dashboard/webhooks', icon: Webhook },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings }
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-slate-100">
      <SidebarHeader className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <span className="text-white font-black text-xl">B</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-slate-900 leading-tight">BetterPay</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Merchant</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={`h-11 px-4 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-bold shadow-sm' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Link href={item.href}>
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Secured Account</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            Your transactions are protected by end-to-end encryption.
          </p>
        </div>
        <div className="mt-4 px-2">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center">
            BetterPay v0.1.0
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
