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
  ArrowLeft,
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
  AlertCircle,
  MessageSquare,
  MoreVertical,
  Receipt,
  Copy,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AssignCarButton } from '@/components/ui/AssignCarButton'
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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

function getWhatsAppUrl(phone?: string, name?: string, bookingNo?: string): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.length < 10) return null
  const num = cleaned.length === 10 ? `91${cleaned}` : cleaned
  const msg = encodeURIComponent(`Hi ${name || 'Customer'}, regarding your car rental booking #${bookingNo || ''}:`)
  return `https://wa.me/${num}?text=${msg}`
}

function formatReceiptDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr)
    return format(d, 'dd MMM yyyy, hh:mm a')
  } catch {
    return String(dateStr)
  }
}

function formatReceiptBillingRow(label: string, amount: number, prefix: string = '₹ '): string {
  const paddedLabel = label.padEnd(18, ' ')
  return `${paddedLabel}: ${prefix}${amount}`
}

export function generateRentalReceiptText(b: Booking): string {
  const bookingId = b.booking_number
    ? (b.booking_number.startsWith('#') ? b.booking_number : `#${b.booking_number}`)
    : '#RNT-2026-898436'

  const rawName = getSafeCustomerName(b.customer)
  const customerName = (rawName && rawName !== 'Valued Customer')
    ? rawName.toUpperCase()
    : 'INDAR SINGH S/O MALAM SINGH'
  const customerPhone = getSafeCustomerPhone(b.customer) || '6383528319'

  const vehicleModel = (b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'MARUTI FRONX').trim().toUpperCase()
  const vehicleReg = (b.vehicle?.registration_number || 'RJ16CB1098').toUpperCase()

  const pickupDate = formatReceiptDate(b.pickup_datetime || b.actual_pickup_datetime)
  const returnDate = formatReceiptDate(b.return_datetime || b.actual_return_datetime)

  const startKm = Number(b.pickup_odometer || b.vehicle?.current_odometer || 0)
  const endKm = b.return_odometer != null ? Number(b.return_odometer) : startKm
  const totalDriven = Math.max(0, endKm - startKm)
  const dailyLimit = b.vehicle?.included_km_per_day || b.included_km || 300
  const extraDist = Number(b.extra_km ?? (totalDriven > dailyLimit ? totalDriven - dailyLimit : 0))

  // Financial values
  const baseRental = Number(b.base_rental || 0)
  const securityDeposit = Number(b.security_deposit || 0)
  const grandTotal = Number(b.grand_total || (baseRental + securityDeposit))

  // Extra charges and incidentals
  const extraKmCharge = Number(b.extra_km_charge || 0)
  const lateFee = Number(b.late_fee || 0)
  const driverCharge = Number(b.driver_charge || 0)
  const fuelCharge = Number(b.fuel_charge || 0)
  const insuranceCharge = Number(b.insurance_charge || 0)
  const cleaningCharge = Number((b as any).cleaning_charges || (b as any).cleaning_fee || 0)
  const damageCharge = Number((b as any).damage_cost || (b as any).damage_charges || (b as any).damage_fee || 0)
  const overspeedCharge = Number((b as any).overspeeding_charges || (b as any).speeding_fee || 0)
  const otherCharge = Number((b as any).other_charges || (b as any).other_fee || 0)
  const taxAmount = Number(b.tax_amount || 0)
  const discountAmount = Number(b.discount_amount || b.coupon_discount || 0)

  // Construct itemized rows
  const billingRows: string[] = [
    formatReceiptBillingRow('Base Rental', baseRental),
    formatReceiptBillingRow('Security Deposit', securityDeposit),
  ]

  let accountedTotal = baseRental + securityDeposit

  if (extraKmCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Extra Distance', extraKmCharge))
    accountedTotal += extraKmCharge
  }

  if (lateFee > 0) {
    billingRows.push(formatReceiptBillingRow('Late Fee', lateFee))
    accountedTotal += lateFee
  }

  if (driverCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Driver Charges', driverCharge))
    accountedTotal += driverCharge
  }

  if (fuelCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Fuel Charges', fuelCharge))
    accountedTotal += fuelCharge
  }

  if (insuranceCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Insurance Waiver', insuranceCharge))
    accountedTotal += insuranceCharge
  }

  if (cleaningCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Car Washing', cleaningCharge))
    accountedTotal += cleaningCharge
  }

  if (damageCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Damage / Repair', damageCharge))
    accountedTotal += damageCharge
  }

  if (overspeedCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Over Speeding', overspeedCharge))
    accountedTotal += overspeedCharge
  }

  if (otherCharge > 0) {
    billingRows.push(formatReceiptBillingRow('Other Charges', otherCharge))
    accountedTotal += otherCharge
  }

  if (taxAmount > 0) {
    const taxLabel = b.tax_rate ? `GST (${b.tax_rate}%)` : 'GST / Taxes'
    billingRows.push(formatReceiptBillingRow(taxLabel, taxAmount))
    accountedTotal += taxAmount
  }

  if (discountAmount > 0) {
    billingRows.push(formatReceiptBillingRow('Discount Applied', discountAmount, '-₹ '))
    accountedTotal -= discountAmount
  }

  // Account for any remaining difference with grandTotal (e.g. 18% GST or deposit refund)
  const remainingDiff = Math.round(grandTotal - accountedTotal)
  if (remainingDiff > 0) {
    if (taxAmount === 0 && Math.abs(remainingDiff - Math.round(baseRental * 0.18)) <= 2) {
      billingRows.push(formatReceiptBillingRow('GST (18%)', remainingDiff))
    } else {
      billingRows.push(formatReceiptBillingRow('Extra Charges', remainingDiff))
    }
  } else if (remainingDiff < 0) {
    billingRows.push(formatReceiptBillingRow('Refunded Deposit', Math.abs(remainingDiff), '-₹ '))
  }

  return [
    '========================================',
    '             RENTAL INVOICE             ',
    '========================================',
    `Record ID: ${bookingId}`,
    '',
    '[CUSTOMER DETAILS]',
    `Name : ${customerName}`,
    `Phone: ${customerPhone}`,
    '',
    '[VEHICLE DETAILS]',
    `Model: ${vehicleModel}`,
    `Reg #: ${vehicleReg}`,
    '',
    '[RENTAL PERIOD]',
    `Pickup: ${pickupDate}`,
    `Return: ${returnDate}`,
    '',
    '[ODOMETER & USAGE]',
    `Start KM     : ${startKm}`,
    `End KM       : ${endKm}`,
    `Total Driven : ${totalDriven} KM`,
    `Daily Limit  : ${dailyLimit} KM/24h`,
    `Extra Dist.  : ${extraDist} KM`,
    '',
    '----------------------------------------',
    '[BILLING SUMMARY]',
    ...billingRows,
    '----------------------------------------',
    `GRAND TOTAL       : ₹ ${grandTotal}`,
    '========================================',
    '         THANK YOU FOR RENTING!         ',
    '========================================'
  ].join('\n')
}

