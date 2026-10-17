'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutGrid,
  CarFront,
  Calendar,
  Users,
  Zap,
  CreditCard,
  History,
  BarChart3,
  Bell,
  Settings,
  ChevronRight,
  ChevronLeft,
  LogOut,
  X,
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
  badgeColor?: string
}

interface NavItem {
  label: string
  href?: string
  icon: React.ElementType
  badge?: string
  children?: NavChild[]
}

const workspaceNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutGrid,
  },
  {
    label: 'Fleet',
    icon: CarFront,
    badge: '24',
    children: [
      { label: 'All Cars', href: '/admin/vehicles' },
      { label: 'Available Cars', href: '/admin/vehicles?status=available', badgeColor: 'bg-emerald-400' },
      { label: 'Running Cars', href: '/admin/vehicles?status=rented', badgeColor: 'bg-blue-400' },
      { label: 'Unavailable Cars', href: '/admin/vehicles?status=inactive', badgeColor: 'bg-rose-400' },
    ],
  },
  {
    label: 'Rentals',
    icon: Calendar,
    badge: '8',
    children: [
      { label: 'Active Rentals', href: '/admin/bookings?status=active', badgeColor: 'bg-blue-400' },
      { label: 'Completed', href: '/admin/bookings?status=completed', badgeColor: 'bg-zinc-400' },
      { label: 'Cancelled', href: '/admin/bookings?status=cancelled', badgeColor: 'bg-rose-400' },
    ],
  },
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: Users,
  },
  {
    label: 'Assign car',
    href: '/admin/assign',
    icon: Zap,
  },
  {
    label: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
  },
  {
    label: 'Rental history',
    href: '/admin/history',
    icon: History,
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
  },
]

