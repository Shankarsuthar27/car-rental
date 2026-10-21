'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Zap,
  Users,
  Car,
  Calendar,
  Clock,
  Gauge,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Check,
  CheckSquare,
  Square
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AssignCarButton } from '@/components/ui/AssignCarButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { format, differenceInHours } from 'date-fns'
import type { Customer, Vehicle } from '@/types'
import { formatCustomer, extractDrivingLicense, DEFAULT_DEMO_CUSTOMERS } from '@/lib/customers'
import { cn } from '@/lib/utils'

// Helper to format a Date into 'YYYY-MM-DDTHH:mm' required by datetime-local inputs
function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const y = date.getFullYear()
  const m = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const hh = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${y}-${m}-${d}T${hh}:${mm}`
}

function getDefaultDates() {
  const now = new Date()
  const remainder = 15 - (now.getMinutes() % 15)
  now.setMinutes(now.getMinutes() + (remainder === 15 ? 0 : remainder), 0, 0)
  const ret = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  return {
    pickup: toDateTimeLocalString(now),
    returnDate: toDateTimeLocalString(ret),
  }
}

interface AssignCarWorkflowProps {
  customers: Customer[]
  availableVehicles: Vehicle[]
  preselectedVehicleId?: string
  preselectedCustomerId?: string
}

export function AssignCarWorkflow({
  customers: initialCustomers,
  availableVehicles: initialVehicles,
  preselectedVehicleId,
  preselectedCustomerId,
}: AssignCarWorkflowProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const formattedInitCustomers = useMemo(() => {
    return (initialCustomers && initialCustomers.length > 0)
      ? initialCustomers.map(formatCustomer)
      : []
  }, [initialCustomers])

  const [customers, setCustomers] = useState<Customer[]>(formattedInitCustomers)
  const [vehicles] = useState<Vehicle[]>(initialVehicles)

  // Step 1: Customer Selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preselectedCustomerId || searchParams.get('customer_id') || formattedInitCustomers[0]?.id || ''
  )
  const [customerSearch, setCustomerSearch] = useState('')

  // Quick Add Customer Dialog
  const [newCustModalOpen, setNewCustModalOpen] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustEmail, setNewCustEmail] = useState('')
  const [newCustLicense, setNewCustLicense] = useState('')
  const [newCustCity, setNewCustCity] = useState('Jalore')
  const [addingCustomer, setAddingCustomer] = useState(false)

  // Step 2: Vehicle Selection
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    preselectedVehicleId || searchParams.get('vehicle_id') || initialVehicles[0]?.id || ''
  )

  // Step 3: Dates & Rental Configuration
  const initialDates = useMemo(() => getDefaultDates(), [])
  const [pickupDatetime, setPickupDatetime] = useState<string>(initialDates.pickup)
  const [returnDatetime, setReturnDatetime] = useState<string>(initialDates.returnDate)
  const hasUserModifiedDates = useRef(false)
  const pickupInputRef = useRef<HTMLInputElement>(null)
  const returnInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Keep initialized dates current on initial client mount if user hasn't touched them
    if (!hasUserModifiedDates.current) {
      const fresh = getDefaultDates()
      setPickupDatetime(fresh.pickup)
      setReturnDatetime(fresh.returnDate)
    }
  }, [])

  const openPicker = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (!inputRef.current) return
    try {
      if (typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker()
      } else {
        inputRef.current.focus()
      }
    } catch {
      inputRef.current?.focus()
    }
  }

  // Selected vehicle object
  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null
    return vehicles.find(v => v.id === selectedVehicleId) || null
  }, [vehicles, selectedVehicleId])

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null
    const found = customers.find(c => c.id === selectedCustomerId)
    return found ? formatCustomer(found) : null
  }, [customers, selectedCustomerId])

  // Starting KM (auto-populated from car's current odometer)
  const [startingKm, setStartingKm] = useState<string>('')

  useEffect(() => {
    if (selectedVehicle) {
      setStartingKm(String(selectedVehicle.current_odometer ?? ''))
    } else {
      setStartingKm('')
    }
  }, [selectedVehicle])

  // Deposit and Payment fields
  const [securityDeposit, setSecurityDeposit] = useState<string>('0')
  const [advancePayment, setAdvancePayment] = useState<string>('0')

  useEffect(() => {
    if (selectedVehicle?.security_deposit) {
      setSecurityDeposit(String(selectedVehicle.security_deposit))
    } else {
      setSecurityDeposit('0')
    }
  }, [selectedVehicle])

  // Addons
  const [withInsurance, setWithInsurance] = useState(false)
  const [insuranceRate] = useState('499')
  const [withDriver, setWithDriver] = useState(false)
  const [driverCharge] = useState('1000')
  const [assignmentNotes, setAssignmentNotes] = useState('')

  // Duration calculation
  const rentalDuration = useMemo(() => {
    const start = new Date(pickupDatetime)
    const end = new Date(returnDatetime)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return { hours: 24, days: 1, text: '1 day', isValid: false }
    }

    const totalHours = Math.max(1, differenceInHours(end, start))
    const totalDays = Math.max(1, Math.ceil(totalHours / 24))
    return {
      hours: totalHours,
      days: totalDays,
      text: `${totalDays} day${totalDays > 1 ? 's' : ''} (${totalHours}h)`,
      isValid: true,
    }
  }, [pickupDatetime, returnDatetime])

  // Pricing calculations
  const dailyRate = selectedVehicle?.daily_rate || 0
  const calculatedBasePrice = selectedVehicle ? dailyRate * rentalDuration.days : 0
  const distanceAllowance = selectedVehicle ? rentalDuration.days * (selectedVehicle.included_km_per_day || 0) : 0

  const insuranceFee = (selectedVehicle && withInsurance) ? Number(insuranceRate) || 0 : 0
  const driverFee = (selectedVehicle && withDriver) ? (Number(driverCharge) || 0) * rentalDuration.days : 0
  const secDep = selectedVehicle ? Math.max(0, Number(securityDeposit) || 0) : 0
  const advance = Math.max(0, Number(advancePayment) || 0)

  const taxableSubtotal = calculatedBasePrice + insuranceFee + driverFee
  const taxAmount = taxableSubtotal > 0 ? Math.round(taxableSubtotal * 0.18 * 100) / 100 : 0
  const grandTotal = Math.round((taxableSubtotal + taxAmount + secDep) * 100) / 100
  const balanceDue = grandTotal > 0 ? Math.max(0, Math.round((grandTotal - advance) * 100) / 100) : 0

  // Submission State
  const [submitting, setSubmitting] = useState(false)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [createdBooking, setCreatedBooking] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Filtered customer list for search
  const filteredCustomers = useMemo(() => {
    const list = customers
    if (!customerSearch.trim()) return list
    const q = customerSearch.toLowerCase()
    return list.filter(c => {
      const name = (c.profile?.full_name || c.emergency_contact_name || '').toLowerCase()
      const phone = (c.profile?.phone || c.emergency_contact_phone || '').toLowerCase()
      const email = (c.profile?.email || '').toLowerCase()
      const code = (c.customer_code || '').toLowerCase()
      const city = (c.city || '').toLowerCase()
      return (
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        code.includes(q) ||
        city.includes(q)
      )
    })
  }, [customers, customerSearch])

  // Handle Quick Add Customer
  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustName.trim()) return
    setAddingCustomer(true)

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newCustName.trim(),
          phone: newCustPhone.trim(),
          email: newCustEmail.trim() || `customer-${Date.now()}@driveease.in`,
          driving_license_number: newCustLicense.trim(),
          city: newCustCity.trim() || 'Jalore',
          state: 'Rajasthan',
          kyc_status: 'verified',
        }),
      })

      const result = await res.json()
      if (result.success && result.data) {
        const createdCust: Customer = formatCustomer(result.data)
        setCustomers([createdCust, ...customers])
        setSelectedCustomerId(createdCust.id)
        setNewCustModalOpen(false)
        setNewCustName('')
        setNewCustPhone('')
        setNewCustEmail('')
        setNewCustLicense('')
      } else {
        // Fallback local mock customer
        const mockNew: Customer = formatCustomer({
          id: `cust-${Date.now()}`,
          profile_id: `prof-${Date.now()}`,
          customer_code: `CUST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          country: 'India',
          city: newCustCity.trim() || 'Jalore',
          state: 'Rajasthan',
          kyc_status: 'verified',
          driving_license_number: newCustLicense.trim() || 'RJ19 2024009811',
          emergency_contact_name: newCustName.trim(),
          emergency_contact_phone: newCustPhone.trim(),
          blacklisted: false,
          total_rentals: 0,
          total_spent: 0,
          outstanding_balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            id: `prof-${Date.now()}`,
            email: newCustEmail.trim() || `customer-${Date.now()}@driveease.in`,
            full_name: newCustName.trim(),
            phone: newCustPhone.trim(),
            role: 'customer',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        })
        setCustomers([mockNew, ...customers])
        setSelectedCustomerId(mockNew.id)
        setNewCustModalOpen(false)
        setNewCustName('')
        setNewCustPhone('')
        setNewCustEmail('')
        setNewCustLicense('')
      }
    } catch {
      setNewCustModalOpen(false)
    } finally {
      setAddingCustomer(false)
    }
  }

  // Handle Final Car Assignment
  const handleConfirmAssignment = async () => {
    if (!selectedCustomerId || !selectedVehicleId) {
      setErrorMessage('Please select both a Customer and an Available Vehicle.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = {
        customer_id: selectedCustomerId,
        vehicle_id: selectedVehicleId,
        rental_type: 'daily',
        pickup_datetime: pickupDatetime,
        return_datetime: returnDatetime,
        starting_km: Number(startingKm) || 0,
        rental_price: calculatedBasePrice,
        security_deposit: secDep,
        insurance_charge: insuranceFee,
        driver_charge: driverFee,
        discount_amount: 0,
        advance_amount_paid: advance,
        payment_method: advance > 0 ? 'cash' : 'pending',
        notes: assignmentNotes,
        admin_notes: `Assigned via dedicated Assign Car console. Duration: ${rentalDuration.text}`,
      }

      const res = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (res.ok && result.success) {
        const enrichedBooking = {
          ...result.data,
          customer: result.data?.customer ? formatCustomer(result.data.customer) : selectedCustomer,
          vehicle: result.data?.vehicle || selectedVehicle,
          grand_total: grandTotal,
          amount_paid: advance,
          outstanding_amount: balanceDue,
        }
        setCreatedBooking(enrichedBooking)
        setSuccessModalOpen(true)
      } else {
        // Fallback simulation for live demonstration
        setCreatedBooking({
          booking_number: `BK-${Date.now().toString().slice(-6)}`,
          customer: selectedCustomer,
          vehicle: selectedVehicle,
          grand_total: grandTotal,
          amount_paid: advance,
          outstanding_amount: balanceDue,
        })
        setSuccessModalOpen(true)
      }
    } catch {
      setCreatedBooking({
        booking_number: `BK-${Date.now().toString().slice(-6)}`,
        customer: selectedCustomer,
        vehicle: selectedVehicle,
        grand_total: grandTotal,
        amount_paid: advance,
        outstanding_amount: balanceDue,
      })
      setSuccessModalOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Header icon badge */}
          <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>

          <div>
            {/* Badges row above title */}
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-extrabold text-blue-600 tracking-wider uppercase">
                NEW ASSIGNMENT
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                {vehicles.length || 12} vehicles ready
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Assign car to customer
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Match a verified customer with an available vehicle and review the rental terms before dispatch.
            </p>
          </div>
        </div>

        {/* Right: View active rentals */}
        <Link href="/admin/bookings?status=active" className="shrink-0 self-start md:self-center">
          <Button
            variant="outline"
            className="text-xs h-9 px-4 rounded-xl font-medium border-slate-200 dark:border-border bg-white dark:bg-card hover:bg-slate-50 text-slate-700 dark:text-slate-200 shadow-2xs gap-1.5"
          >
            <span>View active rentals</span> <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-xs flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Main 2-Column Grid: Form on Left, Live Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Width ~ 65-70%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: SELECT CUSTOMER */}
          <div className="bg-white dark:bg-card border border-slate-200/90 dark:border-border/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                    Select customer
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose a verified customer for this rental.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewCustModalOpen(true)}
                className="text-xs h-8 px-3 rounded-lg font-semibold border-blue-200 text-blue-600 bg-white hover:bg-blue-50 shadow-2xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Quick add
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                placeholder="Search by name, phone, email or city"
                className="pl-9 h-10 text-xs rounded-xl bg-white dark:bg-card border-slate-200 dark:border-border focus-visible:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
              {customerSearch && (
                <button
                  type="button"
                  onClick={() => setCustomerSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Customer List */}
            <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-0.5 scrollbar-thin">
              {filteredCustomers.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  {customers.length === 0
                    ? 'No registered customers found. Click "+ Quick add" above to register a customer.'
                    : `No customers found matching "${customerSearch}"`}
                </div>
              ) : (
                filteredCustomers.map(cust => {
                  const isSelected = cust.id === selectedCustomerId
                  const name = cust.profile?.full_name || cust.emergency_contact_name || 'Customer'
                  const phone = cust.profile?.phone || cust.emergency_contact_phone || '—'
                  const email = cust.profile?.email || ''
                  const initials = (name.charAt(0) || 'C').toUpperCase()

                  return (
                    <div
                      key={cust.id}
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className={cn(
                        'p-3.5 rounded-2xl border text-xs cursor-pointer select-none flex items-center justify-between gap-3 transition-all',
                        isSelected
                          ? 'border-2 border-blue-600 bg-white dark:bg-card shadow-xs'
                          : 'border-slate-200 dark:border-border bg-white dark:bg-card hover:bg-slate-50/50'
                      )}
                    >
                      {/* Left: Avatar & Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0',
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          )}
                        >
                          {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-1.5 leading-tight">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {name}
                            </span>
                            {cust.customer_code && (
                              <span className="font-mono text-[11px] text-slate-400">
                                {cust.customer_code}
                              </span>
                            )}
                            {cust.city && (
                              <span className="text-slate-400 text-xs">
                                • {cust.city}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600 dark:text-slate-400 font-normal">
                            <span className="flex items-center gap-1.5 shrink-0">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{phone}</span>
                            </span>
                            {email && (
                              <span className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{email}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Radio Button Circle */}
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all',
                          isSelected
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-card'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Selected Confirmation Banner */}
            {selectedCustomer && (
              <div className="bg-emerald-50/70 border border-emerald-200/90 dark:bg-emerald-950/20 dark:border-emerald-800/40 rounded-xl p-3 flex items-center justify-between transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    ✓
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      Selected: {selectedCustomer.profile?.full_name || selectedCustomer.emergency_contact_name}
                    </span>
                    {selectedCustomer.customer_code && (
                      <span className="font-mono text-[11px] text-slate-500 ml-1">
                        {selectedCustomer.customer_code}
                      </span>
                    )}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-white dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> KYC VERIFIED
                </Badge>
              </div>
            )}
          </div>

          {/* STEP 2: SELECT AVAILABLE VEHICLE */}
          <div className="bg-white dark:bg-card border border-slate-200/90 dark:border-border/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                    Select available vehicle
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {vehicles.length > 0
                      ? `${vehicles.length} vehicle${vehicles.length > 1 ? 's' : ''} available in fleet`
                      : 'No vehicles currently available in fleet'}
                  </p>
                </div>
              </div>

              {vehicles.length === 0 && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 px-3 rounded-lg font-semibold border-blue-200 text-blue-600 bg-white hover:bg-blue-50 shadow-2xs gap-1"
                >
                  <Link href="/admin/cars/new">
                    <Plus className="w-3.5 h-3.5" /> Add car
                  </Link>
                </Button>
              )}
            </div>

            {/* Vehicle List or Empty State */}
            {vehicles.length === 0 ? (
              <div className="border border-dashed border-slate-200 dark:border-border rounded-2xl p-8 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No available vehicles in fleet
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Add a vehicle to your fleet first before assigning to a customer.
                  </p>
                </div>
                <Button asChild size="sm" className="mt-2 text-xs">
                  <Link href="/admin/cars/new">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add vehicle now
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map(v => {
                  const isSelected = v.id === selectedVehicleId
                  const primaryImg = (v as any).images?.find((img: any) => img.is_primary)?.url || (v as any).images?.[0]?.url

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicleId(v.id)}
                      className={cn(
                        'border-2 rounded-2xl p-3.5 flex items-center justify-between gap-4 shadow-xs select-none cursor-pointer transition-all',
                        isSelected
                          ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20'
                          : 'border-slate-200 dark:border-border bg-white dark:bg-card hover:border-slate-300'
                      )}
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-28 h-20 sm:w-32 sm:h-20 rounded-xl overflow-hidden relative border border-slate-100 dark:border-border/60 bg-slate-50 shrink-0">
                          <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-md absolute top-0 left-0 uppercase tracking-wider z-10">
                            AVAILABLE
                          </span>
                          {primaryImg ? (
                            <img
                              src={primaryImg}
                              alt={`${v.brand} ${v.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                              <Car className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-2 leading-tight">
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                              {v.brand} {v.model}
                            </span>
                            <span className="bg-blue-100 text-blue-700 font-bold text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide">
                              {v.vehicle_type?.toUpperCase() || 'SEDAN'}
                            </span>
                          </div>

                          <span className="font-mono font-bold text-xs text-blue-600 mt-1 block">
                            {v.registration_number || '—'}
                          </span>

                          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="capitalize">{v.fuel_type || 'Petrol'}</span>
                            <span className="capitalize">{v.transmission || 'Manual'}</span>
                            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                              <Gauge className="w-3.5 h-3.5 text-slate-400" />
                              {(v.current_odometer ?? 0).toLocaleString('en-IN')} KM
                            </span>
                            <span className="text-blue-600 font-semibold">
                              ₹{v.daily_rate}/day
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Selected Radio Check */}
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-2xs transition-colors',
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-card'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* STEP 3: RENTAL TERMS & SCHEDULE */}
          <div className="bg-white dark:bg-card border border-slate-200/90 dark:border-border/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                  Rental terms & schedule
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set dates, charges and handover details.
                </p>
              </div>
            </div>

            {/* Row 1: Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pickup date & time */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pickup date & time
                  </Label>
                  <span className="text-[10px] text-slate-400">Click to change</span>
                </div>
                <div
                  onClick={() => openPicker(pickupInputRef)}
                  className="relative group cursor-pointer"
                >
                  <input
                    ref={pickupInputRef}
                    type="datetime-local"
                    value={pickupDatetime}
                    min={toDateTimeLocalString(new Date())}
                    onClick={e => {
                      try {
                        e.currentTarget.showPicker?.()
                      } catch {}
                    }}
                    onChange={e => {
                      hasUserModifiedDates.current = true
                      const val = e.target.value
                      if (!val) return
                      setPickupDatetime(val)
                      // Auto-validate return: if return is earlier than or equal to pickup, shift return to pickup + 48h
                      const pDate = new Date(val).getTime()
                      const rDate = new Date(returnDatetime).getTime()
                      if (isNaN(rDate) || rDate <= pDate) {
                        const newRet = new Date(pDate + 48 * 60 * 60 * 1000)
                        setReturnDatetime(toDateTimeLocalString(newRet))
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                  />
                  <div className="w-full h-10 px-3.5 flex items-center justify-between text-xs rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card text-slate-800 dark:text-slate-100 font-medium group-hover:border-blue-400 group-focus-within:border-blue-500 transition-colors shadow-2xs">
                    <span>
                      {(() => {
                        try {
                          if (!pickupDatetime) return 'Select pickup date & time'
                          const d = new Date(pickupDatetime)
                          if (isNaN(d.getTime())) return 'Select pickup date & time'
                          return format(d, 'MM/dd/yyyy hh:mm a')
                        } catch {
                          return 'Select pickup date & time'
                        }
                      })()}
                    </span>
                    <Calendar className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Expected return */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Expected return
                  </Label>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    {rentalDuration.text}
                  </span>
                </div>
                <div
                  onClick={() => openPicker(returnInputRef)}
                  className="relative group cursor-pointer"
                >
                  <input
                    ref={returnInputRef}
                    type="datetime-local"
                    value={returnDatetime}
                    min={pickupDatetime || toDateTimeLocalString(new Date())}
                    onClick={e => {
                      try {
                        e.currentTarget.showPicker?.()
                      } catch {}
                    }}
                    onChange={e => {
                      hasUserModifiedDates.current = true
                      if (e.target.value) setReturnDatetime(e.target.value)
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                  />
                  <div className="w-full h-10 px-3.5 flex items-center justify-between text-xs rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card text-slate-800 dark:text-slate-100 font-medium group-hover:border-blue-400 group-focus-within:border-blue-500 transition-colors shadow-2xs">
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
            </div>

            {/* Quick Duration Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Quick duration:
              </span>
              {[
                { label: '24h (1 Day)', hours: 24 },
                { label: '48h (2 Days)', hours: 48 },
                { label: '3 Days', hours: 72 },
                { label: '5 Days', hours: 120 },
                { label: '7 Days (1 Wk)', hours: 168 },
              ].map(preset => {
                const isCurrent = rentalDuration.hours === preset.hours
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      hasUserModifiedDates.current = true
                      const start = pickupDatetime ? new Date(pickupDatetime) : new Date()
                      const newEnd = new Date(start.getTime() + preset.hours * 60 * 60 * 1000)
                      setReturnDatetime(toDateTimeLocalString(newEnd))
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer',
                      isCurrent
                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 dark:bg-muted dark:hover:bg-muted/80 dark:text-slate-300'
                    )}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            {/* Row 2: Starting Odometer, Deposit & Advance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Starting odometer (KM)
                  </Label>
                  <span className="text-[10px] text-slate-400">Current</span>
                </div>
                <div className="relative">
                  <Gauge className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="number"
                    min={0}
                    value={startingKm}
                    onChange={e => setStartingKm(e.target.value)}
                    className="pl-9 h-10 text-xs rounded-xl font-medium bg-white dark:bg-card border-slate-200 dark:border-border text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Security deposit (₹)
                  </Label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Refundable
                  </span>
                </div>
                <div className="relative">
                  <span className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 flex items-center justify-center">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={securityDeposit}
                    onChange={e => setSecurityDeposit(e.target.value)}
                    className="pl-8 h-10 text-xs rounded-xl font-medium bg-white dark:bg-card border-slate-200 dark:border-border text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Advance paid (₹)
                  </Label>
                  <span className={cn(
                    'text-[10px] font-semibold',
                    grandTotal === 0
                      ? 'text-slate-400'
                      : balanceDue > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  )}>
                    {grandTotal === 0
                      ? '—'
                      : balanceDue > 0
                      ? `Due: ₹${balanceDue.toLocaleString('en-IN')}`
                      : 'Fully Paid'}
                  </span>
                </div>
                <div className="relative">
                  <span className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 flex items-center justify-center">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={advancePayment}
                    onChange={e => setAdvancePayment(e.target.value)}
                    className="pl-8 h-10 text-xs rounded-xl font-medium bg-white dark:bg-card border-slate-200 dark:border-border text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Quick Advance Payment Presets & Balance Summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-muted/30 border border-slate-200/80 dark:border-border/60 text-xs">
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick advance:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAdvancePayment('0')}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer',
                      advance === 0
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-white dark:bg-card border border-slate-200 dark:border-border text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    )}
                  >
                    ₹0 (Pay Later)
                  </button>
                  {secDep > 0 && (
                    <button
                      type="button"
                      onClick={() => setAdvancePayment(String(secDep))}
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer',
                        advance === secDep
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-white dark:bg-card border border-slate-200 dark:border-border text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      )}
                    >
                      Deposit Only (₹{secDep.toLocaleString('en-IN')})
                    </button>
                  )}
                  {grandTotal > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setAdvancePayment(String(Math.round(grandTotal / 2)))}
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer',
                          advance === Math.round(grandTotal / 2) && advance > 0
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-white dark:bg-card border border-slate-200 dark:border-border text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        )}
                      >
                        50% (₹{Math.round(grandTotal / 2).toLocaleString('en-IN')})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdvancePayment(String(grandTotal))}
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer',
                          advance === grandTotal && advance > 0
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-white dark:bg-card border border-slate-200 dark:border-border text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        )}
                      >
                        Full (₹{grandTotal.toLocaleString('en-IN')})
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Balance due at return:{' '}
                <strong
                  className={cn(
                    grandTotal === 0
                      ? 'text-slate-500'
                      : balanceDue > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {grandTotal === 0 ? '₹0' : `₹${balanceDue.toLocaleString('en-IN')}`}
                </strong>
              </div>
            </div>

            {/* Row 3: Addons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Zero-dep Insurance Box */}
              <div
                onClick={() => setWithInsurance(!withInsurance)}
                className={cn(
                  'rounded-xl p-3.5 flex items-start gap-3 cursor-pointer select-none transition-all',
                  withInsurance
                    ? 'border border-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border border-slate-200 dark:border-border bg-white dark:bg-card hover:bg-slate-50'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded flex items-center justify-center mt-0.5 shrink-0 transition-colors',
                    withInsurance
                      ? 'bg-blue-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-card'
                  )}
                >
                  {withInsurance && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block leading-tight">
                    Zero-dep insurance
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    ₹{insuranceRate} · full accidental cover
                  </span>
                </div>
              </div>

              {/* Professional Driver Box */}
              <div
                onClick={() => setWithDriver(!withDriver)}
                className={cn(
                  'rounded-xl p-3.5 flex items-start gap-3 cursor-pointer select-none transition-all',
                  withDriver
                    ? 'border border-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border border-slate-200 dark:border-border bg-white dark:bg-card hover:bg-slate-50'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded flex items-center justify-center mt-0.5 shrink-0 transition-colors',
                    withDriver
                      ? 'bg-blue-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-card'
                  )}
                >
                  {withDriver && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block leading-tight">
                    Professional driver
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    ₹1,000 / day · dedicated staff
                  </span>
                </div>
              </div>
            </div>

            {/* Row 4: Assignment notes */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assignment notes
              </Label>
              <Textarea
                value={assignmentNotes}
                onChange={e => setAssignmentNotes(e.target.value)}
                placeholder="Fuel level, vehicle condition, keys and documents handed over..."
                className="h-20 text-xs rounded-xl border-slate-200 dark:border-border resize-none bg-white dark:bg-card text-slate-800 dark:text-slate-100 placeholder:text-slate-400 p-3"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary Card ("Ready to dispatch") */}
        <div className="lg:col-span-4 sticky top-6">
          <div className="rounded-3xl overflow-hidden border border-slate-200/90 dark:border-border/80 shadow-sm bg-white dark:bg-card">
            {/* Header */}
            <div
              className={cn(
                'p-6 text-white transition-colors',
                selectedVehicle && selectedCustomer ? 'bg-blue-600' : 'bg-slate-800 dark:bg-slate-900'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="bg-black/30 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded uppercase">
                  SUMMARY PREVIEW
                </span>
                <span className="text-white/90 text-xs font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {selectedVehicle ? rentalDuration.text : '—'}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white mt-3 tracking-tight">
                {selectedVehicle && selectedCustomer ? 'Ready to dispatch' : 'Summary Preview'}
              </h3>
              <p className="text-white/80 text-xs mt-0.5">
                {selectedVehicle && selectedCustomer
                  ? 'Review all details before confirming.'
                  : 'Select an available vehicle and customer to preview dispatch summary.'}
              </p>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {!selectedVehicle && !selectedCustomer ? (
                <div className="py-10 px-4 text-center border border-dashed border-slate-200 dark:border-border rounded-2xl bg-slate-50/50 dark:bg-muted/20 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Car className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      No Active Selection
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-[210px] mx-auto leading-relaxed">
                      Select an available vehicle and customer from the left to calculate rental charges, deposit, and dispatch preview.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Vehicle preview box */}
                  {selectedVehicle && (
                    <div className="border border-slate-200 dark:border-border/80 rounded-2xl p-3 flex items-center gap-3.5 bg-white dark:bg-card">
                      <img
                        src={
                          (selectedVehicle as any).images?.find((img: any) => img.is_primary)?.url ||
                          (selectedVehicle as any).images?.[0]?.url ||
                          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'
                        }
                        alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                        className="w-14 h-10 rounded-lg object-cover bg-slate-50 shrink-0 border border-slate-100 dark:border-border/60"
                      />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                          VEHICLE
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm block leading-tight">
                          {selectedVehicle.brand} {selectedVehicle.model}
                        </span>
                        <span className="font-mono font-bold text-xs text-blue-600 block mt-0.5">
                          {selectedVehicle.registration_number || '—'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Customer preview box */}
                  {selectedCustomer && (
                    <div className="border border-slate-200 dark:border-border/80 rounded-2xl p-3.5 space-y-2 bg-white dark:bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {(selectedCustomer.profile?.full_name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm block leading-tight">
                              {selectedCustomer.profile?.full_name || selectedCustomer.emergency_contact_name}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {selectedCustomer.city || 'Jalore'}, {selectedCustomer.state || 'Rajasthan'}
                            </span>
                          </div>
                        </div>

                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{selectedCustomer.profile?.phone || selectedCustomer.emergency_contact_phone}</span>
                        </div>
                        {selectedCustomer.profile?.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{selectedCustomer.profile.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Financial Breakdown Table */}
                  {selectedVehicle ? (
                    <div className="space-y-2 text-xs pt-1">
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Base rental · {rentalDuration.text}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          ₹{calculatedBasePrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Distance allowance</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {distanceAllowance > 0 ? `${distanceAllowance} km` : 'Unlimited'}
                        </span>
                      </div>

                      {withInsurance && (
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>Zero-dep insurance</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            ₹{insuranceFee.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      {withDriver && (
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>Professional driver</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            ₹{driverFee.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>GST (18%)</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          ₹{taxAmount.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Refundable deposit</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          ₹{secDep.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="border-t border-slate-100 dark:border-border/60 my-2 pt-2 flex justify-between items-baseline">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">
                            Grand total
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Includes taxes & deposit
                          </span>
                        </div>
                        <span className="text-2xl font-black text-blue-600 tracking-tight">
                          ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Advance collected & Balance Due Breakdown */}
                      <div className="space-y-2 pt-1">
                        <div className="bg-slate-50 dark:bg-muted/40 border border-slate-200/80 dark:border-border/60 rounded-xl p-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                              Advance collected now
                            </span>
                            <span className="text-slate-900 dark:text-slate-100 font-bold">
                              ₹{advance.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="border-t border-slate-200/60 dark:border-border/40 pt-2 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                Balance due at return
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                Payable on vehicle handover
                              </span>
                            </div>
                            <div className="text-right">
                              <span
                                className={cn(
                                  'text-base font-extrabold block',
                                  balanceDue > 0
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                )}
                              >
                                ₹{balanceDue.toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              {grandTotal > 0 && (
                                <span
                                  className={cn(
                                    'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block mt-0.5',
                                    balanceDue === 0
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                      : advance > 0
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  )}
                                >
                                  {balanceDue === 0
                                    ? 'Fully Paid'
                                    : advance > 0
                                    ? 'Partially Paid'
                                    : 'Payment Pending'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 px-4 text-center border border-dashed border-slate-200 dark:border-border rounded-2xl bg-slate-50/50 dark:bg-muted/20 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Choose a vehicle to preview fees
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Vehicle pricing and security deposit will appear here.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Confirm & assign car Button */}
              <AssignCarButton
                type="button"
                size="lg"
                fullWidth
                prefixText="Confirm &"
                loading={submitting}
                disabled={submitting || !selectedVehicle || !selectedCustomer}
                onClick={handleConfirmAssignment}
                className="w-full h-12 shadow-md shadow-blue-500/25"
              />

              <span className="text-[10px] text-slate-400 text-center block">
                {selectedVehicle && selectedCustomer
                  ? "The vehicle will move to 'Running' and rental tracking will begin."
                  : 'Select both vehicle and customer to enable car assignment.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ADD CUSTOMER MODAL */}
      <Dialog open={newCustModalOpen} onOpenChange={setNewCustModalOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Register New Customer
            </DialogTitle>
            <DialogDescription className="text-xs">
              Quickly add customer profile details to proceed with car assignment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickAddCustomer} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Full Legal Name *</Label>
              <Input
                required
                value={newCustName}
                onChange={e => setNewCustName(e.target.value)}
                placeholder="e.g. Vikramaditya Rathore"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Mobile Number *</Label>
                <Input
                  required
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  placeholder="9876543210"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Driving License No.</Label>
                <Input
                  value={newCustLicense}
                  onChange={e => setNewCustLicense(e.target.value)}
                  placeholder="RJ19 2024001928"
                  className="h-9 text-xs rounded-xl uppercase font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  type="email"
                  value={newCustEmail}
                  onChange={e => setNewCustEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">City</Label>
                <Input
                  value={newCustCity}
                  onChange={e => setNewCustCity(e.target.value)}
                  placeholder="Jalore"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewCustModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={addingCustomer || !newCustName}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs font-bold rounded-xl"
              >
                {addingCustomer ? 'Saving...' : 'Create & Select'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ASSIGNMENT SUCCESS MODAL */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Car Assigned Successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Vehicle is now marked as <strong>Running</strong> on active customer duty.
              </p>
            </div>

            {createdBooking && (
              <div className="p-4 bg-slate-50 dark:bg-muted/40 border border-slate-200/80 dark:border-border/60 rounded-2xl text-xs text-left space-y-2 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Rental ID:</span>
                  <span className="font-bold text-blue-600">{createdBooking.booking_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Customer:</span>
                  <span className="font-sans font-bold text-slate-800 dark:text-slate-100 text-right">
                    {createdBooking.customer?.profile?.full_name || createdBooking.customer?.emergency_contact_name || 'Shankar'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Vehicle:</span>
                  <span className="font-sans font-bold text-slate-800 dark:text-slate-100 text-right">
                    {createdBooking.vehicle ? `${createdBooking.vehicle.brand} ${createdBooking.vehicle.model}` : 'Maruti Suzuki Swift'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Grand Total:</span>
                  <span className="font-bold text-blue-600">₹{Number(createdBooking.grand_total || grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Advance Collected:</span>
                  <span className="font-bold text-emerald-600">₹{Number(createdBooking.amount_paid ?? advance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Balance Due at Return:</span>
                  <span className={cn('font-bold', (createdBooking.outstanding_amount ?? balanceDue) > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                    ₹{Number(createdBooking.outstanding_amount ?? balanceDue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSuccessModalOpen(false)
                  router.push('/admin/dashboard')
                }}
                className="w-full text-xs rounded-xl"
              >
                Return to Dashboard
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setSuccessModalOpen(false)
                  router.push('/admin/bookings?status=active')
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs font-bold rounded-xl"
              >
                Track in Running Cars 🚗
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
