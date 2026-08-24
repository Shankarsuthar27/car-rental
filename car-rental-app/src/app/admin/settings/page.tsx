'use client'

import { useState } from 'react'
import {
  Building2,
  Lock,
  Mail,
  Bell,
  Save,
  CheckCircle2,
  FileText,
  CreditCard,
  Percent,
  Clock,
  Gauge,
  User,
  Shield,
  KeyRound,
  Sliders,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false)

  // 1. Business Settings
  const [businessName, setBusinessName] = useState('DriveEase Fleet Mobility Solutions')
  const [tagline, setTagline] = useState('Premium Fleet & Self-Drive Car Rental')
  const [gstin, setGstin] = useState('08ABCDE1234F1Z5')
  const [supportEmail, setSupportEmail] = useState('admin@driveease.in')
  const [supportPhone, setSupportPhone] = useState('+91-141-2345678')
  const [address, setAddress] = useState('C-Scheme, Ashok Marg, Jaipur, Rajasthan 302001')
  const [currency, setCurrency] = useState('INR (₹)')

  // 2. Rental Settings
  const [defaultHourlyRate, setDefaultHourlyRate] = useState('180')
  const [defaultDailyRate, setDefaultDailyRate] = useState('2200')
  const [defaultDeposit, setDefaultDeposit] = useState('10000')
  const [lateFeePerHour, setLateFeePerHour] = useState('200')
  const [extraKmCharge, setExtraKmCharge] = useState('14')
  const [gracePeriodMins, setGracePeriodMins] = useState('30')
  const [taxRate, setTaxRate] = useState('18')

  // 3. Admin Profile
  const [adminName, setAdminName] = useState('Admin Staff')
  const [adminEmail, setAdminEmail] = useState('admin@driveease.in')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
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
              Configure business identity, rental fee defaults, late penalty rates, and operator profile credentials.
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-bold">Settings updated and synchronized across all rental operations!</span>
        </div>
      )}

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid grid-cols-3 bg-card border border-border/80 h-11 p-1 rounded-2xl shadow-xs">
          <TabsTrigger value="business" className="text-xs rounded-xl font-bold gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Business Settings
          </TabsTrigger>
          <TabsTrigger value="rental" className="text-xs rounded-xl font-bold gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> Rental & Fee Defaults
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-xs rounded-xl font-bold gap-1.5">
            <User className="w-3.5 h-3.5" /> Admin Profile
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

            <form onSubmit={handleSave} className="space-y-4">
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
                <Button type="submit" className="gradient-brand text-white border-0 font-bold text-xs h-10 px-6 rounded-xl shadow-md gap-1.5">
                  <Save className="w-4 h-4" /> Save Business Settings
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

            <form onSubmit={handleSave} className="space-y-4">
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
                <Button type="submit" className="gradient-brand text-white border-0 font-bold text-xs h-10 px-6 rounded-xl shadow-md gap-1.5">
                  <Save className="w-4 h-4" /> Save Rental Defaults
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* 3. ADMIN PROFILE */}
        <TabsContent value="profile">
          <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="font-black text-base text-foreground">
                Operator Account & Credentials
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update administrator name, email, and password security.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Administrator Name</Label>
                  <Input
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Admin Login Email</Label>
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="font-bold text-xs text-foreground">Update Password</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Current Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">New Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Confirm Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" className="gradient-brand text-white border-0 font-bold text-xs h-10 px-6 rounded-xl shadow-md gap-1.5">
                  <Save className="w-4 h-4" /> Update Profile
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
