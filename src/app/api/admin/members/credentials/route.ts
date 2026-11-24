import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

const SALT = process.env.SUPABASE_SERVICE_ROLE_KEY || 'driveease_secure_salt_2026'

function hashValue(value: string, emailOrUser: string): string {
  return crypto
    .createHash('sha256')
    .update(`${value}:${emailOrUser}:${SALT}`)
    .digest('hex')
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { employeeId, username, password } = body

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required.' },
        { status: 400 }
      )
    }

    if (!password || password.trim().length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters.' },
        { status: 400 }
      )
    }

    const cleanPass = password.trim()
    const cleanUser = (username || '').trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '')

    const supabaseAdmin = createAdminClient()

    // 1. Fetch current employee
    const { data: emp, error: fetchErr } = await supabaseAdmin
      .from('employees')
      .select('id, employee_code, emergency_contact, profile_id')
      .eq('id', employeeId)
      .single()

    if (fetchErr || !emp) {
      return NextResponse.json(
        { success: false, error: 'Employee record not found.' },
        { status: 404 }
      )
    }

    let meta: any = {}
    try {
      meta = JSON.parse(emp.emergency_contact || '{}')
    } catch {}

    // 2. Clear old credentials from system_auth_credentials
    const oldEntries = [
      meta.email,
      meta.username,
      meta.short_username,
      emp.employee_code,
    ].filter(Boolean)

    if (oldEntries.length > 0) {
      await supabaseAdmin
        .from('system_auth_credentials')
        .delete()
        .in('email', oldEntries.map((e: string) => e.toLowerCase()))
    }

    // 3. Compute updated identifiers
    const finalUsername =
      cleanUser || meta.username || meta.short_username || `staff${Math.floor(1000 + Math.random() * 9000)}`
    const finalEmail = finalUsername.includes('@')
      ? finalUsername
      : `${finalUsername}@carrental.local`
    const shortUser = finalUsername.split('@')[0].replace(/[^a-z0-9]/g, '')

    meta.username = finalUsername
    meta.short_username = shortUser
    meta.email = finalEmail

    // 4. Create new hashed credential entries
    const passHashEmail = hashValue(cleanPass, finalEmail.toLowerCase())
    const passHashUser = hashValue(cleanPass, finalUsername.toLowerCase())
    const passHashShort = hashValue(cleanPass, shortUser.toLowerCase())

    const credRecords = [
      {
        email: finalEmail.toLowerCase(),
        password_hash: passHashEmail,
        updated_at: new Date().toISOString(),
      },
      {
        email: finalUsername.toLowerCase(),
        password_hash: passHashUser,
        updated_at: new Date().toISOString(),
      },
      {
        email: shortUser.toLowerCase(),
        password_hash: passHashShort,
        updated_at: new Date().toISOString(),
      },
    ]

    if (emp.employee_code) {
      const passHashEmpCode = hashValue(cleanPass, emp.employee_code.toLowerCase())
      credRecords.push({
        email: emp.employee_code.toLowerCase(),
        password_hash: passHashEmpCode,
        updated_at: new Date().toISOString(),
      })
    }

    const { error: credErr } = await supabaseAdmin
      .from('system_auth_credentials')
      .upsert(credRecords)

    if (credErr) {
      console.error('[API/admin/members/credentials] Error saving credentials:', credErr)
      return NextResponse.json(
        { success: false, error: `Failed to update credentials: ${credErr.message}` },
        { status: 500 }
      )
    }

    // 5. Update employees table with updated metadata
    const { error: updateErr } = await supabaseAdmin
      .from('employees')
      .update({
        emergency_contact: JSON.stringify(meta),
      })
      .eq('id', employeeId)

    if (updateErr) {
      console.error('[API/admin/members/credentials] Error updating employee:', updateErr)
      return NextResponse.json(
        { success: false, error: `Failed to update employee metadata: ${updateErr.message}` },
        { status: 500 }
      )
    }

    // 6. Optional best-effort Supabase Auth password sync
    if (emp.profile_id) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(emp.profile_id, {
          password: cleanPass,
        })
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'Staff login ID and password updated successfully.',
      credentials: {
        id: employeeId,
        username: finalUsername,
        short_username: shortUser,
        email: finalEmail,
        password: cleanPass,
      },
    })
  } catch (error: any) {
    console.error('[API/admin/members/credentials] Error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error updating credentials.' },
      { status: 500 }
    )
  }
}
