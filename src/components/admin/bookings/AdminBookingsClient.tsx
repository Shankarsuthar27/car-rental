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
  const [depositSettlement, setDepositSettlement] = useState('refunded')
  const [returnPaymentCollected, setReturnPaymentCollected] = useState('0')
  const [returnPaymentMethod, setReturnPaymentMethod] = useState('cash')
  const [returnAdminNotes, setReturnAdminNotes] = useState('Vehicle inspected and returned in good condition.')

  // Open Return Dialog & Prefill
  const openReturnDialog = (b: Booking) => {
    setSelectedBooking(b)
    const now = new Date()
    setReturnDatetime(format(now, "yyyy-MM-dd'T'HH:mm"))

    const startOdo = Number(b.pickup_odometer || b.vehicle?.current_odometer || 0)
    setReturnEndingKm(String(startOdo + 120)) // sensible default

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
                    onChange={e => setReturnDatetime(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Ending Odometer (KM) *</Label>
                  <Input
                    type="number"
                    required
                    value={returnEndingKm}
                    onChange={e => handleEndingKmChange(e.target.value)}
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Start: {selectedBooking.pickup_odometer || selectedBooking.vehicle?.current_odometer} KM
                  </span>
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

              {/* Damage Report */}
              <div className="p-3.5 bg-muted/20 border border-border/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Damage Check & Cost</Label>
                  <span className="text-[10px] text-muted-foreground">Leave 0 if vehicle returned scratchless</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      value={damageDescription}
                      onChange={e => setDamageDescription(e.target.value)}
                      placeholder="e.g. Scratched left rear bumper during parking"
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={damageCost}
                      onChange={e => setDamageCost(e.target.value)}
                      placeholder="Damage Cost ₹"
                      className="h-9 text-xs rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Over Speeding Violation Check */}
              <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-amber-500" /> Over Speeding Penalty Check
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Standard Fleet Limit: 80 km/h
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      value={maxSpeedRecorded}
                      onChange={e => setMaxSpeedRecorded(e.target.value)}
                      placeholder="e.g. 115 km/h on Highway (2 alerts logged)"
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={overspeedingCharges}
                      onChange={e => setOverspeedingCharges(e.target.value)}
                      placeholder="Speeding Fine ₹"
                      className="h-9 text-xs rounded-xl font-mono text-amber-600 dark:text-amber-400 font-bold"
                    />
                  </div>
                </div>

                {/* Quick Speed Penalty Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-muted-foreground mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => { setOverspeedingCharges('0'); setMaxSpeedRecorded('') }}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-lg border font-medium transition-all',
                      numOverspeed === 0
                        ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    )}
                  >
                    No Fine (₹0)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOverspeedingCharges('500'); setMaxSpeedRecorded('95 km/h (1x Alert)') }}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-lg border font-medium transition-all',
                      numOverspeed === 500
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    )}
                  >
                    1 Alert (+₹500)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOverspeedingCharges('1000'); setMaxSpeedRecorded('110 km/h (2x Alerts)') }}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-lg border font-medium transition-all',
                      numOverspeed === 1000
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    )}
                  >
                    2 Alerts (+₹1,000)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOverspeedingCharges('2000'); setMaxSpeedRecorded('130+ km/h (Severe Violation)') }}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-lg border font-medium transition-all',
                      numOverspeed === 2000
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-600 font-bold'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    )}
                  >
                    Severe / 3+ (+₹2,000)
                  </button>
                </div>
              </div>

              {/* Additional Charges Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Late Fee (₹)</Label>
                  <Input
                    type="number"
                    value={lateCharges}
                    onChange={e => setLateCharges(e.target.value)}
                    className="h-8.5 text-xs rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Extra KM (₹)</Label>
                  <Input
                    type="number"
                    value={extraKmCharges}
                    onChange={e => setExtraKmCharges(e.target.value)}
                    className="h-8.5 text-xs rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Speeding (₹)</Label>
                  <Input
                    type="number"
                    value={overspeedingCharges}
                    onChange={e => setOverspeedingCharges(e.target.value)}
                    className="h-8.5 text-xs rounded-xl font-mono text-amber-600 dark:text-amber-400 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Cleaning (₹)</Label>
                  <Input
                    type="number"
                    value={cleaningCharges}
                    onChange={e => setCleaningCharges(e.target.value)}
                    className="h-8.5 text-xs rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Discount (₹)</Label>
                  <Input
                    type="number"
                    value={returnDiscount}
                    onChange={e => setReturnDiscount(e.target.value)}
                    className="h-8.5 text-xs rounded-xl font-mono text-emerald-600"
                  />
                </div>
              </div>

              {/* Live Calculated Final Bill Box */}
              <div className="p-4 bg-card border-2 border-emerald-500/30 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-foreground border-b border-border pb-1.5">
                  <span>Live Formula Calculation:</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground truncate max-w-[340px]">
                    Rental + Late + Extra KM + Damage + Speeding + Cleaning - Discount
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-muted-foreground pt-1">
                  <div>Base Rental: <span className="font-mono font-semibold text-foreground">₹{baseRentalAmount}</span></div>
                  <div>Late Charges: <span className="font-mono font-semibold text-foreground">+₹{numLate}</span></div>
                  <div>Extra KM Charges: <span className="font-mono font-semibold text-foreground">+₹{numExtraKm}</span></div>
                  <div>Damage / Repair: <span className="font-mono font-semibold text-foreground">+₹{numDamage}</span></div>
                  <div>Speeding Fine: <span className={cn('font-mono font-bold', numOverspeed > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>+₹{numOverspeed}</span></div>
                  <div>Cleaning / Other: <span className="font-mono font-semibold text-foreground">+₹{numCleaning + numOther}</span></div>
                  <div className="sm:col-span-3">Discount Applied: <span className="font-mono font-semibold text-emerald-600">-₹{numDiscount}</span></div>
                </div>

                <div className="border-t border-border pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-black text-foreground block">Final Grand Total (incl. GST)</span>
                    <span className="text-[10px] text-muted-foreground">Already Paid: ₹{alreadyPaid}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                      ₹{returnFinalAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400">
                      Balance Due: ₹{remainingSettlementDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

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
