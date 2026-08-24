'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Car,
  CheckCircle2,
  Key,
  AlertOctagon,
  CalendarPlus,
  TrendingUp,
  RotateCcw,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DashboardStatsProps {
  stats: {
    totalCars: number
    availableCars: number
    runningCars: number
    unavailableCars: number
    carsAssignedToday: number
    activeRentals: number
    todayRevenue: number
    upcomingReturns: number
  }
}

export function DashboardKPIs({ stats }: DashboardStatsProps) {
  const cards = [
    {
      title: 'Total Cars',
      value: stats.totalCars,
      icon: Car,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      href: '/admin/vehicles',
      badge: 'Full Fleet',
      index: 0,
    },
    {
      title: 'Available Cars',
      value: stats.availableCars,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      href: '/admin/vehicles?status=available',
      badge: '🟢 Ready to Rent',
      index: 1,
    },
    {
      title: 'Running Cars',
      value: stats.runningCars,
      icon: Key,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      href: '/admin/vehicles?status=rented',
      badge: '🔵 On the Road',
      index: 2,
    },
    {
      title: 'Unavailable Cars',
      value: stats.unavailableCars,
      icon: AlertOctagon,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      href: '/admin/vehicles?status=inactive',
      badge: '🔴 Inactive / Hold',
      index: 3,
    },
    {
      title: 'Cars Assigned Today',
      value: stats.carsAssignedToday,
      icon: CalendarPlus,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      href: '/admin/bookings?status=active',
      badge: 'Today',
      index: 4,
    },
    {
      title: 'Active Rentals',
      value: stats.activeRentals,
      icon: Zap,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/20',
      href: '/admin/bookings?status=active',
      badge: 'Active Tripping',
      index: 5,
    },
    {
      title: "Today's Revenue",
      value: `₹${(stats.todayRevenue || 0).toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      href: '/admin/payments',
      badge: 'Gross Income',
      index: 6,
    },
    {
      title: 'Upcoming Returns',
      value: stats.upcomingReturns,
      icon: RotateCcw,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      href: '/admin/bookings?status=active',
      badge: 'Due Soon',
      index: 7,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: card.index * 0.04 }}
          >
            <Link
              href={card.href}
              className={cn(
                'group relative block bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block truncate">
                    {card.title}
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    {typeof card.value === 'number'
                      ? card.value.toLocaleString('en-IN')
                      : card.value}
                  </div>
                  <span className="inline-block text-[10px] font-semibold text-muted-foreground/80">
                    {card.badge}
                  </span>
                </div>

                <div className={cn('p-2.5 rounded-xl border shrink-0 group-hover:scale-110 transition-transform duration-200', card.bgColor)}>
                  <Icon className={cn('w-5 h-5', card.color)} />
                </div>
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
