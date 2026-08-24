'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
  const label = `${h.toString().padStart(2, '0')}:${m}`
  return { value: label, label }
})

interface BookingCalculatorProps {
  vehicle: Vehicle
  branches: Array<{ id: string; name: string; city: string }>
}

export function BookingCalculator({ vehicle, branches }: BookingCalculatorProps) {
  const router = useRouter()

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 3)

  const [pickupDate, setPickupDate] = useState(tomorrow.toISOString().split('T')[0])
  const [returnDate, setReturnDate] = useState(dayAfter.toISOString().split('T')[0])
  const [pickupTime, setPickupTime] = useState('10:00')
  const [returnTime, setReturnTime] = useState('16:00')
  const [pickupBranch, setPickupBranch] = useState(vehicle.branch_id || branches[0]?.id || '')
  const [returnBranch, setReturnBranch] = useState(vehicle.branch_id || branches[0]?.id || '')
  const [withDriver, setWithDriver] = useState(false)
  const [withInsurance, setWithInsurance] = useState(true)
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

        if (data.success) {
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
    <div className="bg-card border border-border rounded-3xl p-6 shadow-xl sticky top-24 space-y-6">
      {/* Header with Base Rate and Availability */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Rental Rate
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-bold text-foreground">
              ₹{vehicle.daily_rate?.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-muted-foreground">/ day</span>
          </div>
          {vehicle.hourly_rate && (
            <span className="text-xs text-primary font-medium block">
              or ₹{vehicle.hourly_rate}/hr
            </span>
          )}
        </div>

        <div>
          {isAvailable ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs py-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Available Now
            </Badge>
          ) : (
            <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1 text-xs py-1">
              <XCircle className="w-3.5 h-3.5" /> Booked for dates
            </Badge>
          )}
        </div>
      </div>

      {/* Date & Time Selectors */}
      <div className="space-y-4">
        {/* Pickup Details */}
        <div className="p-3.5 bg-muted/40 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Pickup
            </Label>
            <span className="text-[10px] text-muted-foreground">Starts</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={pickupDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setPickupDate(e.target.value)}
              className="h-9 rounded-lg px-2.5 text-xs bg-background border border-input text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Select value={pickupTime} onValueChange={setPickupTime}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {TIME_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={pickupBranch} onValueChange={setPickupBranch}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <MapPin className="w-3 h-3 text-muted-foreground mr-1" />
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

        {/* Return Details */}
        <div className="p-3.5 bg-muted/40 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" /> Return
            </Label>
            <span className="text-[10px] text-muted-foreground">Ends</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={returnDate}
              min={pickupDate}
              onChange={e => setReturnDate(e.target.value)}
              className="h-9 rounded-lg px-2.5 text-xs bg-background border border-input text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Select value={returnTime} onValueChange={setReturnTime}>
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {TIME_OPTIONS.map(t => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={returnBranch} onValueChange={setReturnBranch}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <MapPin className="w-3 h-3 text-muted-foreground mr-1" />
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

      {/* Add-on Toggles */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Comprehensive Insurance
            </div>
            <p className="text-[10px] text-muted-foreground">Zero liability for accidental damages (₹350/day)</p>
          </div>
          <Switch checked={withInsurance} onCheckedChange={setWithInsurance} />
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <UserCheck className="w-3.5 h-3.5 text-primary" /> Chauffeur / Driver
            </div>
            <p className="text-[10px] text-muted-foreground">Professional verified driver (₹800/day)</p>
          </div>
          <Switch checked={withDriver} onCheckedChange={setWithDriver} />
        </div>
      </div>

      {/* Coupon Application */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Coupon code (e.g. WELCOME20)"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value)}
              className="h-9 pl-8 text-xs uppercase"
              disabled={!!appliedCoupon}
            />
          </div>
          {appliedCoupon ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveCoupon}
              className="h-9 text-xs text-rose-500 hover:text-rose-600"
            >
              Remove
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleApplyCoupon}
              className="h-9 text-xs"
            >
              Apply
            </Button>
          )}
        </div>
        {appliedCoupon && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Coupon <strong>{appliedCoupon}</strong> active
          </p>
        )}
      </div>

      {/* Dynamic Breakdown Display */}
      {calcError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{calcError}</span>
        </div>
      )}

      {loading ? (
        <div className="py-4 space-y-2 animate-pulse">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      ) : (
        breakdown && (
          <div className="space-y-2.5 pt-2 text-xs border-t border-border">
            <div className="flex justify-between text-muted-foreground">
              <span>Duration</span>
              <span className="font-semibold text-foreground">
                {breakdown.rentalDuration.displayText}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>Base Rental Charge</span>
              <span className="font-medium text-foreground">
                ₹{breakdown.baseRental.toLocaleString('en-IN')}
              </span>
            </div>

            {breakdown.driverCharge > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Driver Fee</span>
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
                <span>Coupon Discount</span>
                <span>-₹{breakdown.couponDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground">
              <span>GST ({breakdown.taxRate}%)</span>
              <span>₹{breakdown.taxAmount.toLocaleString('en-IN')}</span>
            </div>

            {breakdown.securityDeposit > 0 && (
              <div className="flex justify-between text-muted-foreground pt-1 border-t border-dashed border-border">
                <span className="flex items-center gap-1">
                  Security Deposit (Refundable)
                </span>
                <span className="font-medium text-foreground">
                  ₹{breakdown.securityDeposit.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-border flex justify-between items-baseline">
              <div>
                <span className="text-sm font-bold text-foreground">Grand Total</span>
                <span className="text-[10px] text-muted-foreground block">
                  Incl. taxes & deposit
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-primary">
                  ₹{breakdown.grandTotal.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  (Advance 30%: ₹{Math.round(breakdown.grandTotal * 0.3).toLocaleString('en-IN')})
                </span>
              </div>
            </div>
          </div>
        )
      )}

      {/* Assign Car CTA */}
      <Button
        size="lg"
        onClick={handleProceedToBooking}
        disabled={!isAvailable}
        className="w-full h-12 gradient-brand text-white border-0 hover:opacity-90 font-bold text-sm shadow-md gap-2 cursor-pointer"
      >
        <Zap className="w-4 h-4 fill-current" />
        <span>Assign Car to Customer</span>
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        Instant booking • Free cancellation up to 48h
      </p>
    </div>
  )
}
