'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
  Printer
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, differenceInMinutes, differenceInHours, differenceInDays, isPast, addHours, addDays } from 'date-fns'
import type { Booking, Branch } from '@/types'
import { formatCustomer } from '@/lib/customers'
import { cn } from '@/lib/utils'

interface AdminBookingsClientProps {
  initialBookings: Booking[]
  branches: Branch[]
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
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('status') || 'active')

  // Feedback Notification State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 5000)
  }

  // Action Dialog States
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [extendModalOpen, setExtendModalOpen] = useState(false)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  // ==========================================
  // RETURN CAR WORKFLOW FORM STATE & FORMULA
  // ==========================================
  const [returnDatetime, setReturnDatetime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [returnEndingKm, setReturnEndingKm] = useState('0')
  const [returnFuelLevel, setReturnFuelLevel] = useState('full')
  const [damageDescription, setDamageDescription] = useState('')
  const [damageCost, setDamageCost] = useState('0')
  const [lateCharges, setLateCharges] = useState('0')
  const [extraKmCharges, setExtraKmCharges] = useState('0')
  const [cleaningCharges, setCleaningCharges] = useState('0')
  const [overspeedingCharges, setOverspeedingCharges] = useState('0')
  const [maxSpeedRecorded, setMaxSpeedRecorded] = useState('')
  const [otherCharges, setOtherCharges] = useState('0')
  const [returnDiscount, setReturnDiscount] = useState('0')
  const [depositSettlement, setDepositSettlement] = useState('held')
  const [returnPaymentCollected, setReturnPaymentCollected] = useState('0')
  const [returnPaymentMethod, setReturnPaymentMethod] = useState('cash')
  const [returnAdminNotes, setReturnAdminNotes] = useState('Vehicle inspected and returned in good condition.')

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

  // Live calculation of Return Bill:
  // Formula: Base Rental + Late Charges + Extra KM Charges + Damage Charges + Cleaning Charges + Over Speeding Charges + Other Charges - Discount
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
  const returnTaxAmount = Math.round((subtotalBeforeTax * (taxRate / 100)) * 100) / 100
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
  const handleCompleteReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return
    setProcessing(true)

    try {
      const payload = {
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

      // Update local state
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
      showFeedback('success', `Return completed successfully! Final bill: ₹${returnFinalAmount.toLocaleString('en-IN')}. Vehicle is now Available.`)
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to complete return.')
    } finally {
      setProcessing(false)
    }
  }

  // ==========================================
  // EXTEND RENTAL WORKFLOW STATE
  // ==========================================
  const [newExtendReturnDatetime, setNewExtendReturnDatetime] = useState('')
  const [extendExtraAmount, setExtendExtraAmount] = useState('0')

  const openExtendDialog = (b: Booking) => {
    setSelectedBooking(b)
    const currentReturn = new Date(b.return_datetime)
    setNewExtendReturnDatetime(format(addDays(currentReturn, 1), "yyyy-MM-dd'T'HH:mm"))
    setExtendExtraAmount(String(b.vehicle?.daily_rate || 2000))
    setExtendModalOpen(true)
  }

  const handleConfirmExtend = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to extend rental.')
    } finally {
      setProcessing(false)
    }
  }

  // Overdue status calculation helper
  const getOverdueStatus = (returnDatetimeStr: string) => {
    const returnTime = new Date(returnDatetimeStr)
    const now = new Date()

    if (isPast(returnTime)) {
      const diffMins = differenceInMinutes(now, returnTime)
      const diffHours = differenceInHours(now, returnTime)

      if (diffHours >= 1) {
        return {
          isOverdue: true,
          label: `🔴 Overdue by ${diffHours}h ${diffMins % 60}m`,
          badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400 font-black animate-pulse',
        }
      }
      return {
        isOverdue: true,
        label: `🔴 Overdue by ${diffMins} mins`,
        badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400 font-black animate-pulse',
      }
    }

    const diffHours = differenceInHours(returnTime, now)
    const diffMins = differenceInMinutes(returnTime, now)

    if (diffHours <= 3) {
      return {
        isOverdue: false,
        label: `⏳ Due in ${diffHours}h ${diffMins % 60}m`,
        badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold',
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
      const cust = b.customer ? formatCustomer(b.customer) : null
      const custName = cust?.profile?.full_name || (b.customer as any)?.emergency_contact_name || (b.customer as any)?.customer_code || ''
      const custPhone = cust?.profile?.phone || (b.customer as any)?.emergency_contact_phone || ''
      const carName = `${b.vehicle?.brand} ${b.vehicle?.model}`
      const regNo = b.vehicle?.registration_number || ''
      const bookingNo = b.booking_number || ''

      const matchesSearch =
        bookingNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        custPhone.includes(searchQuery) ||
        carName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        regNo.toLowerCase().includes(searchQuery.toLowerCase())

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

  // Active running count
  const activeCount = bookings.filter(b => b.status === 'active').length
  const upcomingCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'ready_for_pickup').length
  const completedCount = bookings.filter(b => b.status === 'completed').length
  const cancelledCount = bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-md shadow-primary/20 text-white">
              <Key className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Rental Operations & Running Cars
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track active rentals, overdue returns, process vehicle return inspections, and issue finalized bills.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/assign">
            <Button className="gradient-brand text-white border-0 hover:opacity-90 font-bold text-xs h-9 shadow-md gap-1.5 rounded-xl">
              <Zap className="w-3.5 h-3.5 fill-current" /> Assign New Car
            </Button>
          </Link>
        </div>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-sm border',
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          )}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </motion.div>
      )}

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-card border border-border/80 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Rental ID, customer name, vehicle, phone..."
            className="pl-8.5 h-9 text-xs rounded-xl bg-muted/40"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={activeTab === 'active' ? 'default' : 'outline'}
            onClick={() => setActiveTab('active')}
            className={cn('text-xs h-8.5 rounded-xl font-bold gap-1.5', activeTab === 'active' && 'shadow-sm')}
          >
            🔵 Running Cars ({activeCount})
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'completed' ? 'default' : 'outline'}
            onClick={() => setActiveTab('completed')}
            className="text-xs h-8.5 rounded-xl font-semibold gap-1.5"
          >
            Completed ({completedCount})
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setActiveTab('cancelled')}
            className="text-xs h-8.5 rounded-xl font-semibold gap-1.5"
          >
            Cancelled ({cancelledCount})
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('all')}
            className="text-xs h-8.5 rounded-xl text-muted-foreground"
          >
            All ({bookings.length})
          </Button>
        </div>
      </div>

      {/* Rentals Table */}
      <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
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
                  <td colSpan={7} className="p-10 text-center text-muted-foreground space-y-2">
                    <p className="font-semibold">No rental assignments found in this view.</p>
                    <Link href="/admin/assign">
                      <Button size="sm" className="gradient-brand text-white border-0 text-xs font-bold mt-2">
                        <Zap className="w-3.5 h-3.5 mr-1" /> Assign Car Now
                      </Button>
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const car = b.vehicle
                  const cust = b.customer ? formatCustomer(b.customer) : null
                  const customerName = cust?.profile?.full_name || (b.customer as any)?.emergency_contact_name || (b.customer as any)?.customer_code || 'Valued Customer'
                  const customerPhone = cust?.profile?.phone || (b.customer as any)?.emergency_contact_phone || '—'
                  const initials = customerName
                    .split(' ')
                    .map((p: string) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'C'
                  const overdue = getOverdueStatus(b.return_datetime)
                  const primaryImg =
                    car?.images?.find((img: any) => img.is_primary)?.url ||
                    car?.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'

                  return (
                    <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                      {/* Car Details */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={primaryImg}
                            alt={`${car?.brand} ${car?.model}`}
                            className="w-12 h-9 rounded-lg object-cover border border-border shrink-0 shadow-2xs"
                          />
                          <div>
                            <span className="font-black text-sm text-foreground block">
                              {car ? `${car.brand} ${car.model}` : 'Vehicle'}
                            </span>
                            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-bold inline-block">
                              {car?.registration_number || '—'}
                            </span>
                            <span className="font-mono text-[10px] text-primary block mt-0.5">
                              {b.booking_number}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg gradient-brand text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-foreground block truncate">{customerName}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-primary shrink-0" /> {customerPhone}
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
                            'text-[9px] px-1 py-0 h-4 border-0 uppercase font-bold',
                            b.payment_status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-500/10 text-amber-600'
                          )}
                        >
                          {b.payment_status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {b.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openReturnDialog(b)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-7.5 px-2.5 gap-1 shadow-xs rounded-xl"
                              >
                                <RotateCcw className="w-3 h-3" /> Mark Returned
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openExtendDialog(b)}
                                className="text-xs h-7.5 px-2 rounded-xl text-primary border-primary/30 hover:bg-primary/10"
                              >
                                Extend
                              </Button>
                            </>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedBooking(b)
                              setViewDetailsOpen(true)
                            }}
                            className="h-7.5 px-2 text-xs rounded-xl"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
      {/* 1. RETURN CAR INSPECTION & LIVE BILL CALCULATION MODAL */}
      {/* ============================================================ */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-foreground">
              <RotateCcw className="w-5 h-5 text-emerald-600" /> Return Car & Finalize Bill
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete vehicle return inspection, record ending odometer, calculate late & damage fees, and settle final payment.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <form onSubmit={handleCompleteReturn} className="space-y-4 pt-2">
              {/* Car & Customer Brief */}
              <div className="p-3.5 bg-muted/40 border border-border/60 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-black text-foreground block text-sm">
                    {selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-primary">
                    {selectedBooking.vehicle?.registration_number} • ID: {selectedBooking.booking_number}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground block">
                    {selectedBooking.customer?.profile?.full_name || (selectedBooking.customer as any)?.emergency_contact_name || 'Valued Customer'}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    📞 {selectedBooking.customer?.profile?.phone || (selectedBooking.customer as any)?.emergency_contact_phone || '—'}
                  </span>
                </div>
              </div>

              {/* Inspection Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Return Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={returnDatetime}
                    onChange={e => handleReturnDatetimeChange(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Ending Odometer (KM) *</Label>
                    {activeKmInfo.isExceeded && (
                      <span className="text-[10px] text-rose-600 font-bold">
                        +{activeKmInfo.extraKm} km limit exceeded
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    required
                    value={returnEndingKm}
                    onChange={e => handleEndingKmChange(e.target.value)}
                    className={cn(
                      "h-9 text-xs rounded-xl font-mono",
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

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Fuel Level on Return</Label>
                  <Select value={returnFuelLevel} onValueChange={setReturnFuelLevel}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Tank (100%)</SelectItem>
                      <SelectItem value="three_quarter">3/4 Tank (75%)</SelectItem>
                      <SelectItem value="half">Half Tank (50%)</SelectItem>
                      <SelectItem value="quarter">1/4 Tank (25%)</SelectItem>
                      <SelectItem value="empty">Empty / Low Fuel</SelectItem>
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
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Damage Cost (₹)
                    </Label>
                    <Input
                      type="number"
                      value={damageCost}
                      onChange={e => setDamageCost(e.target.value)}
                      className="h-9 text-xs rounded-xl font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Late Fee (₹)
                    </Label>
                    <Input
                      type="number"
                      value={lateCharges}
                      onChange={e => setLateCharges(e.target.value)}
                      className="h-9 text-xs rounded-xl font-mono text-amber-600 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Extra KM (₹)
                    </Label>
                    <Input
                      type="number"
                      value={extraKmCharges}
                      onChange={e => setExtraKmCharges(e.target.value)}
                      className={cn(
                        "h-9 text-xs rounded-xl font-mono",
                        activeKmInfo.isExceeded && "text-rose-600 font-bold border-rose-500/40"
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">
                      Discount (₹)
                    </Label>
                    <Input
                      type="number"
                      value={returnDiscount}
                      onChange={e => setReturnDiscount(e.target.value)}
                      className="h-9 text-xs rounded-xl font-mono text-emerald-600"
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

              {/* Settle Balance Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Payment Collected at Return (₹)</Label>
                  <Input
                    type="number"
                    value={returnPaymentCollected}
                    onChange={e => setReturnPaymentCollected(e.target.value)}
                    placeholder={String(remainingSettlementDue)}
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Payment Mode</Label>
                  <Select value={returnPaymentMethod} onValueChange={setReturnPaymentMethod}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
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

              <DialogFooter className="gap-2 sm:gap-0 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReturnModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={processing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-1.5"
                >
                  {processing ? 'Processing Return...' : '✓ Complete Return & Release Car'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 2. EXTEND RENTAL MODAL */}
      {/* ============================================================ */}
      <Dialog open={extendModalOpen} onOpenChange={setExtendModalOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Extend Rental Duration
            </DialogTitle>
            <DialogDescription className="text-xs">
              Extend return datetime for {selectedBooking?.vehicle?.brand} {selectedBooking?.vehicle?.model}.
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <form onSubmit={handleConfirmExtend} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">New Return Date & Time</Label>
                <Input
                  type="datetime-local"
                  required
                  value={newExtendReturnDatetime}
                  onChange={e => setNewExtendReturnDatetime(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Additional Rental Charge (₹)</Label>
                <Input
                  type="number"
                  required
                  value={extendExtraAmount}
                  onChange={e => setExtendExtraAmount(e.target.value)}
                  className="h-10 text-xs rounded-xl font-mono"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExtendModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={processing}
                  className="gradient-brand text-white border-0 text-xs font-bold rounded-xl"
                >
                  {processing ? 'Extending...' : 'Confirm Extension'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 3. VIEW RENTAL DETAILS & INVOICE MODAL */}
      {/* ============================================================ */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Rental Details & Agreement
            </DialogTitle>
            <DialogDescription className="text-xs font-mono">
              {selectedBooking?.booking_number}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Vehicle & Customer Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/40 rounded-2xl border border-border/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Vehicle</span>
                  <span className="font-bold text-foreground block">
                    {selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model}
                  </span>
                  <span className="font-mono text-[10px] text-primary font-bold">
                    {selectedBooking.vehicle?.registration_number}
                  </span>
                </div>

                <div className="p-3 bg-muted/40 rounded-2xl border border-border/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Customer</span>
                  <span className="font-bold text-foreground block">
                    {selectedBooking.customer?.profile?.full_name || (selectedBooking.customer as any)?.emergency_contact_name || 'Valued Customer'}
                  </span>
                  <span className="text-muted-foreground text-[10px] block">
                    📞 {selectedBooking.customer?.profile?.phone || (selectedBooking.customer as any)?.emergency_contact_phone || '—'}
                  </span>
                </div>
              </div>

              {/* Schedule */}
              <div className="p-3 bg-muted/20 border border-border/60 rounded-2xl space-y-1 font-medium">
                <div>Pickup: {format(new Date(selectedBooking.pickup_datetime), 'dd MMM yyyy, hh:mm a')}</div>
                <div>Return: {format(new Date(selectedBooking.return_datetime), 'dd MMM yyyy, hh:mm a')}</div>
                <div>Starting Odometer: {selectedBooking.pickup_odometer || selectedBooking.vehicle?.current_odometer} KM</div>
                {selectedBooking.return_odometer && <div>Ending Odometer: {selectedBooking.return_odometer} KM</div>}
              </div>

              {/* Financial summary */}
              <div className="p-3 bg-card border border-border rounded-2xl space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base Rental:</span>
                  <span className="font-mono">₹{selectedBooking.base_rental}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Security Deposit:</span>
                  <span className="font-mono">₹{selectedBooking.security_deposit}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground border-t border-border pt-1.5">
                  <span>Grand Total:</span>
                  <span className="font-mono text-primary">₹{selectedBooking.grand_total}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="text-xs rounded-xl gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Agreement
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setViewDetailsOpen(false)}
                  className="text-xs rounded-xl"
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
