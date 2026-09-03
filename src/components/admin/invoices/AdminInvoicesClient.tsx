'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Search,
  Printer,
  Edit,
  DollarSign,
  Receipt,
  User,
  Car,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  X,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// ==========================================
// STRICT TYPESCRIPT INTERFACES
// ==========================================

export interface InvoiceVehicle {
  brand?: string
  model?: string
  year?: number
  registration_number?: string
}

export interface InvoiceBooking {
  booking_number?: string
  pickup_datetime?: string
  return_datetime?: string
  base_rental?: number
  insurance_charge?: number
  vehicle?: InvoiceVehicle
}

export interface InvoiceCustomerProfile {
  full_name?: string
  email?: string
  phone?: string
}

export interface InvoiceCustomer {
  customer_code?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  profile?: InvoiceCustomerProfile
}

export interface InvoiceRecord {
  id: string
  invoice_number: string
  invoice_date?: string
  subtotal: number
  base_rental?: number
  insurance_charge?: number
  tax_rate?: number
  tax_amount?: number
  total: number
  amount_paid?: number
  balance?: number
  is_paid?: boolean
  customer?: InvoiceCustomer
  booking?: InvoiceBooking
}

export interface AdminInvoicesClientProps {
  initialInvoices: InvoiceRecord[]
}

const DEFAULT_DEMO_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv-1',
    invoice_number: 'INV-202608-1001',
    invoice_date: '2026-08-20',
    subtotal: 5400,
    base_rental: 4350,
    insurance_charge: 1050,
    tax_rate: 18,
    tax_amount: 972,
    total: 6372,
    amount_paid: 6372,
    balance: 0,
    is_paid: true,
    customer: {
      profile: {
        full_name: 'Rahul Sharma',
        email: 'rahul@example.com',
        phone: '+91 98765 43210'
      }
    },
    booking: {
      booking_number: 'BK-202608-1002',
      pickup_datetime: '2026-08-20T10:00:00Z',
      return_datetime: '2026-08-23T16:00:00Z',
      base_rental: 4350,
      insurance_charge: 1050,
      vehicle: {
        brand: 'Hyundai',
        model: 'Creta',
        year: 2024,
        registration_number: 'RJ14-CR-2024'
      }
    }
  }
]

