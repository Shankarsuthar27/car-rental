'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Fuel, Users, Zap, ArrowRight, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface VehicleImage {
  url: string
  is_primary: boolean
  sort_order: number
}

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  vehicle_type: string
  fuel_type: string
  transmission: string
  seating_capacity: number
  hourly_rate?: number
  daily_rate?: number
  status: string
  current_location?: string
  images?: VehicleImage[]
  branch?: { name: string; city: string }
}

interface FeaturedCarsProps {
  vehicles: Vehicle[]
}

function VehicleCard({ vehicle, index }: { vehicle: Vehicle; index: number }) {
  const primaryImage = vehicle.images?.find((img) => img.is_primary)
  const imageUrl = primaryImage?.url ?? vehicle.images?.[0]?.url

  const fuelLabel: Record<string, string> = {
    petrol: 'Petrol',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
    cng: 'CNG',
  }

  const typeLabel: Record<string, string> = {
    suv: 'SUV',
    sedan: 'Sedan',
    hatchback: 'Hatchback',
    muv: 'MUV',
    luxury: 'Luxury',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-4xl">🚗</span>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <Badge
            className={`text-[10px] font-medium ${
              vehicle.status === 'available'
                ? 'bg-emerald-500/90 text-white'
                : 'bg-amber-500/90 text-white'
            }`}
          >
            {vehicle.status === 'available' ? 'Available' : 'Booked'}
          </Badge>
        </div>

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="text-[10px] glass text-white border-white/20">
            {typeLabel[vehicle.vehicle_type] ?? vehicle.vehicle_type}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-base leading-tight">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {vehicle.year} • {vehicle.branch?.city ?? vehicle.current_location}
            </p>
          </div>
          <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs font-medium">4.8</span>
          </div>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Fuel className="w-3 h-3" />
            {fuelLabel[vehicle.fuel_type] ?? vehicle.fuel_type}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {vehicle.transmission === 'automatic' ? 'Auto' : 'Manual'}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {vehicle.seating_capacity} seats
          </span>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            {vehicle.hourly_rate && (
              <p className="text-xs text-muted-foreground">
                ₹{vehicle.hourly_rate}/hr
              </p>
            )}
            {vehicle.daily_rate && (
              <p className="text-base font-bold">
                ₹{vehicle.daily_rate.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-muted-foreground">/day</span>
              </p>
            )}
          </div>
          <Button
            size="sm"
            asChild
            className="gradient-brand text-white border-0 hover:opacity-90 gap-1"
          >
            <Link href={`/admin/assign?vehicle_id=${vehicle.id}`}>
              Assign Car <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export function FeaturedCars({ vehicles }: FeaturedCarsProps) {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-primary"
          >
            Our Fleet
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold mt-2"
          >
            Featured Vehicles
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mt-2 max-w-lg mx-auto"
          >
            Handpicked premium vehicles for every journey — from city commutes to mountain adventures.
          </motion.p>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No vehicles available at the moment. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {vehicles.slice(0, 8).map((vehicle, i) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} index={i} />
              ))}
            </div>

            <div className="text-center mt-10">
              <Button
                size="lg"
                variant="outline"
                asChild
                className="gap-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
              >
                <Link href="/cars">
                  Browse All Cars <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
