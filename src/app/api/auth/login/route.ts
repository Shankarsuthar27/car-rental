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

    // 1. Check against active credentials (persistent in system_auth_credentials table)
    const isLocalValid = await PasswordResetService.validateCredentials(cleanEmail, cleanPass)

    if (isLocalValid) {
      // Check if this is the master owner or a team member/manager
      const isMasterAdmin =
        cleanEmail === 'jalorecarrentel@gmail.com' || cleanEmail === 'jalorecarrentel'

      let userRole = isMasterAdmin ? 'super_admin' : 'staff'
      let userPermissions: string[] = isMasterAdmin ? ['*'] : []
      let fullName = isMasterAdmin ? 'Administrator' : 'Staff Member'

      if (!isMasterAdmin) {
        try {
          const supabase = createAdminClient()
          const { data: employees } = await supabase
            .from('employees')
            .select('*')
            .eq('is_active', true)

          const cleanNoSpace = cleanEmail.replace(/[^a-z0-9]/g, '')

          const matchedEmp = (employees || []).find((emp) => {
            if (emp.emergency_contact) {
              try {
                const meta = JSON.parse(emp.emergency_contact)
                const u = meta.username?.toLowerCase()
                const em = meta.email?.toLowerCase()
                const fn = meta.full_name?.toLowerCase().replace(/[^a-z0-9]/g, '')
                const su = meta.short_username?.toLowerCase()

                if (em === cleanEmail || u === cleanEmail || su === cleanEmail) return true
                if (fn && (fn === cleanNoSpace || cleanNoSpace.startsWith(fn) || fn.startsWith(cleanNoSpace))) return true
              } catch {}
            }
            if (emp.employee_code?.toLowerCase() === cleanEmail) return true
            if (emp.id === cleanEmail) return true
            return false
          })

          if (matchedEmp) {
            userRole = matchedEmp.designation || 'branch_manager'
            userPermissions = Array.isArray(matchedEmp.permissions) ? matchedEmp.permissions : []
            try {
              const meta = JSON.parse(matchedEmp.emergency_contact)
              fullName = meta.full_name || 'Staff Member'
            } catch {
              fullName = 'Staff Member'
            }
          }
        } catch (dbErr) {
          console.warn('[Login Auth] Employee lookup error:', dbErr)
        }
      }

      const response = NextResponse.json({
        success: true,
        redirect: '/admin/dashboard',
        message: 'Login successful.',
        role: userRole,
        permissions: userPermissions,
        name: fullName,
      })

      // Set auth session cookies
      response.cookies.set('driveease_demo_role', userRole, {
        path: '/',
        maxAge: 2592000,
        sameSite: 'lax',
        httpOnly: false,
      })
      response.cookies.set('driveease_user_permissions', encodeURIComponent(JSON.stringify(userPermissions)), {
        path: '/',
        maxAge: 2592000,
        sameSite: 'lax',
        httpOnly: false,
      })
      response.cookies.set('driveease_user_name', encodeURIComponent(fullName), {
        path: '/',
        maxAge: 2592000,
        sameSite: 'lax',
        httpOnly: false,
      })
      response.cookies.set('driveease_user_email', encodeURIComponent(cleanEmail), {
        path: '/',
        maxAge: 2592000,
        sameSite: 'lax',
        httpOnly: false,
      })

      return response
    }

    // 2. Check against Supabase Auth as secondary fallback
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      })

      if (!error && data.user) {
        const [{ data: prof }, { data: emp }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle(),
          supabase.from('employees').select('*').eq('profile_id', data.user.id).maybeSingle(),
        ])

        const userRole = prof?.role || data.user.user_metadata?.role || 'staff'
        const userPermissions = emp?.permissions || data.user.user_metadata?.permissions || []
        const fullName = prof?.full_name || data.user.user_metadata?.full_name || 'Staff Member'

        const response = NextResponse.json({
          success: true,
          redirect: '/admin/dashboard',
          message: 'Login successful.',
          role: userRole,
          permissions: userPermissions,
          name: fullName,
        })

        response.cookies.set('driveease_demo_role', userRole, {
          path: '/',
          maxAge: 2592000,
          sameSite: 'lax',
          httpOnly: false,
        })
        response.cookies.set('driveease_user_permissions', JSON.stringify(userPermissions), {
          path: '/',
          maxAge: 2592000,
          sameSite: 'lax',
          httpOnly: false,
        })
        response.cookies.set('driveease_user_name', encodeURIComponent(fullName), {
          path: '/',
          maxAge: 2592000,
          sameSite: 'lax',
          httpOnly: false,
        })
        response.cookies.set('driveease_user_email', cleanEmail, {
          path: '/',
          maxAge: 2592000,
          sameSite: 'lax',
          httpOnly: false,
        })

        return response
      }
    } catch (authErr) {
      console.warn('[Login Auth] Exception during remote Supabase login:', authErr)
    }

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
