import type { Metadata } from 'next'
import { CreditCard, CheckCircle2, RotateCcw, Download, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Payments & Deposit Refunds — DriveEase'
}

export default function CustomerPaymentsPage() {
  const transactions = [
    {
      id: 'tx-1',
      bookingNumber: 'BK-202608-1002',
      date: '20 Aug 2026, 11:24 AM',
      amount: 1767,
      type: 'Advance Rental Payment (30%)',
      method: 'UPI (Google Pay)',
      status: 'paid'
    },
    {
      id: 'tx-2',
      bookingNumber: 'BK-202607-0941',
      date: '17 Jul 2026, 06:15 PM',
      amount: 10000,
      type: 'Security Deposit Refund',
      method: 'Original Payment Method',
      status: 'refunded'
    },
    {
      id: 'tx-3',
      bookingNumber: 'BK-202607-0941',
      date: '14 Jul 2026, 08:50 AM',
      amount: 7850,
      type: 'Full Rental Settlement',
      method: 'Credit Card (HDFC)',
      status: 'paid'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments & Deposit Refunds</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track transaction receipts and automated security deposit refund statuses.
        </p>
      </div>

      {/* Security Deposit Security Notice */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Automated Security Deposit Return Guarantee</h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Your refundable deposit is processed automatically within 24–48 hours of vehicle return inspection. Deductions, if any (e.g. extra fuel or late return), are itemized clearly on your final tax invoice.
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="font-bold text-base">Payment History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">Transaction / Booking</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Description</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">
                    #{tx.bookingNumber}
                  </td>
                  <td className="p-4 text-muted-foreground">{tx.date}</td>
                  <td className="p-4 font-medium">{tx.type}</td>
                  <td className="p-4 text-muted-foreground">{tx.method}</td>
                  <td className="p-4">
                    <Badge
                      className={`text-[10px] uppercase font-bold capitalize ${
                        tx.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      }`}
                    >
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right font-extrabold text-sm">
                    {tx.status === 'refunded' ? '+' : ''}₹{tx.amount.toLocaleString('en-IN')}
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
