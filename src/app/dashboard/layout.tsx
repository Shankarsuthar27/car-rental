'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  FileCheck2,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  Car
} from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const customerNavItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Bookings', href: '/dashboard/bookings', icon: CalendarDays },
  { label: 'KYC Documents', href: '/dashboard/documents', icon: FileCheck2 },
  { label: 'Payments & Refunds', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Profile Settings', href: '/dashboard/profile', icon: User }
]

export default function CustomerDashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-background border-b border-border sticky top-0 z-30 h-16 flex items-center px-4 md:px-8 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-foreground p-1"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <BrandLogo href="/" size="sm" textVariant="compact" />
          <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-md">
            Customer Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="text-xs gap-1.5 h-8">
            <Link href="/cars">
              <Car className="w-3.5 h-3.5" /> Book a Car
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-rose-600 h-8 gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </Button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Desktop Left Navigation */}
          <div className="hidden md:block md:col-span-1 bg-card border border-border rounded-3xl p-4 shadow-sm space-y-1">
            <div className="p-3 mb-2 border-b border-border">
              <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                My Account
              </span>
            </div>
            {customerNavItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Main Dashboard Content */}
          <div className="md:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  )
}
