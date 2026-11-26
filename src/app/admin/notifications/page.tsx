'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  CarFront,
  DollarSign,
  ArrowRight,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle,
  Phone,
  MapPin,
  CalendarDays,
  UserRound,
  MessageSquare,
  IndianRupee,
  X,
  XCircle,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface DbNotification {
  id: string
  user_id: string | null
  type: string
  title: string
  body: string
  data?: Record<string, unknown> | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

type NotificationCategory = 'overdue' | 'pickup' | 'payment' | 'maintenance' | 'general'

interface InquiryMetadata {
  customerName?: string
  phone?: string
  vehicleName?: string
  registrationNumber?: string
  plan?: string
  rate?: number
  pickupDate?: string
  returnDate?: string
  pickupLocation?: string
  notes?: string
  source?: string
  inquiryStatus?: 'accepted' | 'rejected'
}

interface UiNotification {
  id: string
  type: string
  category: NotificationCategory
  title: string
  body: string
  time: string
  createdAt: string
  unread: boolean
  href: string
  actionLabel: string
  meta: InquiryMetadata | null
}

const iconClass = 'h-3.5 w-3.5 shrink-0'

function getStatusDotClass(currentStatus: string): string {
  switch (currentStatus) {
    case 'Accepted':
      return 'bg-emerald-500'
    case 'Rejected':
      return 'bg-rose-500'
    case 'New Inquiry':
      return 'bg-blue-500'
    default:
      return 'bg-slate-400'
  }
}

function getDisplayStatus(n: UiNotification): string {
  if (n.meta?.inquiryStatus === 'accepted') return 'Accepted'
  if (n.meta?.inquiryStatus === 'rejected') return 'Rejected'
  return n.unread ? 'New Inquiry' : 'Reviewed'
}

function mapCategory(type: string): NotificationCategory {
  if (type === 'late_return') return 'overdue'
  if (
    type === 'booking_created' ||
    type === 'booking_confirmed' ||
    type === 'booking_cancelled' ||
    type === 'pickup_reminder' ||
    type === 'return_reminder'
  ) {
    return 'pickup'
  }
  if (
    type === 'payment_success' ||
    type === 'payment_failed' ||
    type === 'payment_due' ||
    type === 'deposit_refunded' ||
    type === 'damage_charged'
  ) {
    return 'payment'
  }
  if (type === 'maintenance_due' || type === 'insurance_expiry') {
    return 'maintenance'
  }
  return 'general'
}

function mapAction(type: string): { href: string; actionLabel: string } {
  if (type === 'booking_created') {
    return { href: '/admin/assign', actionLabel: 'Assign Car' }
  }
  if (
    type === 'booking_confirmed' ||
    type === 'booking_cancelled' ||
    type === 'pickup_reminder' ||
    type === 'return_reminder' ||
    type === 'late_return'
  ) {
    return { href: '/admin/bookings', actionLabel: 'View Bookings' }
  }
  if (
    type === 'payment_success' ||
    type === 'payment_failed' ||
    type === 'payment_due' ||
    type === 'deposit_refunded' ||
    type === 'damage_charged'
  ) {
    return { href: '/admin/payments', actionLabel: 'View Payments' }
  }
  if (type === 'maintenance_due' || type === 'insurance_expiry') {
    return { href: '/admin/maintenance', actionLabel: 'View Maintenance' }
  }
  if (type === 'kyc_approved' || type === 'kyc_rejected') {
    return { href: '/admin/customers', actionLabel: 'View Customers' }
  }
  return { href: '/admin', actionLabel: 'Open Dashboard' }
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return '—'
  const s = start ? new Date(start) : null
  const e = end ? new Date(end) : null
  const validS = s && !Number.isNaN(s.getTime()) ? s : null
  const validE = e && !Number.isNaN(e.getTime()) ? e : null

  if (validS && validE) {
    const sameYear = validS.getFullYear() === validE.getFullYear()
    const startFmt = validS.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      ...(sameYear ? {} : { year: 'numeric' }),
    })
    const endFmt = validE.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    return `${startFmt} → ${endFmt}`
  }

  return `${start || '—'} → ${end || '—'}`
}

function formatDisplayPhone(phone?: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }
  return phone
}

function getDurationLabel(start?: string, end?: string): string | null {
  if (!start || !end) return null
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null
  const diffDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)))
  return `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`
}

