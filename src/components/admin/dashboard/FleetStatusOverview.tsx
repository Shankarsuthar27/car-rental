'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Key,
  AlertOctagon,
  Wrench,
  ChevronRight,
  Gauge
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FleetStatusOverviewProps {
  statusCounts: {
    available: number
    rented: number
    inactive: number
    maintenance: number
    total: number
  }
}

export function FleetStatusOverview({ statusCounts }: FleetStatusOverviewProps) {
  const { available, rented, inactive, maintenance, total } = statusCounts

  const availablePct = total > 0 ? Math.round((available / total) * 100) : 0
  const runningPct = total > 0 ? Math.round((rented / total) * 100) : 0
  const unavailablePct = total > 0 ? Math.round((inactive / total) * 100) : 0
  const maintenancePct = total > 0 ? Math.round((maintenance / total) * 100) : 0

  const statuses = [
    {
      label: 'Available',
      count: available,
      percentage: availablePct,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40',
      barColor: 'bg-emerald-500',
      icon: CheckCircle2,
      emoji: '🟢',
      href: '/admin/vehicles?status=available',
      desc: 'Ready for instant customer assignment',
    },
    {
      label: 'Running',
      count: rented,
      percentage: runningPct,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40',
      barColor: 'bg-blue-500',
      icon: Key,
      emoji: '🔵',
      href: '/admin/vehicles?status=rented',
      desc: 'Currently assigned & on road with customer',
    },
    {
      label: 'Unavailable',
      count: inactive,
      percentage: unavailablePct,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40',
      barColor: 'bg-rose-500',
      icon: AlertOctagon,
      emoji: '🔴',
      href: '/admin/vehicles?status=inactive',
      desc: 'Deactivated, held or off-market',
    },
    {
      label: 'Maintenance',
      count: maintenance,
      percentage: maintenancePct,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40',
      barColor: 'bg-orange-500',
      icon: Wrench,
      emoji: '🟠',
      href: '/admin/maintenance',
      desc: 'Under mechanical service or repairs',
    },
  ]

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            <h2 className="font-extrabold text-base sm:text-lg tracking-tight text-foreground">
              Fleet Status Overview
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time fleet utilization breakdown ({total} Vehicles registered)
          </p>
        </div>

        <Link
          href="/admin/vehicles"
          className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
        >
          Manage All Vehicles <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Progress Bar Visualizer */}
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden flex shadow-inner">
          {availablePct > 0 && (
            <div
              style={{ width: `${availablePct}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`Available: ${available} (${availablePct}%)`}
            />
          )}
          {runningPct > 0 && (
            <div
              style={{ width: `${runningPct}%` }}
              className="bg-blue-500 transition-all duration-500"
              title={`Running: ${rented} (${runningPct}%)`}
            />
          )}
          {maintenancePct > 0 && (
            <div
              style={{ width: `${maintenancePct}%` }}
              className="bg-orange-500 transition-all duration-500"
              title={`Maintenance: ${maintenance} (${maintenancePct}%)`}
            />
          )}
          {unavailablePct > 0 && (
            <div
              style={{ width: `${unavailablePct}%` }}
              className="bg-rose-500 transition-all duration-500"
              title={`Unavailable: ${inactive} (${unavailablePct}%)`}
            />
          )}
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statuses.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href={s.href}
              className={cn(
                'group relative p-4 rounded-2xl border transition-all duration-200 block shadow-2xs hover:shadow-md cursor-pointer',
                s.bgColor
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <span>{s.emoji}</span> {s.label}
                </span>
                <span className="text-[11px] font-bold font-mono text-muted-foreground">
                  {s.percentage}%
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-foreground">
                {s.count}
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-1">
                {s.desc}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
