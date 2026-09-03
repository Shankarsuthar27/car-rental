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
  const [depositSettlement, setDepositSettlement] = useState<string>('refunded')
  const [returnPaymentCollected, setReturnPaymentCollected] = useState<string>('0')
  const [returnPaymentMethod, setReturnPaymentMethod] = useState<string>('cash')
  const [returnAdminNotes, setReturnAdminNotes] = useState<string>('Vehicle inspected and returned in good condition.')

  // Open Return Dialog & Prefill
  const openReturnDialog = (b: Booking) => {
    setSelectedBooking(b)
    const now = new Date()
    setReturnDatetime(format(now, "yyyy-MM-dd'T'HH:mm"))

    const startOdo = Number(b.pickup_odometer || b.vehicle?.current_odometer || 0)
    setReturnEndingKm(String(startOdo + 120))

    // Auto-calculate late fee if overdue
    const returnTime = new Date(b.return_datetime)
    if (isPast(returnTime)) {
      const hoursLate = Math.max(1, differenceInHours(now, returnTime))
      setLateCharges(String(hoursLate * 200))
    } else {
      setLateCharges('0')
    }

    setExtraKmCharges('0')
    setDamageCost('0')
    setCleaningCharges('0')
    setOverspeedingCharges('0')
    setMaxSpeedRecorded('')
    setOtherCharges('0')
    setReturnDiscount('0')
    setDamageDescription('')
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

  // Recalculate extra KM when ending KM changes
  const handleEndingKmChange = (newEndKm: string) => {
    setReturnEndingKm(newEndKm)
    if (!selectedBooking) return
    const startKm = Number(selectedBooking.pickup_odometer || selectedBooking.vehicle?.current_odometer || 0)
    const endKm = Number(newEndKm) || startKm
    const driven = Math.max(0, endKm - startKm)
    const included = Number(selectedBooking.included_km || 200)
    const extraKm = Math.max(0, driven - included)
    const ratePerKm = Number(selectedBooking.vehicle?.extra_km_charge || 12)
    setExtraKmCharges(String(extraKm * ratePerKm))
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
    <div className="w-full space-y-4 sm:space-y-6 p-3.5 sm:p-5 md:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center text-white shrink-0 shadow-sm shadow-primary/25">
              <Key className="w-5 h-5 fill-current" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground truncate">
                Rental Operations & Fleet
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Track active rentals, overdue status, vehicle returns, inspections, and billing settlements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/admin/assign" className="w-full sm:w-auto">
            <Button className="gradient-brand text-white border-0 hover:opacity-95 font-bold text-xs sm:text-sm min-h-[44px] px-4 shadow-sm gap-2 rounded-xl w-full sm:w-auto">
              <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Assign New Car</span>
            </Button>
          </Link>
        </div>
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

      {/* Search and Tabs Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 sm:p-4 bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-xs">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <Input
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Search rental #, customer, car model, reg no..."
            className="pl-10 min-h-[44px] text-xs sm:text-sm rounded-xl bg-muted/40 w-full focus-visible:ring-primary"
            aria-label="Search rental assignments"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[32px] flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Tab Filters with Smooth Horizontal Touch Scrolling */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <Button
            size="sm"
            variant={activeTab === 'active' ? 'default' : 'outline'}
            onClick={() => setActiveTab('active')}
            className={cn(
              'min-h-[44px] px-3.5 text-xs rounded-xl font-bold gap-1.5 shrink-0',
              activeTab === 'active' && 'shadow-xs'
            )}
            aria-pressed={activeTab === 'active'}
          >
            <span>🔵 Running ({activeCount})</span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'completed' ? 'default' : 'outline'}
            onClick={() => setActiveTab('completed')}
            className="min-h-[44px] px-3.5 text-xs rounded-xl font-semibold gap-1.5 shrink-0"
            aria-pressed={activeTab === 'completed'}
          >
            <span>Completed ({completedCount})</span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setActiveTab('cancelled')}
            className="min-h-[44px] px-3.5 text-xs rounded-xl font-semibold gap-1.5 shrink-0"
            aria-pressed={activeTab === 'cancelled'}
          >
            <span>Cancelled ({cancelledCount})</span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('all')}
            className="min-h-[44px] px-3 text-xs rounded-xl text-muted-foreground shrink-0"
            aria-pressed={activeTab === 'all'}
          >
            <span>All ({bookings.length})</span>
          </Button>
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
      <div className="hidden lg:block bg-card border border-border/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">Car & Reg No</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Rental Duration</th>
                <th className="p-4">Status & Overdue Tracker</th>
                <th className="p-4">Odometer</th>
                <th className="p-4">Payment</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
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
                      {/* Car Details */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbnail}
                            alt={`${car?.brand} ${car?.model}`}
                            className="w-12 h-9 rounded-xl object-cover border border-border shrink-0 shadow-2xs"
                          />
                          <div>
                            <span className="font-black text-sm text-foreground block">
                              {car ? `${car.brand} ${car.model}` : 'Vehicle'}
                            </span>
                            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold inline-block">
                              {car?.registration_number || '—'}
                            </span>
                            <span className="font-mono text-[10px] text-primary block mt-0.5">
                              #{b.booking_number}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl gradient-brand text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {customerName[0] || 'C'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-foreground block truncate max-w-[160px]">{customerName}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-primary shrink-0" aria-hidden="true" /> {customerPhone || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rental Duration */}
                      <td className="p-4 space-y-0.5 text-muted-foreground">
                        <div>
                          <span className="text-foreground font-medium">Pickup:</span>{' '}
                          {format(new Date(b.pickup_datetime), 'dd MMM yyyy, hh:mm a')}
                        </div>
                        <div>
                          <span className="text-foreground font-medium">Return:</span>{' '}
                          {format(new Date(b.return_datetime), 'dd MMM yyyy, hh:mm a')}
                        </div>
                      </td>

                      {/* Status / Overdue */}
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={cn(
                              'text-[10px] font-bold capitalize border',
                              b.status === 'active' && 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                              b.status === 'completed' && 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30',
                              b.status === 'confirmed' && 'bg-purple-500/10 text-purple-600 border-purple-500/30',
                              b.status === 'cancelled' && 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                            )}
                          >
                            {b.status === 'active' ? '🔵 Running' : b.status}
                          </Badge>
                        </div>
                        {b.status === 'active' && (
                          <Badge className={cn('text-[9px] border block w-fit', overdue.badgeClass)}>
                            {overdue.label}
                          </Badge>
                        )}
                      </td>

                      {/* Odometer */}
                      <td className="p-4">
                        <div className="font-mono text-xs">
                          <span className="text-muted-foreground block text-[10px]">
                            Start: {b.pickup_odometer || car?.current_odometer || 0} KM
                          </span>
                          {b.return_odometer && (
                            <span className="font-bold text-foreground block">
                              End: {b.return_odometer} KM
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="p-4">
                        <span className="font-black text-foreground text-sm block font-mono">
                          ₹{Number(b.grand_total || 0).toLocaleString('en-IN')}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] px-1.5 py-0 h-4 border uppercase font-bold mt-0.5',
                            b.payment_status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                          )}
                        >
                          {b.payment_status}
                        </Badge>
                      </td>

                      {/* Actions with Minimum 44px Touch Targets */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {b.status === 'active' && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => openReturnDialog(b)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs min-h-[44px] px-3 gap-1.5 rounded-xl shadow-xs"
                                aria-label={`Process vehicle return for booking ${b.booking_number}`}
                              >
                                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Mark Returned</span>
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openExtendDialog(b)}
                                className="text-xs min-h-[44px] px-3 rounded-xl text-primary border-primary/30 hover:bg-primary/10"
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
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
                            aria-label={`View details for booking ${b.booking_number}`}
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnDatetime(e.target.value)}
                    className="min-h-[44px] text-xs sm:text-sm rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ret-km" className="text-xs font-semibold">
                    Ending Odometer (KM) *
                  </Label>
                  <Input
                    id="ret-km"
                    type="number"
                    required
                    value={returnEndingKm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEndingKmChange(e.target.value)}
                    className="min-h-[44px] text-xs sm:text-sm rounded-xl font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Start: {selectedBooking.pickup_odometer || selectedBooking.vehicle?.current_odometer} KM
                  </span>
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

              {/* Damage & Repair Assessment */}
              <div className="p-3.5 bg-muted/30 border border-border/60 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-foreground block">Vehicle Condition & Damage Notes</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label htmlFor="ret-damage-desc" className="text-[11px] font-semibold">
                      Damage or Scratch Details (Optional)
                    </Label>
                    <Input
                      id="ret-damage-desc"
                      placeholder="e.g. Scratched front bumper, clean interior"
                      value={damageDescription}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDamageDescription(e.target.value)}
                      className="min-h-[44px] text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="ret-damage-cost" className="text-[11px] font-semibold">
                      Repair / Dent Cost (₹)
                    </Label>
                    <Input
                      id="ret-damage-cost"
                      type="number"
                      value={damageCost}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDamageCost(e.target.value)}
                      className="min-h-[44px] text-xs rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Over Speeding Penalty Check */}
              <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <Label className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    Over Speeding & Telematics Violations
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Standard Speed Cap: 90 km/h</span>
                </div>

                {/* Quick Selection Buttons with Accessible Touch Targets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOverspeedingCharges('0')
                      setMaxSpeedRecorded('')
                    }}
                    className={cn(
                      'min-h-[44px] text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition-all text-center flex items-center justify-center',
                      numOverspeed === 0
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    )}
                  >
                    No Violation (₹0)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOverspeedingCharges('500')
                      setMaxSpeedRecorded('98 km/h (1x Alert)')
                    }}
                    className={cn(
                      'min-h-[44px] text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition-all text-center flex items-center justify-center',
                      numOverspeed === 500
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    )}
                  >
                    1 Alert (+₹500)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOverspeedingCharges('1000')
                      setMaxSpeedRecorded('110 km/h (2x Alerts)')
                    }}
                    className={cn(
                      'min-h-[44px] text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition-all text-center flex items-center justify-center',
                      numOverspeed === 1000
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    )}
                  >
                    2 Alerts (+₹1,000)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOverspeedingCharges('2000')
                      setMaxSpeedRecorded('130+ km/h (Severe Violation)')
                    }}
                    className={cn(
                      'min-h-[44px] text-xs px-2.5 py-1.5 rounded-xl border font-semibold transition-all text-center flex items-center justify-center',
                      numOverspeed === 2000
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-600 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    )}
                  >
                    Severe (+₹2,000)
                  </button>
                </div>
              </div>

              {/* Additional Charges Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="late-fee" className="text-[11px] font-semibold">Late Fee (₹)</Label>
                  <Input
                    id="late-fee"
                    type="number"
                    value={lateCharges}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLateCharges(e.target.value)}
                    className="min-h-[44px] text-xs rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="extra-km-fee" className="text-[11px] font-semibold">Extra KM (₹)</Label>
                  <Input
                    id="extra-km-fee"
                    type="number"
                    value={extraKmCharges}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtraKmCharges(e.target.value)}
                    className="min-h-[44px] text-xs rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="speeding-fee" className="text-[11px] font-semibold">Speeding (₹)</Label>
                  <Input
                    id="speeding-fee"
                    type="number"
                    value={overspeedingCharges}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOverspeedingCharges(e.target.value)}
                    className="min-h-[44px] text-xs rounded-xl font-mono text-amber-600 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="clean-fee" className="text-[11px] font-semibold">Cleaning (₹)</Label>
                  <Input
                    id="clean-fee"
                    type="number"
                    value={cleaningCharges}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCleaningCharges(e.target.value)}
                    className="min-h-[44px] text-xs rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="disc-fee" className="text-[11px] font-semibold">Discount (₹)</Label>
                  <Input
                    id="disc-fee"
                    type="number"
                    value={returnDiscount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnDiscount(e.target.value)}
                    className="min-h-[44px] text-xs rounded-xl font-mono text-emerald-600"
                  />
                </div>
              </div>

              {/* Live Formula Calculated Summary */}
              <div className="p-4 bg-card border-2 border-emerald-500/30 rounded-2xl space-y-2.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between font-bold text-foreground border-b border-border pb-2 gap-1">
                  <span>Live Formula Calculation:</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">
                    Rental + Late + Extra KM + Damage + Speeding + Cleaning - Discount
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-muted-foreground pt-1">
                  <div>Base Hire: <span className="font-mono font-semibold text-foreground">₹{baseRentalAmount}</span></div>
                  <div>Late Charges: <span className="font-mono font-semibold text-foreground">+₹{numLate}</span></div>
                  <div>Extra KM Charges: <span className="font-mono font-semibold text-foreground">+₹{numExtraKm}</span></div>
                  <div>Damage / Repair: <span className="font-mono font-semibold text-foreground">+₹{numDamage}</span></div>
                  <div>Speeding Penalty: <span className={cn('font-mono font-bold', numOverspeed > 0 ? 'text-amber-600' : 'text-foreground')}>+₹{numOverspeed}</span></div>
                  <div>Cleaning / Other: <span className="font-mono font-semibold text-foreground">+₹{numCleaning + numOther}</span></div>
                  <div className="col-span-2 sm:col-span-3">Discount: <span className="font-mono font-semibold text-emerald-600">-₹{numDiscount}</span></div>
                </div>

                <div className="border-t border-border pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-black text-foreground block">Final Grand Total (incl. GST)</span>
                    <span className="text-[11px] text-muted-foreground">Advance Paid: ₹{alreadyPaid}</span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 block">
                      ₹{returnFinalAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-bold font-mono text-rose-600">
                      Balance Due: ₹{remainingSettlementDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Deposit Settlement */}
              {selectedBooking && Number(selectedBooking.security_deposit || 0) > 0 && (() => {
                const depositAmt = Number(selectedBooking.security_deposit || 0)
                const depositDeducted = numDamage + numOverspeed + (depositSettlement === 'deducted' ? Math.max(0, remainingSettlementDue) : 0)
                const depositRefundAmt = Math.max(0, depositAmt - depositDeducted)

                return (
                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" aria-hidden="true" />
                        Security Deposit Settlement
                      </Label>
                      <span className="font-mono text-sm font-black text-foreground">
                        ₹{depositAmt.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { value: 'refunded', label: '✅ Full Refund' },
                        { value: 'deducted', label: '🔻 Deduct Dues' },
                        { value: 'held', label: '⏸ Hold Deposit' },
                        { value: 'forfeited', label: '❌ Forfeit All' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDepositSettlement(opt.value)}
                          className={cn(
                            'min-h-[44px] text-xs py-2 px-2.5 rounded-xl border font-bold transition-all text-center flex items-center justify-center',
                            depositSettlement === opt.value
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-3 bg-background rounded-xl border border-border/80 flex items-center justify-between">
                      <span className="text-muted-foreground">Net Refundable to Customer:</span>
                      <span className="font-mono font-bold text-sm text-emerald-600">
                        ₹{(depositSettlement === 'refunded' ? depositAmt : depositSettlement === 'forfeited' ? 0 : depositRefundAmt).toLocaleString('en-IN')}
                      </span>
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

              {/* Schedule */}
              <div className="p-3.5 bg-muted/20 border border-border/60 rounded-2xl space-y-1.5 font-medium">
                <div>Pickup: {format(new Date(selectedBooking.pickup_datetime), 'dd MMM yyyy, hh:mm a')}</div>
                <div>Return: {format(new Date(selectedBooking.return_datetime), 'dd MMM yyyy, hh:mm a')}</div>
                <div>Starting Odometer: {selectedBooking.pickup_odometer || selectedBooking.vehicle?.current_odometer} KM</div>
                {selectedBooking.return_odometer && <div>Ending Odometer: {selectedBooking.return_odometer} KM</div>}
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
