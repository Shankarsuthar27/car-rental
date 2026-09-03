'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Menu, X, Car, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

export function CustomerNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isTransparentPage = pathname === '/'

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isTransparentPage && !scrolled
          ? 'bg-transparent'
          : 'bg-background/95 backdrop-blur-sm border-b border-border shadow-sm'
      )}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <BrandLogo
          href="/"
          size="md"
          priority
          textClassName={isTransparentPage && !scrolled ? 'text-white' : 'text-foreground'}
          subtextClassName={isTransparentPage && !scrolled ? 'text-amber-400' : 'text-primary'}
        />

        {/* Desktop nav links & auth */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/cars"
            className={cn(
              'text-xs font-bold transition-colors hover:text-primary',
              isTransparentPage && !scrolled ? 'text-white/90 hover:text-white' : 'text-foreground/80'
            )}
          >
            Browse Cars
          </Link>
          <a
            href="tel:+911412345678"
            className={cn(
              'text-xs font-semibold transition-colors flex items-center gap-1 hover:text-primary',
              isTransparentPage && !scrolled ? 'text-white/80 hover:text-white' : 'text-muted-foreground'
            )}
          >
            <Phone className="w-3.5 h-3.5" /> +91-141-2345678
          </a>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs gradient-brand text-white">
                      {user.email?.[0]?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn('text-sm', isTransparentPage && !scrolled && 'text-white')}>
                    My Account
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/admin/dashboard">Fleet Console</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/vehicles">Fleet Inventory</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/bookings">All Bookings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className={cn(isTransparentPage && !scrolled && 'text-white hover:text-white/80')}
              >
                <Link href="/login">Staff Log in</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="gradient-brand text-white border-0 hover:opacity-90"
              >
                <Link href="/login">Admin Portal</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className={cn(
            'md:hidden p-2 -mr-2 rounded-xl transition-colors',
            isTransparentPage && !scrolled ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-muted'
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/98 backdrop-blur-xl border-b border-border shadow-xl overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <div className="pb-3 border-b border-border flex items-center justify-between">
                <BrandLogo href="/" size="sm" textVariant="full" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                  Navigation
                </span>
              </div>

              {/* Customer Links */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/cars"
                  onClick={() => setMobileOpen(false)}
                  className="p-3 rounded-2xl bg-muted/40 hover:bg-primary/10 border border-border/80 flex items-center gap-2.5 text-xs font-bold text-foreground transition-colors"
                >
                  <Car className="w-4 h-4 text-primary" />
                  <span>Browse Fleet</span>
                </Link>

                <a
                  href="tel:+911412345678"
                  onClick={() => setMobileOpen(false)}
                  className="p-3 rounded-2xl bg-muted/40 hover:bg-primary/10 border border-border/80 flex items-center gap-2.5 text-xs font-bold text-foreground transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span>Call Support</span>
                </a>
              </div>

              <div className="flex flex-col gap-2 pt-1 border-t border-border">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" asChild onClick={() => setMobileOpen(false)} className="h-10 rounded-xl font-bold">
                      <Link href="/admin/dashboard">Fleet Operations Console</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="h-10 rounded-xl text-destructive font-semibold">
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild onClick={() => setMobileOpen(false)} className="h-10 rounded-xl font-semibold">
                      <Link href="/login">Staff Log in</Link>
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      onClick={() => setMobileOpen(false)}
                      className="gradient-brand text-white border-0 h-10 rounded-xl font-bold shadow-md"
                    >
                      <Link href="/login">Admin Console</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
