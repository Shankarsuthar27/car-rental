import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CustomerNav } from '@/components/customer/CustomerNav'
import { Footer } from '@/components/customer/Footer'
import { VehicleListingClient } from '@/components/customer/VehicleListingClient'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Browse Cars',
  description:
    'Browse our fleet of premium cars. Filter by type, price, fuel, and availability. Book online instantly.',
}

async function getBranches() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('branches')
    .select('id, name, city')
    .eq('is_active', true)
  return data ?? []
}

async function getVehicleBrands() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vehicles')
    .select('brand')
    .eq('is_active', true)
  const brands = [...new Set((data ?? []).map((v: { brand: string }) => v.brand))].sort()
  return brands
}

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const [branches, brands] = await Promise.all([getBranches(), getVehicleBrands()])

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />
      <div className="pt-16">
        <Suspense fallback={<div className="p-8 text-center">Loading vehicles...</div>}>
          <VehicleListingClient
            initialParams={params}
            branches={branches}
            brands={brands}
          />
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}
