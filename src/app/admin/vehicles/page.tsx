import type { Metadata } from 'next'
import { VehicleService } from '@/services/VehicleService'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminVehiclesClient } from '@/components/admin/vehicles/AdminVehiclesClient'
import type { Vehicle, Branch } from '@/types'

export const metadata: Metadata = {
  title: 'Vehicle Fleet Management — DriveEase Admin'
}

async function getVehiclesData() {
  const supabase = createAdminClient()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select(`
      *,
      branch:branches(id, name, city),
      images:vehicle_images(id, url, is_primary)
    `)
    .order('created_at', { ascending: false })

  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, city')
    .eq('is_active', true)

  return {
    vehicles: (vehicles ?? []) as unknown as Vehicle[],
    branches: (branches ?? []) as unknown as Branch[]
  }
}

export default async function AdminVehiclesPage() {
  const { vehicles, branches } = await getVehiclesData()

  return (
    <div className="p-6 md:p-8 space-y-6">
      <AdminVehiclesClient initialVehicles={vehicles} branches={branches} />
    </div>
  )
}
