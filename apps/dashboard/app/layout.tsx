import type { Metadata } from 'next'
import './globals.css'
import { TRPCProvider } from '@/components/providers/trpc-provider'

export const metadata: Metadata = {
  title: 'Dashboard - BetterPay',
  description: 'Merchant dashboard for crypto payments'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-background">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