const utilityNavItems: NavItem[] = [
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

  // Track expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      // If currently unset, check if it's active by route
      const currentlyExpanded = prev[groupName] ?? false
      return {
        ...prev,
        [groupName]: !currentlyExpanded,
      }
    })
  }

  const handleLogout = async () => {
    document.cookie = 'driveease_demo_role=; path=/; max-age=0; SameSite=Lax'
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onToggle()
    }
  }

  const isLinkActive = (href: string) => {
    const [path, query] = href.split('?')
    if (query) {
      const [key, val] = query.split('=')
      return pathname === path && searchParams.get(key) === val
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
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isGroupActive = (item: NavItem) => {
    if (item.href && isLinkActive(item.href)) return true
    if (item.children && item.children.some((c) => isLinkActive(c.href))) return true
    return false
  }

  const isGroupExpanded = (item: NavItem) => {
    if (expandedGroups[item.label] !== undefined) {
      return expandedGroups[item.label]
    }
    // Default open if one of its children is currently active
    return isGroupActive(item)
  }

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const active = isGroupActive(item)
    const expanded = hasChildren && isGroupExpanded(item)

    // Collapsed mode item (when sidebar is mini 68px width)
    if (collapsed) {
      const linkContent = (
        <button
          type="button"
          onClick={() => {
            if (hasChildren && item.children?.[0]) {
              router.push(item.children[0].href)
            } else if (item.href) {
              router.push(item.href)
            }
          }}
          className={cn(
            'w-10 h-10 mx-auto my-1 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer',
            active
              ? 'bg-[#1f70ff] text-white shadow-lg shadow-blue-500/25 font-semibold'
              : 'text-[#627794] hover:text-white hover:bg-white/[0.05]'
          )}
        >
          <Icon className="w-5 h-5 shrink-0" />
        </button>
      )

      return (
        <Tooltip key={item.label}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent
            side="right"
            className="p-2.5 bg-[#09152b] border border-[#1b2940] text-white shadow-xl min-w-[150px]"
          >
            <p className="font-bold text-xs pb-1 mb-1 border-b border-white/10 text-white flex items-center justify-between">
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#131e30] text-[#5e7799]">
                  {item.badge}
                </span>
              )}
            </p>
            {hasChildren && (
              <div className="space-y-1 pt-1">
                {item.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={handleNavClick}
                    prefetch={true}
                    className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
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

    // Single item without dropdown children (e.g. Dashboard, Customers, Assign car, etc.)
    if (!hasChildren && item.href) {
      return (
        <Link
          key={item.label}
          href={item.href}
          onClick={handleNavClick}
          prefetch={true}
          className={cn(
            'w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[13.5px] transition-all duration-150 group select-none',
            active
              ? 'bg-[#1f70ff] text-white font-medium shadow-lg shadow-blue-600/25'
              : 'text-[#7e91ab] hover:text-white hover:bg-white/[0.04]'
          )}
        >
          <Icon
            className={cn(
              'w-5 h-5 shrink-0 transition-colors',
              active ? 'text-white' : 'text-[#5e7492] group-hover:text-white'
            )}
          />
          <span className="truncate">{item.label}</span>

          {/* When active: show white right chevron like in image */}
          {active && (
            <ChevronRight className="w-4 h-4 ml-auto shrink-0 text-white stroke-[2.3]" />
          )}

          {/* Dark pill badge like in image (e.g. 24, 8) */}
          {!active && item.badge && (
            <span className="ml-auto shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#131e30] text-[#5e7799] border border-[#1b2940]">
              {item.badge}
            </span>
          )}
        </Link>
      )
    }

    // Group with collapsible Dropdown (Fleet, Rentals)
    return (
      <div key={item.label} className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggleGroup(item.label)}
          className={cn(
            'w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[13.5px] transition-all duration-150 group select-none cursor-pointer text-left',
            active
              ? 'bg-[#1f70ff] text-white font-medium shadow-lg shadow-blue-600/25'
              : 'text-[#7e91ab] hover:text-white hover:bg-white/[0.04]'
          )}
        >
          <Icon
            className={cn(
              'w-5 h-5 shrink-0 transition-colors',
              active ? 'text-white' : 'text-[#5e7492] group-hover:text-white'
            )}
          />
          <span className="truncate">{item.label}</span>

          {/* If active or expanded: show chevron right (rotates down when expanded) */}
          {active || expanded ? (
            <ChevronRight
              className={cn(
                'w-4 h-4 ml-auto shrink-0 transition-transform duration-200 stroke-[2.3]',
                active ? 'text-white' : 'text-[#5e7492] group-hover:text-white',
                expanded && 'transform rotate-90'
              )}
            />
          ) : (
            /* When inactive and collapsed: show dark pill badge like 24 or 8 */
            item.badge && (
              <span className="ml-auto shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#131e30] text-[#5e7799] border border-[#1b2940]">
                {item.badge}
              </span>
            )
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
              className="overflow-hidden pl-7 pr-1 space-y-1 ml-4 my-1 border-l border-white/10"
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
                      'flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] transition-all duration-150',
                      isChildActive
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-[#7e91ab] hover:text-white hover:bg-white/[0.04]'
                    )}
                  >
                    <span className="truncate">{child.label}</span>
                    {child.badgeColor && (
                      <span className={cn('w-2 h-2 rounded-full shrink-0 shadow-xs', child.badgeColor)} />
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
        animate={{ width: collapsed ? 68 : 256 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex flex-col h-screen bg-gradient-to-b from-[#09152b] via-[#060e1d] to-[#040913] border-r border-[#122036] fixed left-0 top-0 z-30 overflow-hidden shadow-xl select-none"
      >
        {/* Header Logo — Preserved as requested */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#122036] shrink-0 bg-[#09152b]/80 backdrop-blur-sm">
          <Link
            href="/admin/dashboard"
            onClick={handleNavClick}
            className="flex items-center gap-2.5 overflow-hidden flex-1 group min-w-0"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-md ring-2 ring-primary/25 bg-slate-950 flex items-center justify-center transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="JSD — Jalore Self Drive Car Rental"
                width={36}
                height={36}
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
                <span className="text-white font-black text-lg tracking-tight block leading-tight">
                  JSD
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-primary block truncate">
                  Jalore Self Drive • Fleet
                </span>
              </motion.div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onToggle}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3.5 space-y-1 scrollbar-thin">
          {/* WORKSPACE Section */}
          {!collapsed && (
            <div className="px-3 pt-3 pb-2">
              <span className="text-[10.5px] font-bold tracking-[0.15em] text-[#4c627b] uppercase select-none">
                WORKSPACE
              </span>
            </div>
          )}

          <div className="space-y-1">
            {workspaceNavItems.map(renderNavItem)}
          </div>

          {/* Settings & Notifications footer items */}
          <div className="pt-4 mt-3 border-t border-[#122036]">
            <div className="space-y-0.5">
              {utilityNavItems.map(renderNavItem)}
            </div>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-[#122036] p-2 space-y-1 shrink-0 bg-[#060e1d]/90">
          {/* Logout */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center p-2 rounded-xl text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Log out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Log out</span>
            </button>
          )}

          {/* Sidebar Collapse Button */}
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center py-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all duration-150"
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


