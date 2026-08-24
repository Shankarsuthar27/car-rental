import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { role } = await req.json()
    const isSuperAdmin = role === 'admin'
    const userRole = isSuperAdmin ? 'super_admin' : 'customer'
    const email = isSuperAdmin ? 'admin@driveease.in' : 'rahul@example.com'
    const password = 'Password@123'
    const fullName = isSuperAdmin ? 'Admin DriveEase' : 'Rahul Sharma'

    try {
      const supabase = createAdminClient()

      // Attempt to create / ensure user exists in Supabase
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })

      let userId = newUser?.user?.id

      if (!userId && createError) {
        const { data: userList } = await supabase.auth.admin.listUsers()
        const existing = userList?.users?.find(u => u.email === email)
        if (existing) {
          userId = existing.id
          await supabase.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
          })
        }
      }

      if (userId) {
        await supabase.from('profiles').upsert(
          {
            id: userId,
            email,
            full_name: fullName,
            role: userRole,
            is_active: true,
          },
          { onConflict: 'id' }
        )

        if (!isSuperAdmin) {
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('profile_id', userId)
            .single()

          if (!existingCustomer) {
            await supabase.from('customers').insert({
              profile_id: userId,
              customer_code: 'CUST-DEMO-001',
              city: 'Jaipur',
              state: 'Rajasthan',
              kyc_status: 'verified',
            })
          }
        }
      }
    } catch (e) {
      console.warn('Supabase Admin provisioning warning (proceeding with demo cookie):', e)
    }

    const response = NextResponse.json({
      success: true,
      email,
      password,
      role: userRole,
    })

    // Set demo role cookie (valid for 7 days)
    response.cookies.set('driveease_demo_role', userRole, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Demo auth error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to setup demo account' },
      { status: 500 }
    )
  }
}
