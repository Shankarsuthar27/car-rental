import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
})

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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
