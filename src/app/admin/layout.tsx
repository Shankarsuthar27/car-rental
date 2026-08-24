import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient'
import type { Profile } from '@/types'

export const metadata: Metadata = {
  title: {
    default: 'Admin Dashboard',
    template: '%s | DriveEase Admin',
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
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. If no user, check demo role cookie fallback
  if (!user) {
    const cookieStore = await cookies()
    const demoRole = cookieStore.get('driveease_demo_role')?.value

    if (demoRole && STAFF_ROLES.includes(demoRole)) {
      const mockAdminProfile: Profile = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@driveease.in',
        full_name: 'Admin DriveEase 👑',
        role: demoRole as any,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return (
        <AdminLayoutClient profile={mockAdminProfile}>
          {children}
        </AdminLayoutClient>
      )
    }

    redirect('/login?redirectTo=/admin/dashboard')
  }

  // 2. Fetch real user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <AdminLayoutClient profile={profile as unknown as Profile}>
      {children}
    </AdminLayoutClient>
  )
}
