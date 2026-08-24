import { NextResponse } from 'next/server'
import { PasswordResetService } from '@/services/PasswordResetService'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    const result = await PasswordResetService.requestOtp(email)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message, cooldownSeconds: result.cooldownSeconds },
        { status: 429 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email.',
    })
  } catch (error: any) {
    console.error('[API/auth/resend-otp] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Unable to resend OTP at this moment.' },
      { status: 500 }
    )
  }
}