function formatTypeBadge(type: string, source?: string): string {
  if (type === 'booking_created') {
    return source === 'website_booking_form' ? 'Website Booking Inquiry' : 'Booking Request'
  }
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function extractMetadata(data?: Record<string, unknown> | null): InquiryMetadata | null {
  if (!data || typeof data !== 'object') return null
  const str = (key: string) =>
    typeof data[key] === 'string' && String(data[key]).trim() ? String(data[key]).trim() : undefined
  const num = (key: string) => {
    const val = Number(data[key])
    return Number.isFinite(val) && val > 0 ? val : undefined
  }

  const meta: InquiryMetadata = {
    customerName: str('customer_name'),
    phone: str('phone'),
    vehicleName: str('vehicle_name'),
    registrationNumber: str('registration_number'),
    plan: str('plan'),
    rate: num('rate'),
    pickupDate: str('pickup_date'),
    returnDate: str('return_date'),
    pickupLocation: str('pickup_location'),
    notes: str('notes'),
    source: str('source'),
    inquiryStatus:
      data.inquiry_status === 'accepted' || data.inquiry_status === 'rejected'
        ? data.inquiry_status
        : undefined,
  }

  if (!meta.customerName && !meta.phone && !meta.vehicleName && !meta.pickupLocation) {
    return null
  }
  return meta
}

function toUiNotification(row: DbNotification): UiNotification {
  const category = mapCategory(row.type)
  const { href, actionLabel } = mapAction(row.type)
  return {
    id: row.id,
    type: row.type,
    category,
    title: row.title,
    body: row.body,
    time: formatTimestamp(row.created_at),
    createdAt: row.created_at,
    unread: !row.is_read,
    href,
    actionLabel,
    meta: extractMetadata(row.data),
  }
}

export default function AdminNotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'pickup' | 'rejected'>('all')
  const [notifications, setNotifications] = useState<UiNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<{
    notification: UiNotification
    action: 'accept' | 'reject' | 'delete'
  } | null>(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to load inquiries')
      }
      const rows = Array.isArray(data) ? (data as DbNotification[]) : []
      setNotifications(rows.map(toUiNotification))
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load inquiries')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  const activeNotifications = notifications.filter((n) => n.meta?.inquiryStatus !== 'rejected')
  const rejectedCount = notifications.filter((n) => n.meta?.inquiryStatus === 'rejected').length
  const filtered =
    filter === 'rejected'
      ? notifications.filter((n) => n.meta?.inquiryStatus === 'rejected')
      : activeNotifications.filter((n) => filter === 'all' || n.category === filter)
  const unreadCount = activeNotifications.filter((n) => n.unread).length
  const bookingCount = activeNotifications.filter((n) => n.type === 'booking_created').length
  const acceptedCount = activeNotifications.filter((n) => n.meta?.inquiryStatus === 'accepted').length

  const markAllAsRead = async () => {
    setMarkingAll(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
      }
    } finally {
      setMarkingAll(false)
    }
  }

  const markOneAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {
      // Non-blocking optimistic update
    }
  }

  const handleInquiryAction = async (id: string, action: 'accept' | 'reject' | 'delete') => {
    setActionLoadingId(id)
    setErrorMsg(null)
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/admin/notifications?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to delete inquiry')
        }
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        setPendingConfirm(null)
        return
      }

      const res = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || `Failed to ${action} inquiry`)
      }
      const nextStatus = action === 'accept' ? 'accepted' : 'rejected'
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                unread: false,
                meta: n.meta ? { ...n.meta, inquiryStatus: nextStatus } : { inquiryStatus: nextStatus },
              }
            : n
        )
      )
      setPendingConfirm(null)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : `Failed to ${action} inquiry`)
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="w-full p-4 sm:p-6 md:p-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-md shadow-primary/20 text-white">
              <Bell className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Fleet Inquiries & Alerts
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customer booking inquiries, overdue return warnings, maintenance alarms, and payment updates.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchNotifications()}
            disabled={loading}
            className="text-xs h-8.5 rounded-xl gap-1.5"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} /> Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void markAllAsRead()}
              disabled={markingAll}
              className="text-xs h-8.5 rounded-xl gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-2xl text-destructive text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {/* Compact KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200/80 dark:border-border bg-white dark:bg-card p-3.5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Inquiries</p>
            <p className="text-xl font-black text-slate-900 dark:text-foreground mt-0.5 tabular-nums">{notifications.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
        </div>

        <div className="rounded-xl border border-blue-200/70 dark:border-blue-500/30 bg-gradient-to-br from-blue-50/60 to-white dark:from-blue-950/20 dark:to-card p-3.5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400">New / Unread</p>
            <p className="text-xl font-black text-blue-700 dark:text-blue-400 mt-0.5 tabular-nums">{unreadCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-100/80 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock3 className="w-4 h-4" />
          </div>
        </div>

        <div className="rounded-xl border border-purple-200/70 dark:border-purple-500/30 bg-gradient-to-br from-purple-50/60 to-white dark:from-purple-950/20 dark:to-card p-3.5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600/80 dark:text-purple-400">Booking Requests</p>
            <p className="text-xl font-black text-purple-700 dark:text-purple-400 mt-0.5 tabular-nums">{bookingCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-100/80 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <CarFront className="w-4 h-4" />
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-card p-3.5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400">Accepted</p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 tabular-nums">{acceptedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-card border border-border/80 rounded-2xl w-fit shadow-2xs">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'ghost'}
          onClick={() => setFilter('all')}
          className={cn('text-xs h-8 rounded-xl font-bold', filter === 'all' && 'shadow-xs')}
        >
          All ({activeNotifications.length})
        </Button>
        <Button
          size="sm"
          variant={filter === 'pickup' ? 'default' : 'ghost'}
          onClick={() => setFilter('pickup')}
          className="text-xs h-8 rounded-xl font-semibold text-purple-600 dark:text-purple-400"
        >
          Bookings & Pickups
        </Button>
        <Button
          size="sm"
          variant={filter === 'rejected' ? 'default' : 'ghost'}
          onClick={() => setFilter('rejected')}
          className="text-xs h-8 rounded-xl font-semibold text-rose-600 dark:text-rose-400"
        >
          Rejected ({rejectedCount})
        </Button>
      </div>

      {/* Inquiry List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center bg-card border border-border rounded-2xl shadow-xs">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Loading inquiries...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-2xl shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-foreground">No inquiries found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              All clear! No overdue returns, urgent alerts, or pending inquiries.
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const meta = n.meta
            const durationLabel = meta ? getDurationLabel(meta.pickupDate, meta.returnDate) : null
            const cleanPhone = meta?.phone ? meta.phone.replace(/\D/g, '') : ''
            const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
            const telHref = cleanPhone.length === 10 ? `tel:+91${cleanPhone}` : meta?.phone ? `tel:${meta.phone}` : ''
            const displayStatus = getDisplayStatus(n)

            return (
              <section
                key={n.id}
                onClick={() => {
                  if (n.unread) void markOneAsRead(n.id)
                }}
                className={cn(
                  'w-full overflow-hidden rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card shadow-2xs transition-shadow hover:shadow-sm cursor-pointer',
                  n.unread && 'border-blue-300 dark:border-blue-500/40'
                )}
              >
                {/* Card Header */}
                <header className="flex flex-col gap-2 border-b border-slate-100 dark:border-border/60 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-300">
                      {n.category === 'overdue' && <AlertTriangle aria-hidden="true" className="h-4 w-4 text-rose-600" strokeWidth={1.8} />}
                      {n.category === 'pickup' && <CarFront aria-hidden="true" className="h-4 w-4 text-blue-600" strokeWidth={1.8} />}
                      {n.category === 'maintenance' && <Clock3 aria-hidden="true" className="h-4 w-4 text-amber-600" strokeWidth={1.8} />}
                      {n.category === 'payment' && <DollarSign aria-hidden="true" className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />}
                      {n.category === 'general' && <Bell aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />}
                    </div>

                    <div className="min-w-0 flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-foreground">
                        {meta?.customerName &&
                        !n.title.toLowerCase().includes(meta.customerName.toLowerCase())
                          ? `${n.title} — ${meta.customerName}`
                          : n.title}
                      </h2>
                      {meta?.registrationNumber && (
                        <span className="rounded border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {meta.registrationNumber}
                        </span>
                      )}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          displayStatus === 'Accepted'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : displayStatus === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : displayStatus === 'New Inquiry'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-muted dark:text-slate-300'
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            displayStatus === 'New Inquiry' ? 'bg-white' : getStatusDotClass(displayStatus)
                          )}
                        />
                        {displayStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 pl-10 text-[11px] text-slate-500 dark:text-muted-foreground tabular-nums sm:pl-0">
                    <Clock3 aria-hidden="true" className="h-3 w-3 text-slate-400" />
                    <time dateTime={n.createdAt}>{n.time}</time>
                  </div>
                </header>

                {/* Card Body */}
                <div className="px-4 py-3">
                  {meta ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Customer
                        </span>
                        <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-900 dark:text-foreground">
                            {meta.customerName || 'Walk-in / Guest'}
                          </span>
                          {meta.phone && (
                            <a
                              href={telHref}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-medium text-blue-600 dark:text-blue-400 tabular-nums hover:underline"
                            >
                              {formatDisplayPhone(meta.phone)}
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Plan &amp; Rate
                        </span>
                        <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-900 dark:text-foreground">
                            {meta.vehicleName || 'Requested Vehicle'}
                            {meta.plan ? ` · ${meta.plan}` : ''}
                          </span>
                          {meta.rate && (
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                              ₹{meta.rate.toLocaleString('en-IN')}/day
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Trip Schedule
                        </span>
                        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-slate-900 dark:text-foreground tabular-nums">
                            {formatDateRange(meta.pickupDate, meta.returnDate)}
                          </span>
                          {durationLabel && (
                            <span className="text-[11px] font-medium text-slate-500 dark:text-muted-foreground">
                              ({durationLabel})
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                          Pickup Branch
                        </span>
                        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-slate-900 dark:text-foreground">
                            {meta.pickupLocation || 'Jalore Main Branch'}
                          </span>
                          {meta.notes && (
                            <span className="text-[11px] text-slate-500 dark:text-muted-foreground">
                              · {meta.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-muted-foreground leading-relaxed">{n.body}</p>
                  )}
                </div>

                {/* Card Footer */}
                <footer
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-col gap-2 border-t border-slate-100 dark:border-border/60 px-4 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                >
                  {/* Quick Contact Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {meta?.phone && (
                      <a
                        href={telHref}
                        className="inline-flex h-7.5 items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-muted/40 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] transition-colors hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-muted"
                      >
                        <Phone aria-hidden="true" className={iconClass} />
                        Call
                      </a>
                    )}
                    {waNumber && (
                      <a
                        href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                          `Hello ${meta?.customerName || ''}, thank you for your booking inquiry with JSD — Jalore Self Drive Car Rental${meta?.vehicleName ? ` for ${meta.vehicleName}` : ''}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-7.5 items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-muted/40 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
                      >
                        <MessageSquare aria-hidden="true" className={iconClass} />
                        WhatsApp
                      </a>
                    )}
                  </div>

                  {/* Workflow Decision Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {n.type === 'booking_created' && !meta?.inquiryStatus && (
                      <>
                        <button
                          type="button"
                          disabled={actionLoadingId === n.id}
                          onClick={() => setPendingConfirm({ notification: n, action: 'reject' })}
                          className="inline-flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 disabled:opacity-50"
                        >
                          <X aria-hidden="true" className={iconClass} />
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === n.id}
                          onClick={() => setPendingConfirm({ notification: n, action: 'accept' })}
                          className="inline-flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 disabled:opacity-50"
                        >
                          {actionLoadingId === n.id ? (
                            <Loader2 aria-hidden="true" className={`${iconClass} animate-spin`} />
                          ) : (
                            <Check aria-hidden="true" className={iconClass} />
                          )}
                          Accept
                        </button>
                      </>
                    )}
                    {(meta?.inquiryStatus === 'accepted' || meta?.inquiryStatus === 'rejected') && (
                      <button
                        type="button"
                        disabled={actionLoadingId === n.id}
                        onClick={() => setPendingConfirm({ notification: n, action: 'delete' })}
                        className="inline-flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 text-xs font-semibold text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400 disabled:opacity-50"
                      >
                        <Trash2 aria-hidden="true" className={iconClass} />
                        Delete
                      </button>
                    )}
                    {(n.type !== 'booking_created' || meta?.inquiryStatus === 'accepted') && (
                      <Link
                        href={n.href}
                        className="inline-flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        {n.actionLabel}
                        <ArrowRight aria-hidden="true" className={iconClass} />
                      </Link>
                    )}
                  </div>
                </footer>
              </section>
            )
          })
        )}
      </div>

      {/* Confirm Accept / Reject Dialog */}
      <Dialog
        open={Boolean(pendingConfirm)}
        onOpenChange={(open) => {
          if (!open && !actionLoadingId) setPendingConfirm(null)
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          {pendingConfirm && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                      pendingConfirm.action === 'accept'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                    )}
                  >
                    {pendingConfirm.action === 'accept' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold">
                      {pendingConfirm.action === 'accept'
                        ? 'Accept Booking Inquiry?'
                        : pendingConfirm.action === 'reject'
                        ? 'Reject Booking Inquiry?'
                        : 'Delete Booking Inquiry?'}
                    </DialogTitle>
                    <DialogDescription className="text-xs mt-0.5">
                      {pendingConfirm.action === 'accept'
                        ? 'This will mark the inquiry as Accepted so your team can proceed with car assignment.'
                        : pendingConfirm.action === 'reject'
                        ? 'This will mark the inquiry as Rejected and move it to the Rejected tab.'
                        : 'This will permanently delete this inquiry from the database.'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={Boolean(actionLoadingId)}
                  onClick={() => setPendingConfirm(null)}
                  className="text-xs h-9 rounded-xl font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={Boolean(actionLoadingId)}
                  onClick={() =>
                    void handleInquiryAction(
                      pendingConfirm.notification.id,
                      pendingConfirm.action
                    )
                  }
                  className={cn(
                    'text-xs h-9 rounded-xl font-bold text-white border-0 gap-1.5',
                    pendingConfirm.action === 'accept'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  )}
                >
                  {actionLoadingId === pendingConfirm.notification.id && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {pendingConfirm.action === 'accept'
                    ? 'Confirm Accept'
                    : pendingConfirm.action === 'reject'
                    ? 'Confirm Reject'
                    : 'Confirm Delete'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
