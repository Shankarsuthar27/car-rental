import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerPermissionState } from '@/lib/server-permissions'

export async function GET() {
  try {
    const state = await getServerPermissionState()
    if (!state.role || state.role === 'customer') {
      return NextResponse.json({ inquiry: 0, fleet: 0, rentals: 0 }, { status: 403 })
    }

    const supabase = createAdminClient()

    const [notifsRes, vehiclesRes, rentalsRes] = await Promise.all([
      supabase.from('notifications').select('id, data'),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
    ])

    const activeInquiries = (notifsRes.data || []).filter((row) => {
      const data = row.data as Record<string, unknown> | null
      return data?.inquiry_status !== 'rejected'
    }).length

    return NextResponse.json({
      inquiry: activeInquiries,
      fleet: vehiclesRes.count ?? 0,
      rentals: rentalsRes.count ?? 0,
    })
  } catch {
    return NextResponse.json({ inquiry: 0, fleet: 0, rentals: 0 }, { status: 500 })
  }
}
