import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Payment Checkout - BetterPay',
  description: 'Complete your payment securely with crypto'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  )
}
