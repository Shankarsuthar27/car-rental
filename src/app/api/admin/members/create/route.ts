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
    const {
      name,
      phone,
      role = 'branch_manager',
      department = 'Operations',
      permissions = [],
      branch_id,
      customEmail,
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Member full name is required.' },
        { status: 400 }
      )
    }

    const cleanName = name.trim()
    const supabaseAdmin = createAdminClient()

    // 1. Generate unique staff Username & Email
    const randomCode = Math.floor(1000 + Math.random() * 9000)
    const sanitizedName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'staff'
    const staffUsername = `${sanitizedName}${randomCode}`
    const staffEmail = customEmail && customEmail.trim()
      ? customEmail.trim().toLowerCase()
      : `${staffUsername}@carrental.local`

    // 2. Generate secure 9-character readable alphanumeric password (e.g. "K7x9pQ2m9")
    const generatedPassword = crypto
      .randomBytes(6)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '8')
      .slice(0, 9)

    const employeeCode = `EMP-${randomCode}`

    // 3. Store persistent hashed credentials in system_auth_credentials table
    const passHashEmail = hashValue(generatedPassword, staffEmail.toLowerCase())
    const passHashUser = hashValue(generatedPassword, staffUsername.toLowerCase())
    const passHashShort = hashValue(generatedPassword, sanitizedName.toLowerCase())
    const passHashEmpCode = hashValue(generatedPassword, employeeCode.toLowerCase())

    const credRecords = [
      {
        email: staffEmail.toLowerCase(),
        password_hash: passHashEmail,
        updated_at: new Date().toISOString(),
      },
      {
        email: staffUsername.toLowerCase(),
        password_hash: passHashUser,
        updated_at: new Date().toISOString(),
      },
      {
        email: sanitizedName.toLowerCase(),
        password_hash: passHashShort,
        updated_at: new Date().toISOString(),
      },
      {
        email: employeeCode.toLowerCase(),
        password_hash: passHashEmpCode,
        updated_at: new Date().toISOString(),
      },
    ]

    const { error: credError } = await supabaseAdmin
      .from('system_auth_credentials')
      .upsert(credRecords)

    if (credError) {
      console.error('[API/admin/members/create] Error saving auth credentials:', credError)
      return NextResponse.json(
        { success: false, error: `Database error storing credentials: ${credError.message}` },
        { status: 500 }
      )
    }

    // 4. Insert into employees table with granular permissions and metadata
    const employeeContactMeta = JSON.stringify({
      full_name: cleanName,
      email: staffEmail,
      username: staffUsername,
      short_username: sanitizedName,
      phone: phone || '',
    })

    const { data: employeeData, error: empError } = await supabaseAdmin
      .from('employees')
      .insert({
        employee_code: employeeCode,
        department: department || 'Operations',
        designation: role,
        branch_id: branch_id || null,
        is_active: true,
        permissions: Array.isArray(permissions) ? permissions : [],
        emergency_contact: employeeContactMeta,
      })
      .select(`
        *,
        branch:branches(id, name, city)
      `)
      .single()

    if (empError) {
      console.error('[API/admin/members/create] Error saving employee:', empError)
      return NextResponse.json(
        { success: false, error: `Database error saving employee record: ${empError.message}` },
        { status: 500 }
      )
    }

    // 5. Optional best-effort Supabase Auth user sync (non-blocking)
    try {
      await supabaseAdmin.auth.admin.createUser({
        email: staffEmail,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          username: staffUsername,
          role,
          permissions,
        },
      })
    } catch (authNotice) {
      console.warn('[API/admin/members/create] Supabase auth sync notice (optional):', authNotice)
    }

    // 6. Return generated credentials to Owner
    return NextResponse.json({
      success: true,
      message: `Staff member "${cleanName}" created successfully!`,
      credentials: {
        id: employeeData.id,
        name: cleanName,
        username: staffUsername,
        email: staffEmail,
        password: generatedPassword,
        role: role,
        employee_code: employeeCode,
        permissions: permissions,
      },
      employee: {
        ...employeeData,
        profile: {
          id: employeeData.id,
          full_name: cleanName,
          email: staffEmail,
          phone: phone || '',
          role: role,
          is_active: true,
        },
      },
    })
  } catch (error: any) {
    console.error('[API/admin/members/create] Error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error creating team member.' },
      { status: 500 }
    )
  }
}
