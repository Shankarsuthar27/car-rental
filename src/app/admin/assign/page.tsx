import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { AssignCarWorkflow } from '@/components/admin/assign/AssignCarWorkflow'
import { formatCustomer, DEFAULT_DEMO_CUSTOMERS } from '@/lib/customers'
import type { Customer, Vehicle } from '@/types'

export const metadata: Metadata = {
  title: 'Assign Car to Customer — DriveEase Admin',
}

async function getAssignmentData() {
  const supabase = createAdminClient()

  const [vehiclesRes, rawCustomersRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select(`
        *,
        branch:branches(id, name, city),
        images:vehicle_images(id, url, is_primary, sort_order)
      `)
      .eq('is_active', true)
      .eq('status', 'available')
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

  return {
    availableVehicles: (vehiclesRes.data ?? []) as unknown as Vehicle[],
    customers: formattedCustomers as Customer[],
  }
}

export default async function AssignCarPage() {
  const { availableVehicles, customers } = await getAssignmentData()

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <AssignCarWorkflow
        availableVehicles={availableVehicles}
        customers={customers}
      />
    </div>
  )
}
