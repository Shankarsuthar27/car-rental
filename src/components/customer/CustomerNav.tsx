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
  LogOut,
  CreditCard,
  FileCheck2,
  MapPin,
  MessageCircle
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('scroll', handleScroll)
    }
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

          {/* Mobile Right Controls: Direct Phone Call + Avatar + Hamburger Toggle */}
          <div className="flex items-center gap-1.5 md:hidden">
            {/* Direct Quick Tap Phone Link */}
            <a
              href="tel:+919876543210"
              className={cn(
                'min-h-[40px] px-2.5 flex items-center gap-1.5 rounded-xl transition-all cursor-pointer text-xs font-bold shrink-0',
                isTransparentPage && !scrolled
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15'
              )}
              aria-label="Call support at +91 98765 43210"
            >
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden xs:inline">Call Us</span>
            </a>

            {/* Quick user avatar shortcut if logged in */}
            {user && (
              <Link
                href="/dashboard"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl"
                aria-label="Customer Account Dashboard"
              >
                <Avatar className="w-7 h-7 ring-2 ring-primary/30">
                  <AvatarFallback className="text-xs gradient-brand text-white font-bold">
                    {user.email?.[0]?.toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}

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
      {/* MOBILE ORGANIZED SIDE SHEET NAVIGATION OVERLAY              */}
      {/* ============================================================ */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop Blur Overlay */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Slide-in Mobile Navigation Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-[340px] sm:max-w-sm bg-background border-l border-border flex flex-col shadow-2xl overflow-hidden z-50"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation"
            >
              {/* Drawer Top Bar */}
              <div className="h-16 px-4 border-b border-border flex items-center justify-between bg-card/60 backdrop-blur-md shrink-0">
                <BrandLogo
                  href="/"
                  size="xs"
                  textVariant="compact"
                  onClick={() => setMobileOpen(false)}
                />

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label="Close navigation drawer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* Scrollable Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {/* 1. Account / Authentication Status Card */}
                {user ? (
                  <div className="p-3.5 bg-card border border-border/80 rounded-2xl shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 ring-2 ring-primary/30 shrink-0">
                        <AvatarFallback className="gradient-brand text-white font-black text-sm">
                          {user.email?.[0]?.toUpperCase() ?? 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-foreground block truncate">
                          {user.email}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Customer Account
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/15 transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Console</span>
                      </Link>
                      <Link
                        href="/dashboard/bookings"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Bookings</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-2xl shadow-xs space-y-3">
                    <div>
                      <span className="text-xs font-extrabold text-foreground block">
                        Self-Drive Car Rental
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Instant KYC verification & 0 security hassle across Rajasthan.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="rounded-xl text-xs font-bold min-h-[40px] border-border"
                      >
                        <Link href="/login" onClick={() => setMobileOpen(false)}>
                          <LogIn className="w-3.5 h-3.5 mr-1" />
                          <span>Log in</span>
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        asChild
                        className="gradient-brand text-white border-0 rounded-xl text-xs font-bold min-h-[40px] shadow-xs"
                      >
                        <Link href="/cars" onClick={() => setMobileOpen(false)}>
                          <Car className="w-3.5 h-3.5 mr-1" />
                          <span>Book Car</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* 2. Organized Section: Fleet & Booking */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1 block">
                    Fleet & Booking
                  </span>

                  <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/50 shadow-xs">
                    <Link
                      href="/cars"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center justify-between p-3 transition-colors',
                        pathname === '/cars' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted/50 text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">Browse Fleet Cars</span>
                          <span className="text-[10px] text-muted-foreground block">SUVs, Sedans, Hatchbacks</span>
                        </div>
                      </div>
                      <Badge className="text-[9px] bg-primary text-white border-0 font-bold px-1.5 py-0.5">
                        Live Fleet
                      </Badge>
                    </Link>

                    <Link
                      href="/cars#offers"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">Rental Deals & Offers</span>
                          <span className="text-[10px] text-muted-foreground block">Special discounts & weekly plans</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </Link>
                  </div>
                </div>

                {/* 3. Organized Section: Customer Services & Account */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1 block">
                    Customer Services
                  </span>

                  <div className="bg-card border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/50 shadow-xs">
                    <Link
                      href="/dashboard/bookings"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">My Bookings</span>
                          <span className="text-[10px] text-muted-foreground block">View trips & car passes</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </Link>

                    <Link
                      href="/dashboard/documents"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                          <FileCheck2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">KYC & Documents</span>
                          <span className="text-[10px] text-muted-foreground block">Driving License verification</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </Link>

                    <Link
                      href="/dashboard/payments"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">Payments & Receipts</span>
                          <span className="text-[10px] text-muted-foreground block">Security deposit & settlements</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                    </Link>
                  </div>
                </div>

                {/* 4. Organized Section: 24/7 Roadside Helpline & WhatsApp */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1 block">
                    Emergency Support & Help
                  </span>

                  <div className="grid grid-cols-1 gap-2">
                    <a
                      href="tel:+919876543210"
                      className="flex items-center justify-between p-3 rounded-2xl bg-primary/10 border border-primary/25 hover:bg-primary/15 transition-all text-primary"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold block">Call Support Helpline</span>
                          <span className="text-[10px] text-muted-foreground font-mono">+91 98765 43210</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        24/7
                      </span>
                    </a>

                    <a
                      href="https://wa.me/919876543210?text=Hi%2C%20I%20am%20interested%20in%20booking%20a%20car%20with%20JSD%20Car%20Rental"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 transition-all text-emerald-600 dark:text-emerald-400"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold block">WhatsApp Assistance</span>
                          <span className="text-[10px] text-muted-foreground">Instant car booking inquiry</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                        Online
                      </span>
                    </a>
                  </div>
                </div>

                {/* 5. Organized Section: Staff & Administration */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1 block">
                    Operations & Staff
                  </span>

                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/80 hover:bg-muted/50 transition-colors text-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-zinc-500/10 flex items-center justify-center text-zinc-500 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">Staff Fleet Console</span>
                        <span className="text-[10px] text-muted-foreground block">Vehicle management & gate logs</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold">
                      Staff Portal
                    </Badge>
                  </Link>
                </div>
              </div>

              {/* Drawer Bottom Footer */}
              <div className="p-4 border-t border-border bg-muted/20 shrink-0 space-y-2.5">
                {user && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full min-h-[44px] text-xs font-bold rounded-xl text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/10 justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </Button>
                )}

                <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 text-center">
                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                  <span>Jalore Self Drive PVT LTD • Rajasthan</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
