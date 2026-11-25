'use client'

import { useState } from 'react'
import {
  CreditCard,
  Search,
  Plus,
  ArrowLeft,
  Lock,
  IndianRupee,
  Clock,
  RotateCcw,
  Receipt
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
import { usePermissions } from '@/hooks/usePermissions'

interface AdminPaymentsClientProps {
  initialPayments: any[]
}

export function AdminPaymentsClient({ initialPayments }: AdminPaymentsClientProps) {
  const { can } = usePermissions()
  const canViewStatus = can('payments.view')
  const canViewAmounts = can('payments.view_amounts')
  const canViewBalances = can('payments.view_balances')
  const canViewDetails = can('payments.view_details')
  const canCollect = can('payments.collect')

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
  const [submitError, setSubmitError] = useState<string | null>(null)

  const filtered = payments.filter(p => {
    const bookingNum = p.booking?.booking_number || ''
    const custName = p.customer?.profile?.full_name || ''
    const rzpId = canViewDetails ? (p.razorpay_payment_id || p.reference_number || '') : ''

    const matchesSearch =
      bookingNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rzpId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Handle Manual Payment Entry via guarded API route
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canCollect) return
    setSaving(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId.trim() || undefined,
          amount: Number(amount),
          payment_method: method,
          reference_number: refNumber.trim() || undefined,
          description: notes.trim() || 'Manual counter payment collection',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data?.error || 'Failed to record payment')
        setSaving(false)
        return
      }
      setPayments([data, ...payments])
      setManualModalOpen(false)
      setBookingId('')
      setRefNumber('')
      setNotes('')
    } catch {
      setSubmitError('Network error while recording payment.')
    } finally {
      setSaving(false)
    }
  }

  const totalCollected = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const totalPendingDues = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const totalRefunded = payments
    .filter(p => p.status === 'refunded')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const canSeeAmountForPayment = (p: any) => {
    if (p.amount === null || p.amount === undefined) return false
    if (p.status === 'pending') return canViewBalances || canViewAmounts
    return canViewAmounts
  }

  return (
    <div className="space-y-6">
      {/* Title + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Payments &amp; Gateway Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total revenue collected:{' '}
            <strong className="text-foreground">
              {canViewAmounts ? `₹${totalCollected.toLocaleString('en-IN')}` : '₹ ••••'}
            </strong>{' '}
            across {payments.length} transactions.
          </p>
        </div>

        <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={!canCollect}
              title={canCollect ? 'Record a manual counter payment' : 'Permission required: Collect & Record Payments'}
              className="gradient-brand text-white border-0 hover:opacity-90 font-bold gap-2 text-xs h-10 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {canCollect ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              Record Counter Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200/60 dark:hover:bg-muted flex items-center justify-center text-primary transition-colors cursor-pointer shrink-0"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Record Cash / Manual Payment
                </DialogTitle>
              </div>
            </DialogHeader>

            <form onSubmit={handleRecordPayment} className="space-y-3 pt-2">
              {submitError && (
                <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                  {submitError}
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Booking # (Optional)</Label>
                <Input
                  placeholder="e.g. RNT-2026-123456"
                  value={bookingId}
                  onChange={e => setBookingId(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Amount Received (₹)</Label>
                <Input
                  required
                  type="number"
                  min={1}
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
                  className="gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !canCollect}
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

      {/* Granular Payment KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Total Collected</span>
            <IndianRupee className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black font-mono text-foreground">
            {canViewAmounts ? `₹${totalCollected.toLocaleString('en-IN')}` : '₹ ••••'}
          </div>
          <span className="text-[10px] text-muted-foreground block">
            {canViewAmounts ? 'Verified settled receipts' : 'Amount view restricted'}
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Pending Dues</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black font-mono text-amber-600">
            {canViewBalances || canViewAmounts ? `₹${totalPendingDues.toLocaleString('en-IN')}` : '₹ ••••'}
          </div>
          <span className="text-[10px] text-muted-foreground block">
            {canViewBalances || canViewAmounts ? 'Awaiting settlement' : 'Balance view restricted'}
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Refunded</span>
            <RotateCcw className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black font-mono text-foreground">
            {canViewAmounts ? `₹${totalRefunded.toLocaleString('en-IN')}` : '₹ ••••'}
          </div>
          <span className="text-[10px] text-muted-foreground block">
            {canViewAmounts ? 'Returned deposits & refunds' : 'Amount view restricted'}
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Transactions</span>
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-black font-mono text-foreground">
            {payments.length}
          </div>
          <span className="text-[10px] text-muted-foreground block">
            {canViewDetails ? 'Full mode & Txn IDs visible' : 'Txn IDs & modes masked'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={canViewDetails ? 'Search by customer, booking #, ref...' : 'Search by customer or booking #...'}
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
                <th className="p-4">Method &amp; Channel</th>
                <th className="p-4">Date &amp; Time</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <span className="font-mono font-bold text-primary block">
                      {p.booking?.booking_number || 'Direct Payment'}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                      {canViewDetails && (p.razorpay_payment_id || p.reference_number) ? (
                        p.razorpay_payment_id || p.reference_number || p.id.slice(0, 8)
                      ) : canViewDetails ? (
                        p.id.slice(0, 8)
                      ) : (
                        <>
                          <Lock className="w-2.5 h-2.5" /> ID Restricted
                        </>
                      )}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="font-bold text-foreground block">
                      {p.customer?.profile?.full_name || p.customer?.emergency_contact_name || p.customer?.customer_code || 'Valued Customer'}
                    </span>
                  </td>

                  <td className="p-4 capitalize text-muted-foreground font-medium">
                    {canViewDetails && p.payment_method !== 'restricted' ? (
                      String(p.payment_method || 'cash').replace(/_/g, ' ')
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/75 normal-case">
                        <Lock className="w-3 h-3" /> Restricted
                      </span>
                    )}
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
                    {canViewStatus ? (
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
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Lock className="w-3 h-3" /> Restricted
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right font-black text-sm text-foreground font-mono">
                    {canSeeAmountForPayment(p) ? (
                      `₹${Number(p.amount).toLocaleString('en-IN')}`
                    ) : (
                      <span className="text-muted-foreground font-semibold">₹ ••••</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
