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

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
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
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          className={cn(
            'md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer',
            isTransparentPage && !scrolled ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-muted'
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden bg-background border-b border-border overflow-hidden shadow-lg"
          >
            <div className="container mx-auto px-4 py-4 space-y-3">
              <div className="pb-2 border-b border-border/60 flex items-center justify-between">
                <BrandLogo href="/" size="sm" textVariant="full" />
              </div>
              <div className="flex flex-col gap-2.5">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" asChild className="min-h-[44px] justify-start rounded-xl">
                      <Link href="/admin/dashboard" onClick={() => setMobileOpen(false)}>
                        Fleet Console
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="min-h-[44px] justify-start rounded-xl text-destructive"
                    >
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild className="min-h-[44px] justify-center rounded-xl font-semibold">
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        Staff Log in
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      className="gradient-brand text-white border-0 min-h-[44px] justify-center rounded-xl font-bold shadow-xs"
                    >
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        Admin Portal
                      </Link>
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
