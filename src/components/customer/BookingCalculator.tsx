'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Info,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { Vehicle, PricingBreakdown } from '@/types'

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const value = `${h.toString().padStart(2, '0')}:${m}`
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 === 0 ? 12 : h % 12
  const label = `${displayH.toString().padStart(2, '0')}:${m} ${ampm}`
  return { value, label }
})

interface BookingCalculatorProps {
  vehicle: Vehicle
  branches: Array<{ id: string; name: string; city: string }>
}

export function BookingCalculator({ vehicle, branches }: BookingCalculatorProps) {
  const router = useRouter()

  // Match the date/time from the mockup UI: 09/25/2026 10:00 AM to 09/27/2026 06:00 PM
  const [pickupDate, setPickupDate] = useState('2026-09-25')
  const [returnDate, setReturnDate] = useState('2026-09-27')
  const [pickupTime, setPickupTime] = useState('10:00')
  const [returnTime, setReturnTime] = useState('18:00')

  const defaultBranchId = vehicle.branch_id || branches[0]?.id || ''
  const [pickupBranch, setPickupBranch] = useState(defaultBranchId)
  const [returnBranch, setReturnBranch] = useState(defaultBranchId)

  // Options from the mockup UI
  const [withInsurance, setWithInsurance] = useState(true)
  const [withDriver, setWithDriver] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState('')

  const [loading, setLoading] = useState(false)
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean>(true)
  const [calcError, setCalcError] = useState<string | null>(null)

  // Recalculate price whenever inputs change
  useEffect(() => {
    async function calculatePrice() {
      if (!pickupDate || !returnDate || !pickupTime || !returnTime) return

      const start = `${pickupDate}T${pickupTime}:00`
      const end = `${returnDate}T${returnTime}:00`

      if (new Date(end) <= new Date(start)) {
        setCalcError('Return time must be after pickup time')
        setBreakdown(null)
        return
      }

      setLoading(true)
      setCalcError(null)

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

        if (data.success && data.data?.breakdown) {
          setBreakdown(data.data.breakdown)
          setIsAvailable(data.data.isAvailable)
        } else {
          setCalcError(data.error?.message || 'Calculation failed')
          setBreakdown(null)
        }
      } catch (err: any) {
        setCalcError('Network error calculating price')
      } finally {
        setLoading(false)
      }
    }

    calculatePrice()
  }, [
    vehicle.id,
    pickupDate,
    returnDate,
    pickupTime,
    returnTime,
    withDriver,
    withInsurance,
    appliedCoupon
  ])

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return
    setAppliedCoupon(couponCode.trim().toUpperCase())
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setAppliedCoupon('')
  }

  const handleProceedToBooking = () => {
    router.push(`/admin/assign?vehicle_id=${vehicle.id}`)
  }

  return (
    <div className="bg-card border border-border/70 rounded-[28px] p-6 shadow-sm sticky top-24 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-foreground">Configure Rental & Dates</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Authoritative server-side pricing</p>
      </div>

      {/* Hub Selectors */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Pickup Hub
          </Label>
          <Select value={pickupBranch} onValueChange={setPickupBranch}>
            <SelectTrigger className="h-10 text-xs rounded-xl bg-background border border-border">
              <SelectValue placeholder="Pickup hub" />
            </SelectTrigger>
            <SelectContent>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id} className="text-xs">
                  {b.name} ({b.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Return Hub
          </Label>
          <Select value={returnBranch} onValueChange={setReturnBranch}>
            <SelectTrigger className="h-10 text-xs rounded-xl bg-background border border-border">
              <SelectValue placeholder="Return hub" />
            </SelectTrigger>
            <SelectContent>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id} className="text-xs">
                  {b.name} ({b.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date & Time Selectors (2 Columns) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Pickup */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Pickup Date</Label>
          <div className="relative">
            <input
              type="date"
              value={pickupDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setPickupDate(e.target.value)}
              className="h-10 rounded-xl px-3 pr-8 text-xs bg-background border border-border text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            />
            <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <Select value={pickupTime} onValueChange={setPickupTime}>
            <SelectTrigger className="h-10 text-xs rounded-xl bg-background border border-border px-3 font-medium">
              <SelectValue />
              <Clock className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {TIME_OPTIONS.map(t => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Return */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Return Date</Label>
          <div className="relative">
            <input
              type="date"
              value={returnDate}
              min={pickupDate}
              onChange={e => setReturnDate(e.target.value)}
              className="h-10 rounded-xl px-3 pr-8 text-xs bg-background border border-border text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            />
            <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <Select value={returnTime} onValueChange={setReturnTime}>
            <SelectTrigger className="h-10 text-xs rounded-xl bg-background border border-border px-3 font-medium">
              <SelectValue />
              <Clock className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
            </SelectTrigger>
            <SelectContent className="max-h-56">
              {TIME_OPTIONS.map(t => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Add-on Checkbox Options */}
      <div className="space-y-3 pt-1">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <div className="flex items-center gap-2.5">
            <Checkbox
              checked={withInsurance}
              onCheckedChange={checked => setWithInsurance(!!checked)}
              className="size-4 rounded border-border data-[state=checked]:bg-[#2563eb] data-[state=checked]:border-[#2563eb] data-[state=checked]:text-white"
            />
            <span className="text-xs text-foreground font-medium">
              Zero-Depreciation Insurance Cover
            </span>
          </div>
          <span className="text-xs font-bold text-foreground">
            ₹350 <span className="font-normal text-muted-foreground text-[11px]">/day</span>
          </span>
        </label>

        <label className="flex items-center justify-between cursor-pointer select-none">
          <div className="flex items-center gap-2.5">
            <Checkbox
              checked={withDriver}
              onCheckedChange={checked => setWithDriver(!!checked)}
              className="size-4 rounded border-border data-[state=checked]:bg-[#2563eb] data-[state=checked]:border-[#2563eb] data-[state=checked]:text-white"
            />
            <span className="text-xs text-foreground font-medium">
              Professional Chauffeur Driver
            </span>
          </div>
          <span className="text-xs font-bold text-foreground">
            ₹800 <span className="font-normal text-muted-foreground text-[11px]">/day</span>
          </span>
        </label>
      </div>

      {/* Coupon Application Input */}
      <div className="pt-1">
        <div className="relative">
          <Input
            placeholder="COUPON (E.G. WELCOME500)"
            value={couponCode}
            onChange={e => setCouponCode(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleApplyCoupon()
              }
            }}
            className="h-10 text-xs uppercase rounded-xl border border-border/80 tracking-wider placeholder:text-muted-foreground/50 text-foreground"
          />
          {appliedCoupon ? (
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-rose-500 font-semibold hover:underline"
            >
              Remove
            </button>
          ) : couponCode.trim() ? (
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-primary font-semibold hover:underline"
            >
              Apply
            </button>
          ) : null}
        </div>
        {appliedCoupon && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-1.5">
            <Sparkles className="w-3 h-3" /> Coupon <strong>{appliedCoupon}</strong> active
          </p>
        )}
      </div>

      {/* Error Display */}
      {calcError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{calcError}</span>
        </div>
      )}

      {/* Price Breakdown */}
      {loading ? (
        <div className="py-6 space-y-2.5 animate-pulse">
          <div className="h-4 bg-muted/60 rounded w-full" />
          <div className="h-4 bg-muted/60 rounded w-4/5" />
          <div className="h-4 bg-muted/60 rounded w-3/4" />
          <div className="h-4 bg-muted/60 rounded w-full" />
        </div>
      ) : breakdown ? (
        <div className="space-y-2.5 pt-2 text-xs">
          {/* Dynamic line items */}
          {breakdown.lineItems.map((item, idx) => (
            <div key={idx} className="flex justify-between text-muted-foreground">
              <span>{item.description}</span>
              <span className="font-semibold text-foreground">
                {item.total < 0
                  ? `-₹${Math.abs(item.total).toLocaleString('en-IN')}`
                  : `₹${item.total.toLocaleString('en-IN')}`}
              </span>
            </div>
          ))}

          <Separator className="my-2" />

          {/* Taxable Subtotal */}
          <div className="flex justify-between text-muted-foreground">
            <span>Taxable Subtotal</span>
            <span className="font-semibold text-foreground">
              ₹{breakdown.subtotal.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Applicable GST */}
          <div className="flex justify-between text-muted-foreground">
            <span>Applicable GST ({breakdown.taxRate}%)</span>
            <span className="font-semibold text-foreground">
              ₹{breakdown.taxAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Security Deposit (Escrow) highlighted card */}
          <div className="bg-[#dfd0bd]/50 dark:bg-amber-950/40 border border-[#cbb79e] rounded-xl p-3 flex items-center justify-between mt-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-800 dark:text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-xs text-amber-950 dark:text-amber-200">
                  Security Deposit (Escrow)
                </div>
                <div className="text-[10px] text-amber-900/80 dark:text-amber-300/80">
                  Refundable liability upon inspection
                </div>
              </div>
            </div>
            <div className="font-bold text-sm text-amber-950 dark:text-amber-200">
              ₹{breakdown.securityDeposit.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Grand Total Row */}
          <div className="pt-2 flex justify-between items-baseline">
            <div>
              <span className="text-sm font-bold text-foreground">Grand Total Payable</span>
              <span className="text-[11px] text-muted-foreground block">
                Includes Rental, 18% GST & Deposit
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl md:text-3xl font-black text-foreground">
                ₹{breakdown.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Dark Compliance Notice */}
          <div className="bg-[#484e5b] dark:bg-[#2b303c] text-white/90 p-3 rounded-xl flex items-start gap-2.5 text-[11px] leading-snug mt-3">
            <Info className="w-4 h-4 text-white/80 shrink-0 mt-0.5" />
            <span>
              In compliance with Indian Tax Laws, security deposits are held in escrow liability and not counted as rental turnover.
            </span>
          </div>
        </div>
      ) : null}

      {/* CTA Button */}
      <Button
        size="lg"
        onClick={handleProceedToBooking}
        disabled={!isAvailable || loading}
        className="w-full h-12 bg-[#9da4ff] hover:bg-[#8b93fa] text-white font-bold text-sm rounded-2xl shadow-sm transition-all duration-200 cursor-pointer border-0 mt-2"
      >
        <span>Proceed to Secure Booking</span>
        <span className="ml-1 text-base">→</span>
      </Button>
    </div>
  )
}
