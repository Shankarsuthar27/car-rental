'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Calendar, Search, Car } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface BranchOption {
  id: string
  name: string
  city?: string
}

interface HeroBookingSectionProps {
  branches?: BranchOption[]
  className?: string
  targetUrl?: string
}

const TIME_OPTIONS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
]

const DEFAULT_CITIES: BranchOption[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Jalore Main Branch — Collectorate Road', city: 'Jalore' },
]

export function HeroBookingSection({
  branches,
  className = '',
  targetUrl = '/cars',
}: HeroBookingSectionProps) {
  const router = useRouter()

  const cityOptions = branches && branches.length > 0 ? branches : DEFAULT_CITIES

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultPickupDate = tomorrow.toISOString().split('T')[0]

  const returnDay = new Date()
  returnDay.setDate(returnDay.getDate() + 3)
  const defaultReturnDate = returnDay.toISOString().split('T')[0]

  const [pickupLocation, setPickupLocation] = useState<string>(cityOptions[0]?.id || '')
  const [returnLocation, setReturnLocation] = useState<string>('same')
  const [pickupDate, setPickupDate] = useState<string>(defaultPickupDate)
  const [pickupTime, setPickupTime] = useState<string>('10:00')
  const [returnDate, setReturnDate] = useState<string>(defaultReturnDate)
  const [returnTime, setReturnTime] = useState<string>('10:00')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const resolvedReturn =
      returnLocation === 'same' || !returnLocation ? pickupLocation : returnLocation

    const params = new URLSearchParams()
    if (pickupLocation) params.set('pickup_branch', pickupLocation)
    if (resolvedReturn) params.set('return_branch', resolvedReturn)
    if (pickupDate) params.set('pickup', `${pickupDate}T${pickupTime}`)
    if (returnDate) params.set('return', `${returnDate}T${returnTime}`)

    router.push(`${targetUrl}?${params.toString()}`)
  }

  return (
    <div
      className={`rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 text-slate-900 shadow-sm transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200/80 mb-1.5">
            <Car className="w-3.5 h-3.5 text-cyan-600" />
            <span>JSD — Premium Self-Drive Car Rental</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Find Your <span className="text-cyan-600">Perfect</span> Car
          </h2>
        </div>

        {/* Compact Quick Stats */}
        <div className="flex items-center gap-5 text-xs text-slate-500 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
          <div>
            <span className="font-bold text-sm text-slate-900 mr-1">50+</span>
            <span>Cars</span>
          </div>
          <div className="w-px h-3.5 bg-slate-200" />
          <div>
            <span className="font-bold text-sm text-slate-900 mr-1">Jalore</span>
            <span>Branch</span>
          </div>
          <div className="w-px h-3.5 bg-slate-200" />
          <div>
            <span className="font-bold text-sm text-amber-500 mr-1">5★</span>
            <span className="text-slate-600">Rated</span>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Row 1: Locations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label
              htmlFor="pickup-city"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-600" />
              Pickup Location
            </label>
            <Select value={pickupLocation} onValueChange={setPickupLocation}>
              <SelectTrigger
                id="pickup-city"
                className="w-full h-10 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600"
              >
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                {cityOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="cursor-pointer text-slate-800 hover:bg-slate-50">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="return-city"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-600" />
              Return Location
            </label>
            <Select value={returnLocation} onValueChange={setReturnLocation}>
              <SelectTrigger
                id="return-city"
                className="w-full h-10 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600"
              >
                <SelectValue placeholder="Same as pickup" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md">
                <SelectItem value="same" className="cursor-pointer text-cyan-700 font-semibold hover:bg-slate-50">
                  Same as pickup
                </SelectItem>
                {cityOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="cursor-pointer text-slate-800 hover:bg-slate-50">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Dates & Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label
              htmlFor="pickup-date"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-600" />
              Pickup Date & Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                id="pickup-date"
                type="date"
                value={pickupDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPickupDate(e.target.value)}
                className="col-span-2 h-10 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600 [color-scheme:light]"
              />
              <Select value={pickupTime} onValueChange={setPickupTime}>
                <SelectTrigger className="h-10 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2 text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md max-h-48">
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={`p-${time}`} value={time} className="cursor-pointer hover:bg-slate-50">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="return-date"
              className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-600" />
              Return Date & Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                id="return-date"
                type="date"
                value={returnDate}
                min={pickupDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setReturnDate(e.target.value)}
                className="col-span-2 h-10 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600 [color-scheme:light]"
              />
              <Select value={returnTime} onValueChange={setReturnTime}>
                <SelectTrigger className="h-10 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-2 text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-md max-h-48">
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={`r-${time}`} value={time} className="cursor-pointer hover:bg-slate-50">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Row 3: Submit Button */}
        <div className="pt-1">
          <button
            type="submit"
            className="w-full h-11 rounded-lg bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>Search Cars</span>
          </button>
        </div>
      </form>
    </div>
  )
}
