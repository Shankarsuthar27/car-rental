'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Gauge,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/admin/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const cleanEmail = email.trim().toLowerCase()
    const cleanPass = password.trim()

    // STRICT CHECK: Only admin@driveease.in and admin123 are permitted
    if (
      (cleanEmail === 'admin@driveease.in' || cleanEmail === 'admin') &&
      cleanPass === 'admin123'
    ) {
      document.cookie = `driveease_demo_role=super_admin; path=/; max-age=2592000; SameSite=Lax`
      try {
        await fetch('/api/auth/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'admin' }),
        })
      } catch {}
      window.location.href = '/admin/dashboard'
      return
    }

    // Reject all other usernames and passwords
    setTimeout(() => {
      setErrorMsg('Access Denied: Invalid administrator credentials. Only authorized staff can access the admin panel.')
      setLoading(false)
    }, 400)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card/92 dark:bg-card/85 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-3xl p-7 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2.5 mb-2">
            <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/20">
              <Gauge className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <span className="font-black text-2xl tracking-tight block leading-none">
                DriveEase
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mt-0.5">
                Fleet Management SaaS
              </span>
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Admin Staff Portal
          </h2>
          <p className="text-xs text-muted-foreground">
            Sign in with authorized administrator credentials to manage vehicle fleet, customer assignments, and returns.
          </p>
       
        </div>

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

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Admin Email / Username</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@driveease.in"
                className="pl-10 h-11 rounded-xl bg-muted/30 text-xs focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <Label className="font-semibold">Password</Label>
              <Link
                href="/forgot-password"
                className="text-primary hover:underline text-[11px] font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="pl-10 pr-10 h-11 rounded-xl bg-muted/30 text-xs focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
              />
              <span>Remember this session</span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 gradient-brand text-white border-0 hover:opacity-90 font-bold rounded-xl shadow-lg shadow-primary/20 gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                Sign In to Dashboard <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="pt-2 text-center">
          <span className="text-[11px] text-muted-foreground/80 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Authorized Personnel Only • Single Sign-On Protected
          </span>
        </div>
      </motion.div>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center px-4 py-12 overflow-hidden select-none">
      {/* Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/login-bg.jpg"
        alt="DriveEase Luxury Car Rental"
        className="absolute inset-0 w-full h-full object-cover object-center scale-100 pointer-events-none"
      />

      {/* Atmospheric Frosted Gradient Overlay for Contrast & Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/65 to-background/80 dark:from-background/95 dark:via-background/75 dark:to-background/85 pointer-events-none backdrop-blur-[2px]" />

      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      {/* Content Form Container */}
      <div className="relative z-10 w-full flex justify-center items-center">
        <Suspense
          fallback={
            <div className="p-8 text-center text-sm text-white bg-black/60 backdrop-blur-xl rounded-3xl flex items-center gap-2 shadow-2xl border border-white/10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading Admin Portal...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
