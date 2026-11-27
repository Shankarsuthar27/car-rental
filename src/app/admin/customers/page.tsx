import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminCustomersClient } from '@/components/admin/customers/AdminCustomersClient'
import { formatCustomer, DEFAULT_DEMO_CUSTOMERS } from '@/lib/customers'
import { PermissionGuard } from '@/components/admin/PermissionGuard'
import type { Customer } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Customer Directory & KYC Approvals — DriveEase Admin'
}

async function getCustomersData() {
  const supabase = createAdminClient()

  const [{ data }, { data: activeBookings }] = await Promise.all([
    supabase
      .from('customers')
      .select(`
        *,
        profile:profiles!customers_profile_id_fkey(*),
        kyc_documents(*)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('bookings')
      .select('customer_id')
      .eq('status', 'active'),
  ])

  const activeCustomerIds = new Set(
    (activeBookings || []).map((b) => b.customer_id).filter(Boolean)
  )

  const formatted = (data && data.length > 0)
    ? data.map((c) => ({
        ...formatCustomer(c),
        has_active_trip: activeCustomerIds.has(c.id),
      }))
    : DEFAULT_DEMO_CUSTOMERS

  return formatted as Customer[]
}

export default async function AdminCustomersPage() {
  const customers = await getCustomersData()

  return (
    <div className="p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      <PermissionGuard permission="customers.view">
        <AdminCustomersClient initialCustomers={customers} />
      </PermissionGuard>
    </div>
  )
}
