import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient()

    // Fetch employees joined with branches
    const { data: rawEmployees, error: empErr } = await supabaseAdmin
      .from('employees')
      .select(`
        *,
        profile:profiles(id, email, full_name, phone, role, is_active, avatar_url),
        branch:branches(id, name, city)
      `)
      .order('created_at', { ascending: false })

    if (empErr) {
      console.error('[API/admin/members GET] Error:', empErr)
      return NextResponse.json({ success: false, error: empErr.message }, { status: 500 })
    }

    // Map profile metadata from profile relation or parsed emergency_contact
    const employees = (rawEmployees || []).map((emp) => {
      let profile = emp.profile
      if (!profile && emp.emergency_contact) {
        try {
          const meta = JSON.parse(emp.emergency_contact)
          profile = {
            id: emp.id,
            full_name: meta.full_name || 'Staff Member',
            email: meta.email || meta.username || '',
            phone: meta.phone || '',
            role: emp.designation || 'staff',
            is_active: emp.is_active,
          }
        } catch {
          profile = {
            id: emp.id,
            full_name: emp.emergency_contact,
            email: '',
            phone: '',
            role: emp.designation || 'staff',
            is_active: emp.is_active,
          }
        }
      }
      return {
        ...emp,
        profile,
      }
    })

    return NextResponse.json({
      success: true,
      data: employees,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') // employee id

    if (!id) {
      return NextResponse.json({ success: false, error: 'Employee ID is required.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Find the employee to get credentials to delete
    const { data: emp } = await supabaseAdmin
      .from('employees')
      .select('id, profile_id, emergency_contact, employee_code')
      .eq('id', id)
      .maybeSingle()

    if (emp?.emergency_contact) {
      try {
        const meta = JSON.parse(emp.emergency_contact)
        const emailsToDelete = [meta.email, meta.username, meta.short_username, emp.employee_code].filter(Boolean)
        if (emailsToDelete.length > 0) {
          await supabaseAdmin
            .from('system_auth_credentials')
            .delete()
            .in('email', emailsToDelete.map((e: string) => e.toLowerCase()))
        }
      } catch {}
    }

    // Delete from employees table
    await supabaseAdmin.from('employees').delete().eq('id', id)

    if (emp?.profile_id) {
      await supabaseAdmin.from('profiles').delete().eq('id', emp.profile_id)
      try {
        await supabaseAdmin.auth.admin.deleteUser(emp.profile_id)
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete member' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, permissions, is_active, designation } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Employee ID is required.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const updates: any = {}
    if (permissions !== undefined) updates.permissions = permissions
    if (is_active !== undefined) updates.is_active = is_active
    if (designation !== undefined) updates.designation = designation
    updates.updated_at = new Date().toISOString()

    const { data: updated, error } = await supabaseAdmin
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        profile:profiles(id, email, full_name, phone, role, is_active, avatar_url),
        branch:branches(id, name, city)
      `)
      .single()

    if (error) throw error

    let profile = updated.profile
    if (!profile && updated.emergency_contact) {
      try {
        const meta = JSON.parse(updated.emergency_contact)
        profile = {
          id: updated.id,
          full_name: meta.full_name || 'Staff Member',
          email: meta.email || meta.username || '',
          phone: meta.phone || '',
          role: updated.designation || 'staff',
          is_active: updated.is_active,
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'Member permissions updated successfully.',
      data: {
        ...updated,
        profile,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update member permissions' },
      { status: 500 }
    )
  }
}
