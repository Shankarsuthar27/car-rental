'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BrandLogo } from '@/components/brand/BrandLogo'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid administrator email address.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.message || 'Unable to send OTP. Please try again later.')
        setLoading(false)
        return
      }

      setSuccessMsg(data.message || 'If an account exists with this email, an OTP has been sent.')

      // Save email in session storage for the verify page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('reset_email', cleanEmail)
      }

      // Redirect to Verify OTP page after a brief moment
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(cleanEmail)}`)
      }, 1200)
    } catch (err: any) {
      setErrorMsg('Network error. Please check your internet connection.')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen relative flex flex-col justify-center items-center px-4 py-12 overflow-hidden select-none bg-cover bg-center"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      {/* Atmospheric Frosted Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/65 to-background/80 dark:from-background/95 dark:via-background/75 dark:to-background/85 pointer-events-none backdrop-blur-[2px]" />

      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      {/* Form Container */}
      <div className="relative z-10 w-full flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card/92 dark:bg-card/85 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-3xl p-7 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-3">
              <BrandLogo size="lg" textVariant="full" href="/" priority />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Forgot Password?
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter your registered administrator email address. We'll send you a secure 6-digit verification code to reset your password.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Success Message */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg} Redirecting to verification...</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Registered Admin Email</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@driveease.in"
                  className="pl-10 h-11 rounded-xl bg-muted/30 text-xs focus-visible:ring-primary"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full h-11 gradient-brand text-white border-0 hover:opacity-90 font-bold rounded-xl shadow-lg shadow-primary/20 gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Dispatching OTP...
                </>
              ) : (
                <>
                  Send Verification OTP <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Security Note & Back Link */}
          <div className="pt-3 border-t border-border/80 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80">
              <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Single-Use 10-Minute Cryptographic Token
            </div>
            <div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Staff Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
