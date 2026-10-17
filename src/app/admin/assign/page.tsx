import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { AssignCarWorkflow } from '@/components/admin/assign/AssignCarWorkflow'
import { formatCustomer, DEFAULT_DEMO_CUSTOMERS } from '@/lib/customers'
import type { Customer, Vehicle } from '@/types'

export const metadata: Metadata = {
  title: 'Assign Car to Customer — DriveEase Admin',
}

const DEMO_SWIFT_VEHICLE: Vehicle = {
  id: 'veh-demo-swift-1',
  branch_id: 'branch-jalore-1',
  brand: 'Maruti Suzuki',
  model: 'Swift 1.2',
  year: 2024,
  variant: 'VXi',
  registration_number: 'RJ19CB1640',
  vin: 'MA3FBA21S00192837',
  color: 'Arctic White',
  vehicle_type: 'hatchback',
  seating_capacity: 5,
  fuel_type: 'petrol',
  transmission: 'manual',
  current_odometer: 34570,
  daily_rate: 1300,
  hourly_rate: 120,
  extra_km_charge: 12,
  security_deposit: 1500,
  included_km_per_day: 300,
  fuel_policy: 'same_to_same',
  status: 'available',
  is_active: true,
  images: [
    {
      id: 'img-swift-1',
      vehicle_id: 'veh-demo-swift-1',
      url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      is_primary: true,
      sort_order: 0,
    }
  ] as any,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
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

  const dbVehicles = (vehiclesRes.data ?? []) as unknown as Vehicle[]
  const hasSwift = dbVehicles.some(v => v.registration_number === 'RJ19CB1640')
  const availableVehicles = hasSwift ? dbVehicles : [DEMO_SWIFT_VEHICLE, ...dbVehicles]

  const rawCustomers = rawCustomersRes.data
  const formattedCustomers = (rawCustomers && rawCustomers.length > 0)
    ? rawCustomers.map(formatCustomer)
    : DEFAULT_DEMO_CUSTOMERS

  return {
    availableVehicles,
    customers: formattedCustomers as Customer[],
  }
}

export default async function AssignCarPage() {
  const { availableVehicles, customers } = await getAssignmentData()

  return (
    <div className="min-h-full bg-slate-50/50 dark:bg-background p-4 sm:p-6 md:p-8">
      <AssignCarWorkflow
        availableVehicles={availableVehicles}
        customers={customers}
      />
    </div>
  )
}
