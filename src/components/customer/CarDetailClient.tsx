'use client'

import { useState } from 'react'
import {
  Users,
  Gauge,
  Fuel,
  CheckCircle2,
  MapPin,
  Clock,
  FileText
} from 'lucide-react'
import { BookingCalculator } from './BookingCalculator'
import type { Vehicle } from '@/types'

interface CarDetailClientProps {
  vehicle: Vehicle
  branches: Array<{ id: string; name: string; city: string }>
}

export function CarDetailClient({ vehicle, branches }: CarDetailClientProps) {
  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    : [{ id: '1', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80', is_primary: true, vehicle_id: vehicle.id, sort_order: 0, created_at: '' }]

  const heroImage = images[0]?.url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'

  // Subtitle formatting: "MARUTI SUZUKI • Swift ZXi (2023)"
  const brandUpper = vehicle.brand.toUpperCase()
  const modelShort = vehicle.model
    .replace(/ 1\.2 Petrol/i, '')
    .replace(new RegExp(`^${vehicle.brand}\\s*`, 'i'), '')
    .trim()
  const subtitle = `${brandUpper} • ${modelShort || vehicle.model} ${vehicle.variant || ''}`.trim()

  // Title formatting: "Maruti Swift 1.2 Petrol"
  const title = vehicle.model.toLowerCase().includes(vehicle.brand.toLowerCase().split(' ')[0])
    ? vehicle.model
    : `${vehicle.brand.split(' ')[0]} ${vehicle.model}`

  // Stationed location
  const branchName = vehicle.branch?.name || (branches.find(b => b.id === vehicle.branch_id)?.name) || 'Jalore Main Branch'

  // Included features
  const rawFeatures: string[] = Array.isArray(vehicle.features) && vehicle.features.length > 0
    ? (vehicle.features as string[])
    : [
        'Touchscreen Infotainment',
        'Keyless Push Start',
        'Automatic Climate Control',
        'LED Projector Lamps',
        'Dual Airbags',
        'ABS with EBD'
      ]

  // Arrange into two columns matching the mockup
  const col1Features = [
    rawFeatures.find(f => f.toLowerCase().includes('touchscreen')) || rawFeatures[0] || 'Touchscreen Infotainment',
    rawFeatures.find(f => f.toLowerCase().includes('climate') || f.toLowerCase().includes('automatic')) || rawFeatures[2] || 'Automatic Climate Control',
    rawFeatures.find(f => f.toLowerCase().includes('airbag')) || rawFeatures[4] || 'Dual Airbags'
  ].filter(Boolean)

  const col2Features = [
    rawFeatures.find(f => f.toLowerCase().includes('keyless') || f.toLowerCase().includes('push')) || rawFeatures[1] || 'Keyless Push Start',
    rawFeatures.find(f => f.toLowerCase().includes('projector') || f.toLowerCase().includes('led')) || rawFeatures[3] || 'LED Projector Lamps',
    rawFeatures.find(f => f.toLowerCase().includes('abs') || f.toLowerCase().includes('ebd')) || rawFeatures[5] || 'ABS with EBD'
  ].filter(Boolean)

  return (
    <div className="container mx-auto px-4 py-4 max-w-6xl">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {subtitle}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mt-0.5">
            {title}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-1">
            <MapPin className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />
            <span>Stationed at {branchName}</span>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#8a98ea]/25 text-[#6372ce] dark:text-[#9ea6ff] border border-[#8a98ea]/40 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">{vehicle.status || 'RESERVED'}</span>
          </div>
          <div className="text-[11px] text-muted-foreground font-medium">
            Base Daily Rate
          </div>
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-2xl md:text-3xl font-black text-foreground">
              ₹{vehicle.daily_rate?.toLocaleString('en-IN') || '1,300'}
            </span>
            <span className="text-xs text-muted-foreground font-normal">/day</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Hero, Key Specs, Overview, Features, Terms */}
        <div className="lg:col-span-7 space-y-5">
          {/* Hero Vehicle Photo */}
          <div className="relative aspect-[16/10] bg-muted/30 rounded-[26px] overflow-hidden border border-border/50 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Key Specifications Card */}
          <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Seating Capacity</span>
                <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                  <Users className="w-4 h-4 text-foreground/80 shrink-0" />
                  <span>{vehicle.seating_capacity || 5} Persons</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Transmission</span>
                <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                  <Gauge className="w-4 h-4 text-foreground/80 shrink-0" />
                  <span className="capitalize">{vehicle.transmission || 'Manual'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Fuel & Efficiency</span>
                <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                  <Fuel className="w-4 h-4 text-foreground/80 shrink-0" />
                  <span className="capitalize">{vehicle.fuel_type || 'Petrol'} ({vehicle.mileage ? `${vehicle.mileage} Km/L` : '22.4 Km/L'})</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Daily KM Allowance</span>
                <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{vehicle.included_km_per_day || 300} km/day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Overview Card */}
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-sm space-y-2">
            <h3 className="text-base font-bold text-foreground">Vehicle Overview</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              {vehicle.description || 'Nimble and ultra-fuel-efficient hatchback ideal for city commuting and quick weekend getaways.'}
            </p>
          </div>

          {/* Features & Amenities Card */}
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-foreground">Features & Amenities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-8">
              <div className="space-y-2.5">
                {col1Features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs md:text-sm text-foreground/90">
                    <CheckCircle2 className="w-4 h-4 text-foreground/80 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {col2Features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs md:text-sm text-foreground/90">
                    <CheckCircle2 className="w-4 h-4 text-foreground/80 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rental Terms & Mandatory Documents Card */}
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-foreground" />
              <span>Rental Terms & Mandatory Documents</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#484e5b] dark:bg-[#2b303c] text-white p-4 rounded-xl space-y-1.5 shadow-sm">
                <div className="font-bold text-xs text-white">Required at Pickup</div>
                <div className="text-[11px] text-white/80 leading-relaxed">
                  1. Valid Original Driving License (held 1+ yr)
                </div>
                <div className="text-[11px] text-white/80 leading-relaxed">
                  2. Original Aadhaar or Passport ID
                </div>
              </div>
              <div className="bg-[#484e5b] dark:bg-[#2b303c] text-white p-4 rounded-xl space-y-1.5 shadow-sm">
                <div className="font-bold text-xs text-white">Security Deposit Rule</div>
                <div className="text-[11px] text-white/80 leading-relaxed">
                  Refundable deposit of ₹{vehicle.security_deposit?.toLocaleString('en-IN') || '1,500'} is held in non-revenue escrow and refunded upon return.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Booking Calculator */}
        <div className="lg:col-span-5">
          <BookingCalculator vehicle={vehicle} branches={branches} />
        </div>
      </div>
    </div>
  )
}
