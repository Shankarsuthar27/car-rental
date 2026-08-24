import { NextResponse } from 'next/server'
import { PasswordResetService } from '@/services/PasswordResetService'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanPass = password.trim()

    // 1. Check against active updated credentials (including newly reset password)
    const isLocalValid = PasswordResetService.validateCredentials(cleanEmail, cleanPass)

    if (isLocalValid) {
      const response = NextResponse.json({
        success: true,
        redirect: '/admin/dashboard',
        message: 'Login successful.',
      })

      // Set auth session cookie
      response.cookies.set('driveease_demo_role', 'super_admin', {
        path: '/',
        maxAge: 2592000,
        sameSite: 'lax',
        httpOnly: false,
      })

      return response
    }

    // 2. Check against Supabase Auth if applicable
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      })

      if (!error && data.user) {
        const response = NextResponse.json({
          success: true,
          redirect: '/admin/dashboard',
          message: 'Login successful.',
        })

        response.cookies.set('driveease_demo_role', 'super_admin', {
          path: '/',
          maxAge: 2592000,
          sameSite: 'lax',
          httpOnly: false,
        })

        return response
      }
    } catch {}

    // Invalid credentials
    return NextResponse.json(
      {
        success: false,
        message: 'Access Denied: Invalid administrator credentials. Only authorized staff can access the admin panel.',
      },
      { status: 401 }
    )
  } catch (error) {
    console.error('[API/auth/login] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Authentication failed. Please try again.' },
      { status: 500 }
    )
  }
}
