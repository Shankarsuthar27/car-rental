'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  MessageSquareText,
  CarFront,
  CalendarClock,
  Users,
  Zap,
  CreditCard,
  History,
  BarChart3,
  Settings,
  UserCog,
  ChevronRight,
  ChevronLeft,
  LogOut,
  X,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { usePermissions } from '@/hooks/usePermissions'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavChild {
  label: string
  href: string
  badgeColor?: string
}

interface NavItem {
  label: string
  href?: string
  icon: React.ElementType
  badge?: string
  permission?: string
  children?: NavChild[]
}

const workspaceNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Inquiry',
    href: '/admin/notifications',
    icon: MessageSquareText,
  },
  {
    label: 'Fleet',
    icon: CarFront,
    permission: 'vehicles.view',
    children: [
      { label: 'All Cars', href: '/admin/vehicles' },
      { label: 'Available Cars', href: '/admin/vehicles?status=available', badgeColor: 'bg-emerald-500' },
      { label: 'Running Cars', href: '/admin/vehicles?status=rented', badgeColor: 'bg-blue-500' },
      { label: 'Unavailable Cars', href: '/admin/vehicles?status=inactive', badgeColor: 'bg-rose-500' },
    ],
  },
  {
    label: 'Rentals',
    icon: CalendarClock,
    permission: 'bookings.view',
    children: [
      { label: 'Active Rentals', href: '/admin/bookings?status=active', badgeColor: 'bg-blue-500' },
      { label: 'Completed', href: '/admin/bookings?status=completed', badgeColor: 'bg-zinc-400' },
      { label: 'Cancelled', href: '/admin/bookings?status=cancelled', badgeColor: 'bg-rose-500' },
    ],
  },
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: Users,
    permission: 'customers.view',
  },
  {
    label: 'Assign Car',
    href: '/admin/assign',
    icon: Zap,
    permission: 'bookings.create',
  },
  {
    label: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
    permission: 'payments.view',
  },
  {
    label: 'Rental History',
    href: '/admin/history',
    icon: History,
    permission: 'bookings.view',
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    permission: 'reports.view',
  },
]

const utilityNavItems: NavItem[] = [
  {
    label: 'Staff & Roles',
    href: '/admin/employees',
    icon: UserCog,
    permission: 'team.manage',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: 'settings.manage',
  },
]

