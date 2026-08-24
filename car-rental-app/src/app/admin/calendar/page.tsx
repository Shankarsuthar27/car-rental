import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { CalendarVisualizer } from '@/components/admin/calendar/CalendarVisualizer'

export const metadata: Metadata = {
  title: 'Booking Schedule & Fleet Timeline — DriveEase Admin'
}

async function getCalendarData() {
  const supabase = createAdminClient()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, brand, model, registration_number, status, branch:branches(name, city)')
    .eq('is_active', true)
    .order('brand')

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, booking_number, pickup_datetime, return_datetime, status, vehicle_id,
      customer:customers(profile:profiles!customers_profile_id_fkey(full_name, phone))
    `)
    .not('status', 'in', '("cancelled","rejected")')

  return {
    vehicles: vehicles || [],
    bookings: bookings || []
  }
}

export default async function AdminCalendarPage() {
  const { vehicles, bookings } = await getCalendarData()

  return (
    <div className="p-6 md:p-8 space-y-6">
      <CalendarVisualizer vehicles={vehicles} bookings={bookings} />
    </div>
  )
}
