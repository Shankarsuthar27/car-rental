import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { fullName, email, phone, password } = await req.json()

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Create user in Supabase Auth with pre-confirmed email
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || '',
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Upsert profile
    await supabase.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        phone: phone || null,
        role: 'customer',
      },
      { onConflict: 'id' }
    )

    // 3. Create customer record
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    await supabase.from('customers').insert({
      profile_id: userId,
      customer_code: `CUST-${new Date().getFullYear()}-${randomSuffix}`,
      kyc_status: 'pending',
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      userId,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create account' },
      { status: 500 }
    )
  }
}
