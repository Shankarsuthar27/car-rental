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
  ShieldCheck,
  CheckCircle2,
  KeyRound
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

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

  // Forgot Password Modal
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) {
        setErrorMsg(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Set cookie if remember me is checked
        if (rememberMe) {
          document.cookie = `driveease_demo_role=super_admin; path=/; max-age=2592000; SameSite=Lax`
        }

        window.location.href = '/admin/dashboard'
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please check credentials.')
      setLoading(false)
    }
  }

  // Quick Demo Admin Login
  const handleDemoAdminLogin = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      // 1. Set client cookie directly for instant middleware approval
      document.cookie = `driveease_demo_role=super_admin; path=/; max-age=604800; SameSite=Lax`

      // 2. Call backend demo provisioning endpoint
      await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      })

      // 3. Navigate directly to Admin Dashboard
      window.location.href = '/admin/dashboard'
    } catch (err) {
      window.location.href = '/admin/dashboard'
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login`,
      })
      setForgotSuccess(true)
    } catch (err) {
      setForgotSuccess(true) // For security, show sent message
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card/90 backdrop-blur-xl border border-border/80 rounded-3xl p-8 shadow-2xl space-y-6"
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
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email)
                  setForgotSuccess(false)
                  setForgotOpen(true)
                }}
                className="text-primary hover:underline text-[11px] font-medium transition-colors"
              >
                Forgot password?
              </button>
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

        {/* Demo Fast Access */}
        <div className="pt-3 border-t border-border/80 space-y-2.5 text-center">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Instant Reviewer One-Click Access
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleDemoAdminLogin}
            className="w-full h-10 rounded-xl font-bold text-xs bg-muted/20 hover:bg-muted/40 border-primary/30 hover:border-primary text-foreground flex items-center justify-center gap-2 shadow-sm"
          >
            <span>👑 One-Click Demo Admin Login</span>
          </Button>
        </div>
      </motion.div>

      {/* FORGOT PASSWORD DIALOG */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" /> Reset Admin Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter your registered administrator email address to receive password recovery instructions.
            </DialogDescription>
          </DialogHeader>

          {forgotSuccess ? (
            <div className="py-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Recovery Email Sent</p>
              <p className="text-xs text-muted-foreground">
                If an account matches <strong>{forgotEmail}</strong>, password reset instructions have been dispatched.
              </p>
              <Button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="mt-4 text-xs h-9"
              >
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Registered Admin Email</Label>
                <Input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="admin@driveease.in"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForgotOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={forgotLoading || !forgotEmail}
                  className="gradient-brand text-white border-0 text-xs font-bold"
                >
                  {forgotLoading ? 'Sending...' : 'Send Recovery Link'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading Admin Portal...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  )
}
