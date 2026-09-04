'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BrandLogo } from '@/components/brand/BrandLogo'
import {
  Menu,
  X,
  Car,
  Phone,
  ShieldCheck,
  User,
  LayoutDashboard,
  Calendar,
  ChevronRight,
  Sparkles,
  LogIn,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function CustomerNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const [scrolled, setScrolled] = useState<boolean>(false)

  // Fetch current user and track scroll position
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isTransparentPage = pathname === '/'

  const navLinks = [
    { label: 'Browse Fleet', href: '/cars', icon: Car },
    { label: 'Customer Portal', href: '/dashboard', icon: LayoutDashboard },
  ]

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isTransparentPage && !scrolled
            ? 'bg-transparent'
            : 'bg-background/95 backdrop-blur-md border-b border-border shadow-xs'
        )}
      >
        <nav
          className="container mx-auto px-3 sm:px-4 md:px-6 h-16 flex items-center justify-between gap-2 max-w-7xl"
          aria-label="Main Navigation"
        >
          {/* Brand Logo - Responsive sizing for ultra-narrow 320px screens */}
          <div className="shrink-0 min-w-0">
            <BrandLogo
              href="/"
              size="sm"
              textVariant="compact"
              priority
              textClassName={isTransparentPage && !scrolled ? 'text-white' : 'text-foreground'}
              subtextClassName={isTransparentPage && !scrolled ? 'text-amber-400' : 'text-primary'}
            />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all min-h-[44px]',
                    isTransparentPage && !scrolled
                      ? isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                      : isActive
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              )
            })}

            <a
              href="tel:+919876543210"
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px]',
                isTransparentPage && !scrolled
                  ? 'text-amber-300 hover:text-white hover:bg-white/10'
                  : 'text-primary hover:bg-primary/5'
              )}
              aria-label="Call Helpline +91 98765 43210"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">+91 98765 43210</span>
              <span className="lg:hidden">Helpline</span>
            </a>
          </div>

          {/* Desktop Auth & Admin Action Buttons */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 min-h-[44px] px-3 rounded-xl hover:bg-muted/40 cursor-pointer"
                    aria-label="User account menu"
                  >
                    <Avatar className="w-7 h-7 ring-2 ring-primary/25">
                      <AvatarFallback className="text-xs gradient-brand text-white font-bold">
                        {user.email?.[0]?.toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        'text-xs font-bold truncate max-w-28',
                        isTransparentPage && !scrolled ? 'text-white' : 'text-foreground'
                      )}
                    >
                      Account
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl border border-border">
                  <div className="px-3 py-2 border-b border-border/60">
                    <span className="text-xs font-bold text-foreground block truncate">
                      {user.email}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      Authorized User
                    </span>
                  </div>
                  <DropdownMenuItem asChild className="rounded-xl min-h-[40px] text-xs font-medium cursor-pointer">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span>Admin Fleet Console</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl min-h-[40px] text-xs font-medium cursor-pointer">
                    <Link href="/admin/bookings" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span>All Bookings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl min-h-[40px] text-xs font-medium cursor-pointer">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" aria-hidden="true" />
                      <span>Customer Portal</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-xl min-h-[40px] text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    'min-h-[44px] px-3.5 rounded-xl text-xs font-semibold',
                    isTransparentPage && !scrolled ? 'text-white hover:text-white/80 hover:bg-white/10' : ''
                  )}
                >
                  <Link href="/login">Staff Log in</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="gradient-brand text-white border-0 hover:opacity-90 font-bold text-xs min-h-[44px] px-4 rounded-xl shadow-xs gap-1.5"
                >
                  <Link href="/login">
                    <ShieldCheck className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                    <span>Admin Portal</span>
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Right Controls: Direct Phone Call + Hamburger Toggle */}
          <div className="flex items-center gap-1 md:hidden">
            {/* Direct Quick Tap Phone Link */}
            <a
              href="tel:+919876543210"
              className={cn(
                'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer',
                isTransparentPage && !scrolled
                  ? 'text-amber-300 hover:bg-white/10'
                  : 'text-primary hover:bg-primary/10'
              )}
              aria-label="Call support at +91 98765 43210"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
            </a>

            {/* Hamburger Toggle Button (Strict 44x44px Touch Target) */}
            <button
              type="button"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              className={cn(
                'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer',
                isTransparentPage && !scrolled
                  ? 'text-white hover:bg-white/10 active:bg-white/20'
                  : 'text-foreground hover:bg-muted active:bg-muted/80'
              )}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-6 h-6" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="w-6 h-6" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </header>

      {/* ============================================================ */}
      {/* MOBILE FULL-SCREEN / DRAWER NAVIGATION OVERLAY              */}
      {/* ============================================================ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
              aria-hidden="true"
            />

            {/* Slide-Down Mobile Navigation Menu */}
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed top-16 left-0 right-0 bg-card border-b border-border z-50 md:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto shadow-2xl rounded-b-3xl"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation"
            >
              <div className="p-4 sm:p-6 space-y-4">
                {/* Brand & Helpline Strip */}
                <div className="p-3 bg-muted/40 border border-border/60 rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-foreground block truncate">
                      Jalore Self Drive Car Rental
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-3 h-3 text-amber-500" aria-hidden="true" /> 24/7 Roadside Assistance
                    </span>
                  </div>
                  <a
                    href="tel:+919876543210"
                    className="min-h-[44px] px-3 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shrink-0"
                    aria-label="Call helpline"
                  >
                    <Phone className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                    <span>Call Us</span>
                  </a>
                </div>

                {/* Primary Navigation Links */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground px-2 block">
                    Navigation
                  </span>

                  <Link
                    href="/cars"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center justify-between p-3.5 rounded-2xl text-sm font-semibold transition-colors min-h-[44px]',
                      pathname === '/cars'
                        ? 'bg-primary text-white font-bold shadow-xs'
                        : 'bg-muted/30 text-foreground hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                      <span>Browse Fleet & Cars</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-70" aria-hidden="true" />
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center justify-between p-3.5 rounded-2xl text-sm font-semibold transition-colors min-h-[44px]',
                      pathname.startsWith('/dashboard')
                        ? 'bg-primary text-white font-bold shadow-xs'
                        : 'bg-muted/30 text-foreground hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                      <span>Customer Portal / Bookings</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-70" aria-hidden="true" />
                  </Link>
                </div>

                {/* Authentication & Admin Action Links */}
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground px-2 block">
                    Operations & Staff
                  </span>

                  {user ? (
                    <div className="space-y-2">
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-primary/10 border border-primary/25 text-sm font-bold text-primary min-h-[44px]"
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                          <span>Admin Fleet Console</span>
                        </div>
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </Link>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLogout}
                        className="w-full min-h-[44px] text-xs font-bold rounded-xl text-rose-600 dark:text-rose-400 border-border hover:bg-rose-500/10 gap-2"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        <span>Sign Out ({user.email})</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <Button
                        variant="outline"
                        asChild
                        className="min-h-[44px] rounded-xl text-xs font-bold justify-center border-border"
                      >
                        <Link href="/login" onClick={() => setMobileOpen(false)}>
                          <LogIn className="w-4 h-4 mr-1.5" aria-hidden="true" />
                          <span>Staff Log in</span>
                        </Link>
                      </Button>

                      <Button
                        asChild
                        className="gradient-brand text-white border-0 min-h-[44px] rounded-xl text-xs font-bold justify-center shadow-xs"
                      >
                        <Link href="/login" onClick={() => setMobileOpen(false)}>
                          <ShieldCheck className="w-4 h-4 mr-1.5 fill-current" aria-hidden="true" />
                          <span>Admin Operations</span>
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
