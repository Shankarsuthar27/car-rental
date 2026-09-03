'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { MapPin, Calendar, Clock, Search, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Branch {
  id: string
  name: string
  city: string
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const label = `${h.toString().padStart(2, '0')}:${m}`
  return { value: label, label }
})

interface HeroSectionProps {
  branches: Branch[]
}

export function HeroSection({ branches }: HeroSectionProps) {
  const router = useRouter()

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 3)

  const [pickupBranch, setPickupBranch] = useState('')
  const [returnBranch, setReturnBranch] = useState('')
  const [pickupDate, setPickupDate] = useState(tomorrow.toISOString().split('T')[0])
  const [returnDate, setReturnDate] = useState(dayAfter.toISOString().split('T')[0])
  const [pickupTime, setPickupTime] = useState('10:00')
  const [returnTime, setReturnTime] = useState('10:00')

  const handleSearch = () => {
    const params = new URLSearchParams({
      pickup_branch: pickupBranch,
      return_branch: returnBranch || pickupBranch,
      pickup: `${pickupDate}T${pickupTime}`,
      return: `${returnDate}T${returnTime}`,
    })
    router.push(`/cars?${params.toString()}`)
  }

  return (
    <section className="relative min-h-[85vh] hero-gradient flex items-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-12 sm:py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/20 text-white/90 text-xs sm:text-sm mb-4 sm:mb-6 bg-white/5 backdrop-blur-sm shadow-sm"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 ring-1 ring-primary/50 bg-slate-950 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="JSD"
                width={20}
                height={20}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span className="font-semibold text-[11px] sm:text-sm truncate">JSD — Jalore Self Drive Car Rental</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-3 sm:mb-4 leading-tight tracking-tight"
          >
            Find Your{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
              Perfect Car
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-lg md:text-xl text-white/75 mb-6 sm:mb-10 max-w-2xl mx-auto px-2"
          >
            Drive your way — hourly, daily, weekly, or monthly. Premium vehicles
            across Jalore, Rajasthan & Gujarat.
          </motion.p>

          {/* Search Widget */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass rounded-3xl p-4 sm:p-6 max-w-3xl mx-auto shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
              {/* Pickup Location */}
              <div className="space-y-1">
                <label className="text-xs text-white/60 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Pickup Location
                </label>
                <Select value={pickupBranch} onValueChange={setPickupBranch}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-11">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Return Location */}
              <div className="space-y-1">
                <label className="text-xs text-white/60 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Return Location
                </label>
                <Select value={returnBranch} onValueChange={setReturnBranch}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-11">
                    <SelectValue placeholder="Same as pickup" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pickup Date + Time */}
              <div className="space-y-1">
                <label className="text-xs text-white/60 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Pickup Date & Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={pickupDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="h-11 rounded-lg px-3 text-sm bg-white/10 border border-white/20 text-white [color-scheme:dark] w-full focus:outline-none focus:ring-1 focus:ring-white/40"
                  />
                  <Select value={pickupTime} onValueChange={setPickupTime}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Return Date + Time */}
              <div className="space-y-1">
                <label className="text-xs text-white/60 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Return Date & Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={returnDate}
                    min={pickupDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="h-11 rounded-lg px-3 text-sm bg-white/10 border border-white/20 text-white [color-scheme:dark] w-full focus:outline-none focus:ring-1 focus:ring-white/40"
                  />
                  <Select value={returnTime} onValueChange={setReturnTime}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleSearch}
              className="w-full h-12 text-base font-semibold gradient-brand hover:opacity-90 text-white border-0"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Cars
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="grid grid-cols-3 gap-6 mt-12 max-w-sm mx-auto"
          >
            {[
              { value: '50+', label: 'Premium Cars' },
              { value: '4', label: 'Cities' },
              { value: '5★', label: 'Rated' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/60 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  )
}
