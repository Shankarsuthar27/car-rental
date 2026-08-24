'use client'

import { useState } from 'react'
import {
  CreditCard,
  Search,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  QrCode,
  Building,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

interface AdminPaymentsClientProps {
  initialPayments: any[]
}

export function AdminPaymentsClient({ initialPayments }: AdminPaymentsClientProps) {
  const [payments, setPayments] = useState<any[]>(initialPayments)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Manual Payment Modal
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [amount, setAmount] = useState('5000')
  const [method, setMethod] = useState('cash')
  const [refNumber, setRefNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Refund Modal
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [refundAmount, setRefundAmount] = useState('1000')
  const [refundReason, setRefundReason] = useState('Security deposit refund after vehicle return')
  const [processingRefund, setProcessingRefund] = useState(false)

  const filtered = payments.filter(p => {
    const bookingNum = p.booking?.booking_number || ''
    const custName = p.customer?.profile?.full_name || ''
    const rzpId = p.razorpay_payment_id || p.reference_number || ''

    const matchesSearch =
      bookingNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rzpId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Handle Manual Payment Entry
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    const { data: newPayment, error } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId || '11111111-0000-0000-0000-000000000001',
        customer_id: '11111111-0000-0000-0000-000000000001',
        amount: Number(amount),
        currency: 'INR',
        payment_method: method,
        status: 'paid',
        reference_number: refNumber || `MANUAL-${Date.now()}`,
        payment_date: new Date().toISOString(),
        description: notes || 'Manual counter payment collection'
      })
      .select('*, customer:customers(profile:profiles!customers_profile_id_fkey(full_name)), booking:bookings(booking_number)')
      .single()

    if (!error && newPayment) {
      setPayments([newPayment, ...payments])
      setManualModalOpen(false)
    }
    setSaving(false)
  }

  // Handle Refund Initiation
  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayment) return
    setProcessingRefund(true)

    const supabase = createClient()

    // 1. Insert refund record
    await supabase.from('refunds').insert({
      booking_id: selectedPayment.booking_id,
      payment_id: selectedPayment.id,
      customer_id: selectedPayment.customer_id,
      amount: Number(refundAmount),
      reason: refundReason,
      status: 'completed',
      processed_at: new Date().toISOString()
    })

    // 2. Update payment status
    await supabase
      .from('payments')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', selectedPayment.id)

    setPayments(prev =>
      prev.map(p =>
        p.id === selectedPayment.id ? { ...p, status: 'refunded' } : p
      )
    )

    setProcessingRefund(false)
    setRefundModalOpen(false)
  }

  const totalCollected = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Title + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Payments & Gateway Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total revenue collected: <strong className="text-foreground">₹{totalCollected.toLocaleString('en-IN')}</strong> across {payments.length} transactions.
          </p>
        </div>

        <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-white border-0 hover:opacity-90 font-bold gap-2 text-xs h-10 shadow-md">
              <Plus className="w-4 h-4" /> Record Counter Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Record Cash / Manual Payment
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleRecordPayment} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Amount Received (₹)</Label>
                <Input
                  required
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="h-9 text-xs capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash Counter Collection</SelectItem>
                    <SelectItem value="bank_transfer">Direct Bank NEFT / RTGS</SelectItem>
                    <SelectItem value="upi">POS Terminal UPI QR</SelectItem>
                    <SelectItem value="card">POS Card Swipe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Reference / Receipt Number</Label>
                <Input
                  placeholder="e.g. CASH-REC-2026-08"
                  value={refNumber}
                  onChange={e => setRefNumber(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Notes / Reason</Label>
                <Input
                  placeholder="Security deposit or balance settlement"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManualModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  size="sm"
                  className="gradient-brand text-white border-0 font-bold"
                >
                  {saving ? 'Recording...' : 'Record Payment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by customer, booking #, ref..."
              className="pl-9 h-9 text-xs bg-muted/40"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {['all', 'paid', 'refunded', 'pending'].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="text-xs capitalize h-9"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">Booking / Tx ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Method & Channel</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Status</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <span className="font-mono font-bold text-primary block">
                      {p.booking?.booking_number || 'Direct Payment'}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {p.razorpay_payment_id || p.reference_number || p.id.slice(0, 8)}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="font-bold text-foreground block">
                      {p.customer?.profile?.full_name || p.customer?.emergency_contact_name || p.customer?.customer_code || 'Valued Customer'}
                    </span>
                  </td>

                  <td className="p-4 capitalize text-muted-foreground font-medium">
                    {p.payment_method.replace(/_/g, ' ')}
                  </td>

                  <td className="p-4 text-muted-foreground">
                    {new Date(p.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>

                  <td className="p-4">
                    <Badge
                      className={`text-[10px] uppercase font-bold capitalize ${
                        p.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : p.status === 'refunded'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      {p.status}
                    </Badge>
                  </td>

                  <td className="p-4 font-black text-sm text-foreground">
                    ₹{Number(p.amount).toLocaleString('en-IN')}
                  </td>

                  <td className="p-4 text-right">
                    {p.status === 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(p)
                          setRefundAmount(String(p.amount))
                          setRefundModalOpen(true)
                        }}
                        className="h-7 text-xs text-rose-600 hover:text-rose-700"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Refund
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REFUND MODAL */}
      <Dialog open={refundModalOpen} onOpenChange={setRefundModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-600" /> Process Transaction Refund
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <form onSubmit={handleProcessRefund} className="space-y-3 pt-2">
              <div className="p-3 bg-muted/40 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-foreground block">
                  Original Transaction Amount: ₹{selectedPayment.amount.toLocaleString('en-IN')}
                </span>
                <span className="text-muted-foreground block">
                  Booking #{selectedPayment.booking?.booking_number}
                </span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Refund Amount (₹)</Label>
                <Input
                  required
                  type="number"
                  value={refundAmount}
                  max={selectedPayment.amount}
                  onChange={e => setRefundAmount(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Reason for Refund</Label>
                <Input
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRefundModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={processingRefund}
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {processingRefund ? 'Refunding...' : 'Confirm & Settle Refund'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
