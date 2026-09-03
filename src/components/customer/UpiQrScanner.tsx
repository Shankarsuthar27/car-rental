'use client'

import { useState } from 'react'
import { Check, Copy, QrCode, Smartphone, ShieldCheck, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface UpiQrScannerProps {
  amount: number
  payeeName?: string
  upiId?: string
}

export function UpiQrScanner({
  amount,
  payeeName = 'shankar suthar',
  upiId = 'ss2137789@okhdfcbank',
}: UpiQrScannerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Standard UPI URI format with dynamic amount
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('JSD Car Rental Booking')}`

  // QR Code generator API URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}&margin=10`

  return (
    <div className="bg-gradient-to-b from-blue-50/50 to-indigo-50/50 dark:from-slate-900/80 dark:to-slate-950/80 border border-blue-200 dark:border-blue-900/50 rounded-3xl p-6 text-center space-y-5 shadow-sm">
      {/* Header with Payee Name */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold">
          <QrCode className="w-3.5 h-3.5" /> Instant UPI Payment
        </div>
        <h3 className="text-lg font-extrabold text-foreground capitalize">
          {payeeName}
        </h3>
        <p className="text-xs text-muted-foreground">
          Scan with GPay, PhonePe, Paytm, Cred, or any UPI App
        </p>
      </div>

      {/* QR Code Container */}
      <div className="relative inline-block mx-auto bg-white p-4 rounded-3xl shadow-md border border-slate-200">
        <div className="relative w-44 h-44 xs:w-52 xs:h-52 sm:w-56 sm:h-56 mx-auto flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeUrl}
            alt={`UPI QR Code for ${payeeName}`}
            className="w-full h-full object-contain rounded-2xl"
          />
          {/* GPay Central Badge */}
          <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-full p-1.5 shadow-md flex items-center justify-center border border-slate-100">
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs px-1">
          <span className="text-slate-500 font-medium">Amount to Pay:</span>
          <span className="font-extrabold text-slate-900 text-sm">
            ₹{amount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* UPI ID & Copy Bar */}
      <div className="max-w-sm mx-auto flex items-center justify-between bg-card border border-border rounded-2xl p-2.5 px-4">
        <div className="text-left">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            UPI ID
          </span>
          <span className="font-mono text-xs font-bold text-foreground">
            {upiId}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-8 gap-1.5 rounded-xl text-xs font-semibold"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy
            </>
          )}
        </Button>
      </div>

      {/* Mobile Direct Deep Link */}
      <div className="block sm:hidden">
        <Button
          type="button"
          variant="default"
          asChild
          className="w-full h-11 gradient-brand text-white font-bold rounded-2xl shadow-sm gap-2"
        >
          <a href={upiUri}>
            <Smartphone className="w-4 h-4" /> Open UPI App Directly
          </a>
        </Button>
      </div>

      {/* Trust Notice */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Scan to pay with any UPI app & complete reservation</span>
      </div>
    </div>
  )
}
