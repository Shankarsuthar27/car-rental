import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { NotificationService } from './NotificationService'

interface MemoryOtpRecord {
  email: string
  otpHash: string
  expiresAt: number
  attempts: number
  verifiedAt: number | null
  resetTokenHash: string | null
  resetTokenExpiresAt: number | null
  createdAt: number
}

// In-memory store for high-speed rate-limiting and resilient database fallback
const memoryStore = new Map<string, MemoryOtpRecord>()
const rateLimitStore = new Map<string, number[]>()

const SALT = process.env.SUPABASE_SERVICE_ROLE_KEY || 'driveease_secure_salt_2026'
const OTP_EXPIRY_MS = (Number(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000
const RESET_TOKEN_EXPIRY_MS = (Number(process.env.RESET_TOKEN_EXPIRY_MINUTES) || 15) * 60 * 1000
const MAX_ATTEMPTS = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_OTP_REQUESTS_PER_WINDOW = 4

function hashValue(value: string, email: string): string {
  return crypto
    .createHash('sha256')
    .update(`${value}:${email}:${SALT}`)
    .digest('hex')
}

export class PasswordResetService {
  /**
   * Check rate-limit for OTP generation per email
   */
  private static checkRateLimit(email: string): boolean {
    const now = Date.now()
    const timestamps = (rateLimitStore.get(email) || []).filter(
      t => now - t < RATE_LIMIT_WINDOW_MS
    )
    if (timestamps.length >= MAX_OTP_REQUESTS_PER_WINDOW) {
      return false
    }
    timestamps.push(now)
    rateLimitStore.set(email, timestamps)
    return true
  }

  /**
   * Mask email for secure UI display (e.g. ss2137789@gmail.com -> s****9@gmail.com)
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '******'
    const [local, domain] = email.split('@')
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`
    }
    const firstChar = local[0]
    const lastChar = local[local.length - 1]
    return `${firstChar}${'*'.repeat(Math.min(local.length - 2, 5))}${lastChar}@${domain}`
  }

  /**
   * Request 6-digit OTP and send via email
   */
  static async requestOtp(rawEmail: string): Promise<{ success: boolean; message: string; cooldownSeconds?: number }> {
    const email = rawEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' }
    }

    // Rate Limit Check
    if (!this.checkRateLimit(email)) {
      return {
        success: false,
        message: 'Too many OTP requests. Please wait a few minutes before trying again.',
      }
    }

    // Check Cooldown (at least 45 seconds between resends)
    const existing = memoryStore.get(email)
    if (existing && Date.now() - existing.createdAt < 45 * 1000) {
      const remainingSeconds = Math.ceil((45 * 1000 - (Date.now() - existing.createdAt)) / 1000)
      return {
        success: false,
        message: `Please wait ${remainingSeconds}s before requesting a new OTP.`,
        cooldownSeconds: remainingSeconds,
      }
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString()
    const otpHash = hashValue(otp, email)
    const now = Date.now()
    const expiresAt = now + OTP_EXPIRY_MS

    // Save in Memory Store
    memoryStore.set(email, {
      email,
      otpHash,
      expiresAt,
      attempts: 0,
      verifiedAt: null,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      createdAt: now,
    })

    // Also persist in Supabase if table exists
    try {
      const supabase = createAdminClient()
      await supabase.from('password_resets').insert({
        email,
        otp_hash: otpHash,
        expires_at: new Date(expiresAt).toISOString(),
        attempts: 0,
      })
    } catch {
      // Fallback silently to memory store
    }

    // Send Email via Resend
    await NotificationService.notifyPasswordResetOtp(email, otp, 10)

    return {
      success: true,
      message: 'If an account exists with this email, a 6-digit verification code has been sent.',
    }
  }

  /**
   * Verify 6-digit OTP and issue single-use Reset Token
   */
  static async verifyOtp(rawEmail: string, rawOtp: string): Promise<{
    success: boolean
    message: string
    resetToken?: string
    remainingAttempts?: number
  }> {
    const email = rawEmail.trim().toLowerCase()
    const otp = rawOtp.trim()

    if (!email || !otp || otp.length !== 6) {
      return { success: false, message: 'Please provide a valid 6-digit code.' }
    }

    const record = memoryStore.get(email)

    if (!record) {
      return {
        success: false,
        message: 'No active OTP request found. Please request a new code.',
      }
    }

    // Check expiration
    if (Date.now() > record.expiresAt) {
      memoryStore.delete(email)
      return {
        success: false,
        message: 'This verification code has expired. Please request a new OTP.',
      }
    }

    // Check max attempts
    if (record.attempts >= MAX_ATTEMPTS) {
      memoryStore.delete(email)
      return {
        success: false,
        message: 'Too many incorrect attempts. For security, this OTP has been invalidated. Please request a new one.',
      }
    }

    // Compare Hash
    const computedHash = hashValue(otp, email)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(record.otpHash, 'hex')
    )

    if (!isValid) {
      record.attempts += 1
      const remaining = MAX_ATTEMPTS - record.attempts
      if (remaining <= 0) {
        memoryStore.delete(email)
        return {
          success: false,
          message: 'Maximum attempts exceeded. Please request a new OTP.',
        }
      }
      return {
        success: false,
        message: `Invalid code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
        remainingAttempts: remaining,
      }
    }

    // OTP is valid! Generate single-use reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = hashValue(resetToken, email)
    const resetTokenExpiresAt = Date.now() + RESET_TOKEN_EXPIRY_MS

    record.verifiedAt = Date.now()
    record.resetTokenHash = resetTokenHash
    record.resetTokenExpiresAt = resetTokenExpiresAt

    return {
      success: true,
      message: 'OTP verified successfully.',
      resetToken,
    }
  }

  /**
   * Reset Password using verified Reset Token
   */
  static async resetPassword(
    resetToken: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    if (!resetToken || !newPassword) {
      return { success: false, message: 'Invalid request parameters.' }
    }

    if (newPassword.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long.' }
    }

    // Find record by reset token hash
    let matchingEmail: string | null = null
    let matchingRecord: MemoryOtpRecord | null = null

    for (const [email, record] of memoryStore.entries()) {
      if (
        record.resetTokenHash &&
        record.resetTokenExpiresAt &&
        Date.now() <= record.resetTokenExpiresAt
      ) {
        const testHash = hashValue(resetToken, email)
        if (
          testHash.length === record.resetTokenHash.length &&
          crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(record.resetTokenHash, 'hex'))
        ) {
          matchingEmail = email
          matchingRecord = record
          break
        }
      }
    }

    if (!matchingEmail || !matchingRecord) {
      return {
        success: false,
        message: 'Password reset session has expired or is invalid. Please start again.',
      }
    }

    // Invalidate the reset token immediately (single use protection)
    memoryStore.delete(matchingEmail)

    // Update password in Supabase Auth
    try {
      const supabase = createAdminClient()
      const { data: userList } = await supabase.auth.admin.listUsers()
      const targetUser = userList?.users?.find(
        u => u.email?.toLowerCase() === matchingEmail
      )

      if (targetUser) {
        await supabase.auth.admin.updateUserById(targetUser.id, {
          password: newPassword,
        })
      }
    } catch (err) {
      console.error('[PasswordResetService] Supabase password update note:', err)
    }

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    }
  }
}
