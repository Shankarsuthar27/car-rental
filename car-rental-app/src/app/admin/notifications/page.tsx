'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Car,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Zap,
  Check
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AdminNotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'overdue' | 'pickup' | 'payment' | 'maintenance'>('all')

  const [notifications, setNotifications] = useState([
    {
      id: 'n-1',
      title: '🔴 Critical: Overdue Rental Return',
      body: 'Hyundai Creta (RJ14-CR-2024) is overdue by 3 hours. Expected return was 8:00 AM today.',
      category: 'overdue',
      time: '15 minutes ago',
      unread: true,
      href: '/admin/bookings?status=active',
      actionLabel: 'Inspect & Return',
    },
    {
      id: 'n-2',
      title: 'Upcoming Scheduled Pickup Today',
      body: 'Customer Rahul Sharma scheduled to pick up Toyota Fortuner (GJ01-TF-2024) at 2:00 PM at Jaipur Main Branch.',
      category: 'pickup',
      time: '45 minutes ago',
      unread: true,
      href: '/admin/bookings?status=confirmed',
      actionLabel: 'View Booking',
    },
    {
      id: 'n-3',
      title: 'Advance Rental Payment Received',
      body: 'Payment of ₹5,000 recorded for Booking #RNT-2026-891024 via UPI Counter payment.',
      category: 'payment',
      time: '2 hours ago',
      unread: false,
      href: '/admin/payments',
      actionLabel: 'View Ledger',
    },
    {
      id: 'n-4',
      title: 'Fleet Maintenance Alert',
      body: 'Mahindra Scorpio N (RJ20-SN-2023) has reached 22,000 KM. Brake pad inspection and oil service due.',
      category: 'maintenance',
      time: '5 hours ago',
      unread: false,
      href: '/admin/maintenance',
      actionLabel: 'Schedule Service',
    },
    {
      id: 'n-5',
      title: 'Insurance Policy Expiry Reminder',
      body: 'Comprehensive insurance for Maruti Swift (RJ14-SW-2024) expires in 14 days.',
      category: 'maintenance',
      time: '1 day ago',
      unread: false,
      href: '/admin/vehicles',
      actionLabel: 'Check Vehicle',
    },
  ])

  const filtered = notifications.filter(n => filter === 'all' || n.category === filter)
  const unreadCount = notifications.filter(n => n.unread).length

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-md shadow-primary/20 text-white">
              <Bell className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Fleet Notifications & Alerts
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overdue return warnings, scheduled customer pickups, maintenance alarms, and payment updates.
              </p>
            </div>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs h-8.5 rounded-xl self-start sm:self-auto gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-card border border-border/80 rounded-2xl w-fit shadow-2xs">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'ghost'}
          onClick={() => setFilter('all')}
          className={cn('text-xs h-8 rounded-xl font-bold', filter === 'all' && 'shadow-xs')}
        >
          All ({notifications.length})
        </Button>
        <Button
          size="sm"
          variant={filter === 'overdue' ? 'default' : 'ghost'}
          onClick={() => setFilter('overdue')}
          className="text-xs h-8 rounded-xl font-semibold text-rose-600 dark:text-rose-400"
        >
          🔴 Overdue Returns
        </Button>
        <Button
          size="sm"
          variant={filter === 'pickup' ? 'default' : 'ghost'}
          onClick={() => setFilter('pickup')}
          className="text-xs h-8 rounded-xl font-semibold text-purple-600 dark:text-purple-400"
        >
          Upcoming Pickups
        </Button>
        <Button
          size="sm"
          variant={filter === 'maintenance' ? 'default' : 'ghost'}
          onClick={() => setFilter('maintenance')}
          className="text-xs h-8 rounded-xl font-semibold text-orange-600 dark:text-orange-400"
        >
          Maintenance
        </Button>
        <Button
          size="sm"
          variant={filter === 'payment' ? 'default' : 'ghost'}
          onClick={() => setFilter('payment')}
          className="text-xs h-8 rounded-xl font-semibold text-emerald-600 dark:text-emerald-400"
        >
          Payments
        </Button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.map(n => (
          <div
            key={n.id}
            className={cn(
              'p-5 bg-card border border-border/80 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4',
              n.unread && 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
            )}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs',
                  n.category === 'overdue' && 'bg-rose-500/10 text-rose-600 border border-rose-500/30',
                  n.category === 'pickup' && 'bg-purple-500/10 text-purple-600 border border-purple-500/30',
                  n.category === 'maintenance' && 'bg-amber-500/10 text-amber-600 border border-amber-500/30',
                  n.category === 'payment' && 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                )}
              >
                {n.category === 'overdue' && <AlertTriangle className="w-5 h-5" />}
                {n.category === 'pickup' && <Clock className="w-5 h-5" />}
                {n.category === 'maintenance' && <Car className="w-5 h-5" />}
                {n.category === 'payment' && <DollarSign className="w-5 h-5" />}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-foreground">{n.title}</h3>
                  {n.unread && (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{n.body}</p>
                <span className="text-[10px] text-muted-foreground/80 font-mono block pt-0.5">{n.time}</span>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <Link href={n.href}>
                <Button size="sm" variant="outline" className="text-xs h-8 rounded-xl font-bold gap-1.5">
                  {n.actionLabel} <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
