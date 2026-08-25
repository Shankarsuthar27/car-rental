import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: {
    default: 'DriveEase — Car Rental Management',
    template: '%s | DriveEase',
  },
  description:
    'DriveEase — Premium car rental platform. Book SUVs, sedans, and more for hourly, daily, weekly, or monthly rentals across Jaipur, Jodhpur, Udaipur, and Ahmedabad.',
  keywords: ['car rental', 'self drive', 'SUV rental', 'Jaipur car rental', 'DriveEase'],
  openGraph: {
    title: 'DriveEase — Drive Your Way, Every Day',
    description: 'Premium car rental platform for individuals and businesses.',
    type: 'website',
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
