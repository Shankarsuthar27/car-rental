import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'JSD — Jalore Self Drive Car Rental',
    template: '%s | JSD Jalore Self Drive Car Rental',
  },
  description:
    'JSD — Jalore Self Drive Car Rental — Premium self-drive car rental platform. Book SUVs, sedans, and luxury cars for hourly, daily, weekly, or monthly rentals across Jalore, Rajasthan, and Gujarat.',
  keywords: ['car rental', 'self drive', 'Jalore car rental', 'JSD self drive', 'SUV rental Rajasthan', 'JSD', 'Jalore Self Drive Car Rental'],
  icons: {
    icon: [
      { url: '/logo.png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'JSD — Jalore Self Drive Car Rental',
    description: 'Premium self-drive car rental for hassle-free journeys across Jalore, Rajasthan & Gujarat.',
    type: 'website',
    images: [{ url: '/logo.png', width: 800, height: 800, alt: 'JSD — Jalore Self Drive Car Rental Logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'JSD — Jalore Self Drive Car Rental',
    description: 'Premium self-drive car rental across Jalore, Rajasthan & Gujarat.',
    images: ['/logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
