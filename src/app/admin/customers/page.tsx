import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminCustomersClient } from '@/components/admin/customers/AdminCustomersClient'
import { formatCustomer, DEFAULT_DEMO_CUSTOMERS } from '@/lib/customers'
import type { Customer } from '@/types'

export const metadata: Metadata = {
  title: 'Customer Directory & KYC Approvals — DriveEase Admin'
}

async function getCustomersData() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('customers')
    .select(`
      *,
      profile:profiles!customers_profile_id_fkey(*),
      kyc_documents(*)
    `)
    .order('created_at', { ascending: false })

  const formatted = (data && data.length > 0)
    ? data.map(formatCustomer)
    : DEFAULT_DEMO_CUSTOMERS

  return formatted as Customer[]
}

export default async function AdminCustomersPage() {
  const customers = await getCustomersData()

  return (
    <div className="p-6 md:p-8 space-y-6">
      <AdminCustomersClient initialCustomers={customers} />
    </div>
  )
}
