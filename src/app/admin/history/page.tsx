import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { RentalHistoryClient } from '@/components/admin/history/RentalHistoryClient'
import { formatCustomer, DEFAULT_DEMO_CUSTOMERS } from '@/lib/customers'
import type { Booking, Vehicle, Customer } from '@/types'

export const metadata: Metadata = {
  title: 'Fleet & Customer Rental History — DriveEase Admin',
}

async function getHistoryData() {
  const supabase = createAdminClient()

  // Run all 3 queries concurrently in parallel
  const [bookingsRes, vehiclesRes, rawCustomersRes] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        *,
        vehicle:vehicles(*),
        customer:customers(*, profile:profiles!customers_profile_id_fkey(*))
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('vehicles')
      .select('*')
      .order('brand', { ascending: true }),
    supabase
      .from('customers')
      .select(`
        *,
        profile:profiles!customers_profile_id_fkey(*)
      `)
      .order('created_at', { ascending: false }),
  ])

  const rawCustomers = rawCustomersRes.data
  const formattedCustomers = (rawCustomers && rawCustomers.length > 0)
    ? rawCustomers.map(formatCustomer)
    : DEFAULT_DEMO_CUSTOMERS

  const formattedBookings = (bookingsRes.data ?? []).map(b => ({
    ...b,
    customer: b.customer ? formatCustomer(b.customer) : b.customer,
  }))

  return {
    bookings: formattedBookings as any[],
    vehicles: (vehiclesRes.data ?? []) as any[],
    customers: formattedCustomers as any[],
  }
}

export default async function AdminRentalHistoryPage() {
  const { bookings, vehicles, customers } = await getHistoryData()

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <RentalHistoryClient
        bookings={bookings}
        vehicles={vehicles}
        customers={customers}
      />
    </div>
  )
}