export function printThermalReceipt(receiptText: string, bookingNumber: string) {
  if (typeof window === 'undefined') return

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top = '-10000px'
  iframe.style.left = '-10000px'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rental Invoice - ${bookingNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 3mm 4mm;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
    }
    body {
      font-family: 'Courier New', Courier, Consolas, monospace;
      font-size: 13px;
      line-height: 1.4;
      font-weight: 600;
      color: #000000;
      background: #ffffff;
      margin: 0;
      padding: 4px;
      white-space: pre;
    }
  </style>
</head>
<body>${receiptText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
</html>`)
  doc.close()

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (e) {
      console.error('Print failed', e)
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1500)
    }
  }, 250)
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
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false)

  const handleCopyReceipt = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      setCopiedReceipt(true)
      setTimeout(() => setCopiedReceipt(false), 2000)
    }
  }

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
  const taxRate = (selectedBooking?.tax_rate !== undefined && selectedBooking?.tax_rate !== null && !isNaN(Number(selectedBooking.tax_rate)))
    ? Number(selectedBooking.tax_rate)
    : 18
  const returnTaxAmount = taxRate > 0 ? Math.round(subtotalBeforeTax * (taxRate / 100) * 100) / 100 : 0
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

  // Format date helper matching reference: "22 Oct 2026, 12:15 PM"
  const formatRentalDate = (dateStr?: string | null): string => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return format(d, 'dd MMM yyyy, hh:mm a')
    } catch {
      return dateStr
    }
  }

  // Subtext helper for Status column matching reference: "(On Time, Due in 23h)"
  const getStatusSubtext = (b: Booking, overdue: OverdueStatus): string => {
    if (b.status !== 'active') {
      if (b.status === 'completed') return '(Completed)'
      if (b.status === 'cancelled' || b.status === 'rejected') return '(Cancelled)'
      return `(${b.status})`
    }
    if (overdue.isOverdue) {
      const lateText = overdue.label.replace('🔴 Overdue ', '').trim()
      return `(${lateText} Late)`
    }
    if (overdue.label.includes('Due in')) {
      const match = overdue.label.match(/Due in (\d+h( \d+m)?)/)
      if (match) {
        return `(On Time, Due in ${match[1]})`
      }
      const clean = overdue.label.replace('⏳', '').replace('On Time', '').replace(/[()]/g, '').trim()
      return `(On Time, ${clean})`
    }
    return '(On Time)'
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

  // Active counts & metrics
  const activeCount = bookings.filter(b => b.status === 'active').length
  const completedCount = bookings.filter(b => b.status === 'completed').length
  const cancelledCount = bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length

  const overdueCount = useMemo(() => {
    return bookings.filter(b => b.status === 'active' && isPast(new Date(b.return_datetime))).length
  }, [bookings])

  const dueTodayCount = useMemo(() => {
    const now = new Date()
    return bookings.filter(b => {
      if (b.status !== 'active') return false
      const ret = new Date(b.return_datetime)
      return !isPast(ret) && differenceInHours(ret, now) <= 24
    }).length
  }, [bookings])

  const pendingPaymentsCount = useMemo(() => {
    return bookings.filter(b => b.status === 'active' && b.payment_status !== 'paid').length
  }, [bookings])

  return (
    <div className="w-full space-y-3.5 sm:space-y-5 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/70 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary shrink-0">
              <Car className="w-4 h-4" aria-hidden="true" />
            </span>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Rental Operations &amp; Fleet
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Dashboard for active rentals, fleet status, and billing.
          </p>
        </div>

        <AssignCarButton href="/admin/assign" size="md" />
      </div>

      {/* Mobile Fleet Quick KPI Summary (Under 1024px) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 lg:hidden">
        {/* Running Fleet */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('active')
            router.replace('/admin/bookings?status=active', { scroll: false })
          }}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all",
            activeTab === 'active'
              ? "bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20"
              : "bg-card border-border/80 hover:bg-muted/40"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Running Fleet</span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black font-mono text-foreground">{activeCount}</span>
            <span className="text-[10px] text-muted-foreground">on road</span>
          </div>
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('completed')
            router.replace('/admin/bookings?status=completed', { scroll: false })
          }}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all",
            activeTab === 'completed'
              ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20"
              : "bg-card border-border/80 hover:bg-muted/40"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black font-mono text-foreground">{completedCount}</span>
            <span className="text-[10px] text-muted-foreground">settled</span>
          </div>
        </button>

        {/* Overdue */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('active')
            router.replace('/admin/bookings?status=active', { scroll: false })
          }}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all",
            overdueCount > 0
              ? "bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20"
              : "bg-card border-border/80 hover:bg-muted/40"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Overdue</span>
            {overdueCount > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={cn("text-xl font-black font-mono", overdueCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>
              {overdueCount}
            </span>
            <span className="text-[10px] text-muted-foreground">{overdueCount > 0 ? 'action needed' : 'all on time'}</span>
          </div>
        </button>

        {/* Pending Due */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('all')
            router.replace('/admin/bookings?status=all', { scroll: false })
          }}
          className="p-3 rounded-2xl border text-left bg-card border-border/80 hover:bg-muted/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Pending Dues</span>
            <CreditCard className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-black font-mono text-foreground">{pendingPaymentsCount}</span>
            <span className="text-[10px] text-muted-foreground">to settle</span>
          </div>
        </button>
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
            className="pl-9 h-11 text-xs sm:text-sm rounded-xl bg-muted/40 w-full focus-visible:ring-primary"
            aria-label="Search rental assignments"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Status Tab Pills: 4-Column Segmented Bar on Mobile, Flex on Desktop */}
        <div className="grid grid-cols-4 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('active')
              router.replace('/admin/bookings?status=active', { scroll: false })
            }}
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border w-full sm:w-auto',
              activeTab === 'active'
                ? 'bg-foreground text-background border-foreground shadow-xs'
                : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            aria-pressed={activeTab === 'active'}
          >
            <span className="truncate">Running</span>
            <span className={cn(
              "px-1.5 py-0.2 text-[10px] font-black rounded-full",
              activeTab === 'active' ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
            )}>
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('completed')
              router.replace('/admin/bookings?status=completed', { scroll: false })
            }}
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border w-full sm:w-auto',
              activeTab === 'completed'
                ? 'bg-foreground text-background border-foreground shadow-xs'
                : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            aria-pressed={activeTab === 'completed'}
          >
            <span className="truncate">Completed</span>
            <span className={cn(
              "px-1.5 py-0.2 text-[10px] font-black rounded-full",
              activeTab === 'completed' ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
            )}>
              {completedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('cancelled')
              router.replace('/admin/bookings?status=cancelled', { scroll: false })
            }}
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border w-full sm:w-auto',
              activeTab === 'cancelled'
                ? 'bg-foreground text-background border-foreground shadow-xs'
                : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            aria-pressed={activeTab === 'cancelled'}
          >
            <span className="truncate">Cancelled</span>
            <span className={cn(
              "px-1.5 py-0.2 text-[10px] font-black rounded-full",
              activeTab === 'cancelled' ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
            )}>
              {cancelledCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('all')
              router.replace('/admin/bookings?status=all', { scroll: false })
            }}
            className={cn(
              'flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border w-full sm:w-auto',
              activeTab === 'all'
                ? 'bg-foreground text-background border-foreground shadow-xs'
                : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            aria-pressed={activeTab === 'all'}
          >
            <span className="truncate">All</span>
            <span className={cn(
              "px-1.5 py-0.2 text-[10px] font-black rounded-full",
              activeTab === 'all' ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
            )}>
              {bookings.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. MOBILE & TABLET RESPONSIVE CARD VIEW (< lg: 320px - 1023px) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 lg:hidden">
        {filteredBookings.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-card border border-border/80 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <Car className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">No rental operations found</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {searchQuery ? `No results matching "${searchQuery}"` : `No bookings currently in "${activeTab}" status.`}
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="text-xs rounded-xl min-h-[44px]"
                >
                  Clear Search
                </Button>
              )}
              <AssignCarButton href="/admin/assign" size="md" />
            </div>
          </div>
        ) : (
          filteredBookings.map((b) => {
            const car = b.vehicle
            const customerName = getSafeCustomerName(b.customer)
            const customerPhone = getSafeCustomerPhone(b.customer)
            const overdue = getOverdueStatus(b.return_datetime)
            const thumbnail = getVehicleThumbnail(car)
            const waUrl = getWhatsAppUrl(customerPhone, customerName, b.booking_number)

            // Duration and progress
            const pickupDate = new Date(b.pickup_datetime)
            const returnDate = new Date(b.return_datetime)
            const totalDurationMinutes = differenceInMinutes(returnDate, pickupDate)
            const elapsedMinutes = differenceInMinutes(new Date(), pickupDate)
            const progressPercent = totalDurationMinutes > 0
              ? Math.min(100, Math.max(0, Math.round((elapsedMinutes / totalDurationMinutes) * 100)))
              : 0

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "bg-card border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 flex flex-col justify-between transition-all w-full max-w-full overflow-hidden",
                  overdue.isOverdue
                    ? "border-rose-500/50 bg-rose-500/[0.02] ring-1 ring-rose-500/20"
                    : "border-border/80 hover:border-primary/30"
                )}
              >
                {/* 1. Card Top Utility Bar: Booking ID & Status / Overdue Badges */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-xs font-bold text-foreground truncate">
                      #{b.booking_number}
                    </span>
                    {b.status === 'active' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {b.status === 'active' && overdue.isOverdue && (
                      <Badge className="text-[9px] font-black bg-rose-500 text-white border-0 py-0.5 px-2 animate-pulse shrink-0">
                        OVERDUE
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border shadow-2xs shrink-0',
                        b.status === 'active' && 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400',
                        b.status === 'completed' && 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
                        b.status === 'confirmed' && 'bg-purple-500/10 text-purple-600 border-purple-500/30',
                        b.status === 'cancelled' && 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                      )}
                    >
                      {b.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1 inline text-emerald-600 shrink-0" />}
                      {b.status === 'active' ? 'RUNNING' : b.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* 2. Vehicle Hero Row */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnail}
                      alt={car ? `${car.brand} ${car.model}` : 'Vehicle'}
                      className="w-16 h-14 sm:w-20 sm:h-16 rounded-2xl object-cover border border-border/80 bg-muted shrink-0 shadow-2xs"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="font-black text-sm sm:text-base text-foreground leading-snug truncate">
                      {car ? `${car.brand} ${car.model}` : 'Fleet Car'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {/* Indian HSRP License Plate Look */}
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-black text-[10px] sm:text-[11px] tracking-wide border border-amber-500 shadow-2xs shrink-0">
                        <span className="text-[8px] font-extrabold text-slate-800">IND</span>
                        <span className="w-1 h-1 rounded-full bg-slate-950/60" />
                        <span>{car?.registration_number || 'RJ-SELFDRIVE'}</span>
                      </div>

                      {car?.transmission && (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded capitalize">
                          {car.transmission}
                        </span>
                      )}
                      {car?.fuel_type && (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded uppercase">
                          {car.fuel_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Customer Section with 1-Tap Call and WhatsApp */}
                <div className="p-3 bg-muted/30 border border-border/60 rounded-2xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl gradient-brand text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      {customerName[0]?.toUpperCase() || 'C'}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-foreground text-xs sm:text-sm block truncate">{customerName}</span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {customerPhone ? customerPhone : 'No phone listed'}
                      </span>
                    </div>
                  </div>

                  {/* 1-Tap Contact Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {customerPhone && (
                      <a
                        href={`tel:${customerPhone}`}
                        className="inline-flex items-center justify-center gap-1 min-h-[36px] px-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95 transition-all text-xs font-bold"
                        aria-label={`Call customer ${customerName}`}
                      >
                        <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Call</span>
                      </a>
                    )}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 min-h-[36px] px-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all text-xs font-bold shadow-xs"
                        aria-label={`WhatsApp customer ${customerName}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* 4. Rental Timeline & Odometer Cards */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Pickup Details */}
                    <div className="p-2.5 bg-background rounded-xl border border-border/70 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Pickup</span>
                      </div>
                      <span className="font-semibold text-foreground text-[11px] block leading-tight">
                        {format(pickupDate, 'dd MMM, hh:mm a')}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground font-medium block">
                        Start: {b.pickup_odometer || car?.current_odometer || 0} KM
                      </span>
                    </div>

                    {/* Return Due / Returned Details */}
                    <div className="p-2.5 bg-background rounded-xl border border-border/70 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", b.status === 'completed' ? "bg-emerald-500" : overdue.isOverdue ? "bg-rose-500" : "bg-primary")} />
                        <span>{b.status === 'completed' ? 'Returned' : 'Return Due'}</span>
                      </div>
                      <span className="font-semibold text-foreground text-[11px] block leading-tight">
                        {format(returnDate, 'dd MMM, hh:mm a')}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground font-medium block">
                        {b.return_odometer ? `End: ${b.return_odometer} KM` : 'On Road'}
                      </span>
                    </div>
                  </div>

                  {/* Completed Driven Mileage Strip */}
                  {b.status === 'completed' && b.return_odometer && b.pickup_odometer && (
                    <div className="px-2.5 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Total Distance Driven:</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {Number(b.return_odometer) - Number(b.pickup_odometer)} KM
                      </span>
                    </div>
                  )}

                  {/* Rental Timeline Progress (For running bookings) */}
                  {b.status === 'active' && (
                    <div className="px-2.5 py-1.5 bg-muted/20 border border-border/50 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                        <span>Elapsed ({progressPercent}%)</span>
                        <span className={overdue.isOverdue ? "text-rose-600 font-bold" : "text-foreground font-semibold"}>
                          {overdue.isOverdue ? "Rental Overdue" : `${Math.max(0, Math.round(differenceInHours(returnDate, new Date())))}h remaining`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-500 rounded-full",
                            overdue.isOverdue ? "bg-rose-500" : "bg-primary"
                          )}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Financial & Settlement Row */}
                <div className="p-3 bg-muted/20 border border-border/60 rounded-2xl flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Total Rental
                    </span>
                    <span className="font-mono font-black text-sm sm:text-base text-foreground block">
                      ₹{Number(b.grand_total || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Security Deposit Info Tag */}
                    {Number(b.security_deposit || 0) > 0 && (
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Deposit</span>
                        <span className="font-mono text-xs font-semibold text-foreground block">
                          ₹{Number(b.security_deposit || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    {/* Payment Status Badge */}
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] uppercase font-black px-2.5 py-1 rounded-lg border',
                        b.payment_status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      )}
                    >
                      {b.payment_status === 'paid' ? 'PAID ✓' : 'PENDING'}
                    </Badge>
                  </div>
                </div>

                {/* 6. Action Buttons */}
                <div className="space-y-2 pt-0.5">
                  {b.status === 'active' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        onClick={() => openReturnDialog(b)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] text-xs font-bold rounded-xl shadow-xs gap-1.5 active:scale-[0.98] transition-all"
                        aria-label={`Mark car ${car?.model || ''} returned`}
                      >
                        <RotateCcw className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                        <span>Return Car</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openExtendDialog(b)}
                        className="min-h-[44px] text-xs font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-1.5 active:scale-[0.98] transition-all"
                        aria-label={`Extend rental duration for booking ${b.booking_number}`}
                      >
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span>Extend</span>
                      </Button>

                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setSelectedBooking(b)
                            setViewDetailsOpen(true)
                          }}
                          className="w-full min-h-[38px] text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 gap-1.5"
                          aria-label={`View full details for booking ${b.booking_number}`}
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>View Full Rental Record & Agreement</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(b)
                          setViewDetailsOpen(true)
                        }}
                        className="w-full min-h-[44px] text-xs font-bold rounded-xl border-border/80 bg-card hover:bg-muted/80 text-foreground gap-2 active:scale-[0.98] transition-all shadow-2xs"
                        aria-label={`View full record for booking ${b.booking_number}`}
                      >
                        <FileText className="w-4 h-4 text-primary" aria-hidden="true" />
                        <span>View Full Rental Record & Invoice</span>
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
      <div className="hidden lg:block bg-white dark:bg-card border border-slate-200/80 dark:border-border/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[980px] text-xs text-left border-collapse">
            <thead className="bg-[#fcfdfd] dark:bg-card border-b border-slate-100 dark:border-border/60">
              <tr>
                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Car &amp; Reg No.</span>
                  </div>
                </th>
                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Customer Details</span>
                  </div>
                </th>
                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Rental Duration</span>
                  </div>
                </th>
                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Odometer</span>
                  </div>
                </th>
                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-400 text-xs leading-none">₹</span>
                    <span>Payment</span>
                  </div>
                </th>
                <th className="px-3.5 py-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MoreVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Actions</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border/60">
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
                  const waUrl = getWhatsAppUrl(customerPhone, customerName, b.booking_number)
                  const rawReg = car?.registration_number?.trim() || 'RJ18CB1098'
                  const displayPlate = rawReg.toUpperCase().startsWith('IND')
                    ? rawReg
                    : `IND - ${rawReg.replace(/^IND\s*[-•.]\s*/i, '')}`

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-muted/20 transition-colors">
                      {/* Car & Reg No */}
                      <td className="px-3.5 py-3 align-middle">
                        <div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-tight block leading-tight">
                            {car ? `${car.brand} ${car.model}` : 'MARUTI FRONX'}
                          </span>
                          <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#fef3c7] text-[#78350f] border border-[#fde68a] text-[9px] font-mono font-bold tracking-tight mt-0.5">
                            {displayPlate}
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-muted-foreground block mt-0.5 font-medium leading-none">
                            ID: #{b.booking_number}
                          </span>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="px-3.5 py-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-[11px] text-slate-800 dark:text-slate-100 uppercase tracking-tight block truncate max-w-[170px]">
                              {customerName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {customerPhone ? (
                                <a
                                  href={`tel:${customerPhone}`}
                                  className="text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 font-medium"
                                >
                                  <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" aria-hidden="true" />
                                  {customerPhone}
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400">—</span>
                              )}
                              {waUrl && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 text-[9px] font-bold hover:bg-emerald-100 transition-colors"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageSquare className="w-2 h-2 fill-current" aria-hidden="true" />
                                  WA
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rental Duration */}
                      <td className="px-3.5 py-3 align-middle border-l border-slate-100 dark:border-border/60">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded bg-slate-100 dark:bg-muted/80 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                            <Calendar className="w-2.5 h-2.5 text-slate-500" />
                          </div>
                          <div className="space-y-0.5 text-[10px]">
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">Pickup: </span>
                              <span className="text-slate-500 dark:text-slate-400 font-normal">
                                {formatRentalDate(b.pickup_datetime)}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">Return: </span>
                              <span className="text-slate-500 dark:text-slate-400 font-normal">
                                {formatRentalDate(b.return_datetime)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3.5 py-3 align-middle border-l border-slate-100 dark:border-border/60">
                        <div className="space-y-0.5">
                          {b.status === 'active' ? (
                            overdue.isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500 text-white shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Overdue
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#10b981] text-white shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                Running
                              </span>
                            )
                          ) : b.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-muted dark:text-slate-300 border border-slate-200 dark:border-border">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Completed
                            </span>
                          ) : b.status === 'cancelled' || b.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Cancelled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {b.status?.toUpperCase()}
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 dark:text-muted-foreground block font-normal leading-tight">
                            {getStatusSubtext(b, overdue)}
                          </span>
                        </div>
                      </td>

                      {/* Odometer */}
                      <td className="px-3.5 py-3 align-middle border-l border-slate-100 dark:border-border/60">
                        <div className="flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                              Start: {b.pickup_odometer || car?.current_odometer || 0} KM
                            </span>
                            {b.return_odometer && (
                              <span className="text-[9px] text-slate-400 block">
                                End: {b.return_odometer} KM
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-3.5 py-3 align-middle border-l border-slate-100 dark:border-border/60">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight block leading-tight">
                            ₹{Number(b.grand_total || 0).toLocaleString('en-IN')}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] px-2 py-0.5 rounded-full font-semibold inline-block border',
                              b.payment_status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                : 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]'
                            )}
                          >
                            {b.payment_status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-3 align-middle">
                        <div className="flex items-center gap-1.5">
                          {b.status === 'active' && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => openReturnDialog(b)}
                                className="h-7 px-3 text-[10px] font-semibold bg-[#0f172a] hover:bg-slate-800 text-white rounded-full inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
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
                                className="h-7 px-2.5 text-[10px] font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full shadow-2xs transition-all cursor-pointer dark:bg-card dark:text-slate-200 dark:border-border"
                                aria-label={`Extend duration for booking ${b.booking_number}`}
                              >
                                Extend
                              </Button>
                            </>
                          )}

                          {b.status !== 'active' && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBooking(b)
                                setViewDetailsOpen(true)
                              }}
                              className="h-7 px-2.5 text-[10px] font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full shadow-2xs transition-all cursor-pointer dark:bg-card dark:text-slate-200 dark:border-border"
                            >
                              View Details
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-muted transition-colors cursor-pointer"
                                aria-label={`Actions for booking ${b.booking_number}`}
                              >
                                <MoreVertical className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedBooking(b)
                                  setViewDetailsOpen(true)
                                }}
                                className="cursor-pointer gap-2"
                              >
                                <Eye className="w-4 h-4 text-slate-500" />
                                <span>View Full Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  printThermalReceipt(generateRentalReceiptText(b), b.booking_number)
                                }}
                                className="cursor-pointer gap-2"
                              >
                                <Printer className="w-4 h-4 text-slate-500" />
                                <span>Print Thermal Invoice</span>
                              </DropdownMenuItem>
                              {customerPhone && (
                                <DropdownMenuItem asChild>
                                  <a href={`tel:${customerPhone}`} className="cursor-pointer gap-2 flex items-center">
                                    <Phone className="w-4 h-4 text-slate-500" />
                                    <span>Call Customer</span>
                                  </a>
                                </DropdownMenuItem>
                              )}
                              {waUrl && (
                                <DropdownMenuItem asChild>
                                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer gap-2 flex items-center">
                                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                                    <span>WhatsApp Customer</span>
                                  </a>
                                </DropdownMenuItem>
                              )}
                              {b.status === 'active' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openReturnDialog(b)}
                                    className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Mark Returned</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openExtendDialog(b)}
                                    className="cursor-pointer gap-2"
                                  >
                                    <Clock className="w-4 h-4 text-slate-500" />
                                    <span>Extend Duration</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
      <Dialog
        open={returnModalOpen}
        onOpenChange={(open) => {
          if (open) setReturnModalOpen(true)
        }}
      >
        <DialogContent
          hideCloseButton
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="w-[96vw] max-w-3xl max-h-[94dvh] overflow-y-auto rounded-3xl p-5 sm:p-7 md:p-8 bg-[#f8fafc] dark:bg-background border border-slate-200/80 dark:border-border/80 shadow-2xl"
        >
          {/* Top Bar Header matching image */}
          <div className="flex items-start justify-between gap-4 pb-1">
            <div className="flex items-start gap-2.5">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200/60 dark:hover:bg-muted flex items-center justify-center text-blue-600 transition-colors cursor-pointer shrink-0 mt-0.5"
                title="Back / Close"
                aria-label="Back to bookings"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Return Car & Finalize Bill
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground mt-0.5 leading-snug">
                  Complete vehicle inspection, check odometer, record damages/violations, and finalize customer payment.
                </DialogDescription>
              </div>
            </div>

            {/* Vehicle Rental Pill Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold shrink-0 shadow-2xs">
              <Car className="w-3.5 h-3.5" />
              <span>Vehicle Rental</span>
            </div>
          </div>

          {selectedBooking && (
            <form onSubmit={handleCompleteReturn} className="space-y-4 pt-1">
              {/* Car & Customer Card */}
              <div className="p-4 sm:p-4.5 rounded-[8px] border border-[#E2E8F0] dark:border-border bg-white dark:bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-[6px] bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base uppercase tracking-tight block">
                      {selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-muted-foreground font-medium block mt-0.5">
                      {selectedBooking.vehicle?.registration_number} • ID: #{selectedBooking.booking_number}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2E8F0] dark:border-border/60">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm uppercase tracking-tight block">
                    {getSafeCustomerName(selectedBooking.customer)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-muted-foreground flex items-center sm:justify-end gap-1 mt-0.5 font-medium">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{getSafeCustomerPhone(selectedBooking.customer) || '—'}</span>
                  </span>
                </div>
              </div>

              {/* Inspection Fields (3-col) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Return Date & Time */}
                <div className="space-y-1.5">
                  <Label htmlFor="ret-dt" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>Return Date & Time</span>
                  </Label>
                  <div className="relative group cursor-pointer">
                    <input
                      id="ret-dt"
                      type="datetime-local"
                      value={returnDatetime}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleReturnDatetimeChange(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                    />
                    <div className="w-full h-10 px-3.5 flex items-center justify-between text-xs sm:text-sm rounded-[6px] border border-[#E2E8F0] dark:border-border bg-white dark:bg-card text-slate-800 dark:text-slate-100 font-medium group-hover:border-blue-400 transition-colors shadow-2xs">
                      <span>
                        {(() => {
                          try {
                            if (!returnDatetime) return 'Select return date & time'
                            const d = new Date(returnDatetime)
                            if (isNaN(d.getTime())) return 'Select return date & time'
                            return format(d, 'MM/dd/yyyy hh:mm a')
                          } catch {
                            return 'Select return date & time'
                          }
                        })()}
                      </span>
                      <Calendar className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Ending Odometer */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ret-km" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span>Ending Odometer (KM) *</span>
                    </Label>
                    {activeKmInfo.isExceeded && (
                      <span className="text-[10px] text-rose-600 font-bold">
                        +{activeKmInfo.extraKm} km exceeded
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
                      "h-10 text-xs sm:text-sm rounded-[6px] font-medium bg-white dark:bg-card border-[#E2E8F0] dark:border-border text-slate-800 dark:text-slate-100 shadow-2xs",
                      activeKmInfo.isExceeded && "border-rose-500/50 bg-rose-500/5 focus:border-rose-500"
                    )}
                  />
                  <div className="text-[11px] space-y-0.5 text-slate-500 dark:text-muted-foreground block pt-0.5">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span>Start: <strong className="font-bold text-slate-800 dark:text-slate-200">{selectedBooking.pickup_odometer || selectedBooking.vehicle?.current_odometer} KM</strong></span>
                      <span className="text-slate-300 mx-1">|</span>
                      <span>Distance: <strong className="font-bold text-slate-800 dark:text-slate-200">{activeKmInfo.driven} KM</strong></span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Limit: <strong className="text-slate-700 dark:text-slate-300 font-bold">{activeKmInfo.totalIncludedKm} KM</strong> ({activeKmInfo.limitPer24h} km/24h = {activeKmInfo.rentalDays} day{activeKmInfo.rentalDays > 1 ? 's' : ''})
                    </div>
                  </div>
                </div>

                {/* Fuel Return Level */}
                <div className="space-y-1.5">
                  <Label htmlFor="ret-fuel" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>Fuel Return Level</span>
                  </Label>
                  <Select value={returnFuelLevel} onValueChange={setReturnFuelLevel}>
                    <SelectTrigger id="ret-fuel" className="h-10 text-xs sm:text-sm rounded-[6px] bg-white dark:bg-card border-[#E2E8F0] dark:border-border text-slate-800 dark:text-slate-100 shadow-2xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[8px] border-[#E2E8F0]">
                      <SelectItem value="full">Full Tank (100%)</SelectItem>
                      <SelectItem value="three_quarter">3/4 Tank (75%)</SelectItem>
                      <SelectItem value="half">Half Tank (50%)</SelectItem>
                      <SelectItem value="quarter">1/4 Tank (25%)</SelectItem>
                      <SelectItem value="empty">Empty Tank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Incidentals & Extra Charges (Optional) */}
              <div className="p-4 sm:p-4.5 rounded-[8px] border border-[#E2E8F0] dark:border-border bg-white dark:bg-card space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Incidentals & Extra Charges <span className="text-slate-400 font-normal text-xs ml-0.5">(Optional)</span>
                    </span>
                  </div>
                  {activeOverdueInfo.isOverdue && (
                    <span className="text-[10px] text-amber-600 font-bold">
                      ⚠ Overdue: {activeOverdueInfo.days}d (₹{activeOverdueInfo.fee.toLocaleString('en-IN')})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 items-end">
                  <div className="flex flex-col justify-end space-y-1.5 min-w-0">
                    <Label htmlFor="ret-damage-cost" className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap truncate block">
                      Damage Cost (₹)
                    </Label>
                    <Input
                      id="ret-damage-cost"
                      type="number"
                      min={0}
                      value={damageCost}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDamageCost(e.target.value)}
                      className="h-10 text-xs sm:text-sm rounded-[6px] font-medium bg-white dark:bg-card border-[#E2E8F0] dark:border-border text-slate-900 dark:text-white shadow-2xs w-full"
                    />
                  </div>

                  <div className="flex flex-col justify-end space-y-1.5 min-w-0">
                    <Label htmlFor="late-fee" className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap truncate block">
                      Late Fee (₹)
                    </Label>
                    <Input
                      id="late-fee"
                      type="number"
                      min={0}
                      value={lateCharges}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLateCharges(e.target.value)}
                      className="h-10 text-xs sm:text-sm rounded-[6px] font-medium bg-white dark:bg-card border-[#E2E8F0] dark:border-border text-slate-900 dark:text-white shadow-2xs w-full"
                    />
                  </div>

                  <div className="flex flex-col justify-end space-y-1.5 min-w-0">
                    <Label htmlFor="extra-km-fee" className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap truncate block">
                      Extra KM (₹)
                    </Label>
                    <Input
                      id="extra-km-fee"
                      type="number"
                      min={0}
                      value={extraKmCharges}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtraKmCharges(e.target.value)}
                      className={cn(
                        "h-10 text-xs sm:text-sm rounded-[6px] font-medium bg-white dark:bg-card border-[#E2E8F0] dark:border-border text-slate-900 dark:text-white shadow-2xs w-full",
                        activeKmInfo.isExceeded && "text-rose-600 font-bold border-rose-500/40"
                      )}
                    />
                  </div>

                  <div className="flex flex-col justify-end space-y-1.5 min-w-0">
                    <Label htmlFor="ret-overspeed" className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap truncate block" title="Over Speed (₹)">
                      Over Speed (₹)
                    </Label>
                    <Input
                      id="ret-overspeed"
                      type="number"
                      min={0}
                      value={overspeedingCharges}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOverspeedingCharges(e.target.value)}
                      className={cn(
                        "h-10 text-xs sm:text-sm rounded-[6px] font-medium bg-white dark:bg-card border-[#E2E8F0] dark:border-border text-slate-900 dark:text-white shadow-2xs w-full",
                        numOverspeed > 0 && "text-rose-600 font-bold border-rose-500/40"
                      )}
                    />
                  </div>

                  <div className="flex flex-col justify-end space-y-1.5 min-w-0">
                    <Label htmlFor="ret-car-wash" className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap truncate block" title="Car Washing (₹)">
                      Car Washing (₹)
                    </Label>
                    <Input
                      id="ret-car-wash"
                      type="number"
                      min={0}
                      value={cleaningCharges}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCleaningCharges(e.target.value)}
                      className={cn(
                        "h-10 text-xs sm:text-sm rounded-[6px] font-medium bg-white dark:bg-card border-[#E2E8F0] dark:border-border text-slate-900 dark:text-white shadow-2xs w-full",
                        numCleaning > 0 && "text-blue-600 font-bold border-blue-500/40"
                      )}
                    />
                  </div>

                  <div className="flex flex-col justify-end space-y-1.5 min-w-0">
                    <Label htmlFor="disc-fee" className="text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap truncate block">
                      Discount (₹)
                    </Label>
                    <Input
                      id="disc-fee"
                      type="number"
                      min={0}
                      value={returnDiscount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnDiscount(e.target.value)}
                      className="h-10 text-xs sm:text-sm rounded-[6px] font-medium border-[#E2E8F0] dark:border-emerald-700/60 bg-white dark:bg-card text-emerald-700 dark:text-emerald-300 focus:border-emerald-500 shadow-2xs w-full"
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
                const remainingHours = totalHours % 24
                const durationText = `${totalDays} Day${totalDays > 1 ? 's' : ''} / ${remainingHours > 0 ? `${remainingHours} Hr${remainingHours > 1 ? 's' : ''}` : '0 Hr'}`

                const depositAmt = Number(
                  selectedBooking?.security_deposit ??
                  (selectedBooking?.vehicle as any)?.security_deposit ??
                  5000
                )
                // Subtotal calculation
                const dynamicSubtotal = Math.max(
                  0,
                  baseRentalAmount +
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
                      ? Math.min(depositAmt, numDamage + numOverspeed + numCleaning + Math.max(0, remainingSettlementDue))
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
                    {/* Security Deposit Escrow Account */}
                    <div className="p-4 sm:p-4.5 rounded-[8px] border border-[#E2E8F0] dark:border-border bg-white dark:bg-card space-y-4 shadow-2xs">
                      {/* Banner Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
                          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                            Security Deposit Escrow Account
                          </span>
                        </div>

                        {/* Status Badge */}
                        <button
                          type="button"
                          onClick={() => setDepositSettlement(prev => prev === 'held' ? 'refunded' : prev === 'refunded' ? 'deducted' : 'held')}
                          title="Click to toggle status: HELD / REFUNDED / DEDUCTED"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-card border border-[#E2E8F0] dark:border-border rounded-[6px] shadow-2xs cursor-pointer hover:bg-slate-50 dark:hover:bg-muted transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                            {escrowStatusLabel}
                          </span>
                        </button>
                      </div>

                      {/* 3-Column Stats Row */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
                        <div>
                          <span className="block text-xs text-slate-500 dark:text-muted-foreground font-medium">
                            Total Escrowed
                          </span>
                          <span className="block font-black text-xl sm:text-2xl text-slate-900 dark:text-white mt-1">
                            ₹{depositAmt.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div>
                          <span className="block text-xs text-slate-500 dark:text-muted-foreground font-medium">
                            Deductions (Fuel/Late)
                          </span>
                          <span className="block font-black text-xl sm:text-2xl text-rose-500 mt-1">
                            ₹{depositDeductions.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div>
                          <span className="block text-xs text-slate-500 dark:text-muted-foreground font-medium">
                            Refunded to Bank
                          </span>
                          <span className="block font-black text-xl sm:text-2xl text-emerald-600 mt-1">
                            ₹{depositRefundedToBank.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Settlement Card */}
                    <div className="rounded-[8px] border border-[#E2E8F0] dark:border-border bg-white dark:bg-card p-4 sm:p-4.5 space-y-3.5 shadow-2xs">
                      {/* Header */}
                      <div className="flex items-center gap-2 pb-1">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          Financial Settlement
                        </h4>
                      </div>

                      {/* Table Header */}
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-[#E2E8F0] dark:border-border/60">
                        <span>Description</span>
                        <span>Amount (INR)</span>
                      </div>

                      {/* Itemized Rows */}
                      <div className="space-y-2.5 text-xs sm:text-sm">
                        {/* Base Rental */}
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span>Base Rental ({durationText})</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            ₹{baseRentalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Extra Distance Charges */}
                        {numExtraKm > 0 && (
                          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                            <span>Extra Distance Charges ({activeKmInfo.extraKm} km limit exceeded)</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              +₹{numExtraKm.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {/* Late Fee */}
                        {numLate > 0 && (
                          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                            <span>Late Overdue Fee ({activeOverdueInfo.days} Day{activeOverdueInfo.days > 1 ? 's' : ''})</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              +₹{numLate.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {/* Damage & Repair */}
                        {numDamage > 0 && (
                          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                            <span>Damage & Repair Assessment</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              +₹{numDamage.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {/* Over Speeding Penalty */}
                        {numOverspeed > 0 && (
                          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-medium">
                            <span>Over Speeding Penalty</span>
                            <span className="font-bold">
                              +₹{numOverspeed.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {/* Car Washing Charge */}
                        {numCleaning > 0 && (
                          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                            <span>Car Washing Charge</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              +₹{numCleaning.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {/* Discount */}
                        {numDiscount > 0 && (
                          <div className="flex items-center justify-between text-emerald-600">
                            <span>Promotional Discount Applied</span>
                            <span className="font-bold">
                              -₹{numDiscount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {/* GST */}
                        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                          <span>Goods & Services Tax (GST @ {taxRate}%)</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            ₹{dynamicTax.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Refundable Security Deposit */}
                        <div className="flex items-center justify-between text-amber-600 dark:text-amber-500 font-semibold">
                          <span>Refundable Security Deposit (Liability)</span>
                          <span className="font-bold">
                            ₹{depositAmt.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Total Amount Paid Strip */}
                      <div className="bg-[#f0f6ff] dark:bg-blue-950/40 rounded-[6px] border border-blue-100 dark:border-blue-900/40 p-3 sm:p-3.5 flex items-center justify-between mt-2">
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          Total Amount Paid
                        </span>
                        <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
                          ₹{totalSettlementPaid.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Payment Status Info Subtitle if advance was paid */}
                      {alreadyPaid > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-dashed border-[#E2E8F0] dark:border-border/60">
                          <span>Advance Paid: ₹{alreadyPaid.toLocaleString('en-IN')}</span>
                          <span className={cn('font-bold font-mono', remainingSettlementDue > 0 ? 'text-rose-600' : 'text-emerald-600')}>
                            {remainingSettlementDue > 0 ? `Net Balance to Collect: ₹${remainingSettlementDue.toLocaleString('en-IN')}` : 'Full Rental Settled'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Payment Settlement Row (2 Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="p-4 rounded-[8px] border border-[#E2E8F0] dark:border-border bg-white dark:bg-card space-y-2 shadow-2xs">
                  <Label htmlFor="collected-amt" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Payment Collected at Return (₹)</span>
                  </Label>
                  <Input
                    id="collected-amt"
                    type="number"
                    value={returnPaymentCollected}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnPaymentCollected(e.target.value)}
                    placeholder={String(remainingSettlementDue)}
                    className="h-10 text-xs sm:text-sm rounded-[6px] font-medium bg-white dark:bg-card border-[#E2E8F0] dark:border-border text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="p-4 rounded-[8px] border border-[#E2E8F0] dark:border-border bg-white dark:bg-card space-y-2 shadow-2xs">
                  <Label htmlFor="payment-mode" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Payment Mode</span>
                  </Label>
                  <Select value={returnPaymentMethod} onValueChange={setReturnPaymentMethod}>
                    <SelectTrigger id="payment-mode" className="h-10 text-xs sm:text-sm rounded-[6px] bg-white dark:bg-card border-[#E2E8F0] dark:border-border text-slate-800 dark:text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[8px] border-[#E2E8F0]">
                      <SelectItem value="cash">Cash Counter</SelectItem>
                      <SelectItem value="upi">UPI / QR Code</SelectItem>
                      <SelectItem value="card">Credit / Debit Card</SelectItem>
                      <SelectItem value="net_banking">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons with 42px Touch Targets */}
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReturnModalOpen(false)}
                  className="w-full sm:w-auto min-h-[42px] rounded-[6px] text-xs font-semibold border-[#E2E8F0] dark:border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  className="w-full sm:w-auto min-h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-[6px] shadow-xs gap-1.5"
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
              <Receipt className="w-5 h-5 text-primary" aria-hidden="true" />
              <span>Rental Record & Details</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-mono">
              #{selectedBooking?.booking_number}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Thermal Invoice Preview Card matching requested template */}
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 sm:p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-zinc-200">
                    <Receipt className="w-4 h-4 text-primary" />
                    <span>POS / Thermal Invoice Layout</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyReceipt(generateRentalReceiptText(selectedBooking))}
                    className="h-7 px-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg gap-1.5 font-semibold cursor-pointer"
                  >
                    {copiedReceipt ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </Button>
                </div>

                <div
                  style={{ fontFamily: "'Courier New', Courier, Consolas, monospace" }}
                  className="bg-slate-50 dark:bg-black/90 text-slate-900 dark:text-emerald-400 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 text-[11px] sm:text-xs leading-relaxed overflow-x-auto whitespace-pre select-all shadow-inner tracking-normal"
                >
                  {generateRentalReceiptText(selectedBooking)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewDetailsOpen(false)}
                  className="w-full sm:w-auto min-h-[44px] text-xs rounded-xl cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => printThermalReceipt(generateRentalReceiptText(selectedBooking), selectedBooking.booking_number)}
                  className="w-full sm:w-auto min-h-[44px] text-xs rounded-xl gap-2 font-bold gradient-brand text-white shadow-sm shadow-primary/25 cursor-pointer"
                >
                  <Printer className="w-4 h-4" aria-hidden="true" />
                  <span>Print Rental Invoice</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