interface AdminSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const { can } = usePermissions()

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Fleet: pathname.startsWith('/admin/vehicles'),
    Rentals: pathname.startsWith('/admin/bookings'),
  })
  const [counts, setCounts] = useState<{ inquiry: number | null; fleet: number | null; rentals: number | null }>({
    inquiry: null,
    fleet: null,
    rentals: null,
  })

  useEffect(() => {
    let active = true
    const loadCounts = async () => {
      try {
        const res = await fetch('/api/admin/sidebar-counts', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (active) {
          setCounts({
            inquiry: typeof data.inquiry === 'number' ? data.inquiry : 0,
            fleet: typeof data.fleet === 'number' ? data.fleet : 0,
            rentals: typeof data.rentals === 'number' ? data.rentals : 0,
          })
        }
      } catch {
        // Ignore transient fetch errors
      }
    }

    void loadCounts()
    const handleRefresh = () => void loadCounts()
    window.addEventListener('jsd-sidebar-counts-refresh', handleRefresh)
    return () => {
      active = false
      window.removeEventListener('jsd-sidebar-counts-refresh', handleRefresh)
    }
  }, [pathname])

  const getItemBadge = (item: NavItem): string | undefined => {
    if (item.label === 'Inquiry') {
      return counts.inquiry !== null && counts.inquiry > 0 ? String(counts.inquiry) : undefined
    }
    if (item.label === 'Fleet') {
      return counts.fleet !== null ? String(counts.fleet) : undefined
    }
    if (item.label === 'Rentals') {
      return counts.rentals !== null ? String(counts.rentals) : undefined
    }
    return item.badge
  }

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const handleLogout = async () => {
    document.cookie = 'driveease_demo_role=; path=/; max-age=0'
    document.cookie = 'driveease_user_permissions=; path=/; max-age=0'
    document.cookie = 'driveease_user_name=; path=/; max-age=0'
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onToggle()
    }
  }

  const isLinkActive = (href?: string) => {
    if (!href) return false
    const [basePath, queryStr] = href.split('?')
    if (queryStr) {
      const targetParams = new URLSearchParams(queryStr)
      if (pathname !== basePath) return false
      for (const [key, val] of targetParams.entries()) {
        if (searchParams.get(key) !== val) return false
      }
      return true
    }
    if (basePath === '/admin/dashboard') {
      return pathname === '/admin/dashboard' || pathname === '/admin'
    }
    return pathname === basePath || pathname.startsWith(basePath + '/')
  }

  const isGroupActive = (item: NavItem) => {
    if (item.href && isLinkActive(item.href)) return true
    if (item.children) {
      return item.children.some(child => pathname === child.href.split('?')[0])
    }
    return false
  }

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon
    const active = isGroupActive(item)
    const hasChildren = Boolean(item.children && item.children.length > 0)
    const expanded = openGroups[item.label]
    const allowed = !item.permission || can(item.permission)
    const badgeText = getItemBadge(item)

    // Collapsed mode: Icon-only with Tooltip & popover
    if (collapsed) {
      const linkContent = item.href && allowed ? (
        <Link
          href={item.href}
          onClick={handleNavClick}
          prefetch={true}
          title={item.label}
          className={cn(
            'relative h-11 w-full flex items-center justify-center rounded-lg transition-all duration-150',
            active
              ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-[#1f70ff] dark:text-white dark:shadow-lg dark:shadow-blue-500/25'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-white dark:hover:text-white dark:hover:bg-white/[0.06]'
          )}
        >
          {active && (
            <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-indigo-600 dark:hidden" />
          )}
          <Icon size={19} strokeWidth={1.8} className="shrink-0" />
        </Link>
      ) : (
        <button
          type="button"
          title={item.label}
          onClick={() => {
            if (!allowed) return
            if (hasChildren) {
              onToggle()
              setOpenGroups(prev => ({ ...prev, [item.label]: true }))
            }
          }}
          className={cn(
            'relative h-11 w-full flex items-center justify-center rounded-lg transition-all duration-150',
            !allowed
              ? 'opacity-35 cursor-not-allowed text-slate-400 dark:text-[#4a5b73]'
              : active
              ? 'bg-indigo-50 text-indigo-700 font-semibold cursor-pointer dark:bg-[#1f70ff] dark:text-white dark:shadow-lg dark:shadow-blue-500/25'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 cursor-pointer dark:text-white dark:hover:text-white dark:hover:bg-white/[0.06]'
          )}
        >
          {active && (
            <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-indigo-600 dark:hidden" />
          )}
          <Icon size={19} strokeWidth={1.8} className="shrink-0" />
        </button>
      )

      return (
        <Tooltip key={item.label}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent
            side="right"
            className="p-2.5 bg-white border border-slate-200 text-slate-900 shadow-lg min-w-[160px] dark:bg-[#09152b] dark:border-[#1b2940] dark:text-white"
          >
            <p className="font-semibold text-xs pb-1 mb-1 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
              <span>{item.label}</span>
              {!allowed ? (
                <Lock className="w-3 h-3 text-amber-500" />
              ) : badgeText ? (
                <span className="min-w-6 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-center text-[10px] font-semibold tabular-nums text-slate-600 dark:border-[#1b2940] dark:bg-[#131e30] dark:text-white/90">
                  {badgeText}
                </span>
              ) : null}
            </p>
            {!allowed && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400/90 font-medium">Permission required</p>
            )}
            {allowed && hasChildren && (
              <div className="space-y-1 pt-1">
                {item.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={handleNavClick}
                    prefetch={true}
                    className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-md text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-white dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                  >
                    <span>{child.label}</span>
                    {child.badgeColor && (
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', child.badgeColor)} />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      )
    }

    // Expanded Mode: Single Link Item (Dashboard, Inquiry, Customers, etc.)
    if (!hasChildren && item.href) {
      if (!allowed) {
        return (
          <div
            key={item.label}
            className="w-full flex items-center h-11 rounded-lg px-3 gap-3 text-sm font-medium opacity-35 cursor-not-allowed select-none text-slate-400 dark:text-[#5e7492]"
            title={`Permission required: ${item.label}`}
          >
            <Icon size={19} strokeWidth={1.8} className="shrink-0" />
            <span className="truncate">{item.label}</span>
            <Lock className="w-3.5 h-3.5 ml-auto shrink-0" />
          </div>
        )
      }

      return (
        <Link
          key={item.label}
          href={item.href}
          onClick={handleNavClick}
          prefetch={true}
          className={cn(
            'relative w-full flex items-center h-11 rounded-lg px-3 gap-3 text-sm font-medium transition-all duration-150 group select-none',
            active
              ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-[#1f70ff] dark:text-white dark:shadow-lg dark:shadow-blue-600/25'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-white dark:hover:text-white dark:hover:bg-white/[0.06]'
          )}
        >
          {active && (
            <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-indigo-600 dark:hidden" />
          )}
          <Icon
            size={19}
            strokeWidth={1.8}
            className={cn(
              'shrink-0 transition-colors',
              active
                ? 'text-indigo-700 dark:text-white'
                : 'text-slate-600 group-hover:text-slate-900 dark:text-white/90 dark:group-hover:text-white'
            )}
          />
          <span className="truncate">{item.label}</span>

          {badgeText && (
            <span
              className={cn(
                'ml-auto shrink-0 min-w-6 rounded-full border px-2 py-0.5 text-center text-xs font-semibold tabular-nums',
                active
                  ? 'border-indigo-200 bg-white text-indigo-700 dark:border-white/20 dark:bg-white/15 dark:text-white'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-[#1b2940] dark:bg-[#131e30] dark:text-white/90'
              )}
            >
              {badgeText}
            </span>
          )}
        </Link>
      )
    }

    // Group with collapsible Dropdown (Fleet, Rentals)
    if (!allowed) {
      return (
        <div
          key={item.label}
          className="w-full flex items-center h-11 rounded-lg px-3 gap-3 text-sm font-medium opacity-35 cursor-not-allowed select-none text-slate-400 dark:text-[#5e7492]"
          title={`Permission required: ${item.label}`}
        >
          <Icon size={19} strokeWidth={1.8} className="shrink-0" />
          <span className="truncate">{item.label}</span>
          <Lock className="w-3.5 h-3.5 ml-auto shrink-0" />
        </div>
      )
    }

    return (
      <div key={item.label} className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggleGroup(item.label)}
          className={cn(
            'relative w-full flex items-center h-11 rounded-lg px-3 gap-3 text-sm font-medium transition-all duration-150 group select-none cursor-pointer text-left',
            active
              ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-[#1f70ff] dark:text-white dark:shadow-lg dark:shadow-blue-600/25'
              : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-white dark:hover:text-white dark:hover:bg-white/[0.06]'
          )}
        >
          {active && (
            <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-indigo-600 dark:hidden" />
          )}
          <Icon
            size={19}
            strokeWidth={1.8}
            className={cn(
              'shrink-0 transition-colors',
              active
                ? 'text-indigo-700 dark:text-white'
                : 'text-slate-600 group-hover:text-slate-900 dark:text-white/90 dark:group-hover:text-white'
            )}
          />
          <span className="truncate">{item.label}</span>

          {badgeText && (
            <span
              className={cn(
                'ml-auto shrink-0 min-w-6 rounded-full border px-2 py-0.5 text-center text-xs font-semibold tabular-nums',
                active
                  ? 'border-indigo-200 bg-white text-indigo-700 dark:border-white/20 dark:bg-white/15 dark:text-white'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-[#1b2940] dark:bg-[#131e30] dark:text-white/90'
              )}
            >
              {badgeText}
            </span>
          )}
        </button>

        {/* Collapsible Dropdown Submenu */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden pl-6 pr-1 space-y-0.5 ml-4 my-1 border-l border-slate-200 dark:border-white/10"
            >
              {item.children?.map((child) => {
                const isChildActive = isLinkActive(child.href)
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={handleNavClick}
                    prefetch={true}
                    className={cn(
                      'flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                      isChildActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-white/10 dark:text-white'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-white dark:hover:text-white dark:hover:bg-white/[0.06]'
                    )}
                  >
                    <span className="truncate">{child.label}</span>
                    {child.badgeColor && (
                      <span className={cn('w-2 h-2 rounded-full shrink-0', child.badgeColor)} />
                    )}
                  </Link>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex flex-col h-screen bg-[#F1F4FA] dark:bg-gradient-to-b dark:from-[#09152b] dark:via-[#060e1d] dark:to-[#040913] border-r border-slate-200 dark:border-[#122036] fixed left-0 top-0 z-30 overflow-hidden shadow-xs dark:shadow-xl select-none"
      >
        {/* 1. Brand Header */}
        <div
          className={cn(
            'flex items-center h-20 border-b border-slate-200 dark:border-[#122036] shrink-0 dark:bg-[#09152b]/80',
            collapsed ? 'justify-center px-3' : 'justify-between px-5'
          )}
        >
          <Link
            href="/admin/dashboard"
            onClick={handleNavClick}
            className={cn(
              'flex items-center gap-3 overflow-hidden group min-w-0',
              collapsed ? 'justify-center' : 'flex-1'
            )}
          >
            {/* Brand Logo */}
            <div className="size-10 rounded-full overflow-hidden shrink-0 shadow-sm ring-2 ring-indigo-200 dark:ring-primary/25 bg-slate-950 flex items-center justify-center transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="JSD — Jalore Self Drive Car Rental"
                width={40}
                height={40}
                className="w-full h-full object-cover rounded-full"
              />
            </div>

            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden min-w-0"
              >
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
                  JSD
                </span>
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-indigo-600 dark:text-[#1f70ff] block truncate">
                  JALORE SELF DRIVE • FLEET
                </span>
              </motion.div>
            )}
          </Link>

          {/* Mobile Close Button */}
          {!collapsed && (
            <button
              type="button"
              onClick={onToggle}
              className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {!collapsed && (
            <div className="px-3 mb-3">
              <span className="text-[11px] font-semibold tracking-[0.15em] text-slate-500 dark:text-white/75 uppercase select-none">
                WORKSPACE
              </span>
            </div>
          )}

          <div className="space-y-1">
            {workspaceNavItems
              .filter(item => !item.permission || can(item.permission))
              .map(renderNavItem)}
          </div>

          {/* Staff & Settings items */}
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-[#122036]">
            <div className="space-y-1">
              {utilityNavItems
                .filter(item => !item.permission || can(item.permission))
                .map(renderNavItem)}
            </div>
          </div>
        </nav>

        {/* 3. Footer */}
        <div className="border-t border-slate-200 dark:border-[#122036] p-3 space-y-1 shrink-0 dark:bg-[#060e1d]/90">
          {/* Log out */}
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Log out' : undefined}
            className={cn(
              'w-full flex items-center h-10 rounded-lg text-sm font-semibold text-slate-500 hover:bg-white hover:text-slate-900 dark:text-white dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition-all duration-150 cursor-pointer',
              collapsed ? 'justify-center px-0' : 'px-3 gap-3'
            )}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>

          {/* Collapse sidebar */}
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden md:flex w-full items-center h-10 rounded-lg text-sm font-semibold text-slate-500 hover:bg-white hover:text-slate-900 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/[0.05] transition-all duration-150 cursor-pointer',
              collapsed ? 'justify-center px-0' : 'px-3 gap-3'
            )}
          >
            {collapsed ? (
              <ChevronRight size={18} className="shrink-0" />
            ) : (
              <>
                <ChevronLeft size={18} className="shrink-0" />
                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
