import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inventory Manager POS',
  description: 'Point of Sale system for shopkeepers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
