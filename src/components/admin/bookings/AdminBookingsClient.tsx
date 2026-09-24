'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  Car,
  User,
  Search,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Eye,
  FileText,
  CreditCard,
  AlertTriangle,
  Zap,
  Key,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  Gauge,
  Plus,
  Edit,
  DollarSign,
  Fuel,
  Printer,
  X,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { format, differenceInMinutes, differenceInHours, isPast, addDays } from 'date-fns'
import type { Booking, Branch, Vehicle } from '@/types'
import { formatCustomer } from '@/lib/customers'
import { cn } from '@/lib/utils'

// ==========================================
// STRICT TYPESCRIPT DEFINITIONS
// ==========================================

export interface CustomerProfileData {
  id?: string
  full_name?: string
  email?: string
  phone?: string
}

export interface CustomerFormattedData {
  id?: string
  customer_code?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  profile?: CustomerProfileData
}

export interface AdminBookingsClientProps {
  initialBookings: Booking[]
  branches: Branch[]
}

interface OverdueStatus {
  isOverdue: boolean
  label: string
  badgeClass: string
}

interface ReturnPayload {
  booking_id: string
  return_datetime: string
  ending_odometer: number
  fuel_level: string
  damage_description: string
  damage_cost: number
  late_charges: number
  extra_km_charges: number
  cleaning_charges: number
  overspeeding_charges: number
  max_speed_recorded: string
  other_charges: number
  discount_amount: number
  tax_rate: number
  deposit_settlement: string
  payment_method: string
  payment_collected_now: number
  admin_notes: string
}

function getSafeCustomerName(customer: unknown): string {
  if (!customer || typeof customer !== 'object') return 'Valued Customer'
  const c = customer as CustomerFormattedData
  return (
    c.profile?.full_name ||
    c.emergency_contact_name ||
    c.customer_code ||
    'Valued Customer'
  )
}

function getSafeCustomerPhone(customer: unknown): string {
  if (!customer || typeof customer !== 'object') return ''
  const c = customer as CustomerFormattedData
  return c.profile?.phone || c.emergency_contact_phone || ''
}

function getVehicleThumbnail(vehicle?: Vehicle | null): string {
  if (!vehicle) return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'
  const imgs = vehicle.images as Array<{ url?: string; is_primary?: boolean }> | undefined
  if (Array.isArray(imgs) && imgs.length > 0) {
    const primary = imgs.find(img => img.is_primary)?.url
    if (primary) return primary
    if (imgs[0]?.url) return imgs[0].url
  }
  return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'
}

