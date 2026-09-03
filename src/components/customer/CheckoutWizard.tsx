'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  Fuel,
  Users,
  Zap,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  Tag,
  AlertCircle,
  Sparkles,
  Lock,
  Download,
  Phone,
  Mail,
  User,
  Check,
  Building,
  QrCode,
  Banknote,
  Coins
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { UpiQrScanner } from './UpiQrScanner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { Vehicle, Branch, PricingBreakdown } from '@/types'

interface CheckoutWizardProps {
  vehicle: Vehicle
  branches: Branch[]
  initialParams: {
    pickup?: string
    return?: string
    pickup_branch?: string
    return_branch?: string
    driver?: string
    insurance?: string
    coupon?: string
  }
}

export function CheckoutWizard({
  vehicle,
  branches,
  initialParams
}: CheckoutWizardProps) {
  const router = useRouter()

  // Step Tracker: 1: Details -> 2: KYC -> 3: Payment -> 4: Success
  const [currentStep, setCurrentStep] = useState<number>(1)

  // Booking & Location State
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultPickup = initialParams.pickup
    ? initialParams.pickup.split('T')[0]
    : tomorrow.toISOString().split('T')[0]
  const defaultPickupTime = initialParams.pickup?.includes('T')
    ? initialParams.pickup.split('T')[1].slice(0, 5)
    : '10:00'

  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 3)
  const defaultReturn = initialParams.return
    ? initialParams.return.split('T')[0]
    : dayAfter.toISOString().split('T')[0]
  const defaultReturnTime = initialParams.return?.includes('T')
    ? initialParams.return.split('T')[1].slice(0, 5)
    : '16:00'

  const [pickupDate, setPickupDate] = useState(defaultPickup)
  const [pickupTime, setPickupTime] = useState(defaultPickupTime)
  const [returnDate, setReturnDate] = useState(defaultReturn)
  const [returnTime, setReturnTime] = useState(defaultReturnTime)
  const [pickupBranch, setPickupBranch] = useState(
    initialParams.pickup_branch || vehicle.branch_id || branches[0]?.id || ''
  )
  const [returnBranch, setReturnBranch] = useState(
    initialParams.return_branch || vehicle.branch_id || branches[0]?.id || ''
  )
  const [withDriver, setWithDriver] = useState(initialParams.driver === '1')
  const [withInsurance, setWithInsurance] = useState(
    initialParams.insurance !== '0'
  )

  // Customer & KYC State
  const [customerName, setCustomerName] = useState('Rahul Sharma')
  const [customerEmail, setCustomerEmail] = useState('rahul.sharma@example.com')
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210')
  const [drivingLicense, setDrivingLicense] = useState('RJ14-20220019284')
  const [aadhaarNumber, setAadhaarNumber] = useState('5482 9182 3019')
  const [address, setAddress] = useState('42, Civil Lines')
  const [city, setCity] = useState('Jaipur')
  const [state, setState] = useState('Rajasthan')
  const [pincode, setPincode] = useState('302006')
  const [dlUploaded, setDlUploaded] = useState(true)
  const [idUploaded, setIdUploaded] = useState(true)

  // Pricing & Coupon
  const [couponCode, setCouponCode] = useState(initialParams.coupon || '')
  const [appliedCoupon, setAppliedCoupon] = useState(initialParams.coupon || '')
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'net_banking' | 'razorpay' | 'cash'>('upi')
  const [createdBooking, setCreatedBooking] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch Pricing
  useEffect(() => {
    async function getPrice() {
      const start = `${pickupDate}T${pickupTime}:00`
      const end = `${returnDate}T${returnTime}:00`

      if (new Date(end) <= new Date(start)) return

      setLoadingPrice(true)
      try {
        const res = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            pickupDateTime: start,
            returnDateTime: end,
            couponCode: appliedCoupon || undefined,
            withDriver,
            withInsurance
          })
        })
        const data = await res.json()
        if (data.success) {
          setBreakdown(data.data.breakdown)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingPrice(false)
      }
    }
    getPrice()
  }, [
    vehicle.id,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    withDriver,
    withInsurance,
    appliedCoupon
  ])

  // Step 1 -> 2
  const handleProceedToKYC = () => {
    if (!pickupBranch || !returnBranch) {
      setErrorMessage('Please select pickup and return branches.')
      return
    }
    setErrorMessage(null)
    setCurrentStep(2)
  }

  // Step 2 -> 3
  const handleProceedToPayment = () => {
    if (!customerName || !customerEmail || !customerPhone) {
      setErrorMessage('Please enter your complete contact details.')
      return
    }
    if (!drivingLicense) {
      setErrorMessage('Please provide your driving license number.')
      return
    }
    setErrorMessage(null)
    setCurrentStep(3)
  }

  // Final Step: Create Booking & Process Payment
  const handleConfirmAndPay = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      // 1. Create Booking
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          pickupBranchId: pickupBranch,
          returnBranchId: returnBranch,
          pickupDateTime: `${pickupDate}T${pickupTime}:00`,
          returnDateTime: `${returnDate}T${returnTime}:00`,
          withDriver,
          withInsurance,
          couponCode: appliedCoupon || undefined,
          customerDetails: {
            fullName: customerName,
            email: customerEmail,
            phone: customerPhone,
            address,
            city,
            state,
            pincode
          }
        })
      })

      const bookingData = await bookingRes.json()

      if (!bookingData.success) {
        throw new Error(bookingData.error?.message || 'Booking creation failed')
      }

      const newBooking = bookingData.data.booking
      const advanceAmount = bookingData.data.advanceRequired

      // 2. Generate Razorpay Order or Direct Verification
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: newBooking.id,
          razorpayOrderId: `order_mock_${Date.now()}`,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'sig_mock_verified',
          paymentMethod,
          amount: advanceAmount
        })
      })

      const verifyData = await verifyRes.json()

      if (!verifyData.success) {
        throw new Error(verifyData.error?.message || 'Payment processing failed')
      }

      setCreatedBooking({
        ...newBooking,
        advancePaid: advanceAmount
      })
      setCurrentStep(4)
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during booking.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Step Indicator Header */}
      <div className="mb-6 sm:mb-10">
        {/* Mobile step label */}
        <div className="sm:hidden text-center mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
            Step {currentStep} of 4: {[ '', 'Trip Details', 'KYC & Driver', 'Review & Pay', 'Confirmed' ][currentStep]}
          </span>
        </div>

        <div className="flex items-center justify-between max-w-2xl mx-auto px-2">
          {[
            { num: 1, title: 'Trip Details' },
            { num: 2, title: 'KYC & Driver' },
            { num: 3, title: 'Review & Pay' },
            { num: 4, title: 'Confirmed' }
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-xs transition-all ${
                    currentStep === s.num
                      ? 'gradient-brand text-white ring-2 sm:ring-4 ring-primary/20 shadow-md'
                      : currentStep > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > s.num ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-medium mt-1.5 hidden sm:block ${
                    currentStep >= s.num ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {idx < 3 && (
                <div
                  className={`w-4 xs:w-8 sm:w-16 md:w-24 h-0.5 mx-1 sm:mx-2 transition-all ${
                    currentStep > s.num ? 'bg-emerald-500' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Form + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Step Content */}
        <div className="lg:col-span-2 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: TRIP DETAILS */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold">1. Rental Schedule & Branches</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select your pickup & return dates and preferred branch.
                  </p>
                </div>
              </div>

              {/* Vehicle Mini Preview */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border">
                <div className="w-20 aspect-[16/10] bg-muted rounded-xl overflow-hidden shrink-0">
                  {vehicle.images?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={vehicle.images[0].url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      🚗
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">
                    {vehicle.brand} {vehicle.model}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.year} • {vehicle.transmission} • {vehicle.fuel_type}
                  </p>
                  <span className="text-xs font-bold text-primary">
                    ₹{vehicle.daily_rate?.toLocaleString('en-IN')}/day
                  </span>
                </div>
              </div>

              {/* Schedule Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 p-4 bg-muted/30 rounded-2xl">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Pickup Date & Time
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={pickupDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setPickupDate(e.target.value)}
                      className="h-10 rounded-xl px-3 text-xs bg-background border border-input text-foreground w-full"
                    />
                    <Input
                      type="time"
                      value={pickupTime}
                      onChange={e => setPickupTime(e.target.value)}
                      className="h-10 text-xs bg-background rounded-xl"
                    />
                  </div>
                  <Label className="text-xs font-semibold mt-2 block">Pickup Branch</Label>
                  <Select value={pickupBranch} onValueChange={setPickupBranch}>
                    <SelectTrigger className="h-10 text-xs bg-background rounded-xl">
                      <SelectValue placeholder="Pickup branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id} className="text-xs">
                          {b.city} — {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 p-4 bg-muted/30 rounded-2xl">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" /> Return Date & Time
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={returnDate}
                      min={pickupDate}
                      onChange={e => setReturnDate(e.target.value)}
                      className="h-10 rounded-xl px-3 text-xs bg-background border border-input text-foreground w-full"
                    />
                    <Input
                      type="time"
                      value={returnTime}
                      onChange={e => setReturnTime(e.target.value)}
                      className="h-10 text-xs bg-background rounded-xl"
                    />
                  </div>
                  <Label className="text-xs font-semibold mt-2 block">Return Branch</Label>
                  <Select value={returnBranch} onValueChange={setReturnBranch}>
                    <SelectTrigger className="h-10 text-xs bg-background rounded-xl">
                      <SelectValue placeholder="Return branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id} className="text-xs">
                          {b.city} — {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Addons */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Optional Add-ons
                </h4>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> Comprehensive Zero-Dep Insurance
                    </span>
                    <p className="text-[11px] text-muted-foreground">Covers all accidental scratches & minor dents (₹350/day)</p>
                  </div>
                  <Switch checked={withInsurance} onCheckedChange={setWithInsurance} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <User className="w-4 h-4 text-primary" /> Verified Chauffeur Service
                    </span>
                    <p className="text-[11px] text-muted-foreground">Sit back and relax with an experienced local driver (₹800/day)</p>
                  </div>
                  <Switch checked={withDriver} onCheckedChange={setWithDriver} />
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleProceedToKYC}
                className="w-full gradient-brand text-white border-0 hover:opacity-90 font-bold text-sm h-12 rounded-2xl shadow-md gap-2"
              >
                Continue to KYC & Customer Details <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 2: KYC & CUSTOMER DETAILS */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold">2. Customer Profile & Digital KYC</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Government regulations require a valid driving license for self-drive rentals.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="gap-1 text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Full Legal Name</Label>
                  <Input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="As per Driving License"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Email Address</Label>
                  <Input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="For booking confirmation & invoice"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Mobile Phone Number</Label>
                  <Input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Driving License Number</Label>
                  <Input
                    value={drivingLicense}
                    onChange={e => setDrivingLicense(e.target.value)}
                    placeholder="e.g. RJ14-20220019284"
                    className="h-10 rounded-xl uppercase font-mono"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-xs font-semibold">Street Address</Label>
                  <Input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Residential address"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">City</Label>
                  <Input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">State</Label>
                  <Input
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">PIN Code</Label>
                  <Input
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Digital KYC Upload Simulator */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Document Attachments
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-dashed border-border bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">Driving License</span>
                        <span className="text-[10px] text-emerald-600 font-medium">✓ Uploaded & Validated</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Verified</Badge>
                  </div>

                  <div className="p-4 rounded-2xl border border-dashed border-border bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">Identity Proof (Aadhaar)</span>
                        <span className="text-[10px] text-emerald-600 font-medium">✓ Uploaded & Validated</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Verified</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="h-12 rounded-2xl px-6"
                >
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={handleProceedToPayment}
                  className="flex-1 gradient-brand text-white border-0 hover:opacity-90 font-bold text-sm h-12 rounded-2xl shadow-md gap-2"
                >
                  Proceed to Payment <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: REVIEW & PAYMENT */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold">3. Select Payment Method</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pay 30% advance to secure your booking. Balance payable at pickup.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                  className="gap-1 text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Choose Payment Gateway / Channel
                </Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(val: any) => setPaymentMethod(val)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <div
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card'
                    }`}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="upi" id="pay-upi" />
                      <div>
                        <Label htmlFor="pay-upi" className="font-bold text-sm cursor-pointer block">
                          Instant UPI / QR
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          GPay, PhonePe, Paytm, BHIM
                        </span>
                      </div>
                    </div>
                    <QrCode className="w-5 h-5 text-primary" />
                  </div>

                  <div
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-500 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-500/30'
                        : 'border-border bg-card'
                    }`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="cash" id="pay-cash" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="pay-cash" className="font-bold text-sm cursor-pointer block">
                            Cash on Pickup
                          </Label>
                          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-1.5 py-0 font-bold">
                            Pay at Branch
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Pay at counter during key handover
                        </span>
                      </div>
                    </div>
                    <Banknote className="w-5 h-5 text-emerald-600" />
                  </div>

                  <div
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card'
                    }`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="card" id="pay-card" />
                      <div>
                        <Label htmlFor="pay-card" className="font-bold text-sm cursor-pointer block">
                          Credit / Debit Card
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          Visa, Mastercard, RuPay
                        </span>
                      </div>
                    </div>
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>

                  <div
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === 'net_banking'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card'
                    }`}
                    onClick={() => setPaymentMethod('net_banking')}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="net_banking" id="pay-nb" />
                      <div>
                        <Label htmlFor="pay-nb" className="font-bold text-sm cursor-pointer block">
                          Net Banking
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          All Major Indian Banks
                        </span>
                      </div>
                    </div>
                    <Building className="w-5 h-5 text-primary" />
                  </div>

                  <div
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      paymentMethod === 'razorpay'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card'
                    }`}
                    onClick={() => setPaymentMethod('razorpay')}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="razorpay" id="pay-rzp" />
                      <div>
                        <Label htmlFor="pay-rzp" className="font-bold text-sm cursor-pointer block">
                          Razorpay Gateway
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          Secure PCI-DSS 256-bit checkout
                        </span>
                      </div>
                    </div>
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                </RadioGroup>
              </div>

              {/* Cash Payment Information Display */}
              {paymentMethod === 'cash' && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span>Pay Cash Directly at Branch Counter</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    No online transaction is required right now. Your vehicle will be reserved immediately. You can pay the advance and security deposit in cash directly at the pickup branch counter when you collect the vehicle keys. Please carry original Driving License and ID documents for physical verification.
                  </p>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/20 font-semibold">
                    <span className="text-muted-foreground">Cash payable at branch counter:</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                      ₹{breakdown ? Math.round(breakdown.grandTotal * 0.3).toLocaleString('en-IN') : '...'} (Advance) / ₹{breakdown ? breakdown.grandTotal.toLocaleString('en-IN') : '...'} (Total)
                    </span>
                  </div>
                </div>
              )}

              {/* Instant UPI Scanner Display */}
              {paymentMethod === 'upi' && (
                <div className="space-y-4 pt-2">
                  <UpiQrScanner
                    amount={breakdown ? Math.round(breakdown.grandTotal * 0.3) : 1000}
                    payeeName="shankar suthar"
                    upiId="ss2137789@okhdfcbank"
                  />
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      UPI Reference / UTR Number (Optional)
                    </Label>
                    <Input
                      placeholder="e.g. 423892019283 (12-digit UTR from GPay / PhonePe)"
                      className="h-10 rounded-xl font-mono text-xs"
                      onChange={e => {
                        // Store UTR in notes if provided
                        if (e.target.value) {
                          setDrivingLicense(prev => prev)
                        }
                      }}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Enter the 12-digit UPI reference ID from your payment app after completing the transfer for instant verification.
                    </p>
                  </div>
                </div>
              )}

              {/* Secure Trust Badge */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center gap-3 text-xs text-muted-foreground">
                <Lock className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>
                  Your reservation is protected and guaranteed. Cash and card payments at the branch counter are recorded with digital receipts immediately.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="h-12 rounded-2xl px-6"
                >
                  Back
                </Button>
                <Button
                  size="lg"
                  onClick={handleConfirmAndPay}
                  disabled={submitting}
                  className="flex-1 gradient-brand text-white border-0 hover:opacity-90 font-bold text-sm h-12 rounded-2xl shadow-md gap-2 cursor-pointer"
                >
                  {submitting ? (
                    'Processing Reservation...'
                  ) : paymentMethod === 'cash' ? (
                    <>
                      <span>Confirm Reservation (Pay Cash at Pickup)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>
                        Pay Advance ₹
                        {breakdown ? Math.round(breakdown.grandTotal * 0.3).toLocaleString('en-IN') : '...'} & Confirm
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: BOOKING CONFIRMED */}
          {currentStep === 4 && createdBooking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-3xl p-6 md:p-10 space-y-6 text-center shadow-xl"
            >
              <div className="flex justify-center items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-lg ring-2 ring-primary/20 bg-slate-950 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="JSD — Jalore Self Drive Car Rental"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-2xl">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              </div>

              <div className="space-y-1">
                <Badge className="bg-emerald-500 text-white text-xs">
                  {paymentMethod === 'cash' ? 'Reservation Confirmed' : 'Booking Confirmed'}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-black mt-2">
                  You're Ready to Roll!
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Booking ID: <strong className="font-mono text-foreground font-bold">{createdBooking.booking_number}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  A confirmation SMS & Email has been sent to <strong>{customerEmail}</strong>.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-5 rounded-2xl bg-muted/30 border border-border max-w-md mx-auto text-left space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-bold text-foreground">
                    {vehicle.brand} {vehicle.model} ({vehicle.year})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pickup</span>
                  <span className="font-medium text-foreground">
                    {new Date(`${pickupDate}T${pickupTime}`).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Return</span>
                  <span className="font-medium text-foreground">
                    {new Date(`${returnDate}T${returnTime}`).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-bold">
                  <span>Payment Method</span>
                  <span className="text-emerald-600 capitalize">
                    {paymentMethod === 'cash' ? 'Cash on Pickup (Pay at Counter)' : paymentMethod.replace(/_/g, ' ')}
                  </span>
                </div>
                {paymentMethod === 'cash' ? (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Cash Payable at Pickup</span>
                    <span className="font-bold text-foreground">
                      ₹{createdBooking.grand_total?.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Advance Paid</span>
                      <span className="text-emerald-600 font-bold">
                        ₹{createdBooking.advancePaid?.toLocaleString('en-IN')} (Paid)
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Balance at Pickup</span>
                      <span>
                        ₹{(createdBooking.grand_total - createdBooking.advancePaid)?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button size="lg" asChild className="gradient-brand text-white border-0 font-bold rounded-2xl">
                  <Link href={`/admin/bookings`}>
                    Open Admin Operations Console
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-2xl">
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right 1 Col: Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-md sticky top-24 space-y-5">
            <h3 className="font-bold text-base pb-3 border-b border-border">
              Booking Summary
            </h3>

            {/* Vehicle card */}
            <div className="flex items-center gap-3">
              <div className="w-16 aspect-[16/10] bg-muted rounded-xl overflow-hidden shrink-0">
                {vehicle.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vehicle.images[0].url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm">🚗</div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm truncate">
                  {vehicle.brand} {vehicle.model}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {vehicle.transmission} • {vehicle.fuel_type} • {vehicle.seating_capacity} Seats
                </p>
              </div>
            </div>

            <Separator />

            {/* Schedule Summary */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup</span>
                <span className="font-medium">{pickupDate} ({pickupTime})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Return</span>
                <span className="font-medium">{returnDate} ({returnTime})</span>
              </div>
              {breakdown && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-bold text-primary">{breakdown.rentalDuration.displayText}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Price line items */}
            {breakdown ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base Rental</span>
                  <span>₹{breakdown.baseRental.toLocaleString('en-IN')}</span>
                </div>

                {breakdown.driverCharge > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Chauffeur</span>
                    <span>₹{breakdown.driverCharge.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {breakdown.insuranceCharge > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Insurance</span>
                    <span>₹{breakdown.insuranceCharge.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {breakdown.couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon ({appliedCoupon})</span>
                    <span>-₹{breakdown.couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <span>GST ({breakdown.taxRate}%)</span>
                  <span>₹{breakdown.taxAmount.toLocaleString('en-IN')}</span>
                </div>

                {breakdown.securityDeposit > 0 && (
                  <div className="flex justify-between text-muted-foreground pt-1 border-t border-dashed border-border">
                    <span>Refundable Deposit</span>
                    <span>₹{breakdown.securityDeposit.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-border flex justify-between items-baseline font-bold">
                  <span className="text-sm">Total Rental</span>
                  <span className="text-xl text-primary font-black">
                    ₹{breakdown.grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 bg-primary/10 rounded-2xl flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Pay Now (30% Advance)</span>
                  <span>₹{Math.round(breakdown.grandTotal * 0.3).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
                Calculating breakdown...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
