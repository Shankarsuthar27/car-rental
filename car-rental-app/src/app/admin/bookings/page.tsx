import type { Metadata } from 'next'
import { BookingService } from '@/services/BookingService'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminBookingsClient } from '@/components/admin/bookings/AdminBookingsClient'
import { formatCustomer } from '@/lib/customers'
import type { Booking, Branch } from '@/types'

export const metadata: Metadata = {
  title: 'Booking Operations & Workflows — DriveEase Admin'
}

async function getBookingsData() {
  const supabase = createAdminClient()

  const { data: rawBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:customers(*, profile:profiles!customers_profile_id_fkey(*)),
      vehicle:vehicles(*),
      pickup_branch:branches!pickup_branch_id(*),
      return_branch:branches!return_branch_id(*)
    `)
    .order('created_at', { ascending: false })

  const bookings = (rawBookings ?? []).map(b => ({
    ...b,
    customer: b.customer ? formatCustomer(b.customer) : b.customer,
  }))

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .eq('is_active', true)

  return {
    bookings: bookings as unknown as Booking[],
    branches: (branches ?? []) as unknown as Branch[]
  }
}

export default async function AdminBookingsPage() {
  const { bookings, branches } = await getBookingsData()

  return (
    <div className="p-6 md:p-8 space-y-6">
      <AdminBookingsClient initialBookings={bookings} branches={branches} />
    </div>
  )
}