export function AdminBookingsClient({
  initialBookings,
  branches,
}: AdminBookingsClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const formattedInitial = useMemo(() => {
    return initialBookings.map(b => ({
      ...b,
      customer: b.customer ? formatCustomer(b.customer) : b.customer,
    }))
  }, [initialBookings])

  const [bookings, setBookings] = useState<Booking[]>(formattedInitial)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('status') || 'active')

  // Sync activeTab when sidebar navigation changes query params (?status=active, ?status=completed, etc.)
  useEffect(() => {
    const statusParam = searchParams.get('status')
    setActiveTab(statusParam || 'active')
  }, [searchParams])

  // Sync bookings data when server component refreshes
  useEffect(() => {
    setBookings(formattedInitial)
  }, [formattedInitial])

  // Feedback Notification State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 5000)
  }

  // Action Dialog States
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [returnModalOpen, setReturnModalOpen] = useState<boolean>(false)
  const [extendModalOpen, setExtendModalOpen] = useState<boolean>(false)
  const [viewDetailsOpen, setViewDetailsOpen] = useState<boolean>(false)
  const [processing, setProcessing] = useState<boolean>(false)

  // ==========================================
  // RETURN CAR WORKFLOW FORM STATE
  // ==========================================
  const [returnDatetime, setReturnDatetime] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [returnEndingKm, setReturnEndingKm] = useState<string>('0')
  const [returnFuelLevel, setReturnFuelLevel] = useState<string>('full')
  const [damageDescription, setDamageDescription] = useState<string>('')
  const [damageCost, setDamageCost] = useState<string>('0')
  const [lateCharges, setLateCharges] = useState<string>('0')
  const [extraKmCharges, setExtraKmCharges] = useState<string>('0')
  const [cleaningCharges, setCleaningCharges] = useState<string>('0')
  const [overspeedingCharges, setOverspeedingCharges] = useState<string>('0')
  const [maxSpeedRecorded, setMaxSpeedRecorded] = useState<string>('')
  const [otherCharges, setOtherCharges] = useState<string>('0')
  const [returnDiscount, setReturnDiscount] = useState<string>('0')
  const [depositSettlement, setDepositSettlement] = useState<string>('held')
  const [returnPaymentCollected, setReturnPaymentCollected] = useState<string>('0')
  const [returnPaymentMethod, setReturnPaymentMethod] = useState<string>('cash')
  const [returnAdminNotes, setReturnAdminNotes] = useState<string>('Vehicle inspected and returned in good condition.')

  // Helper to calculate 24h late fee for overdue booking
  // Rule:
  // - If overdue <= 24 hours: 1 day counted (1 × 24h rate)
  // - If overdue > 24 hours: next day is automatically counted (ceil(hoursLate / 24) × 24h rate)
  const calculateOverdueLateFee = (b: Booking | null, actualReturnIsoOrLocal: string) => {
    if (!b?.return_datetime || !actualReturnIsoOrLocal) {
      return { hours: 0, days: 0, fee: 0, rate24h: 0, isOverdue: false }
    }
    const scheduledTime = new Date(b.return_datetime)
    const actualTime = new Date(actualReturnIsoOrLocal)
    const diffMs = actualTime.getTime() - scheduledTime.getTime()

    if (diffMs <= 0) {
      return { hours: 0, days: 0, fee: 0, rate24h: 0, isOverdue: false }
    }

    const lateMinutes = diffMs / (1000 * 60)
    const hoursLate = Math.ceil(lateMinutes / 60)
    if (hoursLate <= 0) {
      return { hours: 0, days: 0, fee: 0, rate24h: 0, isOverdue: false }
    }

    // 24-hour late charge rule:
    // If overdue <= 24 hours -> 1 day counted
    // If overdue > 24 hours -> next day automatically counted (ceil(hoursLate / 24))
    const lateDays = Math.max(1, Math.ceil(hoursLate / 24))
    const rate24h = Number(
      (b.vehicle as any)?.late_charge_24h ??
      (b.vehicle?.meta as any)?.late_charge_24h ??
      b.vehicle?.daily_rate ??
      1000
    )
    const fee = lateDays * rate24h

    return {
      hours: hoursLate,
      days: lateDays,
      fee,
      rate24h,
      isOverdue: true,
    }
  }

  // Helper to compute 24-hour rate kilometer limits & extra charges
  // Rule: 24-hour rate includes up to 300 km limit.
  // As soon as driven distance exceeds limit (300 km × rental days), extra km are billed at vehicle extra_km_charge (₹/km).
  const calculateKmDetails = (
    b: Booking | null,
    returnDtStr: string,
    currentEndingKm: string
  ) => {
    if (!b) {
      return { driven: 0, rentalDays: 1, limitPer24h: 300, totalIncludedKm: 300, extraKm: 0, ratePerKm: 0, extraKmCharge: 0, isExceeded: false }
    }
    const startKm = Number(b.pickup_odometer || b.vehicle?.current_odometer || 0)
    const endKm = Number(currentEndingKm) || startKm
    const driven = Math.max(0, endKm - startKm)

    const pickupDate = new Date(b.pickup_datetime || b.actual_pickup_datetime || new Date())
    const returnDate = new Date(returnDtStr || new Date())
    const diffHours = Math.max(1, (returnDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60))
    const rentalDays = Math.max(1, Math.ceil(diffHours / 24))

    const limitPer24h = Number(b.vehicle?.included_km_per_day || 300)
    const totalIncludedKm = Number(b.included_km || (rentalDays * limitPer24h))
    const extraKm = Math.max(0, driven - totalIncludedKm)
    const ratePerKm = Number(b.vehicle?.extra_km_charge || 0)
    const extraKmCharge = Math.round(extraKm * ratePerKm)

    return {
      driven,
      rentalDays,
      limitPer24h,
      totalIncludedKm,
      extraKm,
      ratePerKm,
      extraKmCharge,
      isExceeded: extraKm > 0
    }
  }

  // Open Return Dialog & Prefill
  const openReturnDialog = (b: Booking) => {
    setSelectedBooking(b)
    const now = new Date()
    const returnDtStr = format(now, "yyyy-MM-dd'T'HH:mm")
    setReturnDatetime(returnDtStr)

    const startOdo = Number(b.pickup_odometer || b.vehicle?.current_odometer || 0)
    const initialEnding = String(startOdo + 120)
    setReturnEndingKm(initialEnding)

    // Auto-calculate 24h late fee if overdue
    const lateCalc = calculateOverdueLateFee(b, returnDtStr)
    setLateCharges(String(lateCalc.fee))

    // Auto-calculate extra KM charge based on 300 km/24h limit
    const kmCalc = calculateKmDetails(b, returnDtStr, initialEnding)
    setExtraKmCharges(String(kmCalc.extraKmCharge))
    setDamageCost('0')
    setCleaningCharges('0')
    setOverspeedingCharges('0')
    setMaxSpeedRecorded('')
    setOtherCharges('0')
    setReturnDiscount('0')
    setDamageDescription('')
    setDepositSettlement('held')
    setReturnModalOpen(true)
  }

  // Check if return_booking query param is present on mount
  useEffect(() => {
    const returnBookingId = searchParams.get('return_booking')
    if (returnBookingId) {
      const found = bookings.find(b => b.id === returnBookingId)
      if (found) {
        openReturnDialog(found)
      }
    }
  }, [searchParams, bookings])

  // Live calculation of Return Bill
  const baseRentalAmount = selectedBooking ? Number(selectedBooking.base_rental || 0) : 0
  const numLate = Number(lateCharges) || 0
  const numExtraKm = Number(extraKmCharges) || 0
  const numDamage = Number(damageCost) || 0
  const numCleaning = Number(cleaningCharges) || 0
  const numOverspeed = Number(overspeedingCharges) || 0
  const numOther = Number(otherCharges) || 0
  const numDiscount = Number(returnDiscount) || 0

  const subtotalBeforeTax = Math.max(
    0,
    baseRentalAmount + numLate + numExtraKm + numDamage + numCleaning + numOverspeed + numOther - numDiscount
  )
  const taxRate = selectedBooking?.tax_rate || 18
  const returnTaxAmount = Math.round(subtotalBeforeTax * (taxRate / 100) * 100) / 100
  const returnFinalAmount = Math.round((subtotalBeforeTax + returnTaxAmount) * 100) / 100

  const alreadyPaid = selectedBooking ? Number(selectedBooking.amount_paid || 0) : 0
  const remainingSettlementDue = Math.max(0, returnFinalAmount - alreadyPaid)

  // Dynamic calculation of overdue info
  const activeOverdueInfo = useMemo(() => {
    return calculateOverdueLateFee(selectedBooking, returnDatetime)
  }, [selectedBooking, returnDatetime])

  // Dynamic calculation of 24h rate KM limit & extra km
  const activeKmInfo = useMemo(() => {
    return calculateKmDetails(selectedBooking, returnDatetime, returnEndingKm)
  }, [selectedBooking, returnDatetime, returnEndingKm])

  // Recalculate late fee and extra KM when return datetime changes
  const handleReturnDatetimeChange = (newDatetime: string) => {
    setReturnDatetime(newDatetime)
    if (selectedBooking) {
      const lateCalc = calculateOverdueLateFee(selectedBooking, newDatetime)
      setLateCharges(String(lateCalc.fee))

      const kmCalc = calculateKmDetails(selectedBooking, newDatetime, returnEndingKm)
      setExtraKmCharges(String(kmCalc.extraKmCharge))
    }
  }

  // Recalculate extra KM when ending KM changes based on 300 km/24h limit
  const handleEndingKmChange = (newEndKm: string) => {
    setReturnEndingKm(newEndKm)
    if (!selectedBooking) return
    const kmCalc = calculateKmDetails(selectedBooking, returnDatetime, newEndKm)
    setExtraKmCharges(String(kmCalc.extraKmCharge))
  }

  // Submit Return Process
  const handleCompleteReturn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBooking) return
    setProcessing(true)

    try {
      const payload: ReturnPayload = {
        booking_id: selectedBooking.id,
        return_datetime: returnDatetime,
        ending_odometer: Number(returnEndingKm),
        fuel_level: returnFuelLevel,
        damage_description: damageDescription,
        damage_cost: numDamage,
        late_charges: numLate,
        extra_km_charges: numExtraKm,
        cleaning_charges: numCleaning,
        overspeeding_charges: numOverspeed,
        max_speed_recorded: maxSpeedRecorded,
        other_charges: numOther,
        discount_amount: numDiscount,
        tax_rate: taxRate,
        deposit_settlement: depositSettlement,
        payment_method: returnPaymentMethod,
        payment_collected_now: Number(returnPaymentCollected) || remainingSettlementDue,
        admin_notes: returnAdminNotes,
      }

      const res = await fetch('/api/admin/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to complete vehicle return.')
      }

      setBookings(prev =>
        prev.map(b =>
          b.id === selectedBooking.id
            ? {
                ...b,
                status: 'completed',
                payment_status: 'paid',
                return_odometer: Number(returnEndingKm),
                grand_total: returnFinalAmount,
              }
            : b
        )
      )

      setReturnModalOpen(false)
      showFeedback(
        'success',
        `Return completed successfully! Final bill: ₹${returnFinalAmount.toLocaleString('en-IN')}. Vehicle is released.`
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete return.'
      showFeedback('error', message)
    } finally {
      setProcessing(false)
    }
  }

  // ==========================================
  // EXTEND RENTAL WORKFLOW STATE
  // ==========================================
  const [newExtendReturnDatetime, setNewExtendReturnDatetime] = useState<string>('')
  const [extendExtraAmount, setExtendExtraAmount] = useState<string>('0')

  const openExtendDialog = (b: Booking) => {
    setSelectedBooking(b)
    const currentReturn = new Date(b.return_datetime)
    setNewExtendReturnDatetime(format(addDays(currentReturn, 1), "yyyy-MM-dd'T'HH:mm"))
    setExtendExtraAmount(String(b.vehicle?.daily_rate || 2000))
    setExtendModalOpen(true)
  }

  const handleConfirmExtend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedBooking) return
    setProcessing(true)

    try {
      const addedAmount = Number(extendExtraAmount) || 0
      const newGrandTotal = Number(selectedBooking.grand_total || 0) + addedAmount

      const res = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBooking.id,
          return_datetime: newExtendReturnDatetime,
          base_rental: Number(selectedBooking.base_rental || 0) + addedAmount,
          admin_notes: `${selectedBooking.admin_notes || ''}\nRental extended to ${newExtendReturnDatetime} (+₹${addedAmount})`,
        }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to extend rental.')
      }

      setBookings(prev =>
        prev.map(b =>
          b.id === selectedBooking.id
            ? {
                ...b,
                return_datetime: newExtendReturnDatetime,
                grand_total: newGrandTotal,
              }
            : b
        )
      )

      setExtendModalOpen(false)
      showFeedback('success', `Rental ${selectedBooking.booking_number} extended successfully!`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to extend rental.'
      showFeedback('error', message)
    } finally {
      setProcessing(false)
    }
  }

  // Overdue status calculation helper
  const getOverdueStatus = (returnDatetimeStr: string): OverdueStatus => {
    const returnTime = new Date(returnDatetimeStr)
    const now = new Date()

    if (isPast(returnTime)) {
      const diffMins = differenceInMinutes(now, returnTime)
      const diffHours = differenceInHours(now, returnTime)

      if (diffHours >= 1) {
        return {
          isOverdue: true,
          label: `🔴 Overdue ${diffHours}h ${diffMins % 60}m`,
          badgeClass: 'bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400 font-black animate-pulse',
        }
      }
      return {
        isOverdue: true,
        label: `🔴 Overdue ${diffMins}m`,
        badgeClass: 'bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400 font-black animate-pulse',
      }
    }

    const diffHours = differenceInHours(returnTime, now)
    const diffMins = differenceInMinutes(returnTime, now)

    if (diffHours <= 3) {
      return {
        isOverdue: false,
        label: `⏳ Due in ${diffHours}h ${diffMins % 60}m`,
        badgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/30 font-semibold',
      }
    }

    return {
      isOverdue: false,
      label: `On Time (Due in ${diffHours}h)`,
      badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    }
  }

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const customerName = getSafeCustomerName(b.customer)
      const customerPhone = getSafeCustomerPhone(b.customer)
      const carName = `${b.vehicle?.brand || ''} ${b.vehicle?.model || ''}`
      const regNo = b.vehicle?.registration_number || ''
      const bookingNo = b.booking_number || ''
      const q = searchQuery.toLowerCase()

      const matchesSearch =
        bookingNo.toLowerCase().includes(q) ||
        customerName.toLowerCase().includes(q) ||
        customerPhone.includes(searchQuery) ||
        carName.toLowerCase().includes(q) ||
        regNo.toLowerCase().includes(q)

      const matchesStatus =
        activeTab === 'all'
          ? true
          : activeTab === 'active'
          ? b.status === 'active'
          : activeTab === 'confirmed'
          ? b.status === 'confirmed' || b.status === 'ready_for_pickup'
          : activeTab === 'completed'
          ? b.status === 'completed'
          : activeTab === 'cancelled'
          ? b.status === 'cancelled' || b.status === 'rejected'
          : true

      return matchesSearch && matchesStatus
    })
  }, [bookings, searchQuery, activeTab])

  // Active counts
  const activeCount = bookings.filter(b => b.status === 'active').length
  const completedCount = bookings.filter(b => b.status === 'completed').length
  const cancelledCount = bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length

  return (
    <div className="w-full space-y-4 sm:space-y-5 p-3.5 sm:p-5 md:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground">
            Rental Operations &amp; Fleet
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Dashboard for active rentals, fleet status, and billing.
          </p>
        </div>

        <Link
          href="/admin/assign"
          prefetch={true}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-border bg-card hover:bg-muted transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Assign New Car
        </Link>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-xs border',
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          )}
          role="alert"
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </motion.div>
      )}

      {/* Search + Status Tab Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 bg-card border border-border/80 rounded-2xl shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <Input
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Search rental #, customer, car model, reg no..."
            className="pl-9 h-10 text-xs rounded-xl bg-muted/40 w-full focus-visible:ring-primary"
            aria-label="Search rental assignments"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Status Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
              activeTab === 'active'
                ? 'bg-foreground text-background border-foreground shadow-xs'
                : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            aria-pressed={activeTab === 'active'}
          >
            {activeTab === 'active' && <span className="w-2 h-2 rounded-full bg-current opacity-70" />}
            Running ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={cn(
              'inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
              activeTab === 'completed'
                ? 'bg-foreground text-background border-foreground shadow-xs'
                : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            aria-pressed={activeTab === 'completed'}
          >
            Completed ({completedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cancelled')}
            className={cn(
              'inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
              activeTab === 'cancelled'
                ? 'bg-foreground text-background border-foreground shadow-xs'
                : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            aria-pressed={activeTab === 'cancelled'}
          >
            Cancelled ({cancelledCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
              activeTab === 'all'
                ? 'bg-foreground text-background border-foreground shadow-xs'
                : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            aria-pressed={activeTab === 'all'}
          >
            All ({bookings.length})
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. MOBILE & TABLET RESPONSIVE CARD VIEW (< lg: 320px - 1023px) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 lg:hidden">
        {filteredBookings.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-card border border-border/80 rounded-3xl space-y-3">
            <Car className="w-8 h-8 text-muted-foreground/40 mx-auto" aria-hidden="true" />
            <p className="text-sm font-bold text-foreground">No rental operations found in this category.</p>
            <Link href="/admin/assign">
              <Button size="sm" className="gradient-brand text-white border-0 min-h-[44px] px-4 font-bold text-xs rounded-xl mt-2">
                <Zap className="w-4 h-4 mr-1.5 fill-current" aria-hidden="true" /> Assign Car Now
              </Button>
            </Link>
          </div>
        ) : (
          filteredBookings.map((b) => {
            const car = b.vehicle
            const customerName = getSafeCustomerName(b.customer)
            const customerPhone = getSafeCustomerPhone(b.customer)
            const overdue = getOverdueStatus(b.return_datetime)
            const thumbnail = getVehicleThumbnail(car)

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-card border border-border/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 flex flex-col justify-between"
              >
                {/* Card Top: Car info, status, reg number */}
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnail}
                    alt={car ? `${car.brand} ${car.model}` : 'Vehicle'}
                    className="w-16 h-14 rounded-2xl object-cover border border-border/80 shrink-0 bg-muted"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <span className="font-black text-sm sm:text-base text-foreground block truncate">
                          {car ? `${car.brand} ${car.model}` : 'Fleet Car'}
                        </span>
                        <span className="font-mono text-[11px] text-primary font-bold block">
                          #{b.booking_number}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg shrink-0 border',
                          b.status === 'active' && 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                          b.status === 'completed' && 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30',
                          b.status === 'confirmed' && 'bg-purple-500/10 text-purple-600 border-purple-500/30',
                          b.status === 'cancelled' && 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                        )}
                      >
                        {b.status === 'active' ? 'Running' : b.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded text-foreground font-bold border border-border/60">
                        {car?.registration_number || 'RJ-SELFDRIVE'}
                      </span>
                      {b.status === 'active' && (
                        <Badge className={cn('text-[9px] border py-0 px-1.5', overdue.badgeClass)}>
                          {overdue.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="p-3 bg-muted/30 border border-border/60 rounded-2xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-xl gradient-brand text-white flex items-center justify-center font-black text-xs shrink-0">
                      {customerName[0] || 'C'}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-foreground block truncate">{customerName}</span>
                      <span className="text-[10px] text-muted-foreground block">Renter</span>
                    </div>
                  </div>

                  {customerPhone && (
                    <a
                      href={`tel:${customerPhone}`}
                      className="min-h-[44px] px-2.5 text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
                      aria-label={`Call ${customerName} at ${customerPhone}`}
                    >
                      <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{customerPhone}</span>
                    </a>
                  )}
                </div>

                {/* Rental Timeline & Odometer */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-0.5 p-2.5 bg-background rounded-xl border border-border/60">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Pickup</span>
                    <span className="font-medium text-foreground text-[11px] block">
                      {format(new Date(b.pickup_datetime), 'dd MMM, hh:mm a')}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground block">
                      Start: {b.pickup_odometer || car?.current_odometer || 0} KM
                    </span>
                  </div>

                  <div className="space-y-0.5 p-2.5 bg-background rounded-xl border border-border/60">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Return Due</span>
                    <span className="font-medium text-foreground text-[11px] block">
                      {format(new Date(b.return_datetime), 'dd MMM, hh:mm a')}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground block">
                      {b.return_odometer ? `End: ${b.return_odometer} KM` : 'Running on road'}
                    </span>
                  </div>
                </div>

                {/* Amount & Settlement Status */}
                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Bill</span>
                    <span className="font-mono font-black text-sm sm:text-base text-foreground">
                      ₹{Number(b.grand_total || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] uppercase font-bold px-2 py-0.5',
                      b.payment_status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    )}
                  >
                    {b.payment_status}
                  </Badge>
                </div>

                {/* Accessible Action Buttons (Min 44px Height) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {b.status === 'active' ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => openReturnDialog(b)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] text-xs font-bold rounded-xl shadow-xs gap-1.5"
                        aria-label={`Mark car ${car?.model || ''} returned`}
                      >
                        <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        <span>Return Car</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openExtendDialog(b)}
                        className="min-h-[44px] text-xs font-semibold rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
                        aria-label={`Extend rental duration for booking ${b.booking_number}`}
                      >
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span>Extend</span>
                      </Button>
                    </>
                  ) : (
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(b)
                          setViewDetailsOpen(true)
                        }}
                        className="w-full min-h-[44px] text-xs font-bold rounded-xl border-border hover:bg-muted gap-1.5"
                        aria-label={`View full record for booking ${b.booking_number}`}
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                        <span>View Full Rental Record</span>
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. DESKTOP TABULAR VIEW (>= lg: 1024px+)                       */}
      {/* ============================================================ */}
      <div className="hidden lg:block bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/40 border-b border-border/60">
              <tr>
                <th className="px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Car &amp; Reg No</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Customer<br/>Details</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rental Duration</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Odometer</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    <p className="font-semibold text-sm">No rental operations found in this view.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const car = b.vehicle
                  const customerName = getSafeCustomerName(b.customer)
                  const customerPhone = getSafeCustomerPhone(b.customer)
                  const overdue = getOverdueStatus(b.return_datetime)
                  const thumbnail = getVehicleThumbnail(car)

                  return (
                    <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                      {/* Car & Reg No */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbnail}
                            alt={`${car?.brand} ${car?.model}`}
                            className="w-12 h-9 rounded-lg object-cover border border-border shrink-0"
                          />
                          <div>
                            <span className="font-bold text-sm text-foreground block leading-tight">
                              {car ? `${car.brand} ${car.model}` : 'Vehicle'}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground block mt-0.5">
                              {car?.registration_number || '—'}
                            </span>
                            <span className="font-mono text-[10px] text-primary block">
                              ID: {b.booking_number}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                            {customerName[0] || 'C'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground block truncate max-w-[140px] text-[11px]">{customerName}</span>
                            <a
                              href={`tel:${customerPhone}`}
                              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                              {customerPhone || '—'}
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Rental Duration */}
                      <td className="px-4 py-3.5 text-[11px] text-muted-foreground space-y-1">
                        <div>
                          <span className="text-foreground font-medium">Pickup: </span>
                          {format(new Date(b.pickup_datetime), 'dd MMM yyyy, hh:mm a')}
                        </div>
                        <div>
                          <span className="text-foreground font-medium">Return: </span>
                          {format(new Date(b.return_datetime), 'dd MMM yyyy, hh:mm a')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1.5">
                          {b.status === 'active' ? (
                            overdue.isOverdue ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-500 text-white">
                                OVERDUE
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white">
                                RUNNING
                              </span>
                            )
                          ) : b.status === 'completed' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-zinc-500/15 text-zinc-600 border border-zinc-500/30 dark:text-zinc-400">
                              COMPLETED
                            </span>
                          ) : b.status === 'cancelled' || b.status === 'rejected' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-500/15 text-rose-600 border border-rose-500/30">
                              CANCELLED
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-600 border border-amber-500/30">
                              {b.status?.toUpperCase()}
                            </span>
                          )}
                          {b.status === 'active' && (
                            <div className="text-[10px] text-muted-foreground">
                              {overdue.isOverdue
                                ? `(${overdue.label.replace('🔴 Overdue ', '').trim()} Late)`
                                : overdue.label.includes('Due in')
                                ? `(On Time, Due in ${overdue.label.match(/(\d+h)/)?.[1] || 'soon'})`
                                : overdue.label}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Odometer */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px]">
                          <span className="text-muted-foreground block">
                            Start: {b.pickup_odometer || car?.current_odometer || 0} KM
                          </span>
                          {b.return_odometer && (
                            <span className="font-semibold text-foreground block mt-0.5">
                              End: {b.return_odometer} KM
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <span className="font-black text-foreground text-sm block font-mono">
                          ₹{Number(b.grand_total || 0).toLocaleString('en-IN')}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] px-2 py-0.5 rounded-md font-bold uppercase mt-1 inline-block border',
                            b.payment_status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                          )}
                        >
                          {b.payment_status === 'paid' ? 'PAID' : 'PENDING'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {b.status === 'active' && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => openReturnDialog(b)}
                                className="h-8 px-3 text-[11px] font-bold bg-foreground text-background hover:bg-foreground/90 rounded-lg gap-1.5"
                                aria-label={`Process vehicle return for booking ${b.booking_number}`}
                              >
                                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                                Mark Returned
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openExtendDialog(b)}
                                className="h-8 px-2.5 text-[11px] font-semibold rounded-lg border-border hover:bg-muted"
                                aria-label={`Extend duration for booking ${b.booking_number}`}
                              >
                                Extend
                              </Button>
                            </>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedBooking(b)
                              setViewDetailsOpen(true)
                            }}
                            className="h-8 w-8 p-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                            aria-label={`View details for booking ${b.booking_number}`}
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. RETURN CAR INSPECTION & LIVE BILL CALCULATION MODAL        */}
      {/* ============================================================ */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className="w-[96vw] max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl p-4 sm:p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-xl font-black flex items-center gap-2 text-foreground">
              <RotateCcw className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <span>Return Car & Finalize Bill</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Complete vehicle inspection, check odometer, record damages/violations, and finalize customer payment.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <form onSubmit={handleCompleteReturn} className="space-y-4 pt-2">
              {/* Car & Customer Brief */}
              <div className="p-3.5 bg-muted/40 border border-border/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-black text-foreground block text-sm sm:text-base">
                    {selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model}
                  </span>
                  <span className="font-mono text-xs font-bold text-primary">
                    {selectedBooking.vehicle?.registration_number} • ID: #{selectedBooking.booking_number}
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="font-bold text-foreground block">
                    {getSafeCustomerName(selectedBooking.customer)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    📞 {getSafeCustomerPhone(selectedBooking.customer) || '—'}
                  </span>
                </div>
              </div>

              {/* Inspection Fields (Stacking on mobile, 3-col on tablet/desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ret-dt" className="text-xs font-semibold">
                    Return Date & Time
                  </Label>
                  <Input
                    id="ret-dt"
                    type="datetime-local"
                    value={returnDatetime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleReturnDatetimeChange(e.target.value)}
                    className="min-h-[44px] text-xs sm:text-sm rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ret-km" className="text-xs font-semibold">
                      Ending Odometer (KM) *
                    </Label>
                    {activeKmInfo.isExceeded && (
                      <span className="text-[10px] text-rose-600 font-bold">
                        +{activeKmInfo.extraKm} km limit exceeded
                      </span>
                    )}
                  </div>
                  <Input
                    id="ret-km"
                    type="number"
                    required
                    value={returnEndingKm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEndingKmChange(e.target.value)}
                    className={cn(
                      "min-h-[44px] text-xs sm:text-sm rounded-xl font-mono",
                      activeKmInfo.isExceeded && "border-rose-500/50 bg-rose-500/5 focus:border-rose-500"
                    )}
                  />
                  <div className="text-[10px] space-y-0.5 text-muted-foreground block">
                    <div className="flex items-center justify-between">
                      <span>Start: {selectedBooking.pickup_odometer || selectedBooking.vehicle?.current_odometer} KM</span>
                      <span className="font-semibold text-foreground">Driven: {activeKmInfo.driven} KM</span>
                    </div>
                    <div className="text-[10px]">
                      Limit: <strong className="text-foreground">{activeKmInfo.totalIncludedKm} KM</strong> ({activeKmInfo.limitPer24h} km/24h × {activeKmInfo.rentalDays} day{activeKmInfo.rentalDays > 1 ? 's' : ''})
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ret-fuel" className="text-xs font-semibold">
                    Fuel Return Level
                  </Label>
                  <Select value={returnFuelLevel} onValueChange={setReturnFuelLevel}>
                    <SelectTrigger id="ret-fuel" className="min-h-[44px] text-xs sm:text-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Tank (100%)</SelectItem>
                      <SelectItem value="three_quarter">3/4 Tank (75%)</SelectItem>
                      <SelectItem value="half">Half Tank (50%)</SelectItem>
                      <SelectItem value="quarter">1/4 Tank (25%)</SelectItem>
                      <SelectItem value="empty">Empty Tank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Incidentals & Extra Charges (Simple & Compact) */}
              <div className="p-3 bg-muted/30 border border-border/60 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Incidentals & Extra Charges (Optional)</span>
                  {activeOverdueInfo.isOverdue && (
                    <span className="text-[10px] text-amber-600 font-bold">
                      ⚠ Overdue: {activeOverdueInfo.days}d (₹{activeOverdueInfo.fee.toLocaleString('en-IN')})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="ret-damage-cost" className="text-[11px] font-semibold text-muted-foreground">
                      Damage Cost (₹)
                    </Label>
                    <Input
                      id="ret-damage-cost"
                      type="number"
                      value={damageCost}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDamageCost(e.target.value)}
                      className="min-h-[40px] text-xs rounded-xl font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="late-fee" className="text-[11px] font-semibold text-muted-foreground">
                      Late Fee (₹)
                    </Label>
                    <Input
                      id="late-fee"
                      type="number"
                      value={lateCharges}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLateCharges(e.target.value)}
                      className="min-h-[40px] text-xs rounded-xl font-mono text-amber-600 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="extra-km-fee" className="text-[11px] font-semibold text-muted-foreground">
                      Extra KM (₹)
                    </Label>
                    <Input
                      id="extra-km-fee"
                      type="number"
                      value={extraKmCharges}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtraKmCharges(e.target.value)}
                      className={cn(
                        "min-h-[40px] text-xs rounded-xl font-mono",
                        activeKmInfo.isExceeded && "text-rose-600 font-bold border-rose-500/40"
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="disc-fee" className="text-[11px] font-semibold text-muted-foreground">
                      Discount (₹)
                    </Label>
                    <Input
                      id="disc-fee"
                      type="number"
                      value={returnDiscount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnDiscount(e.target.value)}
                      className="min-h-[40px] text-xs rounded-xl font-mono text-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Security Deposit Escrow Account & FINANCIAL SETTLEMENT */}
              {(() => {
                // Compute dynamic durations & rates
                const pickupDate = selectedBooking ? new Date(selectedBooking.pickup_datetime || selectedBooking.actual_pickup_datetime || new Date()) : new Date()
                const returnDate = selectedBooking ? new Date(returnDatetime || selectedBooking.return_datetime || new Date()) : new Date()
                const diffMs = Math.max(0, returnDate.getTime() - pickupDate.getTime())
                const totalHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)))
                const totalDays = Math.max(1, Math.floor(totalHours / 24))
                const durationText = `${totalDays} Day${totalDays > 1 ? 's' : ''} / ${totalHours} Hrs`

                const depositAmt = Number(
                  selectedBooking?.security_deposit ??
                  (selectedBooking?.vehicle as any)?.security_deposit ??
                  2000
                )
                const insuranceAmt = Number(
                  selectedBooking?.insurance_charge ??
                  (selectedBooking?.with_insurance ? 1200 : 1200)
                )

                // Subtotal calculation
                const dynamicSubtotal = Math.max(
                  0,
                  baseRentalAmount +
                  insuranceAmt +
                  numLate +
                  numExtraKm +
                  numDamage +
                  numCleaning +
                  numOverspeed +
                  numOther -
                  numDiscount
                )
                const dynamicTax = Math.round(dynamicSubtotal * (taxRate / 100))
                const totalSettlementPaid = dynamicSubtotal + dynamicTax + depositAmt

                // Escrow deductions and refunds
                const depositDeductions =
                  depositSettlement === 'forfeited'
                    ? depositAmt
                    : depositSettlement === 'deducted'
                      ? Math.min(depositAmt, numDamage + numOverspeed + Math.max(0, remainingSettlementDue))
                      : 0

                const depositRefundedToBank =
                  depositSettlement === 'refunded'
                    ? depositAmt
                    : depositSettlement === 'held'
                      ? 0
                      : depositSettlement === 'forfeited'
                        ? 0
                        : Math.max(0, depositAmt - depositDeductions)

                const escrowStatusLabel =
                  depositSettlement === 'refunded'
                    ? 'REFUNDED'
                    : depositSettlement === 'forfeited'
                      ? 'FORFEITED'
                      : depositSettlement === 'deducted'
                        ? 'DEDUCTED'
                        : 'HELD'

                return (
                  <div className="space-y-4">
                    {/* Top Escrow Account Banner (Sand/Tan Tone matching mockup) */}
                    <div className="p-4 sm:p-5 bg-[#d3c2b2]/45 dark:bg-amber-950/30 border border-[#c4b09e]/70 dark:border-amber-800/40 rounded-2xl space-y-3 shadow-xs">
                      {/* Banner Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#b48039] shrink-0" aria-hidden="true" />
                          <span className="font-bold text-xs sm:text-sm text-[#b48039] tracking-tight">
                            Security Deposit Escrow Account
                          </span>
                        </div>

                        {/* Status Badge (Clickable to switch: HELD / REFUNDED / DEDUCTED) */}
                        <button
                          type="button"
                          onClick={() => setDepositSettlement(prev => prev === 'held' ? 'refunded' : prev === 'refunded' ? 'deducted' : 'held')}
                          title="Click to toggle status: HELD / REFUNDED / DEDUCTED"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-full shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                            {escrowStatusLabel}
                          </span>
                        </button>
                      </div>

                      {/* 3-Column Stats Row */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
                        <div>
                          <span className="block text-[11px] text-[#a57a44] dark:text-amber-400/90 font-medium">
                            Total Escrowed:
                          </span>
                          <span className="block font-mono font-bold text-xs sm:text-sm text-[#b48039] dark:text-amber-400">
                            ₹{depositAmt.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[11px] text-[#a57a44] dark:text-amber-400/90 font-medium">
                            Deductions (Fuel/Late):
                          </span>
                          <span className="block font-mono font-bold text-xs sm:text-sm text-rose-600 dark:text-rose-400">
                            ₹{depositDeductions.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[11px] text-[#a57a44] dark:text-amber-400/90 font-medium">
                            Refunded to Bank:
                          </span>
                          <span className="block font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                            ₹{depositRefundedToBank.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* FINANCIAL SETTLEMENT Section */}
                    <div className="space-y-2 pt-1">
                      <h4 className="text-xs font-black tracking-wider uppercase text-foreground">
                        FINANCIAL SETTLEMENT
                      </h4>

                      <div className="rounded-2xl border border-slate-200/90 dark:border-border/80 bg-white dark:bg-card p-4 sm:p-5 space-y-3.5 shadow-2xs">
                        {/* Table Header */}
                        <div className="flex items-center justify-between text-xs font-bold text-foreground pb-1">
                          <span>Description</span>
                          <span>Amount (INR)</span>
                        </div>

                        {/* Itemized Rows */}
                        <div className="space-y-3 text-xs">
                          {/* Base Rental */}
                          <div className="flex items-center justify-between text-foreground/90">
                            <span>Base Rental ({durationText})</span>
                            <span className="font-mono font-semibold text-foreground">
                              ₹{baseRentalAmount.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Zero-Depreciation Insurance Waiver */}
                          <div className="flex items-center justify-between text-foreground/90">
                            <span>Zero-Depreciation Insurance Waiver</span>
                            <span className="font-mono font-semibold text-foreground">
                              ₹{insuranceAmt.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Extra KM if applicable */}
                          {numExtraKm > 0 && (
                            <div className="flex items-center justify-between text-foreground/90">
                              <span>Extra Distance Charges ({activeKmInfo.extraKm} km limit exceeded)</span>
                              <span className="font-mono font-semibold text-foreground">
                                +₹{numExtraKm.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}

                          {/* Late Fee if applicable */}
                          {numLate > 0 && (
                            <div className="flex items-center justify-between text-foreground/90">
                              <span>Late Overdue Fee ({activeOverdueInfo.days} Day{activeOverdueInfo.days > 1 ? 's' : ''})</span>
                              <span className="font-mono font-semibold text-foreground">
                                +₹{numLate.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}

                          {/* Damage & Repair if applicable */}
                          {numDamage > 0 && (
                            <div className="flex items-center justify-between text-foreground/90">
                              <span>Damage & Repair Assessment</span>
                              <span className="font-mono font-semibold text-foreground">
                                +₹{numDamage.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}

                          {/* Discount if applicable */}
                          {numDiscount > 0 && (
                            <div className="flex items-center justify-between text-emerald-600">
                              <span>Promotional Discount Applied</span>
                              <span className="font-mono font-semibold">
                                -₹{numDiscount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}

                          {/* Goods & Services Tax (GST @ 18%) */}
                          <div className="flex items-center justify-between text-foreground/90">
                            <span>Goods & Services Tax (GST @ {taxRate}%)</span>
                            <span className="font-mono font-semibold text-foreground">
                              ₹{dynamicTax.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Refundable Security Deposit (Liability) - Highlighted in Amber/Gold */}
                          <div className="flex items-center justify-between text-[#d97706] dark:text-[#f59e0b] font-semibold">
                            <span>Refundable Security Deposit (Liability)</span>
                            <span className="font-mono">
                              ₹{depositAmt.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Total Amount Paid Row */}
                        <div className="border-t border-slate-200/80 dark:border-border/80 pt-3 flex items-center justify-between">
                          <span className="text-sm font-black text-foreground">
                            Total Amount Paid
                          </span>
                          <span className="font-mono text-base font-black text-foreground">
                            ₹{totalSettlementPaid.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Payment Status Info Subtitle */}
                        {alreadyPaid > 0 && (
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-dashed border-slate-200/60 dark:border-border/60">
                            <span>Advance Paid: ₹{alreadyPaid.toLocaleString('en-IN')}</span>
                            <span className={cn('font-bold font-mono', remainingSettlementDue > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                              {remainingSettlementDue > 0 ? `Net Balance to Collect: ₹${remainingSettlementDue.toLocaleString('en-IN')}` : 'Full Rental Settled'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Settle Balance Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="collected-amt" className="text-xs font-semibold">
                    Payment Collected at Return (₹)
                  </Label>
                  <Input
                    id="collected-amt"
                    type="number"
                    value={returnPaymentCollected}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnPaymentCollected(e.target.value)}
                    placeholder={String(remainingSettlementDue)}
                    className="min-h-[44px] text-xs sm:text-sm rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payment-mode" className="text-xs font-semibold">
                    Payment Mode
                  </Label>
                  <Select value={returnPaymentMethod} onValueChange={setReturnPaymentMethod}>
                    <SelectTrigger id="payment-mode" className="min-h-[44px] text-xs sm:text-sm rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash Counter</SelectItem>
                      <SelectItem value="upi">UPI / QR Code</SelectItem>
                      <SelectItem value="card">Credit / Debit Card</SelectItem>
                      <SelectItem value="net_banking">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons with 44px Touch Targets */}
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReturnModalOpen(false)}
                  className="w-full sm:w-auto min-h-[44px] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  className="w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5"
                >
                  {processing ? 'Processing Return...' : '✓ Complete Return & Release Car'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 4. EXTEND RENTAL DURATION MODAL                             */}
      {/* ============================================================ */}
      <Dialog open={extendModalOpen} onOpenChange={setExtendModalOpen}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl p-5 sm:p-6 md:p-7">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
              <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
              <span>Extend Rental Duration</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Extend return datetime for {selectedBooking?.vehicle?.brand} {selectedBooking?.vehicle?.model}.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <form onSubmit={handleConfirmExtend} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-extend-dt" className="text-xs font-semibold">
                  New Return Date & Time
                </Label>
                <Input
                  id="new-extend-dt"
                  type="datetime-local"
                  required
                  value={newExtendReturnDatetime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExtendReturnDatetime(e.target.value)}
                  className="min-h-[44px] text-xs sm:text-sm rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ext-fee" className="text-xs font-semibold">
                  Additional Rental Charge (₹)
                </Label>
                <Input
                  id="ext-fee"
                  type="number"
                  required
                  value={extendExtraAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtendExtraAmount(e.target.value)}
                  className="min-h-[44px] text-xs sm:text-sm rounded-xl font-mono"
                />
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExtendModalOpen(false)}
                  className="w-full sm:w-auto min-h-[44px] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  className="w-full sm:w-auto min-h-[44px] gradient-brand text-white border-0 text-xs font-bold rounded-xl"
                >
                  {processing ? 'Extending...' : 'Confirm Extension'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 5. VIEW RENTAL DETAILS MODAL                                */}
      {/* ============================================================ */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="w-[96vw] max-w-lg max-h-[92dvh] overflow-y-auto rounded-3xl p-5 sm:p-6 md:p-7">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground">
              <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
              <span>Rental Record & Details</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-mono">
              #{selectedBooking?.booking_number}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Vehicle & Customer Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-muted/40 rounded-2xl border border-border/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Vehicle</span>
                  <span className="font-bold text-foreground text-sm block">
                    {selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model}
                  </span>
                  <span className="font-mono text-xs text-primary font-bold block">
                    {selectedBooking.vehicle?.registration_number}
                  </span>
                </div>

                <div className="p-3 bg-muted/40 rounded-2xl border border-border/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Customer</span>
                  <span className="font-bold text-foreground text-sm block truncate">
                    {getSafeCustomerName(selectedBooking.customer)}
                  </span>
                  <span className="text-muted-foreground text-xs block">
                    📞 {getSafeCustomerPhone(selectedBooking.customer) || '—'}
                  </span>
                </div>
              </div>

              {/* Schedule & Odometer Breakdown */}
              <div className="p-3.5 bg-muted/20 border border-border/60 rounded-2xl space-y-1.5 font-medium">
                <div>Pickup: {format(new Date(selectedBooking.pickup_datetime), 'dd MMM yyyy, hh:mm a')}</div>
                <div>Return: {format(new Date(selectedBooking.return_datetime), 'dd MMM yyyy, hh:mm a')}</div>
                <div className="pt-1 border-t border-border/50 text-[11px]">
                  <div>Starting Odometer: {selectedBooking.pickup_odometer || selectedBooking.vehicle?.current_odometer} KM</div>
                  {selectedBooking.return_odometer && (
                    <>
                      <div>Ending Odometer: {selectedBooking.return_odometer} KM (Total: {selectedBooking.return_odometer - Number(selectedBooking.pickup_odometer || 0)} KM driven)</div>
                      <div>24h Limit: {selectedBooking.included_km || 300} KM ({selectedBooking.vehicle?.included_km_per_day || 300} km/24h)</div>
                      <div>Extra Distance: {selectedBooking.extra_km ? `${selectedBooking.extra_km} KM beyond limit (Charge: ₹${selectedBooking.extra_km_charge})` : '0 KM (Within limit)'}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-3.5 bg-card border border-border rounded-2xl space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base Rental:</span>
                  <span className="font-mono font-bold text-foreground">₹{selectedBooking.base_rental}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Security Deposit:</span>
                  <span className="font-mono font-bold text-foreground">₹{selectedBooking.security_deposit}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-foreground border-t border-border pt-2">
                  <span>Grand Total:</span>
                  <span className="font-mono text-primary text-base">₹{selectedBooking.grand_total}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto min-h-[44px] text-xs rounded-xl gap-1.5 font-bold"
                >
                  <Printer className="w-4 h-4" aria-hidden="true" />
                  <span>Print Agreement</span>
                </Button>
                <Button
                  type="button"
                  onClick={() => setViewDetailsOpen(false)}
                  className="w-full sm:w-auto min-h-[44px] text-xs rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
