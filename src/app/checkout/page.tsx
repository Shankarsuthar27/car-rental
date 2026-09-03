import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { CustomerNav } from '@/components/customer/CustomerNav'
import { Footer } from '@/components/customer/Footer'
import { CheckoutWizard } from '@/components/customer/CheckoutWizard'
import { createClient } from '@/lib/supabase/server'
import type { Vehicle, Branch } from '@/types'

export const metadata: Metadata = {
  title: 'Secure Checkout — Book Your Rental Car | JSD Jalore Self Drive',
  description: 'Complete your car rental reservation securely with JSD Self Drive Car Rental.',
}

interface Props {
  searchParams: Promise<Record<string, string>>
}

async function getCheckoutData(vehicleId: string) {
  const supabase = await createClient()

  // Fetch target vehicle or fallback to first available
  let { data: vehicle } = await supabase
    .from('vehicles')
    .select(`
      *,
      branch:branches(*),
      images:vehicle_images(*)
    `)
    .eq('id', vehicleId)
    .single()

  if (!vehicle) {
    const { data: firstAvail } = await supabase
      .from('vehicles')
      .select(`
        *,
        branch:branches(*),
        images:vehicle_images(*)
      `)
      .eq('is_active', true)
      .limit(1)
      .single()
    vehicle = firstAvail
  }

  const { data: branches } = await supabase
    .from('branches')
    .select('*')
    .eq('is_active', true)

  return {
    vehicle: vehicle as unknown as Vehicle | null,
    branches: (branches ?? []) as unknown as Branch[]
  }
}

export default async function CheckoutPage({ searchParams }: Props) {
  const params = await searchParams
  const vehicleId = params.vehicle_id || ''

  const { vehicle, branches } = await getCheckoutData(vehicleId)

  if (!vehicle) {
    redirect('/cars')
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />
      <div className="pt-20 pb-16">
        <CheckoutWizard
          vehicle={vehicle}
          branches={branches}
          initialParams={params}
        />
      </div>
      <Footer />
    </div>
  )
}
