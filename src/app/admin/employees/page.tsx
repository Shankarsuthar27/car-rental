import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { StaffManagementClient } from '@/components/admin/employees/StaffManagementClient'
import { PermissionGuard } from '@/components/admin/PermissionGuard'

export const metadata: Metadata = {
  title: 'Employee Directory & Staff Permissions — DriveEase Admin',
  description: 'Manage employees, define designations, and configure granular permissions with auto-generated credentials.',
}

export const dynamic = 'force-dynamic'

export default async function AdminEmployeesPage() {
  const supabase = createAdminClient()

  const [empRes, branchRes] = await Promise.all([
    supabase
      .from('employees')
      .select(`
        *,
        profile:profiles(id, email, full_name, phone, role, is_active),
        branch:branches(id, name, city)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('branches')
      .select('id, name, city')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ])

  const rawEmployees = empRes.data || []
  const initialEmployees = rawEmployees.map((emp: any) => {
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
    return { ...emp, profile }
  })
  const branches = branchRes.data || []

  return (
    <PermissionGuard permission="team.manage">
      <StaffManagementClient
        initialEmployees={initialEmployees as any}
        branches={branches}
      />
    </PermissionGuard>
  )
}
