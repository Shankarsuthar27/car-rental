'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Users,
  Car,
  Calendar,
  Clock,
  Gauge,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  ArrowRight,
  Phone,
  Mail,
  FileCheck2,
  Sparkles,
  Info,
  Check,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { format, addDays, addHours, differenceInHours, differenceInDays } from 'date-fns'
import type { Customer, Vehicle } from '@/types'
import { formatCustomer, extractDrivingLicense, DEFAULT_DEMO_CUSTOMERS } from '@/lib/customers'
import { cn } from '@/lib/utils'

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
      : DEFAULT_DEMO_CUSTOMERS
  }, [initialCustomers])

  const [customers, setCustomers] = useState<Customer[]>(formattedInitCustomers)
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)

  // Step 1: Customer Selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preselectedCustomerId || searchParams.get('customer_id') || (formattedInitCustomers[0]?.id ?? '')
  )
  const [customerSearch, setCustomerSearch] = useState('')

  // Inline Quick Add Customer Dialog
  const [newCustModalOpen, setNewCustModalOpen] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustEmail, setNewCustEmail] = useState('')
  const [newCustLicense, setNewCustLicense] = useState('')
  const [newCustCity, setNewCustCity] = useState('Jaipur')
  const [addingCustomer, setAddingCustomer] = useState(false)

  // Step 2: Vehicle Selection
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    preselectedVehicleId || searchParams.get('vehicle_id') || (vehicles[0]?.id ?? '')
  )
  const [vehicleSearch, setVehicleSearch] = useState('')

  // Step 3: Rental Configuration
  const [rentalType, setRentalType] = useState<'daily' | 'hourly'>('daily')

  // Default dates: Start = now, Return = 2 days from now (or 6 hours for hourly)
  const now = new Date()
  const defaultPickup = format(now, "yyyy-MM-dd'T'HH:mm")
  const defaultReturnDaily = format(addDays(now, 2), "yyyy-MM-dd'T'HH:mm")
  const defaultReturnHourly = format(addHours(now, 6), "yyyy-MM-dd'T'HH:mm")

  const [pickupDatetime, setPickupDatetime] = useState(defaultPickup)
  const [returnDatetime, setReturnDatetime] = useState(defaultReturnDaily)

  // When switching rental type, adjust default return datetime
  const handleRentalTypeChange = (type: 'daily' | 'hourly') => {
    setRentalType(type)
    if (type === 'hourly') {
      setReturnDatetime(format(addHours(new Date(pickupDatetime), 6), "yyyy-MM-dd'T'HH:mm"))
    } else {
      setReturnDatetime(format(addDays(new Date(pickupDatetime), 2), "yyyy-MM-dd'T'HH:mm"))
    }
  }

  // Selected vehicle object
  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || null
  }, [vehicles, selectedVehicleId])

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    const found = customers.find(c => c.id === selectedCustomerId)
    return found ? formatCustomer(found) : null
  }, [customers, selectedCustomerId])

  // Starting KM (auto-populated from car's current odometer)
  const [startingKm, setStartingKm] = useState<string>('0')

  useEffect(() => {
    if (selectedVehicle) {
      setStartingKm(String(selectedVehicle.current_odometer || 0))
    }
  }, [selectedVehicle])

  // Pricing fields
  const [customPriceOverride, setCustomPriceOverride] = useState<string>('')
  const [securityDeposit, setSecurityDeposit] = useState<string>('10000')

  useEffect(() => {
    if (selectedVehicle) {
      setSecurityDeposit(String(selectedVehicle.security_deposit || 10000))
    }
  }, [selectedVehicle])

  // Additional options
  const [withInsurance, setWithInsurance] = useState(true)
  const [insuranceRate, setInsuranceRate] = useState('499')
  const [withDriver, setWithDriver] = useState(false)
  const [driverCharge, setDriverCharge] = useState('1000')
  const [discountAmount, setDiscountAmount] = useState('0')
  const [advancePayment, setAdvancePayment] = useState('5000')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [assignmentNotes, setAssignmentNotes] = useState('')

  // Duration & Auto Price Calculation
  const rentalDuration = useMemo(() => {
    const start = new Date(pickupDatetime)
    const end = new Date(returnDatetime)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return { hours: 0, days: 0, text: 'Invalid duration' }
    }

    const totalHours = Math.max(1, differenceInHours(end, start))
    const totalDays = Math.max(1, Math.ceil(totalHours / 24))

    if (rentalType === 'hourly') {
      return { hours: totalHours, days: totalDays, text: `${totalHours} Hours` }
    }
    return { hours: totalHours, days: totalDays, text: `${totalDays} Day${totalDays > 1 ? 's' : ''} (${totalHours}h)` }
  }, [pickupDatetime, returnDatetime, rentalType])

  const calculatedBasePrice = useMemo(() => {
    if (!selectedVehicle) return 0
    if (customPriceOverride && Number(customPriceOverride) > 0) {
      return Number(customPriceOverride)
    }

    if (rentalType === 'hourly') {
      const rate = selectedVehicle.hourly_rate || 150
      return Math.round(rate * Math.max(1, rentalDuration.hours))
    } else {
      const rate = selectedVehicle.daily_rate || 2000
      return Math.round(rate * Math.max(1, rentalDuration.days))
    }
  }, [selectedVehicle, customPriceOverride, rentalType, rentalDuration])

  // Financial summary
  const insuranceFee = withInsurance ? Number(insuranceRate) || 0 : 0
  const driverFee = withDriver ? Number(driverCharge) || 0 : 0
  const discount = Number(discountAmount) || 0
  const secDep = Number(securityDeposit) || 0

  const subtotal = Math.max(0, calculatedBasePrice + insuranceFee + driverFee - discount)
  const taxAmount = Math.round(subtotal * 0.18 * 100) / 100
  const grandTotal = Math.round((subtotal + taxAmount + secDep) * 100) / 100
  const advance = Number(advancePayment) || 0
  const balanceDue = Math.max(0, grandTotal - advance)

  // Submission State
  const [submitting, setSubmitting] = useState(false)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [createdBooking, setCreatedBooking] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Filtered customer list for search
  const filteredCustomers = useMemo(() => {
    const list = customers.length > 0 ? customers : DEFAULT_DEMO_CUSTOMERS
    if (!customerSearch.trim()) return list
    const q = customerSearch.toLowerCase()
    return list.filter(c => {
      const name = (c.profile?.full_name || c.emergency_contact_name || '').toLowerCase()
      const phone = (c.profile?.phone || c.emergency_contact_phone || '').toLowerCase()
      const email = (c.profile?.email || '').toLowerCase()
      const code = (c.customer_code || '').toLowerCase()
      const dl = (c.driving_license_number || extractDrivingLicense(c) || '').toLowerCase()
      const city = (c.city || '').toLowerCase()
      return (
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        code.includes(q) ||
        dl.includes(q) ||
        city.includes(q)
      )
    })
  }, [customers, customerSearch])

  // Filtered vehicle list for search
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch.trim()) return vehicles
    const q = vehicleSearch.toLowerCase()
    return vehicles.filter(v => {
      const model = `${v.brand} ${v.model}`.toLowerCase()
      const reg = v.registration_number.toLowerCase()
      const type = v.vehicle_type.toLowerCase()
      return model.includes(q) || reg.includes(q) || type.includes(q)
    })
  }, [vehicles, vehicleSearch])

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
          city: newCustCity.trim() || 'Jaipur',
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
        // Fallback local mock customer for immediate demo responsiveness
        const mockNew: Customer = formatCustomer({
          id: `cust-${Date.now()}`,
          profile_id: `prof-${Date.now()}`,
          customer_code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
          country: 'India',
          city: newCustCity.trim() || 'Jaipur',
          kyc_status: 'verified',
          driving_license_number: newCustLicense.trim() || 'RJ14 2024009811',
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
    } catch (err) {
      console.warn('Add customer failed:', err)
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
        rental_type: rentalType,
        pickup_datetime: pickupDatetime,
        return_datetime: returnDatetime,
        starting_km: Number(startingKm) || 0,
        rental_price: calculatedBasePrice,
        security_deposit: secDep,
        insurance_charge: insuranceFee,
        driver_charge: driverFee,
        discount_amount: discount,
        advance_amount_paid: advance,
        payment_method: paymentMethod,
        notes: assignmentNotes,
        admin_notes: `Assigned via dedicated Assign Car console. Duration: ${rentalDuration.text}`,
      }

      const res = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to assign car.')
      }

      const enrichedBooking = {
        ...result.data,
        customer: result.data?.customer ? formatCustomer(result.data.customer) : selectedCustomer,
        vehicle: result.data?.vehicle || selectedVehicle,
      }
      setCreatedBooking(enrichedBooking)
      setSuccessModalOpen(true)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete assignment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-md shadow-primary/20 text-white">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Assign Car to Customer
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dispatch an available fleet vehicle, configure hourly/daily terms, and immediately start active rental tracking.
              </p>
            </div>
          </div>
        </div>

        <Link href="/admin/bookings?status=active">
          <Button variant="outline" size="sm" className="text-xs h-9 rounded-xl font-semibold gap-1.5 border-border">
            <span>View Active Rentals</span> <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Main 2-Column Grid: Form on Left, Live Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Steps 1, 2, 3 */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: SELECT CUSTOMER */}
          <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                  1
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-foreground leading-tight">
                    Select Customer
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Verified customer profile, driving license & contact info
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewCustModalOpen(true)}
                className="text-xs h-8.5 rounded-xl font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Quick Add Customer
              </Button>
            </div>

            {/* Customer Search & Filter Input */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Filter customers by name, phone (+91), driving license, email, city..."
                  className="pl-9 h-10 text-xs rounded-xl bg-muted/40 border-border/80 focus-visible:ring-primary"
                />
                {customerSearch && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-semibold px-1"
                  >
                    ✕
                  </button>
                )}
              </div>              {/* Customer Cards List View */}
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                {filteredCustomers.length === 0 ? (
                  <div className="py-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-xs font-semibold text-foreground">No customers found</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      No matching records for "{customerSearch}".
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewCustModalOpen(true)}
                      className="mt-3 text-xs h-7.5 rounded-xl gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add this customer
                    </Button>
                  </div>
                ) : (
                  filteredCustomers.map(cust => {
                    const isSelected = cust.id === selectedCustomerId
                    const name = cust.profile?.full_name || cust.emergency_contact_name || 'Customer'
                    const phone = cust.profile?.phone || cust.emergency_contact_phone || 'No phone'
                    const email = cust.profile?.email || ''
                    const dl = cust.driving_license_number || extractDrivingLicense(cust) || 'Verified on file'
                    const initials =
                      name
                        .split(' ')
                        .map(p => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'C'

                    return (
                      <div
                        key={cust.id}
                        onClick={() => setSelectedCustomerId(cust.id)}
                        className={cn(
                          'p-3 sm:p-3.5 rounded-2xl border text-xs cursor-pointer transition-all duration-150 relative select-none flex items-center justify-between gap-3 group',
                          isSelected
                            ? 'border-primary bg-primary/8 ring-2 ring-primary/30 shadow-xs'
                            : 'border-border/80 bg-card hover:bg-muted/40 hover:border-primary/40'
                        )}
                      >
                        {/* Left: Avatar & Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors shadow-2xs',
                              isSelected
                                ? 'gradient-brand text-white'
                                : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                            )}
                          >
                            {initials}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-foreground text-sm truncate leading-tight">
                                {name}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md shrink-0">
                                {cust.customer_code || 'CUST-VERIFIED'}
                              </span>
                              {cust.city && (
                                <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
                                  • {cust.city}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                              <span className="font-semibold text-foreground flex items-center gap-1 shrink-0">
                                <Phone className="w-3 h-3 text-primary shrink-0" />
                                {phone}
                              </span>
                              {email && (
                                <span className="flex items-center gap-1 truncate max-w-[180px] sm:max-w-[240px]">
                                  <Mail className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                                  <span className="truncate">{email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: DL Badge & Selection Indicator */}
                        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-2 py-0.5 font-mono tracking-tight shrink-0 border hidden xs:inline-flex',
                              isSelected
                                ? 'border-primary/40 bg-primary/15 text-primary font-bold'
                                : 'border-border/80 text-muted-foreground bg-muted/30'
                            )}
                          >
                            🪪 {dl}
                          </Badge>

                          <div
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all',
                              isSelected
                                ? 'bg-primary border-primary text-white shadow-xs'
                                : 'border-border bg-muted/40 text-transparent group-hover:border-primary/40'
                            )}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Active Selected Customer Expanded Summary Banner */}
              {selectedCustomer && (
                <div className="p-3.5 bg-primary/[0.04] border border-primary/25 rounded-2xl space-y-2.5 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg gradient-brand text-white flex items-center justify-center text-[10px] font-black shrink-0">
                        ✓
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground">
                          Selected Customer: {selectedCustomer.profile?.full_name || selectedCustomer.emergency_contact_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-2 font-mono">
                          ({selectedCustomer.customer_code || 'Verified'})
                        </span>
                      </div>
                    </div>

                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold gap-1">
                      <ShieldCheck className="w-3 h-3" /> KYC Verified
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-primary/15 text-[11px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="w-3 h-3 text-primary shrink-0" />
                      <span className="font-semibold text-foreground">
                        {selectedCustomer.profile?.phone || selectedCustomer.emergency_contact_phone || '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                      <Mail className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">
                        {selectedCustomer.profile?.email || 'customer@driveease.in'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FileCheck2 className="w-3 h-3 text-primary shrink-0" />
                      <span className="font-mono text-foreground font-semibold truncate">
                        DL: {selectedCustomer.driving_license_number || extractDrivingLicense(selectedCustomer) || 'Verified on file'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: SELECT AVAILABLE CAR */}
          <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                  Select Available Vehicle ({vehicles.length} ready)
                </h3>
              </div>

              <Link href="/admin/vehicles?status=available" className="text-xs font-semibold text-primary hover:underline">
                Fleet View
              </Link>
            </div>

            {/* Vehicle Search & List View */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={vehicleSearch}
                  onChange={e => setVehicleSearch(e.target.value)}
                  placeholder="Filter available cars by model, brand, registration..."
                  className="pl-8.5 h-9 text-xs rounded-xl bg-muted/40"
                />
              </div>

              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                {filteredVehicles.length === 0 ? (
                  <div className="py-8 text-center bg-muted/20 border border-dashed border-border rounded-2xl">
                    <Car className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-xs font-semibold text-foreground">No available vehicles found</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      No cars matching "{vehicleSearch}" are currently available for dispatch.
                    </p>
                  </div>
                ) : (
                  filteredVehicles.map(car => {
                    const isSelected = car.id === selectedVehicleId
                    const primaryImg =
                      (car as any).images?.find((img: any) => img.is_primary)?.url ||
                      (car as any).images?.[0]?.url ||
                      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'

                    return (
                      <div
                        key={car.id}
                        onClick={() => setSelectedVehicleId(car.id)}
                        className={cn(
                          'p-3 sm:p-3.5 rounded-2xl border text-xs cursor-pointer transition-all duration-150 relative select-none flex items-center justify-between gap-3 group',
                          isSelected
                            ? 'border-primary bg-primary/8 ring-2 ring-primary/30 shadow-xs'
                            : 'border-border/80 bg-card hover:bg-muted/40 hover:border-primary/40'
                        )}
                      >
                        {/* Left: Thumbnail & Details */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <img
                            src={primaryImg}
                            alt={`${car.brand} ${car.model}`}
                            className="w-24 h-16 sm:w-28 sm:h-18 md:w-32 md:h-20 rounded-2xl object-cover border border-border/80 shrink-0 shadow-sm group-hover:scale-105 transition-transform bg-muted"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-foreground text-sm truncate leading-tight">
                                {car.brand} {car.model}
                              </span>
                              <span className="font-mono text-[10px] bg-muted/80 px-1.5 py-0.5 rounded text-muted-foreground font-semibold shrink-0">
                                {car.registration_number}
                              </span>
                              <span className="text-[10px] text-muted-foreground bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded uppercase shrink-0">
                                {car.type || 'Car'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                              <span className="capitalize">{car.fuel_type}</span>
                              <span>•</span>
                              <span className="capitalize">{car.transmission}</span>
                              <span>•</span>
                              <span className="font-mono font-medium text-foreground">{car.current_odometer || 0} KM</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Pricing, Badge & Selection Checkmark */}
                        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                          <div className="text-right hidden xs:block">
                            <span className="font-black text-foreground text-sm block">
                              ₹{car.daily_rate}<span className="text-[10px] font-normal text-muted-foreground">/day</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ₹{car.hourly_rate}/hr
                            </span>
                          </div>

                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold shrink-0">
                            Ready
                          </Badge>

                          <div
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all',
                              isSelected
                                ? 'bg-primary border-primary text-white shadow-xs'
                                : 'border-border bg-muted/40 text-transparent group-hover:border-primary/40'
                            )}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* STEP 3: RENTAL CONFIGURATION & DATES */}
          <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                Rental Terms, Schedule & Starting KM
              </h3>
            </div>

            <div className="space-y-4">
              {/* Rental Type Pill Toggle */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Rental Rate Billing Model</Label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-2xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => handleRentalTypeChange('daily')}
                    className={cn(
                      'py-2 rounded-xl text-xs font-bold transition-all',
                      rentalType === 'daily'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    📅 Daily Rental Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRentalTypeChange('hourly')}
                    className={cn(
                      'py-2 rounded-xl text-xs font-bold transition-all',
                      rentalType === 'hourly'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    ⏱️ Hourly Quick Rental
                  </button>
                </div>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Pickup Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={pickupDatetime}
                    onChange={e => setPickupDatetime(e.target.value)}
                    className="h-10 text-xs rounded-xl bg-muted/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Expected Return Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={returnDatetime}
                    onChange={e => setReturnDatetime(e.target.value)}
                    className="h-10 text-xs rounded-xl bg-muted/30"
                  />
                </div>
              </div>

              {/* Starting KM & Deposit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Starting Odometer (KM)</Label>
                  <div className="relative">
                    <Gauge className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      value={startingKm}
                      onChange={e => setStartingKm(e.target.value)}
                      placeholder="e.g. 15200"
                      className="pl-8.5 h-10 text-xs rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Security Deposit (₹)</Label>
                  <Input
                    type="number"
                    value={securityDeposit}
                    onChange={e => setSecurityDeposit(e.target.value)}
                    className="h-10 text-xs rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Advance Paid (₹)</Label>
                  <Input
                    type="number"
                    value={advancePayment}
                    onChange={e => setAdvancePayment(e.target.value)}
                    className="h-10 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Optional Addons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-border/80 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={withInsurance}
                    onChange={e => setWithInsurance(e.target.checked)}
                    className="rounded text-primary focus:ring-primary w-4 h-4"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-foreground block">Zero-Dep Insurance Cover</span>
                    <span className="text-[10px] text-muted-foreground">Add ₹{insuranceRate} for full accidental peace of mind</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-border/80 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={withDriver}
                    onChange={e => setWithDriver(e.target.checked)}
                    className="rounded text-primary focus:ring-primary w-4 h-4"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-foreground block">Professional Chauffeur / Driver</span>
                    <span className="text-[10px] text-muted-foreground">Add ₹{driverCharge} per day for dedicated staff</span>
                  </div>
                </label>
              </div>

              {/* Assignment Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Admin Assignment Notes / Instructions</Label>
                <Textarea
                  value={assignmentNotes}
                  onChange={e => setAssignmentNotes(e.target.value)}
                  placeholder="e.g. Fuel tank full on handover, pristine condition, keys and RC handed over."
                  className="text-xs rounded-xl min-h-16"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Live Assignment Summary & Final Action */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
          <div className="bg-card border-2 border-primary/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <Badge className="gradient-brand text-white border-0 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5">
                  Summary Preview
                </Badge>
                <span className="text-xs font-bold text-muted-foreground font-mono">
                  {rentalDuration.text}
                </span>
              </div>
              <h3 className="text-lg font-black text-foreground mt-2">
                Rental Assignment Summary
              </h3>
            </div>

            {/* Selected Vehicle Snippet */}
            <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/60 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Vehicle Details
              </span>
              {selectedVehicle ? (
                <div className="flex items-center gap-3">
                  {(selectedVehicle as any).images?.[0]?.url ? (
                    <img
                      src={(selectedVehicle as any).images[0].url}
                      alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                      className="w-14 h-10 rounded-xl object-cover border border-border/80 shrink-0 shadow-2xs bg-muted"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl gradient-brand text-white flex items-center justify-center font-bold text-xs shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-sm text-foreground block">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-primary">
                      {selectedVehicle.registration_number}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Starting Odometer: {startingKm} KM
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">No vehicle selected</span>
              )}
            </div>

            {/* Selected Customer Snippet */}
            <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Customer Details
                </span>
                {selectedCustomer && (
                  <Badge variant="outline" className="text-[9px] font-mono border-primary/30 text-primary px-1.5 py-0">
                    {selectedCustomer.customer_code || 'Verified'}
                  </Badge>
                )}
              </div>

              {selectedCustomer ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl gradient-brand text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                      {(selectedCustomer.profile?.full_name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-sm text-foreground block truncate">
                        {selectedCustomer.profile?.full_name || selectedCustomer.emergency_contact_name}
                      </span>
                      <span className="text-[10.5px] text-muted-foreground block truncate">
                        {selectedCustomer.city || 'Jaipur'}, {selectedCustomer.state || 'Rajasthan'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Phone className="w-3 h-3 text-primary shrink-0" />
                      <span>{selectedCustomer.profile?.phone || selectedCustomer.emergency_contact_phone || 'No phone recorded'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] truncate">
                      <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{selectedCustomer.profile?.email || 'customer@driveease.in'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <FileCheck2 className="w-3 h-3 text-primary shrink-0" />
                      <span className="font-mono font-medium text-foreground">
                        DL: {selectedCustomer.driving_license_number || extractDrivingLicense(selectedCustomer) || 'Verified on file'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">No customer selected</span>
              )}
            </div>

            {/* Financial Breakdown Table */}
            <div className="space-y-2 border-t border-border pt-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Base Rental ({rentalDuration.text})</span>
                <span className="font-mono font-semibold text-foreground">₹{calculatedBasePrice.toLocaleString('en-IN')}</span>
              </div>

              {withInsurance && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Zero-Dep Insurance</span>
                  <span className="font-mono font-semibold text-foreground">+₹{insuranceFee.toLocaleString('en-IN')}</span>
                </div>
              )}

              {withDriver && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Chauffeur Service</span>
                  <span className="font-mono font-semibold text-foreground">+₹{driverFee.toLocaleString('en-IN')}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Special Discount</span>
                  <span className="font-mono font-semibold">-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>GST Tax (18%)</span>
                <span className="font-mono font-semibold text-foreground">+₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Security Deposit (Refundable)</span>
                <span className="font-mono font-semibold text-foreground">+₹{secDep.toLocaleString('en-IN')}</span>
              </div>

              <div className="border-t border-border pt-2 flex justify-between items-baseline text-foreground">
                <span className="font-extrabold text-sm">Grand Total</span>
                <span className="text-xl font-black font-mono text-primary">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Advance Collected:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">₹{advance.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Final Action Button */}
            <Button
              type="button"
              disabled={submitting || !selectedVehicle || !selectedCustomer}
              onClick={handleConfirmAssignment}
              className="w-full h-12 gradient-brand text-white border-0 hover:opacity-90 font-black text-sm rounded-2xl shadow-xl shadow-primary/25 gap-2"
            >
              {submitting ? (
                'Processing Assignment...'
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" /> Confirm & Assign Car
                </>
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              ⚡ Upon assignment, car becomes <strong>Running</strong> and is linked to the customer.
            </p>
          </div>
        </div>
      </div>

      {/* QUICK ADD CUSTOMER MODAL */}
      <Dialog open={newCustModalOpen} onOpenChange={setNewCustModalOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Register New Customer
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
                  placeholder="+91 98765 43210"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Driving License No.</Label>
                <Input
                  value={newCustLicense}
                  onChange={e => setNewCustLicense(e.target.value)}
                  placeholder="RJ14 2022001928"
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
                  placeholder="Jaipur"
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
                className="gradient-brand text-white border-0 text-xs font-bold rounded-xl"
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
              <h3 className="text-lg font-black text-foreground">
                Car Assigned Successfully!
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Vehicle is now marked as <strong>Running</strong> on active customer duty.
              </p>
            </div>

            {createdBooking && (() => {
              const custName =
                createdBooking.customer?.profile?.full_name ||
                createdBooking.customer?.emergency_contact_name ||
                selectedCustomer?.profile?.full_name ||
                selectedCustomer?.emergency_contact_name ||
                'Valued Customer'

              const custPhone =
                createdBooking.customer?.profile?.phone ||
                createdBooking.customer?.emergency_contact_phone ||
                selectedCustomer?.profile?.phone ||
                selectedCustomer?.emergency_contact_phone ||
                ''

              const vehicleDisplay =
                createdBooking.vehicle
                  ? `${createdBooking.vehicle.brand} ${createdBooking.vehicle.model} (${createdBooking.vehicle.registration_number})`
                  : selectedVehicle
                  ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.registration_number})`
                  : 'Fleet Vehicle'

              const grandTotalDisplay = Number(createdBooking.grand_total ?? grandTotal ?? 0).toLocaleString('en-IN')

              return (
                <div className="p-4 bg-muted/40 border border-border/60 rounded-2xl text-xs text-left space-y-2 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-sans">Rental ID:</span>
                    <span className="font-bold text-primary">{createdBooking.booking_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-sans">Customer:</span>
                    <span className="font-sans font-bold text-foreground text-right">
                      {custName}
                      {custPhone && custPhone !== '—' && (
                        <span className="text-[11px] text-muted-foreground font-normal block font-mono">
                          {custPhone}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-sans">Vehicle:</span>
                    <span className="font-sans font-bold text-foreground text-right">{vehicleDisplay}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-sans">Grand Total:</span>
                    <span className="font-bold text-foreground">₹{grandTotalDisplay}</span>
                  </div>
                </div>
              )
            })()}

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
                className="w-full gradient-brand text-white border-0 text-xs font-bold rounded-xl"
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
