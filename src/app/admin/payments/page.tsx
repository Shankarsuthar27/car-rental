import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminPaymentsClient } from '@/components/admin/payments/AdminPaymentsClient'
import { PermissionGuard } from '@/components/admin/PermissionGuard'
import { getServerPermissionState, redactPaymentRecord } from '@/lib/server-permissions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Payment Transactions & Settlements — DriveEase Admin'
}

async function getPaymentsData() {
  const state = await getServerPermissionState()
  const supabase = createAdminClient()

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      customer:customers(id, profile:profiles!customers_profile_id_fkey(full_name, email, phone)),
      booking:bookings(id, booking_number, grand_total, status)
    `)
    .order('created_at', { ascending: false })

  return (payments || []).map((p) => redactPaymentRecord(p, state))
}

export default async function AdminPaymentsPage() {
  const payments = await getPaymentsData()

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PermissionGuard permission="payments.view">
        <AdminPaymentsClient initialPayments={payments} />
      </PermissionGuard>
    </div>
  )
}
