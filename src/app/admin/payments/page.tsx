import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminPaymentsClient } from '@/components/admin/payments/AdminPaymentsClient'

export const metadata: Metadata = {
  title: 'Payment Transactions & Settlements — DriveEase Admin'
}

async function getPaymentsData() {
  const supabase = createAdminClient()

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      customer:customers(id, profile:profiles!customers_profile_id_fkey(full_name, email, phone)),
      booking:bookings(id, booking_number, grand_total, status)
    `)
    .order('created_at', { ascending: false })

  return payments || []
}

export default async function AdminPaymentsPage() {
  const payments = await getPaymentsData()

  return (
    <div className="p-6 md:p-8 space-y-6">
      <AdminPaymentsClient initialPayments={payments} />
    </div>
  )
}
