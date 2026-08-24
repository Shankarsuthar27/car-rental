'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

function VerifyOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes (600s)
  const [resendCooldown, setResendCooldown] = useState(45) // 45s cooldown
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const urlEmail = searchParams.get('email')
    const storedEmail = typeof window !== 'undefined' ? sessionStorage.getItem('reset_email') : null
    const targetEmail = urlEmail || storedEmail || ''

    if (!targetEmail) {
      router.push('/forgot-password')
      return
    }

    setEmail(targetEmail)
  }, [searchParams, router])

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timeLeft])

  // Cooldown timer for Resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true)
      return
    }
    setCanResend(false)
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [resendCooldown])

  // Auto focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const maskEmail = (str: string) => {
    if (!str || !str.includes('@')) return '******'
    const [local, domain] = str.split('@')
    if (local.length <= 2) return `${local[0]}***@${domain}`
    return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/[^0-9]/g, '')

    if (cleanVal.length > 1) {
      // User pasted multiple characters into this box
      handlePaste(cleanVal)
      return
    }

    const newOtp = [...otp]
    newOtp[index] = cleanVal
    setOtp(newOtp)
    setErrorMsg(null)

    // Move to next input if filled
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (pastedData: string) => {
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6).split('')
    if (digits.length === 0) return

    const newOtp = ['', '', '', '', '', '']
    digits.forEach((d, i) => {
      if (i < 6) newOtp[i] = d
    })
    setOtp(newOtp)
    setErrorMsg(null)

    const focusIdx = Math.min(digits.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMsg(null)

    const code = otp.join('')
    if (code.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.message || 'Invalid verification code.')
        setLoading(false)
        return
      }

      setSuccessMsg('Code verified successfully!')

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('reset_token', data.resetToken)
      }

      setTimeout(() => {
        router.push(`/reset-password?token=${encodeURIComponent(data.resetToken)}`)
      }, 800)
    } catch (err) {
      setErrorMsg('Network error. Please try again.')
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend || resending) return

    setResending(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.message || 'Unable to resend code.')
        setResending(false)
        return
      }

      setSuccessMsg('A new 6-digit code has been sent to your email.')
      setResendCooldown(45)
      setTimeLeft(600)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      setErrorMsg('Failed to resend code. Please check your connection.')
    } finally {
      setResending(false)
    }
  }

  const isComplete = otp.every(d => d !== '')

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center px-4 py-12 overflow-hidden select-none">
      {/* Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/login-bg.jpg"
        alt="DriveEase Luxury Car Rental"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* Atmospheric Frosted Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/65 to-background/80 dark:from-background/95 dark:via-background/75 dark:to-background/85 pointer-events-none backdrop-blur-[2px]" />

      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      {/* Content Form Container */}
      <div className="relative z-10 w-full flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card/92 dark:bg-card/85 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-3xl p-7 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl gradient-brand text-white shadow-lg shadow-primary/20 mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Enter Verification Code
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We have sent a 6-digit OTP to{' '}
              <span className="font-semibold text-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md">
                {maskEmail(email)}
              </span>
            </p>
          </div>

          {/* Expiration Timer Pill */}
          <div className="flex items-center justify-center">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium transition-colors ${
                timeLeft > 60
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-rose-500/15 text-rose-500 border border-rose-500/30 animate-pulse'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Expires in {formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Error Banner */}
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

          {/* Success Banner */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* OTP Input Boxes */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex items-center justify-between gap-2 sm:gap-2.5">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => {
                    inputRefs.current[idx] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  onPaste={e => {
                    e.preventDefault()
                    handlePaste(e.clipboardData.getData('text'))
                  }}
                  className="w-12 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-2xl bg-muted/40 border border-border/80 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>

            <Button
              type="submit"
              disabled={loading || !isComplete || timeLeft === 0}
              className="w-full h-11 gradient-brand text-white border-0 hover:opacity-90 font-bold rounded-xl shadow-lg shadow-primary/20 gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
                </>
              ) : (
                <>
                  Verify OTP <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Resend Cooldown / Button */}
          <div className="pt-3 border-t border-border/80 flex flex-col items-center gap-3">
            <div className="text-xs text-muted-foreground">
              Didn't receive the code?{' '}
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-primary font-bold hover:underline inline-flex items-center gap-1 ml-1"
                >
                  {resending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RotateCw className="w-3 h-3" />
                  )}
                  Resend OTP
                </button>
              ) : (
                <span className="font-mono text-foreground font-semibold ml-1">
                  Resend in {resendCooldown}s
                </span>
              )}
            </div>

            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Change Email
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  )
}
