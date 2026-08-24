'use client'

import { useState } from 'react'
import {
  FileText,
  Search,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building,
  Gauge,
  Edit,
  DollarSign,
  Receipt,
  Check,
  X,
  RefreshCw
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

interface AdminInvoicesClientProps {
  initialInvoices: any[]
}

export function AdminInvoicesClient({ initialInvoices }: AdminInvoicesClientProps) {
  const [invoices, setInvoices] = useState<any[]>(initialInvoices)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  // Edit Invoice States
  const [editInvId, setEditInvId] = useState('')
  const [editBaseRental, setEditBaseRental] = useState('0')
  const [editInsurance, setEditInsurance] = useState('0')
  const [editTaxRate, setEditTaxRate] = useState('18')
  const [saving, setSaving] = useState(false)

  // Demo fallback invoice if database is brand new
  const displayInvoices =
    invoices.length > 0
      ? invoices
      : [
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

  const filtered = displayInvoices.filter(inv => {
    const num = inv.invoice_number || ''
    const cust = inv.customer?.profile?.full_name || ''
    const bk = inv.booking?.booking_number || ''

    return (
      num.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bk.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const openEditModal = (inv: any) => {
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

  // Live Recalculations for Invoice
  const baseNum = Number(editBaseRental) || 0
  const insNum = Number(editInsurance) || 0
  const taxRateNum = Number(editTaxRate) || 18
  const subtotalNum = baseNum + insNum
  const taxAmountNum = Math.round((subtotalNum * (taxRateNum / 100)) * 100) / 100
  const grandTotalNum = Math.round((subtotalNum + taxAmountNum) * 100) / 100

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Update in local state
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

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          GST Tax Invoices & Billing
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate compliant commercial GST rental tax invoices with itemized Base Rental, Insurance, and 18% GST breakdowns.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by invoice #, customer, booking #..."
          className="h-8 text-xs bg-muted/40 rounded-xl"
        />
      </div>

      {/* Invoices Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Vehicle / Booking</th>
                <th className="p-4">Breakdown (Base + Ins)</th>
                <th className="p-4">GST ({taxRateNum}%)</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(inv => {
                const baseVal = inv.booking?.base_rental ?? inv.base_rental ?? inv.subtotal ?? 0
                const insVal = inv.booking?.insurance_charge ?? inv.insurance_charge ?? 0

                return (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">
                      {inv.invoice_number}
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-foreground block">
                        {inv.customer?.profile?.full_name || inv.customer?.emergency_contact_name || inv.customer?.customer_code || 'Valued Customer'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {inv.customer?.profile?.phone || inv.customer?.emergency_contact_phone || '—'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-foreground block">
                        {inv.booking?.vehicle?.brand} {inv.booking?.vehicle?.model}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
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

                    <td className="p-4 text-foreground font-medium">
                      ₹{Number(inv.tax_amount || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="p-4 font-black text-sm text-foreground">
                      ₹{Number(inv.total).toLocaleString('en-IN')}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(inv)}
                          className="h-8 text-xs text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit Rates
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoice(inv)
                            setPreviewOpen(true)
                          }}
                          className="h-8 text-xs gap-1.5 rounded-lg cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT INVOICE RATES MODAL */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Edit Invoice Billing Breakdown
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Adjust the Base Rental, Insurance, and GST rate for invoice #{selectedInvoice?.invoice_number}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveInvoice} className="space-y-4 pt-2">
            <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-border">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Base Rental (₹)</Label>
                <Input
                  type="number"
                  step="any"
                  required
                  value={editBaseRental}
                  onChange={e => setEditBaseRental(e.target.value)}
                  className="h-9 text-xs font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Insurance (₹)</Label>
                <Input
                  type="number"
                  step="any"
                  value={editInsurance}
                  onChange={e => setEditInsurance(e.target.value)}
                  className="h-9 text-xs font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">GST Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editTaxRate}
                  onChange={e => setEditTaxRate(e.target.value)}
                  className="h-9 text-xs font-bold rounded-xl"
                />
              </div>
            </div>

            {/* Recalculated Summary */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-semibold text-foreground">₹{subtotalNum.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST ({taxRateNum}%):</span>
                <span className="font-semibold text-foreground">₹{taxAmountNum.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-foreground pt-1 border-t border-primary/20">
                <span>Grand Total:</span>
                <span className="text-primary">₹{grandTotalNum.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="gradient-brand text-white border-0 font-bold rounded-xl text-xs"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRINTABLE GST INVOICE MODAL */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-3xl">
          {selectedInvoice && (
            <div className="space-y-6 text-foreground print:text-black">
              {/* Top Company Header */}
              <div className="flex justify-between items-start pb-6 border-b border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold text-xl">DriveEase Mobility SaaS</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    C-Scheme, Ashok Marg, Jaipur, Rajasthan 302001
                  </p>
                  <p className="text-xs font-mono font-bold text-primary">
                    GSTIN: 08ABCDE1234F1Z5 • support@driveease.in
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <Badge className="bg-primary text-white text-xs">TAX INVOICE</Badge>
                  <h3 className="font-mono text-sm font-bold block mt-1">
                    {selectedInvoice.invoice_number}
                  </h3>
                  <span className="text-[11px] text-muted-foreground block">
                    Date: {selectedInvoice.invoice_date}
                  </span>
                </div>
              </div>

              {/* Billed To & Vehicle Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-muted/40 rounded-2xl space-y-1 border border-border/60">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] block">
                    Billed To (Customer):
                  </span>
                  <span className="font-bold text-sm block">
                    {selectedInvoice.customer?.profile?.full_name || selectedInvoice.customer?.emergency_contact_name || 'Valued Customer'}
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
                    Vehicle & Rental Period:
                  </span>
                  <span className="font-bold text-sm block">
                    {selectedInvoice.booking?.vehicle?.brand} {selectedInvoice.booking?.vehicle?.model}
                  </span>
                  <span className="font-mono text-muted-foreground block">
                    Reg: {selectedInvoice.booking?.vehicle?.registration_number}
                  </span>
                  <span className="text-muted-foreground block">
                    Booking #{selectedInvoice.booking?.booking_number}
                  </span>
                </div>
              </div>

              {/* Line Items Table with itemized Base Rental, Insurance & GST */}
              <div className="border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 border-b border-border font-bold">
                    <tr>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-3">
                        <span className="font-semibold block">Base Vehicle Rental Charges</span>
                        <span className="text-[10px] text-muted-foreground">Self-drive hire including standard daily allowance</span>
                      </td>
                      <td className="p-3 text-right font-medium">
                        ₹{Number(selectedInvoice.booking?.base_rental ?? selectedInvoice.base_rental ?? selectedInvoice.subtotal ?? 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    {(selectedInvoice.booking?.insurance_charge > 0 || selectedInvoice.insurance_charge > 0) && (
                      <tr>
                        <td className="p-3">
                          <span className="font-semibold block">Comprehensive Insurance Protection</span>
                          <span className="text-[10px] text-muted-foreground">Zero-depreciation rental collision protection</span>
                        </td>
                        <td className="p-3 text-right font-medium">
                          ₹{Number(selectedInvoice.booking?.insurance_charge ?? selectedInvoice.insurance_charge ?? 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="p-3 text-muted-foreground font-medium">
                        Output CGST ({((selectedInvoice.tax_rate || 18) / 2).toFixed(1)}%) + SGST ({((selectedInvoice.tax_rate || 18) / 2).toFixed(1)}%)
                      </td>
                      <td className="p-3 text-right font-medium">
                        ₹{Number(selectedInvoice.tax_amount || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="bg-muted/20 font-black text-sm">
                      <td className="p-3">Grand Total (INR)</td>
                      <td className="p-3 text-right text-primary">
                        ₹{Number(selectedInvoice.total || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[11px] text-muted-foreground italic">
                  This is a computer generated digital tax invoice.
                </span>
                <Button onClick={handlePrint} className="gradient-brand text-white border-0 font-bold gap-2 rounded-xl">
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
