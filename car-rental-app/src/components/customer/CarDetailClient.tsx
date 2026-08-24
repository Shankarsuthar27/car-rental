'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Car,
  Fuel,
  Users,
  Zap,
  Gauge,
  Calendar,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  CheckCircle,
  MapPin,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Clock,
  ArrowLeft
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookingCalculator } from './BookingCalculator'
import type { Vehicle } from '@/types'

interface CarDetailClientProps {
  vehicle: Vehicle
  branches: Array<{ id: string; name: string; city: string }>
}

export function CarDetailClient({ vehicle, branches }: CarDetailClientProps) {
  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    : [{ id: '1', url: '', is_primary: true, vehicle_id: vehicle.id, sort_order: 0, created_at: '' }]

  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Features list
  const features: string[] = Array.isArray(vehicle.features)
    ? (vehicle.features as string[])
    : []

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/cars" className="hover:text-foreground transition-colors">
          Cars
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium truncate">
          {vehicle.brand} {vehicle.model}
        </span>
      </div>

      {/* Main Grid: Left Details & Right Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left 2 Columns: Image Gallery, Specs, Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="capitalize text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                {vehicle.vehicle_type}
              </Badge>
              {vehicle.branch && (
                <Badge variant="outline" className="text-xs gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  {vehicle.branch.city} • {vehicle.branch.name}
                </Badge>
              )}
              <Badge
                className={`text-xs capitalize ${
                  vehicle.status === 'available'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}
              >
                {vehicle.status}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {vehicle.brand} {vehicle.model} {vehicle.variant || ''}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Model Year {vehicle.year} • Reg: {vehicle.registration_number}
            </p>
          </div>

          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[16/9] bg-muted/60 rounded-3xl overflow-hidden border border-border shadow-md">
              {images[activeImageIndex]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[activeImageIndex].url}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/40 text-muted-foreground">
                  <Car className="w-16 h-16 mb-2 stroke-[1.5]" />
                  <span className="text-sm font-medium">Vehicle Photo</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-24 aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-primary shadow-sm scale-95'
                        : 'border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Key Specifications Grid */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold mb-4">Key Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-2xl bg-muted/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Fuel className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Fuel Type</span>
                  <span className="text-sm font-bold capitalize">{vehicle.fuel_type}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Transmission</span>
                  <span className="text-sm font-bold capitalize">{vehicle.transmission}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Seating</span>
                  <span className="text-sm font-bold">{vehicle.seating_capacity} Persons</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Gauge className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Mileage</span>
                  <span className="text-sm font-bold">{vehicle.mileage ? `${vehicle.mileage} km/l` : '18+ km/l'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {vehicle.description && (
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold">Vehicle Overview</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {vehicle.description}
              </p>
            </div>
          )}

          {/* Features Checklist */}
          {features.length > 0 && (
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Included Features & Amenities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-foreground/90">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs: Rental Policy, Required Docs, Cancellation */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <Tabs defaultValue="policy">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="policy" className="text-xs">Rental Rules</TabsTrigger>
                <TabsTrigger value="docs" className="text-xs">Required KYC</TabsTrigger>
                <TabsTrigger value="cancellation" className="text-xs">Cancellation</TabsTrigger>
              </TabsList>

              <TabsContent value="policy" className="space-y-4 text-sm text-muted-foreground">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-muted/30 rounded-2xl space-y-1">
                    <span className="font-semibold text-foreground block text-xs">Included Kilometers</span>
                    <p className="text-xs">
                      {vehicle.included_km_per_day} km/day included. Extra kilometers charged at ₹{vehicle.extra_km_charge}/km.
                    </p>
                  </div>

                  <div className="p-3.5 bg-muted/30 rounded-2xl space-y-1">
                    <span className="font-semibold text-foreground block text-xs">Security Deposit</span>
                    <p className="text-xs">
                      ₹{vehicle.security_deposit.toLocaleString('en-IN')} refundable security deposit collected at pickup.
                    </p>
                  </div>

                  <div className="p-3.5 bg-muted/30 rounded-2xl space-y-1">
                    <span className="font-semibold text-foreground block text-xs">Fuel Policy</span>
                    <p className="text-xs">
                      Same-to-same fuel policy. Return the car with the same fuel level as given at pickup.
                    </p>
                  </div>

                  <div className="p-3.5 bg-muted/30 rounded-2xl space-y-1">
                    <span className="font-semibold text-foreground block text-xs">Late Return Grace Period</span>
                    <p className="text-xs">
                      30-minute grace period allowed. Beyond that, standard hourly rates apply.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="docs" className="space-y-4 text-sm text-muted-foreground">
                <p className="text-xs text-foreground font-medium">
                  The following original documents must be submitted digitally prior to pickup:
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                    <FileCheck2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground text-xs block">
                        Valid Original Driving License
                      </span>
                      <span className="text-xs">Must be at least 1 year old (LMV - Light Motor Vehicle).</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground text-xs block">
                        Government Identity Proof
                      </span>
                      <span className="text-xs">Aadhaar Card, Passport, or Voter ID.</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cancellation" className="space-y-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
                    <span>48+ hours before pickup</span>
                    <strong className="font-bold">100% Full Refund</strong>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                    <span>24 to 48 hours before pickup</span>
                    <strong className="font-bold">75% Refund</strong>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs">
                    <span>Less than 24 hours before pickup</span>
                    <strong className="font-bold">50% Refund</strong>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Column: Dynamic Booking Calculator */}
        <div className="lg:col-span-1">
          <BookingCalculator vehicle={vehicle} branches={branches} />
        </div>
      </div>
    </div>
  )
}
