import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: {
    default: 'JSD — Jalore Self Drive Car Rental',
    template: '%s | JSD Jalore Self Drive',
  },
  description:
    'JSD Jalore Self Drive Car Rental — Premium car rental platform. Book SUVs, sedans, and more for hourly, daily, weekly, or monthly self-drive rentals across Jalore, Rajasthan, and Gujarat.',
  keywords: ['car rental', 'self drive', 'Jalore car rental', 'JSD self drive', 'SUV rental Rajasthan', 'JSD'],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'JSD — Jalore Self Drive Car Rental',
    description: 'Premium self-drive car rental for hassle-free journeys.',
    type: 'website',
    images: [{ url: '/logo.png', width: 800, height: 800, alt: 'JSD Logo' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
