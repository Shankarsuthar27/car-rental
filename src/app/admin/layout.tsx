import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient'
import { PermissionProvider } from '@/context/PermissionContext'
import type { Profile } from '@/types'

export const metadata: Metadata = {
  title: {
    default: 'Admin Dashboard | JSD Fleet Console',
    template: '%s | JSD Admin',
  },
}

const STAFF_ROLES = [
  'super_admin',
  'admin',
  'branch_manager',
  'booking_manager',
  'accountant',
  'vehicle_manager',
  'staff',
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Fast path: check demo role cookie FIRST without hitting remote Supabase auth
  const cookieStore = await cookies()
  const demoRole = cookieStore.get('driveease_demo_role')?.value
  const userPermissionsRaw = cookieStore.get('driveease_user_permissions')?.value
  const userNameRaw = cookieStore.get('driveease_user_name')?.value
  const userEmailRaw = cookieStore.get('driveease_user_email')?.value

  if (demoRole && STAFF_ROLES.includes(demoRole)) {
    let permissions: string[] = []
    try {
      if (userPermissionsRaw) {
        let decoded = userPermissionsRaw
        try {
          decoded = decodeURIComponent(userPermissionsRaw)
        } catch {}
        permissions = JSON.parse(decoded)
      }
    } catch {}

    const rawDecoded = userNameRaw
      ? decodeURIComponent(userNameRaw)
      : demoRole === 'super_admin'
      ? 'Admin DriveEase'
      : 'Staff Member'
    let decodedName = rawDecoded.replace(/[^\p{L}\p{N}\s]/gu, '').trim() || 'Admin'
    let activeRole = demoRole

    // If staff/manager, fetch live record to guarantee active permissions are 100% synced
    if (demoRole !== 'super_admin') {
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabase = createAdminClient()
        const { data: employees } = await supabase
          .from('employees')
          .select('*')
          .eq('is_active', true)

        const cleanEmail = (userEmailRaw ? decodeURIComponent(userEmailRaw) : '').toLowerCase().trim()
        const cleanNoSpace = cleanEmail.replace(/[^a-z0-9]/g, '')

        const matched = (employees || []).find((emp) => {
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

        if (matched) {
          permissions = Array.isArray(matched.permissions) ? matched.permissions : []
          activeRole = matched.designation || demoRole
          try {
            const meta = JSON.parse(matched.emergency_contact)
            if (meta.full_name) decodedName = meta.full_name
          } catch {}
        }
      } catch (dbErr) {
        console.warn('[Layout] Employee live check note:', dbErr)
      }
    }

    const mockAdminProfile: Profile = {
      id: '00000000-0000-0000-0000-000000000001',
      email: userEmailRaw || (activeRole === 'super_admin' ? 'jalorecarrentel@gmail.com' : 'staff@carrental.local'),
      full_name: decodedName,
      role: activeRole as any,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return (
      <PermissionProvider initialRole={activeRole} initialPermissions={permissions}>
        <AdminLayoutClient profile={mockAdminProfile}>
          {children}
        </AdminLayoutClient>
      </PermissionProvider>
    )
  }

  // 2. Real user Supabase session check
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/admin/dashboard')
  }

  // 3. Fetch real user profile & employee record
  const [{ data: profile }, { data: employee }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('employees').select('*').eq('profile_id', user.id).single(),
  ])

  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    redirect('/cars')
  }

  const userPerms = (employee?.permissions as string[]) || (user.user_metadata?.permissions as string[]) || []

  return (
    <PermissionProvider initialRole={profile.role} initialPermissions={userPerms}>
      <AdminLayoutClient profile={profile as unknown as Profile}>
        {children}
      </AdminLayoutClient>
    </PermissionProvider>
  )
}
