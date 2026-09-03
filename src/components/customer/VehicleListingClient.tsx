'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  SlidersHorizontal,
  Car,
  Fuel,
  Users,
  Zap,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  Calendar,
  MapPin,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import type { Vehicle, VehicleType, FuelType, TransmissionType } from '@/types'

interface VehicleListingClientProps {
  initialParams: Record<string, string>
  branches: Array<{ id: string; name: string; city: string }>
  brands: string[]
}

const VEHICLE_TYPES: { label: string; value: VehicleType }[] = [
  { label: 'SUV', value: 'suv' },
  { label: 'Sedan', value: 'sedan' },
  { label: 'Hatchback', value: 'hatchback' },
  { label: 'MUV / 7-Seater', value: 'muv' },
  { label: 'Luxury', value: 'luxury' },
  { label: 'Electric', value: 'electric' }
]

const FUEL_TYPES: { label: string; value: FuelType }[] = [
  { label: 'Petrol', value: 'petrol' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'Electric', value: 'electric' },
  { label: 'CNG', value: 'cng' }
]

const TRANSMISSION_TYPES: { label: string; value: TransmissionType }[] = [
  { label: 'Automatic', value: 'automatic' },
  { label: 'Manual', value: 'manual' }
]

export function VehicleListingClient({
  initialParams,
  branches,
  brands
}: VehicleListingClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Filter States
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialParams.search || '')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialParams.type ? initialParams.type.split(',') : []
  )
  const [selectedFuels, setSelectedFuels] = useState<string[]>(
    initialParams.fuel ? initialParams.fuel.split(',') : []
  )
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>(
    initialParams.transmission ? initialParams.transmission.split(',') : []
  )
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    initialParams.brand ? initialParams.brand.split(',') : []
  )
  const [selectedBranch, setSelectedBranch] = useState<string>(
    initialParams.pickup_branch || 'all'
  )
  const [priceRange, setPriceRange] = useState<number[]>([
    Number(initialParams.max_price) || 10000
  ])
  const [sortBy, setSortBy] = useState<string>(
    initialParams.sort || 'recommended'
  )
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Fetch Vehicles based on filters
  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('vehicles')
        .select(`
          *,
          branch:branches(id, name, city),
          images:vehicle_images(id, url, is_primary, sort_order)
        `)
        .eq('is_active', true)

      if (selectedBranch && selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch)
      }

      if (selectedTypes.length > 0) {
        query = query.in('vehicle_type', selectedTypes)
      }

      if (selectedFuels.length > 0) {
        query = query.in('fuel_type', selectedFuels)
      }

      if (selectedTransmissions.length > 0) {
        query = query.in('transmission', selectedTransmissions)
      }

      if (selectedBrands.length > 0) {
        query = query.in('brand', selectedBrands)
      }

      query = query.lte('daily_rate', priceRange[0])

      // Sort
      if (sortBy === 'price_asc') {
        query = query.order('daily_rate', { ascending: true })
      } else if (sortBy === 'price_desc') {
        query = query.order('daily_rate', { ascending: false })
      } else if (sortBy === 'newest') {
        query = query.order('year', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (!error && data) {
        let filtered = data as unknown as Vehicle[]
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          filtered = filtered.filter(
            v =>
              v.brand.toLowerCase().includes(q) ||
              v.model.toLowerCase().includes(q) ||
              v.registration_number.toLowerCase().includes(q)
          )
        }
        setVehicles(filtered)
      }
      setLoading(false)
    }

    fetchVehicles()
  }, [
    selectedBranch,
    selectedTypes,
    selectedFuels,
    selectedTransmissions,
    selectedBrands,
    priceRange,
    sortBy,
    searchQuery
  ])

  const toggleFilter = (
    list: string[],
    setList: (val: string[]) => void,
    item: string
  ) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item))
    } else {
      setList([...list, item])
    }
  }

  const clearAllFilters = () => {
    setSelectedTypes([])
    setSelectedFuels([])
    setSelectedTransmissions([])
    setSelectedBrands([])
    setSelectedBranch('all')
    setPriceRange([10000])
    setSearchQuery('')
    setSortBy('recommended')
  }

  const activeFilterCount =
    selectedTypes.length +
    selectedFuels.length +
    selectedTransmissions.length +
    selectedBrands.length +
    (selectedBranch !== 'all' ? 1 : 0) +
    (priceRange[0] < 10000 ? 1 : 0)

  // Filter Sidebar Content (shared between Desktop and Mobile)
  const FilterContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" /> Filters
        </h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-primary h-7 px-2 gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* City / Branch Filter */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Location / Branch
        </Label>
        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities / Branches</SelectItem>
            {branches.map(b => (
              <SelectItem key={b.id} value={b.id}>
                {b.city} — {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Max Price Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <Label className="uppercase tracking-wider text-muted-foreground font-semibold">
            Max Daily Rate
          </Label>
          <span className="font-bold text-primary">
            ₹{priceRange[0].toLocaleString('en-IN')}/day
          </span>
        </div>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={800}
          max={10000}
          step={200}
          className="py-2"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>₹800</span>
          <span>₹10,000+</span>
        </div>
      </div>

      {/* Vehicle Type */}
      <div className="space-y-2.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Body Type
        </Label>
        <div className="space-y-2">
          {VEHICLE_TYPES.map(type => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type.value}`}
                checked={selectedTypes.includes(type.value)}
                onCheckedChange={() =>
                  toggleFilter(selectedTypes, setSelectedTypes, type.value)
                }
              />
              <label
                htmlFor={`type-${type.value}`}
                className="text-sm cursor-pointer select-none text-foreground/80 hover:text-foreground"
              >
                {type.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div className="space-y-2.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Brand
          </Label>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {brands.map(brand => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={selectedBrands.includes(brand)}
                  onCheckedChange={() =>
                    toggleFilter(selectedBrands, setSelectedBrands, brand)
                  }
                />
                <label
                  htmlFor={`brand-${brand}`}
                  className="text-sm cursor-pointer select-none text-foreground/80 hover:text-foreground"
                >
                  {brand}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fuel Type */}
      <div className="space-y-2.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Fuel
        </Label>
        <div className="space-y-2">
          {FUEL_TYPES.map(fuel => (
            <div key={fuel.value} className="flex items-center space-x-2">
              <Checkbox
                id={`fuel-${fuel.value}`}
                checked={selectedFuels.includes(fuel.value)}
                onCheckedChange={() =>
                  toggleFilter(selectedFuels, setSelectedFuels, fuel.value)
                }
              />
              <label
                htmlFor={`fuel-${fuel.value}`}
                className="text-sm cursor-pointer select-none text-foreground/80 hover:text-foreground"
              >
                {fuel.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div className="space-y-2.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Transmission
        </Label>
        <div className="space-y-2">
          {TRANSMISSION_TYPES.map(trans => (
            <div key={trans.value} className="flex items-center space-x-2">
              <Checkbox
                id={`trans-${trans.value}`}
                checked={selectedTransmissions.includes(trans.value)}
                onCheckedChange={() =>
                  toggleFilter(
                    selectedTransmissions,
                    setSelectedTransmissions,
                    trans.value
                  )
                }
              />
              <label
                htmlFor={`trans-${trans.value}`}
                className="text-sm cursor-pointer select-none text-foreground/80 hover:text-foreground"
              >
                {trans.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and Sort Header Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Explore Available Cars
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Finding vehicles...' : `Showing ${vehicles.length} cars`}
          </p>
        </div>

        {/* Search input + Sort + Mobile filter trigger */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search make or model..."
              className="pl-9 h-10 bg-muted/40"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-10">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest Model</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filter Button */}
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden h-10 gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto">
              <SheetHeader className="mb-4">
                <SheetTitle>Filter Vehicles</SheetTitle>
              </SheetHeader>
              {FilterContent}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Grid: Sidebar + Vehicle Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block bg-card border border-border rounded-2xl p-6 sticky top-24 shadow-sm">
          {FilterContent}
        </div>

        {/* Vehicle Cards Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-4 animate-pulse space-y-4"
                >
                  <div className="aspect-[16/10] bg-muted rounded-xl" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 border border-dashed border-border rounded-3xl p-8">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4 text-3xl">
                🚗
              </div>
              <h3 className="text-lg font-bold">No vehicles match your criteria</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
                Try adjusting your price range, fuel type, or clear active filters
                to discover available cars.
              </p>
              <Button onClick={clearAllFilters} variant="outline">
                Reset All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {vehicles.map((v, index) => {
                const primaryImage = v.images?.find(img => img.is_primary)
                const imageUrl = primaryImage?.url ?? v.images?.[0]?.url

                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Top Image & Badges */}
                    <div>
                      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt={`${v.brand} ${v.model}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/40 text-4xl">
                            🚗
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex gap-1.5">
                          <Badge className="bg-black/60 backdrop-blur-md text-white border-0 text-[10px] capitalize font-medium">
                            {v.vehicle_type}
                          </Badge>
                          {v.branch && (
                            <Badge className="bg-primary/90 backdrop-blur-md text-white border-0 text-[10px] flex items-center gap-1 font-medium">
                              <MapPin className="w-2.5 h-2.5" />
                              {v.branch.city}
                            </Badge>
                          )}
                        </div>

                        <div className="absolute top-3 right-3">
                          <Badge
                            className={`text-[10px] font-medium ${
                              v.status === 'available'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {v.status === 'available' ? 'Available' : 'Reserved'}
                          </Badge>
                        </div>
                      </div>

                      {/* Info & Specs */}
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                            {v.brand} {v.model}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {v.variant ? `${v.variant} • ` : ''}
                            {v.year}
                          </p>
                        </div>

                        {/* Specs row */}
                        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-muted/40 rounded-xl text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Fuel className="w-3.5 h-3.5 text-primary" />
                            <span className="capitalize">{v.fuel_type}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-primary" />
                            <span className="capitalize">{v.transmission}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-primary" />
                            <span>{v.seating_capacity} Seats</span>
                          </div>
                        </div>

                        {/* Mileage / Extras */}
                        <div className="text-xs text-muted-foreground flex items-center justify-between">
                          <span>Included: {v.included_km_per_day} km/day</span>
                          <span>Extra: ₹{v.extra_km_charge}/km</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Pricing & CTA */}
                    <div className="p-5 pt-0 border-t border-border mt-2">
                      <div className="flex items-end justify-between mb-3 pt-3">
                        <div>
                          {v.hourly_rate && (
                            <span className="text-xs text-muted-foreground block">
                              ₹{v.hourly_rate}/hr
                            </span>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-foreground">
                              ₹{v.daily_rate?.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              /day
                            </span>
                          </div>
                        </div>
                        {v.security_deposit > 0 && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            Deposit: ₹{v.security_deposit.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full text-xs h-9"
                        >
                          <Link href={`/cars/${v.id}`}>View Details</Link>
                        </Button>
                        <Button
                          size="sm"
                          asChild
                          className="w-full gradient-brand text-white border-0 hover:opacity-90 text-xs h-9 font-semibold gap-1"
                        >
                          <Link href={`/admin/assign?vehicle_id=${v.id}`}>
                            <Zap className="w-3 h-3 fill-current" /> Assign Car
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
