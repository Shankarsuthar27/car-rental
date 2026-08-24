import { NextResponse } from 'next/server'
import { PasswordResetService } from '@/services/PasswordResetService'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, otp } = body

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and 6-digit OTP are required.' },
        { status: 400 }
      )
    }

    const result = await PasswordResetService.verifyOtp(email, otp)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          remainingAttempts: result.remainingAttempts,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      resetToken: result.resetToken,
    })
  } catch (error: any) {
    console.error('[API/auth/verify-otp] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Verification failed. Please try again.' },
      { status: 500 }
    )
  }
}
