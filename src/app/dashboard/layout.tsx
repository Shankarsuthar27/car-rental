'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  CalendarDays,
  FileCheck2,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  Car,
  ChevronRight
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

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-dvh bg-muted/20 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-background border-b border-border sticky top-0 z-30 h-16 flex items-center px-3 sm:px-4 md:px-8 justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Accessible 44x44px Hamburger Button */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close account navigation menu' : 'Open account navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>

          <BrandLogo href="/" size="sm" textVariant="compact" />

          <span className="hidden sm:inline-block text-[11px] bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full border border-primary/20">
            Console
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs gap-1.5 min-h-[40px] px-3 rounded-xl border-border font-semibold"
          >
            <Link href="/cars">
              <Car className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span className="hidden sm:inline">Book a Car</span>
              <span className="sm:hidden">Cars</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-rose-600 min-h-[40px] px-2.5 rounded-xl gap-1"
            aria-label="Log out"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Mobile Side Sheet Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 w-full max-w-[320px] bg-background border-r border-border z-50 flex flex-col shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Customer Account Navigation"
            >
              {/* Drawer Top Header */}
              <div className="h-16 px-4 border-b border-border flex items-center justify-between bg-card/60 backdrop-blur-md shrink-0">
                <BrandLogo href="/" size="xs" textVariant="compact" onClick={() => setMobileOpen(false)} />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Close navigation drawer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground px-2 block">
                    Customer Account
                  </span>

                  <nav className="space-y-1" aria-label="Customer Mobile Navigation">
                    {customerNavItems.map(item => {
                      const Icon = item.icon
                      const isActive = pathname === item.href

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all min-h-[44px]',
                            isActive
                              ? 'bg-primary text-white shadow-xs font-bold'
                              : 'text-foreground hover:bg-muted/60 bg-muted/20'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-primary')} aria-hidden="true" />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-70" aria-hidden="true" />
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                {/* Quick Fleet Link */}
                <div className="pt-2 border-t border-border/60 space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground px-2 block">
                    Quick Booking
                  </span>
                  <Link
                    href="/cars"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold min-h-[44px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Car className="w-4 h-4" />
                      <span>Book Another Car</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  </Link>
                </div>
              </div>

              {/* Drawer Footer with Logout */}
              <div className="p-4 border-t border-border bg-muted/20 shrink-0 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full min-h-[44px] text-xs font-bold rounded-xl text-rose-600 border-rose-500/20 hover:bg-rose-500/10 justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Log out</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Layout Container */}
      <div className="flex-1 container mx-auto px-3.5 sm:px-4 md:px-8 py-6 md:py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 items-start">
          {/* Desktop Left Navigation */}
          <div className="hidden md:block md:col-span-1 bg-card border border-border rounded-3xl p-4 shadow-xs space-y-1 sticky top-24">
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
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all min-h-[44px]',
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Main Dashboard Content */}
          <div className="md:col-span-3 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  )
}
