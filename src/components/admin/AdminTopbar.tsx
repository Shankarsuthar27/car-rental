'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Bell,
  Search,
  Menu,
  Moon,
  Sun,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Car,
  KeyRound,
  CheckCircle2,
  LogOut,
  Zap,
  ArrowRight
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { cn } from '@/lib/utils'

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let href = ''

  for (const seg of segments) {
    href += `/${seg}`
    const label = seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
    crumbs.push({ label, href })
  }

  return crumbs
}

interface AdminTopbarProps {
  onMobileMenuToggle: () => void
  profile?: Profile | null
}

export function AdminTopbar({ onMobileMenuToggle, profile }: AdminTopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const breadcrumbs = generateBreadcrumbs(pathname)
  const [isDark, setIsDark] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      type: 'overdue',
      title: 'Overdue Rental Return',
      description: 'Hyundai Creta (RJ14-CR-2024) is overdue by 3 hours',
      time: '15m ago',
      unread: true,
      href: '/admin/bookings?status=active',
    },
    {
      id: 'n2',
      type: 'pickup',
      title: 'Vehicle Active on Duty',
      description: 'Rahul Sharma dispatched on Toyota Fortuner',
      time: '1h ago',
      unread: true,
      href: '/admin/bookings?status=active',
    },
    {
      id: 'n3',
      type: 'pickup',
      title: 'Vehicle Ready for Assignment',
      description: 'Mahindra Scorpio N inspected and ready for active duty',
      time: '4h ago',
      unread: false,
      href: '/admin/vehicles?status=available',
    },
  ])

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (globalSearch.trim()) {
      router.push(`/admin/vehicles?search=${encodeURIComponent(globalSearch.trim())}`)
    }
  }

  const handleLogout = async () => {
    document.cookie = 'driveease_demo_role=; path=/; max-age=0; SameSite=Lax'
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const unreadCount = notifications.filter(n => n.unread).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD'

  return (
    <header className="h-16 border-b border-border bg-background/85 backdrop-blur-md flex items-center px-4 md:px-6 gap-4 sticky top-0 z-20 select-none">
      {/* Mobile menu toggle & brand badge */}
      <div className="flex items-center gap-2 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <BrandLogo size="xs" textVariant="compact" href="/admin/dashboard" />
      </div>

      {/* Breadcrumbs */}
      <nav className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground flex-1 min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" />}
            <Link
              href={crumb.href}
              className={cn(
                'hover:text-foreground transition-colors truncate max-w-36 font-medium',
                i === breadcrumbs.length - 1 && 'text-foreground font-bold'
              )}
            >
              {crumb.label}
            </Link>
          </div>
        ))}
      </nav>

      {/* Global Quick Search */}
      <form onSubmit={handleGlobalSearch} className="hidden md:flex items-center gap-2 relative">
        <Search className="w-3.5 h-3.5 absolute left-3 text-muted-foreground pointer-events-none" />
        <Input
          value={globalSearch}
          onChange={e => setGlobalSearch(e.target.value)}
          placeholder="Search fleet, customer, license..."
          className="pl-8.5 w-60 h-8.5 bg-muted/40 text-xs rounded-xl focus-visible:ring-primary"
        />
      </form>

      {/* Quick Action: Assign Car */}
      <Link href="/admin/assign" className="hidden sm:inline-flex">
        <Button size="sm" className="gradient-brand text-white border-0 hover:opacity-95 font-bold text-xs h-8.5 rounded-xl gap-1.5 shadow-sm shadow-primary/20">
          <Zap className="w-3.5 h-3.5 fill-current" /> Assign Car
        </Button>
      </Link>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="text-muted-foreground hover:text-foreground h-8.5 w-8.5 rounded-xl"
      >
        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
      </Button>

      {/* Notifications Popover */}
      <Popover>
        <PopoverTrigger className="relative text-muted-foreground hover:text-foreground h-8.5 w-8.5 rounded-xl inline-flex items-center justify-center hover:bg-muted/40 transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-background animate-pulse">
              {unreadCount}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0 rounded-2xl shadow-xl border border-border">
          <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">Fleet Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {notifications.map(n => (
              <Link
                key={n.id}
                href={n.href}
                className={cn(
                  'flex items-start gap-3 p-3 text-xs transition-colors hover:bg-muted/40',
                  n.unread && 'bg-primary/5'
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-lg shrink-0 mt-0.5',
                  n.type === 'overdue' && 'bg-rose-500/10 text-rose-600',
                  n.type === 'pickup' && 'bg-purple-500/10 text-purple-600',
                  n.type === 'maintenance' && 'bg-amber-500/10 text-amber-600'
                )}>
                  {n.type === 'overdue' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {n.type === 'pickup' && <Clock className="w-3.5 h-3.5" />}
                  {n.type === 'maintenance' && <Car className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{n.title}</p>
                  <p className="text-muted-foreground text-[11px] line-clamp-2 mt-0.5">{n.description}</p>
                  <span className="text-[10px] text-muted-foreground/70 font-mono mt-1 block">{n.time}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="p-2 border-t border-border text-center bg-muted/20">
            <Link
              href="/admin/notifications"
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              View All Notifications <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2.5 h-9 px-2 rounded-xl hover:bg-muted/50">
            <Avatar className="w-7 h-7 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url ?? ''} />
              <AvatarFallback className="text-xs gradient-brand text-white font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold truncate max-w-24 leading-none">
                {profile?.full_name ?? 'Admin Staff'}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold leading-none mt-1 uppercase tracking-wider">
                {profile?.role?.replace(/_/g, ' ') || 'Super Admin'}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl border border-border">
          <DropdownMenuLabel className="p-2">
            <div className="flex flex-col">
              <span className="font-bold text-xs text-foreground">{profile?.full_name ?? 'Administrator'}</span>
              <span className="text-[11px] text-muted-foreground truncate font-normal">
                {profile?.email ?? 'admin@driveease.in'}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="rounded-lg text-xs cursor-pointer">
            <Link href="/admin/settings">Settings & Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-lg text-xs cursor-pointer">
            <Link href="/admin/history">Rental History</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-lg text-xs cursor-pointer">
            <Link href="/admin/audit-logs">System Audit Logs</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer focus:bg-rose-500/10 focus:text-rose-600"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" /> Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
