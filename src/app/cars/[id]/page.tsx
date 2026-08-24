import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CustomerNav } from '@/components/customer/CustomerNav'
import { Footer } from '@/components/customer/Footer'
import { CarDetailClient } from '@/components/customer/CarDetailClient'
import { createClient } from '@/lib/supabase/server'
import type { Vehicle } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('brand, model, year')
    .eq('id', id)
    .single()

  if (!vehicle) {
    return { title: 'Car Not Found — DriveEase' }
  }

  return {
    title: `Rent ${vehicle.brand} ${vehicle.model} (${vehicle.year}) — DriveEase`,
    description: `Book ${vehicle.brand} ${vehicle.model} self-drive car rental. Instant online booking, clean sanitized cars, and best rental rates.`
  }
}

async function getVehicleData(id: string) {
  const supabase = await createClient()

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select(`
      *,
      branch:branches(*),
      images:vehicle_images(*)
    `)
    .eq('id', id)
    .single()

  const { data: branches } = await supabase
    .from('branches')
    .select('id, name, city')
    .eq('is_active', true)

  return {
    vehicle: vehicle as unknown as Vehicle | null,
    branches: branches ?? []
  }
}

export default async function CarDetailPage({ params }: Props) {
  const { id } = await params
  const { vehicle, branches } = await getVehicleData(id)

  if (!vehicle) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />
      <div className="pt-20 pb-12">
        <CarDetailClient vehicle={vehicle} branches={branches} />
      </div>
      <Footer />
    </div>
  )
}
