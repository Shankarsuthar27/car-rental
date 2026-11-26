'use client'

import { useEffect, useState } from 'react'
import {
  Building2,
  Save,
  CheckCircle2,
  Sliders,
  DollarSign,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { PermissionGuard } from '@/components/admin/PermissionGuard'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<'business' | 'rental' | null>(null)
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 1. Business Settings
  const [businessName, setBusinessName] = useState('Jalore Self Drive Car Rental')
  const [tagline, setTagline] = useState('Premium Fleet & Self-Drive Car Rental')
  const [gstin, setGstin] = useState('08ABCDE1234F1Z5')
  const [supportEmail, setSupportEmail] = useState('Jalorecarrental@gmail.com')
  const [supportPhone, setSupportPhone] = useState('+91-2973-222333')
  const [address, setAddress] = useState('Near Bus Stand, Collectorate Road, Jalore, Rajasthan 343001')
  const [currency, setCurrency] = useState('INR (₹)')

  // 2. Rental Settings
  const [defaultHourlyRate, setDefaultHourlyRate] = useState('180')
  const [defaultDailyRate, setDefaultDailyRate] = useState('2200')
  const [defaultDeposit, setDefaultDeposit] = useState('10000')
  const [lateFeePerHour, setLateFeePerHour] = useState('200')
  const [extraKmCharge, setExtraKmCharge] = useState('14')
  const [gracePeriodMins, setGracePeriodMins] = useState('30')
  const [taxRate, setTaxRate] = useState('18')

  useEffect(() => {
    let active = true
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!active) return

        if (data.business) {
          if (data.business.name != null) setBusinessName(String(data.business.name))
          if (data.business.tagline != null) setTagline(String(data.business.tagline))
          if (data.business.gstin != null) setGstin(String(data.business.gstin))
          if (data.business.email != null) setSupportEmail(String(data.business.email))
          if (data.business.phone != null) setSupportPhone(String(data.business.phone))
          if (data.business.address != null) setAddress(String(data.business.address))
          if (data.business.currency != null) setCurrency(String(data.business.currency))
        }

        if (data.rental) {
          if (data.rental.default_hourly_rate != null) setDefaultHourlyRate(String(data.rental.default_hourly_rate))
          if (data.rental.default_daily_rate != null) setDefaultDailyRate(String(data.rental.default_daily_rate))
          if (data.rental.default_deposit != null) setDefaultDeposit(String(data.rental.default_deposit))
          if (data.rental.late_fee_per_hour != null) setLateFeePerHour(String(data.rental.late_fee_per_hour))
          if (data.rental.extra_km_charge != null) setExtraKmCharge(String(data.rental.extra_km_charge))
          if (data.rental.return_grace_period_minutes != null) setGracePeriodMins(String(data.rental.return_grace_period_minutes))
          if (data.rental.tax_rate != null) setTaxRate(String(data.rental.tax_rate))
        }
      } catch {
        // Keep defaults if fetch fails
      } finally {
        if (active) setLoading(false)
      }
    }
    loadSettings()
    return () => {
      active = false
    }
  }, [])

  const saveSection = async (section: 'business' | 'rental') => {
    setSaving(section)
    setErrorMsg(null)
    setSaved(false)

    try {
      const payload =
        section === 'business'
          ? {
              business: {
                name: businessName,
                tagline,
                gstin,
                currency,
                email: supportEmail,
                phone: supportPhone,
                address,
              },
            }
          : {
              rental: {
                default_daily_rate: Number(defaultDailyRate),
                default_hourly_rate: Number(defaultHourlyRate),
                default_deposit: Number(defaultDeposit),
                late_fee_per_hour: Number(lateFeePerHour),
                extra_km_charge: Number(extraKmCharge),
                return_grace_period_minutes: Number(gracePeriodMins),
                tax_rate: Number(taxRate),
              },
            }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save settings to database')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(null)
    }
  }

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault()
    void saveSection('business')
  }

  const handleSaveRental = (e: React.FormEvent) => {
    e.preventDefault()
    void saveSection('rental')
  }

  return (
    <PermissionGuard permission="settings.manage">
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-md shadow-primary/20 text-white">
            <Sliders className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Admin & Fleet System Settings
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure business identity, rental fee defaults, and late penalty rates.
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-bold">Settings updated and saved to database!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-2xl text-destructive text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid grid-cols-2 bg-card border border-border/80 h-11 p-1 rounded-2xl shadow-xs">
          <TabsTrigger value="business" className="text-xs rounded-xl font-bold gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Business Settings
          </TabsTrigger>
          <TabsTrigger value="rental" className="text-xs rounded-xl font-bold gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> Rental & Fee Defaults
          </TabsTrigger>
        </TabsList>

        {/* 1. BUSINESS SETTINGS */}
        <TabsContent value="business">
          <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="font-black text-base text-foreground">
                Business & Fleet Identity
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Information displayed on rental agreements, customer invoices, and system receipts.
              </p>
            </div>

            {/* Active Brand Logo Showcase */}
            <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-lg ring-2 ring-primary/30 bg-slate-950 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="JSD — Jalore Self Drive Car Rental"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-foreground">JSD — Jalore Self Drive Car Rental</span>
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Active Emblem</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Primary circular brand logo loaded from <code className="font-mono text-[11px] bg-background px-1.5 py-0.5 rounded border border-border">/public/logo.png</code>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BrandLogo size="sm" textVariant="compact" />
              </div>
            </div>

            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Business Entity Name</Label>
                  <Input
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Brand Tagline</Label>
                  <Input
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">GSTIN / Tax ID Number</Label>
                  <Input
                    value={gstin}
                    onChange={e => setGstin(e.target.value)}
                    className="h-10 rounded-xl text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Default Operational Currency</Label>
                  <Input
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Official Support Email</Label>
                  <Input
                    type="email"
                    value={supportEmail}
                    onChange={e => setSupportEmail(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Official Contact Phone</Label>
                  <Input
                    value={supportPhone}
                    onChange={e => setSupportPhone(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-semibold">Registered Office Address</Label>
                  <Input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading || saving === 'business'}
                  className="gradient-brand text-white border-0 font-bold text-xs h-10 px-6 rounded-xl shadow-md gap-1.5"
                >
                  {saving === 'business' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving === 'business' ? 'Saving...' : 'Save Business Settings'}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* 2. RENTAL & FEE DEFAULTS */}
        <TabsContent value="rental">
          <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="font-black text-base text-foreground">
                Default Rental Charges & Penalty Rules
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Baseline rates applied during car assignment, late fee calculations, and return inspections.
              </p>
            </div>

            <form onSubmit={handleSaveRental} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Default Daily Rental Rate (₹)</Label>
                  <Input
                    type="number"
                    value={defaultDailyRate}
                    onChange={e => setDefaultDailyRate(e.target.value)}
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Default Hourly Rental Rate (₹)</Label>
                  <Input
                    type="number"
                    value={defaultHourlyRate}
                    onChange={e => setDefaultHourlyRate(e.target.value)}
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Default Security Deposit (₹)</Label>
                  <Input
                    type="number"
                    value={defaultDeposit}
                    onChange={e => setDefaultDeposit(e.target.value)}
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Late Return Penalty (₹ / Hour)</Label>
                  <Input
                    type="number"
                    value={lateFeePerHour}
                    onChange={e => setLateFeePerHour(e.target.value)}
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Extra Distance Rate (₹ / KM)</Label>
                  <Input
                    type="number"
                    value={extraKmCharge}
                    onChange={e => setExtraKmCharge(e.target.value)}
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Late Return Grace Period (Minutes)</Label>
                  <Input
                    type="number"
                    value={gracePeriodMins}
                    onChange={e => setGracePeriodMins(e.target.value)}
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">GST Rate (%)</Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={e => setTaxRate(e.target.value)}
                    className="h-10 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading || saving === 'rental'}
                  className="gradient-brand text-white border-0 font-bold text-xs h-10 px-6 rounded-xl shadow-md gap-1.5"
                >
                  {saving === 'rental' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving === 'rental' ? 'Saving...' : 'Save Rental Defaults'}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </PermissionGuard>
  )
}
