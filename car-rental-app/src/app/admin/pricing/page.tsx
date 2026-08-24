'use client'

import { useState } from 'react'
import {
  Tag,
  Clock,
  Calendar,
  Save,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info,
  DollarSign,
  ShieldCheck,
  Percent,
  UserCheck,
  Calculator,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'

export default function AdminPricingPage() {
  const [partialPeriodRule, setPartialPeriodRule] = useState<string>('round_up_hour')
  const [gracePeriod, setGracePeriod] = useState('30')
  const [weekendMultiplier, setWeekendMultiplier] = useState('1.25')

  // Global Rates & Tariffs
  const [dailyInsuranceRate, setDailyInsuranceRate] = useState('350')
  const [gstTaxRate, setGstTaxRate] = useState('18')
  const [dailyDriverRate, setDailyDriverRate] = useState('800')
  const [defaultSecurityDeposit, setDefaultSecurityDeposit] = useState('10000')

  // Interactive Live Simulator State
  const [simBaseRental, setSimBaseRental] = useState('3')
  const [simDays, setSimDays] = useState('3')
  const [simWithInsurance, setSimWithInsurance] = useState(true)
  const [simWithDriver, setSimWithDriver] = useState(false)
  const [simDiscount, setSimDiscount] = useState('0')

  const [saved, setSaved] = useState(false)

  const handleSaveSettings = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Simulator calculations
  const daysNum = Math.max(1, Number(simDays) || 1)
  const baseRentalNum = Number(simBaseRental) || 0
  const insurancePerDay = Number(dailyInsuranceRate) || 0
  const totalInsurance = simWithInsurance ? insurancePerDay * daysNum : 0
  const driverPerDay = Number(dailyDriverRate) || 0
  const totalDriver = simWithDriver ? driverPerDay * daysNum : 0
  const discountNum = Number(simDiscount) || 0

  const subtotal = Math.max(0, baseRentalNum + totalInsurance + totalDriver - discountNum)
  const gstRateNum = Number(gstTaxRate) || 18
  const gstAmount = Math.round((subtotal * (gstRateNum / 100)) * 100) / 100
  const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Pricing Rules, Insurance & Tax Configurator
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure Base Rental calculation policies, default Insurance tariffs, GST tax percentage, and surcharges across the SaaS.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 text-sm flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold">Pricing & tax configuration saved successfully!</span>
        </div>
      )}

      {/* 1. Global Tariffs & Tax Rates */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Insurance, Tax & Driver Standard Tariffs
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure system-wide standard add-ons and mandatory tax rates applied to all vehicle bookings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border border-border/70">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Daily Insurance (₹/day)
            </Label>
            <Input
              type="number"
              value={dailyInsuranceRate}
              onChange={e => setDailyInsuranceRate(e.target.value)}
              className="h-10 text-xs font-bold rounded-xl"
            />
            <p className="text-[10px] text-muted-foreground">Standard comprehensive zero-dep per day</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border border-border/70">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-primary" /> GST Tax Rate (%)
            </Label>
            <Input
              type="number"
              step="0.1"
              value={gstTaxRate}
              onChange={e => setGstTaxRate(e.target.value)}
              className="h-10 text-xs font-bold rounded-xl"
            />
            <p className="text-[10px] text-muted-foreground">Combined CGST (9%) + SGST (9%)</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border border-border/70">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Driver Allowance (₹/day)
            </Label>
            <Input
              type="number"
              value={dailyDriverRate}
              onChange={e => setDailyDriverRate(e.target.value)}
              className="h-10 text-xs font-bold rounded-xl"
            />
            <p className="text-[10px] text-muted-foreground">Chauffeur / driver daily charge</p>
          </div>

          <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border border-border/70">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-500" /> Default Deposit (₹)
            </Label>
            <Input
              type="number"
              value={defaultSecurityDeposit}
              onChange={e => setDefaultSecurityDeposit(e.target.value)}
              className="h-10 text-xs font-bold rounded-xl"
            />
            <p className="text-[10px] text-muted-foreground">Refundable deposit baseline</p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Pricing Simulator & Breakdown */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" /> Live Pricing & Tax Simulator
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Test and verify how Base Rental, Insurance, and GST (18%) interact dynamically.
            </p>
          </div>
          <Badge variant="outline" className="text-xs text-primary font-bold">Interactive</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Simulator Inputs */}
          <div className="space-y-3 p-4 rounded-2xl bg-muted/20 border border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Simulation Inputs
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Base Rental (₹)</Label>
                <Input
                  type="number"
                  value={simBaseRental}
                  onChange={e => setSimBaseRental(e.target.value)}
                  className="h-9 text-xs font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Rental Duration (Days)</Label>
                <Input
                  type="number"
                  value={simDays}
                  onChange={e => setSimDays(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Discount (₹)</Label>
                <Input
                  type="number"
                  value={simDiscount}
                  onChange={e => setSimDiscount(e.target.value)}
                  className="h-9 text-xs rounded-xl text-emerald-600"
                />
              </div>

              <div className="flex flex-col justify-end space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simWithInsurance}
                    onChange={e => setSimWithInsurance(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>Include Insurance (₹{dailyInsuranceRate}/day)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simWithDriver}
                    onChange={e => setSimWithDriver(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>Include Driver (₹{dailyDriverRate}/day)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Simulator Output Card */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-primary block pb-1 border-b border-primary/10">
              Calculated Breakdown
            </span>

            <div className="flex justify-between text-muted-foreground">
              <span>Base Rental:</span>
              <span className="font-semibold text-foreground">₹{baseRentalNum.toLocaleString('en-IN')}</span>
            </div>

            {simWithInsurance && (
              <div className="flex justify-between text-muted-foreground">
                <span>Insurance ({daysNum} days × ₹{dailyInsuranceRate}):</span>
                <span className="font-semibold text-foreground">₹{totalInsurance.toLocaleString('en-IN')}</span>
              </div>
            )}

            {simWithDriver && (
              <div className="flex justify-between text-muted-foreground">
                <span>Driver Fee ({daysNum} days × ₹{dailyDriverRate}):</span>
                <span className="font-semibold text-foreground">₹{totalDriver.toLocaleString('en-IN')}</span>
              </div>
            )}

            {discountNum > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-semibold">-₹{discountNum.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground pt-1 border-t border-dashed border-border/80">
              <span>Subtotal:</span>
              <span className="font-medium text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>GST ({gstRateNum}%):</span>
              <span className="font-bold text-foreground">₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t border-primary/20 text-sm font-black text-foreground">
              <span>Grand Total:</span>
              <span className="text-2xl text-primary font-black">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Partial Duration Calculation Rule */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Partial Period Calculation Policy
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose how partial hours and non-24h blocks are billed by the RentalPricingService.
          </p>
        </div>

        <RadioGroup
          value={partialPeriodRule}
          onValueChange={setPartialPeriodRule}
          className="space-y-3"
        >
          <div
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              partialPeriodRule === 'round_up_hour'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card'
            }`}
            onClick={() => setPartialPeriodRule('round_up_hour')}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="round_up_hour" id="r-round" className="mt-1" />
              <div>
                <Label htmlFor="r-round" className="font-bold text-sm cursor-pointer block">
                  Round Up to Next Full Hour (Recommended)
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  e.g., 2 hours 15 minutes is computed as 3 billable hours.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              partialPeriodRule === 'exact_hour'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card'
            }`}
            onClick={() => setPartialPeriodRule('exact_hour')}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="exact_hour" id="r-exact" className="mt-1" />
              <div>
                <Label htmlFor="r-exact" className="font-bold text-sm cursor-pointer block">
                  Exact Fractional Hourly
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  e.g., 2 hours 30 minutes is charged at exactly 2.5 × hourly rate.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              partialPeriodRule === 'day_blocks'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card'
            }`}
            onClick={() => setPartialPeriodRule('day_blocks')}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="day_blocks" id="r-day" className="mt-1" />
              <div>
                <Label htmlFor="r-day" className="font-bold text-sm cursor-pointer block">
                  Strict 24-Hour Day Blocks
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Any fractional rental period beyond 24 hours is rounded to the next full day.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              partialPeriodRule === 'full_day_min'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card'
            }`}
            onClick={() => setPartialPeriodRule('full_day_min')}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="full_day_min" id="r-min" className="mt-1" />
              <div>
                <Label htmlFor="r-min" className="font-bold text-sm cursor-pointer block">
                  Full Day Minimum Charge
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All rentals have a minimum 24-hour baseline charge regardless of duration.
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* 4. Grace Periods & Surcharges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Return Grace Period
          </h3>
          <p className="text-xs text-muted-foreground">
            Allow buffer minutes before late return penalties and extra hourly charges apply.
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={gracePeriod}
              onChange={e => setGracePeriod(e.target.value)}
              className="w-32 h-10 rounded-xl font-bold"
            />
            <span className="text-xs font-semibold text-muted-foreground">Minutes</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> Weekend Tariff Multiplier
          </h3>
          <p className="text-xs text-muted-foreground">
            Dynamic surge rate applied automatically for Friday–Sunday reservations.
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              step="0.05"
              value={weekendMultiplier}
              onChange={e => setWeekendMultiplier(e.target.value)}
              className="w-32 h-10 rounded-xl font-bold"
            />
            <span className="text-xs font-semibold text-muted-foreground">
              multiplier ({Math.round((Number(weekendMultiplier) - 1) * 100)}% Surge)
            </span>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSaveSettings}
        className="gradient-brand text-white border-0 font-bold gap-2 rounded-xl h-11 px-8 shadow-md cursor-pointer"
      >
        <Save className="w-4 h-4" /> Save Business Pricing Rules & Taxes
      </Button>
    </div>
  )
}
