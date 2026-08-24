'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Car,
  Users,
  KeyRound,
  CalendarCheck,
  CreditCard,
  History,
  BarChart3,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Gauge,
  Sparkles,
  CheckCircle2,
  Clock,
  Wrench,
  AlertOctagon,
  XCircle,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavChild {
  label: string
  href: string
  icon?: React.ElementType
  badge?: string
  badgeColor?: string
}

interface NavGroup {
  label: string
  href?: string
  icon: React.ElementType
  isPrimary?: boolean
  children?: NavChild[]
}

const navStructure: NavGroup[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Fleet',
    icon: Car,
    children: [
      { label: 'All Cars', href: '/admin/vehicles' },
      { label: 'Available Cars', href: '/admin/vehicles?status=available', badgeColor: 'bg-emerald-500' },
      { label: 'Running Cars', href: '/admin/vehicles?status=rented', badgeColor: 'bg-blue-500' },
      { label: 'Unavailable Cars', href: '/admin/vehicles?status=inactive', badgeColor: 'bg-rose-500' },
      { label: 'Maintenance', href: '/admin/maintenance', badgeColor: 'bg-orange-500' },
    ],
  },
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: Users,
  },
  {
    label: 'Rentals',
    icon: CalendarCheck,
    children: [
      { label: 'Active Rentals', href: '/admin/bookings?status=active', badgeColor: 'bg-blue-500' },
      { label: 'Upcoming', href: '/admin/bookings?status=confirmed', badgeColor: 'bg-purple-500' },
      { label: 'Completed', href: '/admin/bookings?status=completed', badgeColor: 'bg-zinc-500' },
      { label: 'Cancelled', href: '/admin/bookings?status=cancelled', badgeColor: 'bg-rose-500' },
    ],
  },
  {
    label: 'Assign Car',
    href: '/admin/assign',
    icon: Zap,
    isPrimary: true,
  },
  {
    label: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
  },
  {
    label: 'Rental History',
    href: '/admin/history',
    icon: History,
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
  },
  {
    label: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
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

  // Track expanded submenu groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Fleet: true,
    Rentals: true,
  })

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }))
  }

  const handleLogout = async () => {
    // Clear cookie
    document.cookie = 'driveease_demo_role=; path=/; max-age=0; SameSite=Lax'
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isLinkActive = (href: string) => {
    const [path, query] = href.split('?')
    if (query) {
      const paramName = query.split('=')[0]
      const paramVal = query.split('=')[1]
      return pathname === path && searchParams.get(paramName) === paramVal
    }
    if (href === '/admin/dashboard') {
      return pathname === '/admin/dashboard'
    }
    if (href === '/admin/vehicles') {
      return pathname === '/admin/vehicles' && (!searchParams.get('status') || searchParams.get('status') === 'all')
    }
    if (href === '/admin/bookings') {
      return pathname === '/admin/bookings' && (!searchParams.get('status') || searchParams.get('status') === 'all')
    }
    return pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: collapsed ? 68 : 256 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex flex-col h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-30 overflow-hidden shadow-sm select-none"
      >
        {/* Header Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border shrink-0 bg-sidebar/50 backdrop-blur-sm">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 overflow-hidden w-full">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden min-w-0"
              >
                <span className="text-sidebar-foreground font-black text-lg tracking-tight block leading-tight">
                  DriveEase
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary block">
                  Fleet Manager
                </span>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1 scrollbar-thin">
          {navStructure.map((group) => {
            const Icon = group.icon
            const hasChildren = group.children && group.children.length > 0
            const isGroupExpanded = expandedGroups[group.label] ?? false

            // Check if any child is active
            const isChildActive = hasChildren && group.children?.some(c => isLinkActive(c.href))
            const isActive = group.href ? isLinkActive(group.href) : isChildActive

            // Render primary "Assign Car" special highlighted button
            if (group.isPrimary) {
              const linkContent = (
                <Link
                  key={group.label}
                  href={group.href!}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 my-1.5 shadow-sm',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-primary/30 ring-2 ring-primary/40'
                      : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0 animate-pulse" />
                  {!collapsed && (
                    <span className="flex-1 whitespace-nowrap tracking-wide">
                      {group.label}
                    </span>
                  )}
                  {!collapsed && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-primary-foreground/20 text-primary-foreground rounded uppercase font-extrabold">
                      ⚡ Quick
                    </span>
                  )}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={group.label}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="font-bold">
                      {group.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return linkContent
            }

            // Standalone Single Item (e.g. Dashboard, Customers, Payments, History, etc.)
            if (!hasChildren && group.href) {
              const linkContent = (
                <Link
                  key={group.label}
                  href={group.href}
                  className={cn(
                    'flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs transition-all duration-150 group',
                    'text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/80',
                    isActive && 'bg-sidebar-accent text-primary font-bold shadow-xs'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
                    )}
                  />
                  {!collapsed && (
                    <span className="whitespace-nowrap truncate font-medium">
                      {group.label}
                    </span>
                  )}
                </Link>
              )

              if (collapsed) {
                return (
                  <Tooltip key={group.label}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">
                      {group.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return linkContent
            }

            // Group with Collapsible Submenu (Fleet, Rentals)
            if (collapsed) {
              return (
                <Tooltip key={group.label}>
                  <TooltipTrigger asChild>
                    <Link
                      href={group.children![0].href}
                      className={cn(
                        'flex items-center justify-center p-2 rounded-xl text-xs transition-all duration-150',
                        isActive
                          ? 'bg-sidebar-accent text-primary font-bold'
                          : 'text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="space-y-1 p-2">
                    <p className="font-bold text-xs border-b border-border pb-1 mb-1">{group.label}</p>
                    {group.children?.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block text-xs py-0.5 hover:text-primary transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <div key={group.label} className="space-y-0.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 group text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/60',
                    isChildActive && 'text-primary'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isChildActive ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
                      )}
                    />
                    <span className="truncate">{group.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 text-sidebar-foreground/40 transition-transform duration-200',
                      isGroupExpanded && 'transform rotate-180'
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isGroupExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-7 pr-1 space-y-0.5 border-l border-sidebar-border/60 ml-4 my-0.5"
                    >
                      {group.children?.map(child => {
                        const isChildLinkActive = isLinkActive(child.href)
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-150',
                              isChildLinkActive
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40'
                            )}
                          >
                            <span className="truncate">{child.label}</span>
                            {child.badgeColor && (
                              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', child.badgeColor)} />
                            )}
                          </Link>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-sidebar-border p-2 space-y-1 shrink-0 bg-sidebar/40">
          {/* Logout */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center p-2 rounded-xl text-xs text-sidebar-foreground/70 hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-150"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Log out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold text-sidebar-foreground/70 hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-150"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Log out</span>
            </button>
          )}

          {/* Sidebar Collapse Button */}
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center py-1.5 rounded-xl text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-150"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