export function AdminInvoicesClient({ initialInvoices }: AdminInvoicesClientProps) {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(
    initialInvoices && initialInvoices.length > 0 ? initialInvoices : DEFAULT_DEMO_INVOICES
  )
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null)
  const [previewOpen, setPreviewOpen] = useState<boolean>(false)
  const [editOpen, setEditOpen] = useState<boolean>(false)

  // Edit Invoice States
  const [editInvId, setEditInvId] = useState<string>('')
  const [editBaseRental, setEditBaseRental] = useState<string>('0')
  const [editInsurance, setEditInsurance] = useState<string>('0')
  const [editTaxRate, setEditTaxRate] = useState<string>('18')
  const [saving, setSaving] = useState<boolean>(false)

  // Filtered list
  const filtered = invoices.filter(inv => {
    const num = inv.invoice_number || ''
    const cust = inv.customer?.profile?.full_name || inv.customer?.emergency_contact_name || ''
    const bk = inv.booking?.booking_number || ''
    const q = searchQuery.toLowerCase()

    return (
      num.toLowerCase().includes(q) ||
      cust.toLowerCase().includes(q) ||
      bk.toLowerCase().includes(q)
    )
  })

  const openEditModal = (inv: InvoiceRecord) => {
    const base = inv.booking?.base_rental ?? inv.base_rental ?? inv.subtotal ?? 0
    const ins = inv.booking?.insurance_charge ?? inv.insurance_charge ?? 0
    const rate = inv.tax_rate ?? 18

    setEditInvId(inv.id)
    setEditBaseRental(String(base))
    setEditInsurance(String(ins))
    setEditTaxRate(String(rate))
    setSelectedInvoice(inv)
    setEditOpen(true)
  }

  // Live Calculations for Edit Modal
  const baseNum = Number(editBaseRental) || 0
  const insNum = Number(editInsurance) || 0
  const taxRateNum = Number(editTaxRate) || 18
  const subtotalNum = baseNum + insNum
  const taxAmountNum = Math.round(subtotalNum * (taxRateNum / 100) * 100) / 100
  const grandTotalNum = Math.round((subtotalNum + taxAmountNum) * 100) / 100

  const handleSaveInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    setInvoices(prev =>
      prev.map(inv =>
        inv.id === editInvId
          ? {
              ...inv,
              subtotal: subtotalNum,
              tax_rate: taxRateNum,
              tax_amount: taxAmountNum,
              total: grandTotalNum,
              booking: inv.booking
                ? {
                    ...inv.booking,
                    base_rental: baseNum,
                    insurance_charge: insNum
                  }
                : undefined
            }
          : inv
      )
    )

    if (selectedInvoice && selectedInvoice.id === editInvId) {
      setSelectedInvoice({
        ...selectedInvoice,
        subtotal: subtotalNum,
        tax_rate: taxRateNum,
        tax_amount: taxAmountNum,
        total: grandTotalNum,
        booking: selectedInvoice.booking
          ? {
              ...selectedInvoice.booking,
              base_rental: baseNum,
              insurance_charge: insNum
            }
          : undefined
      })
    }

    setSaving(false)
    setEditOpen(false)
  }

  const handlePrint = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    window.print()
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 p-3.5 sm:p-5 md:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center text-white shrink-0 shadow-sm shadow-primary/25">
              <Receipt className="w-5 h-5 fill-current" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground truncate">
                GST Tax Invoices & Billing
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Compliant commercial GST rental tax invoices with itemized Base Rental, Insurance, and GST breakdown.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs font-mono px-2.5 py-1 border-primary/30 text-primary bg-primary/5">
            {filtered.length} {filtered.length === 1 ? 'Invoice' : 'Invoices'}
          </Badge>
        </div>
      </div>

      {/* Search Bar - Full width on 320px+, fixed max-width on tablet/desktop */}
      <div className="w-full sm:max-w-md">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" aria-hidden="true" />
          <Input
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, customer name, booking #..."
            className="pl-10 min-h-[44px] text-xs sm:text-sm bg-card border-border/80 rounded-2xl shadow-2xs focus-visible:ring-primary w-full"
            aria-label="Search invoices"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 min-h-[44px] min-w-[32px] flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. MOBILE & TABLET RESPONSIVE CARD VIEW (< lg: 320px - 1023px) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden">
        {filtered.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-card border border-border/80 rounded-3xl space-y-2">
            <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" aria-hidden="true" />
            <p className="text-sm font-bold text-foreground">No invoices matching your query</p>
            <p className="text-xs text-muted-foreground">Try searching with a different invoice number or customer name.</p>
          </div>
        ) : (
          filtered.map(inv => {
            const baseVal = inv.booking?.base_rental ?? inv.base_rental ?? inv.subtotal ?? 0
            const insVal = inv.booking?.insurance_charge ?? inv.insurance_charge ?? 0
            const customerName =
              inv.customer?.profile?.full_name ||
              inv.customer?.emergency_contact_name ||
              inv.customer?.customer_code ||
              'Valued Customer'
            const customerPhone =
              inv.customer?.profile?.phone || inv.customer?.emergency_contact_phone || ''

            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-card border border-border/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5 flex flex-col justify-between"
              >
                {/* Card Header: Invoice # and Paid Badge */}
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="space-y-0.5">
                    <span className="font-mono font-black text-sm text-primary block">
                      {inv.invoice_number}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Date: {inv.invoice_date || 'Current Session'}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border',
                      inv.is_paid
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    )}
                  >
                    {inv.is_paid ? 'Paid' : 'Pending'}
                  </Badge>
                </div>

                {/* Customer & Vehicle Info */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span className="font-bold text-foreground truncate">{customerName}</span>
                    {customerPhone && (
                      <a
                        href={`tel:${customerPhone}`}
                        className="ml-auto text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 min-h-[36px] px-1"
                        aria-label={`Call ${customerName}`}
                      >
                        <Phone className="w-3 h-3" aria-hidden="true" />
                        <span>{customerPhone}</span>
                      </a>
                    )}
                  </div>

                  {inv.booking && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Car className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                      <span className="text-foreground font-medium truncate">
                        {inv.booking.vehicle?.brand} {inv.booking.vehicle?.model}
                      </span>
                      <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded border border-border/50 ml-auto">
                        #{inv.booking.booking_number}
                      </span>
                    </div>
                  )}
                </div>

                {/* Financial Summary Box */}
                <div className="p-3 bg-muted/30 border border-border/60 rounded-2xl space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Base Hire:</span>
                    <span className="font-medium text-foreground">₹{Number(baseVal).toLocaleString('en-IN')}</span>
                  </div>
                  {insVal > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Insurance:</span>
                      <span className="font-medium text-foreground">₹{Number(insVal).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>GST ({inv.tax_rate ?? 18}%):</span>
                    <span className="font-medium text-foreground">₹{Number(inv.tax_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-foreground pt-1.5 border-t border-border/80">
                    <span>Grand Total:</span>
                    <span className="text-primary font-mono font-bold">₹{Number(inv.total).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Touch Action Buttons (Min 44px touch height) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openEditModal(inv)}
                    className="min-h-[44px] text-xs font-semibold rounded-xl border-border/80 hover:bg-muted/50 gap-1.5"
                    aria-label={`Edit rates for invoice ${inv.invoice_number}`}
                  >
                    <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                    <span>Edit Rates</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedInvoice(inv)
                      setPreviewOpen(true)
                    }}
                    className="gradient-brand text-white border-0 min-h-[44px] text-xs font-bold rounded-xl shadow-xs gap-1.5"
                    aria-label={`View and print invoice ${inv.invoice_number}`}
                  >
                    <Printer className="w-4 h-4" aria-hidden="true" />
                    <span>GST Invoice</span>
                  </Button>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. DESKTOP TABULAR VIEW (>= lg: 1024px+)                       */}
      {/* ============================================================ */}
      <div className="hidden lg:block bg-card border border-border/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Vehicle / Booking</th>
                <th className="p-4">Breakdown (Base + Ins)</th>
                <th className="p-4">GST Rate & Tax</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    <p className="font-semibold text-sm">No invoices found matching criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(inv => {
                  const baseVal = inv.booking?.base_rental ?? inv.base_rental ?? inv.subtotal ?? 0
                  const insVal = inv.booking?.insurance_charge ?? inv.insurance_charge ?? 0
                  const customerName =
                    inv.customer?.profile?.full_name ||
                    inv.customer?.emergency_contact_name ||
                    inv.customer?.customer_code ||
                    'Valued Customer'
                  const customerPhone =
                    inv.customer?.profile?.phone || inv.customer?.emergency_contact_phone || '—'

                  return (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-bold text-primary block text-sm">
                          {inv.invoice_number}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                          {inv.invoice_date || 'Session'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-foreground block truncate max-w-[180px]">
                          {customerName}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
                          {customerPhone}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-foreground block">
                          {inv.booking?.vehicle?.brand} {inv.booking?.vehicle?.model}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground block mt-0.5">
                          #{inv.booking?.booking_number}
                        </span>
                      </td>

                      <td className="p-4 text-muted-foreground">
                        <div className="space-y-0.5">
                          <span className="text-foreground font-semibold block">
                            Base: ₹{Number(baseVal).toLocaleString('en-IN')}
                          </span>
                          {insVal > 0 && (
                            <span className="text-[10px] text-muted-foreground block">
                              Ins: ₹{Number(insVal).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-foreground">
                        <span className="font-semibold block">
                          ₹{Number(inv.tax_amount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {inv.tax_rate ?? 18}% GST
                        </span>
                      </td>

                      <td className="p-4 font-black text-sm text-foreground">
                        <span className="font-mono font-black text-base text-foreground block">
                          ₹{Number(inv.total).toLocaleString('en-IN')}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] px-1.5 py-0 h-4 border uppercase font-bold mt-1',
                            inv.is_paid
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                          )}
                        >
                          {inv.is_paid ? 'Paid' : 'Pending'}
                        </Badge>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(inv)}
                            className="min-h-[44px] px-3 text-xs text-primary hover:bg-primary/10 rounded-xl"
                            aria-label={`Edit rates for invoice ${inv.invoice_number}`}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInvoice(inv)
                              setPreviewOpen(true)
                            }}
                            className="min-h-[44px] px-3.5 text-xs gap-1.5 rounded-xl border-border hover:bg-muted font-bold"
                            aria-label={`Print invoice ${inv.invoice_number}`}
                          >
                            <Printer className="w-3.5 h-3.5" aria-hidden="true" /> View PDF
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
      {/* 3. EDIT INVOICE RATES MODAL (Fluid & Mobile-Friendly)        */}
      {/* ============================================================ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl p-5 sm:p-6 md:p-7">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground">
              <DollarSign className="w-5 h-5 text-primary" aria-hidden="true" />
              <span>Edit Invoice Breakdown</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Adjust Base Rental, Insurance, and GST rate for invoice #{selectedInvoice?.invoice_number}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveInvoice} className="space-y-4 pt-2">
            <div className="space-y-3 p-4 bg-muted/40 rounded-2xl border border-border/80">
              <div className="space-y-1.5">
                <Label htmlFor="edit-base" className="text-xs font-semibold">
                  Base Rental Amount (₹)
                </Label>
                <Input
                  id="edit-base"
                  type="number"
                  step="any"
                  required
                  value={editBaseRental}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditBaseRental(e.target.value)}
                  className="min-h-[44px] text-sm font-bold rounded-xl bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-ins" className="text-xs font-semibold">
                  Insurance Charge (₹)
                </Label>
                <Input
                  id="edit-ins"
                  type="number"
                  step="any"
                  value={editInsurance}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditInsurance(e.target.value)}
                  className="min-h-[44px] text-sm font-bold rounded-xl bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-tax" className="text-xs font-semibold">
                  GST Tax Rate (%)
                </Label>
                <Input
                  id="edit-tax"
                  type="number"
                  step="0.1"
                  value={editTaxRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTaxRate(e.target.value)}
                  className="min-h-[44px] text-sm font-bold rounded-xl bg-background"
                />
              </div>
            </div>

            {/* Recalculated Summary Preview */}
            <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-2xl text-xs space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal (Base + Insurance):</span>
                <span className="font-semibold text-foreground">₹{subtotalNum.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Calculated GST ({taxRateNum}%):</span>
                <span className="font-semibold text-foreground">₹{taxAmountNum.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-black text-sm sm:text-base text-foreground pt-1.5 border-t border-primary/20">
                <span>Grand Total:</span>
                <span className="text-primary font-mono">₹{grandTotalNum.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="w-full sm:w-auto min-h-[44px] rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto min-h-[44px] gradient-brand text-white border-0 font-bold rounded-xl text-xs"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 4. PRINTABLE GST TAX INVOICE MODAL (Mobile-Optimized Layout) */}
      {/* ============================================================ */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[96vw] max-w-2xl max-h-[92dvh] overflow-y-auto p-4 sm:p-6 md:p-8 rounded-3xl">
          {selectedInvoice && (
            <div className="space-y-5 sm:space-y-6 text-foreground print:text-black">
              {/* Top Company Header (Stacked on mobile, row on tablet/desktop) */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 sm:pb-6 border-b border-border">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-primary/25 bg-slate-950 shadow-sm flex items-center justify-center">
                      <Image
                        src="/logo.png"
                        alt="JSD — Jalore Self Drive Car Rental"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <span className="font-black text-lg sm:text-xl leading-none block">JSD Car Rental</span>
                      <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block mt-1">
                        Jalore Self Drive Car Rental
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                    Jalore, Rajasthan • support@driveease.in
                  </p>
                  <p className="text-xs font-mono font-bold text-primary">
                    GSTIN: 08ABCDE1234F1Z5
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1 bg-muted/40 sm:bg-transparent p-3 sm:p-0 rounded-2xl w-full sm:w-auto">
                  <Badge className="bg-primary text-white text-xs">TAX INVOICE</Badge>
                  <h3 className="font-mono text-sm sm:text-base font-bold block mt-1">
                    {selectedInvoice.invoice_number}
                  </h3>
                  <span className="text-xs text-muted-foreground block">
                    Date: {selectedInvoice.invoice_date || 'Today'}
                  </span>
                </div>
              </div>

              {/* Billed To & Vehicle Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                <div className="p-3.5 bg-muted/40 rounded-2xl space-y-1 border border-border/60">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] block">
                    Billed To (Customer):
                  </span>
                  <span className="font-bold text-sm block">
                    {selectedInvoice.customer?.profile?.full_name ||
                      selectedInvoice.customer?.emergency_contact_name ||
                      'Valued Customer'}
                  </span>
                  <span className="text-muted-foreground block">
                    Email: {selectedInvoice.customer?.profile?.email || 'customer@driveease.in'}
                  </span>
                  <span className="text-muted-foreground block">
                    Phone: {selectedInvoice.customer?.profile?.phone || selectedInvoice.customer?.emergency_contact_phone || 'N/A'}
                  </span>
                </div>

                <div className="p-3.5 bg-muted/40 rounded-2xl space-y-1 border border-border/60">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] block">
                    Vehicle & Rental Details:
                  </span>
                  <span className="font-bold text-sm block">
                    {selectedInvoice.booking?.vehicle?.brand || 'Vehicle'} {selectedInvoice.booking?.vehicle?.model || ''}
                  </span>
                  <span className="font-mono text-muted-foreground block">
                    Reg No: {selectedInvoice.booking?.vehicle?.registration_number || 'RJ-SELFDRIVE'}
                  </span>
                  <span className="text-muted-foreground block">
                    Booking Ref: #{selectedInvoice.booking?.booking_number || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Line Items Table with Horizontal Safeguard on 320px */}
              <div className="border border-border rounded-2xl overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 border-b border-border font-bold">
                      <tr>
                        <th className="p-3 sm:p-3.5">Item Description</th>
                        <th className="p-3 sm:p-3.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-3 sm:p-3.5">
                          <span className="font-semibold block">Base Vehicle Rental Charges</span>
                          <span className="text-[10px] text-muted-foreground">Self-drive hire including daily allowance</span>
                        </td>
                        <td className="p-3 sm:p-3.5 text-right font-medium">
                          ₹{Number(selectedInvoice.booking?.base_rental ?? selectedInvoice.base_rental ?? selectedInvoice.subtotal ?? 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      {Number(selectedInvoice.booking?.insurance_charge ?? selectedInvoice.insurance_charge ?? 0) > 0 && (
                        <tr>
                          <td className="p-3 sm:p-3.5">
                            <span className="font-semibold block">Comprehensive Insurance Protection</span>
                            <span className="text-[10px] text-muted-foreground">Zero-depreciation collision waiver</span>
                          </td>
                          <td className="p-3 sm:p-3.5 text-right font-medium">
                            ₹{Number(selectedInvoice.booking?.insurance_charge ?? selectedInvoice.insurance_charge ?? 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="p-3 sm:p-3.5 text-muted-foreground font-medium">
                          Output CGST ({((selectedInvoice.tax_rate || 18) / 2).toFixed(1)}%) + SGST ({((selectedInvoice.tax_rate || 18) / 2).toFixed(1)}%)
                        </td>
                        <td className="p-3 sm:p-3.5 text-right font-medium">
                          ₹{Number(selectedInvoice.tax_amount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr className="bg-muted/20 font-black text-sm sm:text-base">
                        <td className="p-3 sm:p-3.5">Grand Total (INR)</td>
                        <td className="p-3 sm:p-3.5 text-right text-primary font-mono">
                          ₹{Number(selectedInvoice.total || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer with Minimum 44px Button */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <span className="text-[11px] text-muted-foreground italic text-center sm:text-left">
                  This is a computer generated digital tax invoice.
                </span>
                <Button
                  type="button"
                  onClick={handlePrint}
                  className="w-full sm:w-auto min-h-[44px] gradient-brand text-white border-0 font-bold gap-2 rounded-xl"
                  aria-label="Print or download invoice PDF"
                >
                  <Printer className="w-4 h-4" aria-hidden="true" />
                  <span>Print / Save PDF</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
