'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Loader2,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const urlToken = searchParams.get('token')
    const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('reset_token') : null
    const targetToken = urlToken || storedToken || ''

    if (!targetToken) {
      router.push('/forgot-password')
      return
    }

    setResetToken(targetToken)
  }, [searchParams, router])

  // Password Requirement Checks
  const hasMinLength = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasLower = /[a-z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword)

  // Calculate score (0 - 4)
  const score = [hasMinLength, (hasUpper && hasLower), hasNumber, hasSpecial].filter(Boolean).length
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword

  const getStrengthText = () => {
    if (newPassword.length === 0) return { label: 'None', color: 'text-muted-foreground' }
    if (score <= 1) return { label: 'Weak', color: 'text-rose-500' }
    if (score === 2) return { label: 'Fair', color: 'text-amber-500' }
    if (score === 3) return { label: 'Good', color: 'text-blue-500' }
    return { label: 'Strong', color: 'text-emerald-500' }
  }

  const strength = getStrengthText()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!hasMinLength) {
      setErrorMsg('Password must be at least 8 characters long.')
      return
    }

    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match. Please verify your entries.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.message || 'Failed to reset password. The session may have expired.')
        setLoading(false)
        return
      }

      // Clear stored temporary tokens
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('reset_email')
        sessionStorage.removeItem('reset_token')
      }

      setIsSuccess(true)
    } catch (err) {
      setErrorMsg('Network error. Please try again.')
      setLoading(false)
    }
  }

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
          {isSuccess ? (
            /* SUCCESS STATE */
            <div className="text-center space-y-5 py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 border border-emerald-500/30"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Password Reset Complete</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your administrator password has been updated securely. You can now log in using your new credentials.
                </p>
              </div>

              <Button
                asChild
                className="w-full h-11 gradient-brand text-white border-0 hover:opacity-90 font-bold rounded-xl shadow-lg shadow-primary/20 gap-2"
              >
                <Link href="/login">
                  Go to Login <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          ) : (
            /* PASSWORD RESET FORM */
            <>
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl gradient-brand text-white shadow-lg shadow-primary/20 mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Create New Password
                </h2>
                <p className="text-xs text-muted-foreground">
                  Choose a strong, secure password for your administrator account.
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

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">New Password</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pl-10 pr-10 h-11 rounded-xl bg-muted/30 text-xs focus-visible:ring-primary font-mono"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Password strength:</span>
                      <span className={`font-bold ${strength.color}`}>{strength.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map(step => (
                        <div
                          key={step}
                          className={`rounded-full transition-colors ${
                            score >= step
                              ? score === 1
                                ? 'bg-rose-500'
                                : score === 2
                                ? 'bg-amber-500'
                                : score === 3
                                ? 'bg-blue-500'
                                : 'bg-emerald-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pl-10 pr-10 h-11 rounded-xl bg-muted/30 text-xs focus-visible:ring-primary font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Live Requirements List */}
                <div className="bg-muted/30 border border-border/60 rounded-2xl p-3 text-[11px] space-y-1.5 text-muted-foreground">
                  <div className="font-semibold text-foreground mb-1">Password Requirements:</div>
                  <div className="flex items-center gap-1.5">
                    {hasMinLength ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasMinLength ? 'text-foreground font-medium' : ''}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasUpper && hasLower ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasUpper && hasLower ? 'text-foreground font-medium' : ''}>
                      Upper and lower case letters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasNumber ? 'text-foreground font-medium' : ''}>
                      At least one number (0-9)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {passwordsMatch ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={passwordsMatch ? 'text-emerald-500 font-medium' : ''}>
                      Passwords match
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !hasMinLength || !passwordsMatch}
                  className="w-full h-11 gradient-brand text-white border-0 hover:opacity-90 font-bold rounded-xl shadow-lg shadow-primary/20 gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating Password...
                    </>
                  ) : (
                    <>
                      Reset Password <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
