import { NextResponse } from 'next/server'
import { PasswordResetService } from '@/services/PasswordResetService'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { resetToken, newPassword } = body

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Reset token and new password are required.' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must contain at least 8 characters.' },
        { status: 400 }
      )
    }

    const result = await PasswordResetService.resetPassword(resetToken, newPassword)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error: any) {
    console.error('[API/auth/reset-password] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to reset password. Please try again.' },
      { status: 500 }
    )
  }
}
