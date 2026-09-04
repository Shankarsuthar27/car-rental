'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  History,
  Car,
  Users,
  Search,
  Calendar,
  DollarSign,
  Gauge,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  Filter,
  X,
  Printer,
  ChevronRight,
  TrendingUp,
  MapPin,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import type { Booking, Vehicle, Customer } from '@/types'
import { formatCustomer } from '@/lib/customers'
import { cn } from '@/lib/utils'

interface RentalHistoryClientProps {
  bookings: any[]
  vehicles: any[]
  customers: any[]
}

export function RentalHistoryClient({
  bookings: rawBookings,
  vehicles,
  customers: rawCustomers,
}: RentalHistoryClientProps) {
  const customers = useMemo(() => (rawCustomers || []).map(formatCustomer), [rawCustomers])
  const bookings = useMemo(() => (rawBookings || []).map(b => ({
    ...b,
    customer: b.customer ? formatCustomer(b.customer) : b.customer,
  })), [rawBookings])

  // Active View Tab: all_rentals (default), car_history, customer_history
  const [activeTab, setActiveTab] = useState<'all_rentals' | 'car_history' | 'customer_history'>('all_rentals')

  // Global All Rentals Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [vehicleFilter, setVehicleFilter] = useState<string>('all')

  // Single Vehicle History State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '')
  const [carSearch, setCarSearch] = useState('')

  // Single Customer History State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '')
  const [custSearch, setCustSearch] = useState('')

  // Modal State for Booking Details
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any | null>(null)

  // Safe Date Formatter
  const formatDateSafe = (dateStr?: string, fmt = 'dd MMM yyyy') => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return isNaN(d.getTime()) ? '—' : format(d, fmt)
    } catch {
      return '—'
    }
  }

  // Safe Duration in Days
  const getDurationDays = (pickup?: string, returnDate?: string) => {
    if (!pickup || !returnDate) return 1
    try {
      const p = new Date(pickup)
      const r = new Date(returnDate)
      const diffDays = Math.ceil((r.getTime() - p.getTime()) / (1000 * 60 * 60 * 24))
      return Math.max(1, diffDays)
    } catch {
      return 1
    }
  }

  // Company-wide High Level Stats
  const overviewStats = useMemo(() => {
    const totalTrips = bookings.length
    let totalRevenue = 0
    let totalKm = 0
    let completedCount = 0
    let activeCount = 0

    for (const b of bookings) {
      totalRevenue += Number(b.grand_total || 0)
      if (b.status === 'completed') completedCount++
      if (b.status === 'active' || b.status === 'confirmed') activeCount++
      if (b.return_odometer && b.pickup_odometer && b.return_odometer > b.pickup_odometer) {
        totalKm += (b.return_odometer - b.pickup_odometer)
      }
    }

    return { totalTrips, totalRevenue, totalKm, completedCount, activeCount }
  }, [bookings])

  // Filtered Bookings for the Master "All Rentals" tab
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Search matching booking number, customer name, phone, car name, or plate
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const bNum = (b.booking_number || '').toLowerCase()
        const custName = (b.customer?.profile?.full_name || b.customer?.emergency_contact_name || '').toLowerCase()
        const phone = (b.customer?.profile?.phone || '').toLowerCase()
        const carName = `${b.vehicle?.brand || ''} ${b.vehicle?.model || ''}`.toLowerCase()
        const plate = (b.vehicle?.registration_number || '').toLowerCase()

        const matches = bNum.includes(query) || custName.includes(query) || phone.includes(query) || carName.includes(query) || plate.includes(query)
        if (!matches) return false
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (b.status !== statusFilter) return false
      }

      // Vehicle filter
      if (vehicleFilter !== 'all') {
        if (b.vehicle_id !== vehicleFilter) return false
      }

      return true
    })
  }, [bookings, searchQuery, statusFilter, vehicleFilter])

  // Selected Vehicle & Its History
  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || null
  }, [vehicles, selectedVehicleId])

  const vehicleBookings = useMemo(() => {
    if (!selectedVehicleId) return []
    return bookings.filter(b => b.vehicle_id === selectedVehicleId)
  }, [bookings, selectedVehicleId])

  const vehicleStats = useMemo(() => {
    const totalTrips = vehicleBookings.length
    let totalRevenue = 0
    let totalDistance = 0

    for (const b of vehicleBookings) {
      totalRevenue += Number(b.grand_total || 0)
      if (b.return_odometer && b.pickup_odometer && b.return_odometer > b.pickup_odometer) {
        totalDistance += (b.return_odometer - b.pickup_odometer)
      }
    }

    return { totalTrips, totalRevenue, totalDistance }
  }, [vehicleBookings])

  // Selected Customer & Their History
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null
  }, [customers, selectedCustomerId])

  const customerBookings = useMemo(() => {
    if (!selectedCustomerId) return []
    return bookings.filter(b => b.customer_id === selectedCustomerId)
  }, [bookings, selectedCustomerId])

  const customerStats = useMemo(() => {
    const totalTrips = customerBookings.length
    let totalSpend = 0
    for (const b of customerBookings) {
      totalSpend += Number(b.grand_total || 0)
    }
    return { totalTrips, totalSpend }
  }, [customerBookings])

  // Helper for Status Badge Styling
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] font-semibold">Completed</Badge>
      case 'active':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[11px] font-semibold animate-pulse">Active Trip</Badge>
      case 'confirmed':
        return <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-[11px] font-semibold">Confirmed</Badge>
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[11px] font-semibold">Pending</Badge>
      case 'cancelled':
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[11px] font-semibold">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="text-[11px] font-semibold capitalize">{status || 'Unknown'}</Badge>
    }
  }

  // Reset Filters Helper
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || vehicleFilter !== 'all'
  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setVehicleFilter('all')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 text-white">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Rental History
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Comprehensive log of all completed trips, fleet mileage progression, and customer track records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/assign">
            <Button size="sm" className="gradient-brand text-white border-0 text-xs font-bold h-9 px-4 rounded-xl shadow-xs">
              + New Rental Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Level Summary Cards (Simple to understand at a glance) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Bookings */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Rentals</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">{overviewStats.totalTrips}</span>
            <span className="text-xs text-muted-foreground">trips logged</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
              ₹{overviewStats.totalRevenue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Fleet Distance Driven */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Distance Driven</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              {overviewStats.totalKm.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-muted-foreground">KM logged</span>
          </div>
        </div>

        {/* Completed vs Active */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trip Status</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div>
              <span className="text-xl sm:text-2xl font-black text-foreground">{overviewStats.completedCount}</span>
              <span className="text-[11px] text-muted-foreground block">Completed</span>
            </div>
            <div className="h-7 w-[1px] bg-border" />
            <div>
              <span className="text-xl sm:text-2xl font-black text-blue-600">{overviewStats.activeCount}</span>
              <span className="text-[11px] text-muted-foreground block">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(val: any) => setActiveTab(val)}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-muted/40 border border-border/80 rounded-2xl">
          <TabsList className="bg-background/80 p-1 rounded-xl h-10 border border-border/60 shadow-xs">
            <TabsTrigger value="all_rentals" className="text-xs sm:text-sm font-bold gap-2 px-3 sm:px-4">
              📋 All Rentals Log
            </TabsTrigger>
            <TabsTrigger value="car_history" className="text-xs sm:text-sm font-bold gap-2 px-3 sm:px-4">
              🚗 Fleet Vehicle History
            </TabsTrigger>
            <TabsTrigger value="customer_history" className="text-xs sm:text-sm font-bold gap-2 px-3 sm:px-4">
              👤 Customer Trip History
            </TabsTrigger>
          </TabsList>

          <span className="text-xs text-muted-foreground px-3 py-1 font-medium hidden sm:inline-block">
            {activeTab === 'all_rentals' && `Showing ${filteredBookings.length} recorded rentals`}
            {activeTab === 'car_history' && `Select any car to see all past trips & mileage`}
            {activeTab === 'customer_history' && `Select any customer to inspect rental history`}
          </span>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: ALL RENTALS MASTER LOG (Default & Easiest to Understand) */}
        {/* ============================================================ */}
        <TabsContent value="all_rentals" className="space-y-4 mt-0">
          {/* Quick Filter Bar */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              {/* Universal Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by Booking ID, Customer Name, Phone, Car Model, or Plate..."
                  className="pl-9.5 h-10 text-xs sm:text-sm rounded-xl bg-muted/30 border-border/80"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-44">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl bg-muted/30 border-border/80">
                    <SelectValue placeholder="Status: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="active">Active Trip</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Filter */}
              <div className="w-full md:w-52">
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                  <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl bg-muted/30 border-border/80 truncate">
                    <SelectValue placeholder="Vehicle: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fleet Vehicles</SelectItem>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.registration_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filter Button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-10 px-3 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Master Table of Rentals */}
          <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-4">Booking ID</th>
                    <th className="p-4">Car Details</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Rental Duration</th>
                    <th className="p-4">Mileage (KM)</th>
                    <th className="p-4">Total Bill</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-muted-foreground">
                        <div className="max-w-xs mx-auto space-y-2">
                          <History className="w-8 h-8 mx-auto text-muted-foreground/50" />
                          <p className="font-semibold text-foreground text-sm">No rental records found</p>
                          <p className="text-xs">
                            {hasActiveFilters
                              ? 'Try adjusting or clearing your filters to see more results.'
                              : 'No rentals have been registered yet.'}
                          </p>
                          {hasActiveFilters && (
                            <Button size="sm" variant="outline" onClick={resetFilters} className="mt-2 text-xs">
                              Clear All Filters
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map(booking => {
                      const duration = getDurationDays(booking.pickup_datetime, booking.return_datetime)
                      const isComplete = booking.status === 'completed'
                      const startKm = booking.pickup_odometer || 0
                      const endKm = booking.return_odometer || 0
                      const drivenKm = endKm > startKm ? endKm - startKm : 0

                      return (
                        <tr
                          key={booking.id}
                          onClick={() => setSelectedBookingDetails(booking)}
                          className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        >
                          {/* Booking ID & Date */}
                          <td className="p-4">
                            <span className="font-mono font-bold text-primary block group-hover:underline">
                              {booking.booking_number}
                            </span>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              {formatDateSafe(booking.created_at || booking.pickup_datetime, 'dd MMM yyyy')}
                            </span>
                          </td>

                          {/* Car Details */}
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold shrink-0">
                                <Car className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-foreground block">
                                  {booking.vehicle?.brand} {booking.vehicle?.model}
                                </span>
                                <Badge variant="outline" className="text-[9px] font-mono font-semibold px-1.5 py-0 mt-0.5">
                                  {booking.vehicle?.registration_number || 'CAR'}
                                </Badge>
                              </div>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="p-4">
                            <span className="font-bold text-foreground block">
                              {booking.customer?.profile?.full_name || booking.customer?.emergency_contact_name || 'Customer'}
                            </span>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              {booking.customer?.profile?.phone || 'No phone'}
                            </span>
                          </td>

                          {/* Rental Duration */}
                          <td className="p-4">
                            <div className="font-medium text-foreground">
                              {formatDateSafe(booking.pickup_datetime, 'dd MMM')} → {formatDateSafe(booking.return_datetime, 'dd MMM yyyy')}
                            </div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-bold text-muted-foreground">
                              {duration} {duration === 1 ? 'Day' : 'Days'}
                            </span>
                          </td>

                          {/* Mileage Progression */}
                          <td className="p-4 font-mono text-[11px]">
                            {isComplete && endKm > 0 ? (
                              <div>
                                <div className="text-foreground font-semibold">
                                  {startKm.toLocaleString('en-IN')} → {endKm.toLocaleString('en-IN')} KM
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 block">
                                  +{drivenKm.toLocaleString('en-IN')} KM driven
                                </span>
                              </div>
                            ) : (
                              <div className="text-muted-foreground">
                                <div>Start: {startKm ? `${startKm} KM` : '—'}</div>
                                <span className="text-[10px] italic">Trip in progress</span>
                              </div>
                            )}
                          </td>

                          {/* Total Bill & Payment Status */}
                          <td className="p-4">
                            <span className="font-black font-mono text-sm text-foreground block">
                              ₹{Number(booking.grand_total || 0).toLocaleString('en-IN')}
                            </span>
                            <span className={cn(
                              'text-[10px] font-bold uppercase tracking-tight block mt-0.5',
                              booking.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                            )}>
                              {booking.payment_status === 'paid' ? 'Paid in full' : `Due: ₹${Number(booking.outstanding_amount || 0).toLocaleString('en-IN')}`}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            {getStatusBadge(booking.status)}
                          </td>

                          {/* Action */}
                          <td className="p-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedBookingDetails(booking)
                              }}
                              className="h-7 px-2.5 text-xs font-semibold rounded-lg gap-1 border-border/80 hover:bg-primary hover:text-white transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-3.5 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing <strong>{filteredBookings.length}</strong> of <strong>{bookings.length}</strong> rentals
              </span>
              <span>Click on any rental row to inspect full details</span>
            </div>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 2: FLEET VEHICLE HISTORY */}
        {/* ============================================================ */}
        <TabsContent value="car_history" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 4 Cols: Vehicle Selector */}
            <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Vehicle
                </span>
                <span className="text-xs font-bold font-mono text-primary">
                  {vehicles.length} Cars
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={carSearch}
                  onChange={e => setCarSearch(e.target.value)}
                  placeholder="Filter cars by model or plate..."
                  className="pl-8.5 h-9 text-xs rounded-xl bg-muted/40"
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {vehicles
                  .filter(v => `${v.brand} ${v.model} ${v.registration_number}`.toLowerCase().includes(carSearch.toLowerCase()))
                  .map(car => {
                    const isSelected = car.id === selectedVehicleId
                    return (
                      <div
                        key={car.id}
                        onClick={() => setSelectedVehicleId(car.id)}
                        className={cn(
                          'p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150 relative select-none',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs'
                            : 'border-border/80 bg-card hover:bg-muted/30'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground block">
                            {car.brand} {car.model}
                          </span>
                          <Badge variant="outline" className="text-[9px] font-mono font-bold">
                            {car.registration_number}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground block capitalize mt-0.5">
                          Status: {car.status} • Odometer: {car.current_odometer || 0} KM
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Right 8 Cols: Selected Vehicle Breakdown & Trips */}
            <div className="lg:col-span-8 space-y-4">
              {selectedVehicle ? (
                <>
                  {/* Selected Vehicle Banner */}
                  <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-black text-foreground">
                          {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.variant}
                        </h2>
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono font-bold uppercase">
                          {selectedVehicle.registration_number}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Year: {selectedVehicle.year} • {selectedVehicle.fuel_type} • {selectedVehicle.transmission} • Current Odometer: <strong>{selectedVehicle.current_odometer || 0} KM</strong>
                      </p>
                    </div>

                    <Link href={`/admin/assign?vehicle_id=${selectedVehicle.id}`}>
                      <Button size="sm" className="gradient-brand text-white border-0 text-xs font-bold h-8.5 rounded-xl shadow-xs">
                        Assign This Car
                      </Button>
                    </Link>
                  </div>

                  {/* Vehicle Lifetime Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Rentals</span>
                      <span className="text-xl font-black text-foreground">{vehicleStats.totalTrips}</span>
                    </div>

                    <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Revenue Earned</span>
                      <span className="text-xl font-black text-emerald-600 font-mono">
                        ₹{vehicleStats.totalRevenue.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Distance Traveled</span>
                      <span className="text-xl font-black text-foreground font-mono">
                        {vehicleStats.totalDistance.toLocaleString('en-IN')} KM
                      </span>
                    </div>
                  </div>

                  {/* Vehicle Trip Log Table */}
                  <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
                      <h3 className="font-bold text-xs text-foreground">
                        Rental History for {selectedVehicle.brand} {selectedVehicle.model} ({vehicleBookings.length})
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                          <tr>
                            <th className="p-3.5">Rental ID</th>
                            <th className="p-3.5">Customer</th>
                            <th className="p-3.5">Dates</th>
                            <th className="p-3.5">Start / End KM</th>
                            <th className="p-3.5">Amount</th>
                            <th className="p-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {vehicleBookings.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                No previous rentals recorded for this vehicle.
                              </td>
                            </tr>
                          ) : (
                            vehicleBookings.map(b => (
                              <tr
                                key={b.id}
                                onClick={() => setSelectedBookingDetails(b)}
                                className="hover:bg-muted/20 transition-colors cursor-pointer"
                              >
                                <td className="p-3.5 font-mono font-bold text-primary">
                                  {b.booking_number}
                                </td>
                                <td className="p-3.5">
                                  <span className="font-bold text-foreground block">
                                    {b.customer?.profile?.full_name || b.customer?.emergency_contact_name || 'Customer'}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {b.customer?.profile?.phone || '—'}
                                  </span>
                                </td>
                                <td className="p-3.5 text-muted-foreground text-[11px]">
                                  <div>{formatDateSafe(b.pickup_datetime)}</div>
                                  <div>to {formatDateSafe(b.return_datetime)}</div>
                                </td>
                                <td className="p-3.5 font-mono text-muted-foreground">
                                  <div>Start: {b.pickup_odometer || 0} KM</div>
                                  <div>End: {b.return_odometer || '—'} KM</div>
                                </td>
                                <td className="p-3.5 font-bold font-mono text-foreground">
                                  ₹{Number(b.grand_total || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5">
                                  {getStatusBadge(b.status)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-muted-foreground bg-card border rounded-2xl">
                  Select a vehicle from the left panel to inspect its rental history.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 3: CUSTOMER TRIP HISTORY */}
        {/* ============================================================ */}
        <TabsContent value="customer_history" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 4 Cols: Customer Selector */}
            <div className="lg:col-span-4 bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Customer
                </span>
                <span className="text-xs font-bold font-mono text-primary">
                  {customers.length} Customers
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={custSearch}
                  onChange={e => setCustSearch(e.target.value)}
                  placeholder="Filter customers by name or phone..."
                  className="pl-8.5 h-9 text-xs rounded-xl bg-muted/40"
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {customers
                  .filter(c => `${c.profile?.full_name} ${c.profile?.phone} ${c.customer_code}`.toLowerCase().includes(custSearch.toLowerCase()))
                  .map(cust => {
                    const isSelected = cust.id === selectedCustomerId
                    const name = cust.profile?.full_name || 'Customer'
                    return (
                      <div
                        key={cust.id}
                        onClick={() => setSelectedCustomerId(cust.id)}
                        className={cn(
                          'p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150 relative select-none',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs'
                            : 'border-border/80 bg-card hover:bg-muted/30'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground block">
                            {name}
                          </span>
                          <Badge variant="outline" className="text-[9px] font-mono">
                            {cust.customer_code || 'CUST'}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                          📞 {cust.profile?.phone || 'No phone'}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Right 8 Cols: Selected Customer Breakdown & Trips */}
            <div className="lg:col-span-8 space-y-4">
              {selectedCustomer ? (
                <>
                  {/* Selected Customer Banner */}
                  <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-black text-foreground">
                          {selectedCustomer.profile?.full_name}
                        </h2>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                          ✓ Verified DL
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Phone: {selectedCustomer.profile?.phone || 'N/A'} • Email: {selectedCustomer.profile?.email || 'N/A'} • City: {selectedCustomer.city || 'Jaipur'}
                      </p>
                    </div>

                    <Link href={`/admin/assign?customer_id=${selectedCustomer.id}`}>
                      <Button size="sm" className="gradient-brand text-white border-0 text-xs font-bold h-8.5 rounded-xl shadow-xs">
                        Assign New Car
                      </Button>
                    </Link>
                  </div>

                  {/* Customer Lifetime Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Lifetime Rentals</span>
                      <span className="text-xl font-black text-foreground">{customerStats.totalTrips} Trips</span>
                    </div>

                    <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Amount Spent</span>
                      <span className="text-xl font-black text-emerald-600 font-mono">
                        ₹{customerStats.totalSpend.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Customer Previous Rentals Table */}
                  <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
                      <h3 className="font-bold text-xs text-foreground">
                        Rental History for {selectedCustomer.profile?.full_name} ({customerBookings.length})
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                          <tr>
                            <th className="p-3.5">Rental ID</th>
                            <th className="p-3.5">Vehicle Rented</th>
                            <th className="p-3.5">Dates</th>
                            <th className="p-3.5">KM Logged</th>
                            <th className="p-3.5">Total Bill</th>
                            <th className="p-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {customerBookings.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                No previous rentals recorded for this customer.
                              </td>
                            </tr>
                          ) : (
                            customerBookings.map(b => (
                              <tr
                                key={b.id}
                                onClick={() => setSelectedBookingDetails(b)}
                                className="hover:bg-muted/20 transition-colors cursor-pointer"
                              >
                                <td className="p-3.5 font-mono font-bold text-primary">
                                  {b.booking_number}
                                </td>
                                <td className="p-3.5">
                                  <span className="font-bold text-foreground block">
                                    {b.vehicle?.brand} {b.vehicle?.model}
                                  </span>
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    {b.vehicle?.registration_number}
                                  </span>
                                </td>
                                <td className="p-3.5 text-muted-foreground text-[11px]">
                                  <div>{formatDateSafe(b.pickup_datetime)}</div>
                                  <div>to {formatDateSafe(b.return_datetime)}</div>
                                </td>
                                <td className="p-3.5 font-mono text-muted-foreground">
                                  <div>Start: {b.pickup_odometer || 0} KM</div>
                                  <div>End: {b.return_odometer || '—'} KM</div>
                                </td>
                                <td className="p-3.5 font-bold font-mono text-foreground">
                                  ₹{Number(b.grand_total || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5">
                                  {getStatusBadge(b.status)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-muted-foreground bg-card border rounded-2xl">
                  Select a customer from the left panel to inspect their rental history.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* RENTAL TRIP DETAILS DIALOG (Clear, Plain-Language Modal) */}
      {/* ============================================================ */}
      <Dialog
        open={Boolean(selectedBookingDetails)}
        onOpenChange={(open) => !open && setSelectedBookingDetails(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7">
          {selectedBookingDetails && (
            <div className="space-y-6">
              {/* Modal Header */}
              <DialogHeader className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-primary px-2.5 py-1 rounded-lg bg-primary/10">
                    {selectedBookingDetails.booking_number}
                  </span>
                  {getStatusBadge(selectedBookingDetails.status)}
                </div>
                <DialogTitle className="text-xl font-black text-foreground">
                  Rental Trip Details
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Booked on {formatDateSafe(selectedBookingDetails.created_at, 'dd MMMM yyyy, hh:mm a')}
                </DialogDescription>
              </DialogHeader>

              {/* Vehicle and Customer Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vehicle Card */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                    <Car className="w-4 h-4 text-primary" />
                    Vehicle Information
                  </div>
                  <div className="pt-1">
                    <h4 className="font-extrabold text-base text-foreground">
                      {selectedBookingDetails.vehicle?.brand} {selectedBookingDetails.vehicle?.model}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono font-bold text-[10px]">
                        {selectedBookingDetails.vehicle?.registration_number || 'CAR'}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">
                        {selectedBookingDetails.vehicle?.fuel_type} • {selectedBookingDetails.vehicle?.transmission}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Card */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                    <Users className="w-4 h-4 text-primary" />
                    Customer Details
                  </div>
                  <div className="pt-1">
                    <h4 className="font-extrabold text-base text-foreground">
                      {selectedBookingDetails.customer?.profile?.full_name || selectedBookingDetails.customer?.emergency_contact_name || 'Customer'}
                    </h4>
                    <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                      <p>📞 {selectedBookingDetails.customer?.profile?.phone || 'No phone'}</p>
                      <p>✉️ {selectedBookingDetails.customer?.profile?.email || 'No email'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Dates and Mileage Progression */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Trip Duration & Odometer Tracking
                  </span>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                    {getDurationDays(selectedBookingDetails.pickup_datetime, selectedBookingDetails.return_datetime)} Days
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-card border border-border/60">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Pickup Details</span>
                    <div className="font-bold text-foreground text-sm mt-1">
                      {formatDateSafe(selectedBookingDetails.pickup_datetime, 'dd MMM yyyy, hh:mm a')}
                    </div>
                    <div className="font-mono text-muted-foreground mt-0.5">
                      Starting Odometer: <strong>{selectedBookingDetails.pickup_odometer || 0} KM</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/60">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase block">Return Details</span>
                    <div className="font-bold text-foreground text-sm mt-1">
                      {formatDateSafe(selectedBookingDetails.return_datetime, 'dd MMM yyyy, hh:mm a')}
                    </div>
                    <div className="font-mono text-muted-foreground mt-0.5">
                      Ending Odometer: <strong>{selectedBookingDetails.return_odometer ? `${selectedBookingDetails.return_odometer} KM` : 'Trip active'}</strong>
                    </div>
                  </div>
                </div>

                {selectedBookingDetails.return_odometer && selectedBookingDetails.pickup_odometer && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">Total Distance Logged for this Trip:</span>
                    <span className="font-mono font-black text-emerald-600 text-sm">
                      {(selectedBookingDetails.return_odometer - selectedBookingDetails.pickup_odometer).toLocaleString('en-IN')} KM
                    </span>
                  </div>
                )}
              </div>

              {/* Financial Charges Breakdown */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-3">
                <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Bill & Financial Breakdown
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Base Rental ({getDurationDays(selectedBookingDetails.pickup_datetime, selectedBookingDetails.return_datetime)} Days)</span>
                    <span className="font-mono font-medium text-foreground">
                      ₹{Number(selectedBookingDetails.base_rental || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {Number(selectedBookingDetails.extra_km_charge || 0) > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Extra KM Charges</span>
                      <span className="font-mono font-medium text-foreground">
                        +₹{Number(selectedBookingDetails.extra_km_charge).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {Number(selectedBookingDetails.insurance_charge || 0) > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Insurance Protection</span>
                      <span className="font-mono font-medium text-foreground">
                        +₹{Number(selectedBookingDetails.insurance_charge).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {Number(selectedBookingDetails.tax_amount || 0) > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>GST & Taxes</span>
                      <span className="font-mono font-medium text-foreground">
                        +₹{Number(selectedBookingDetails.tax_amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {Number(selectedBookingDetails.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Special Discount</span>
                      <span className="font-mono font-medium">
                        -₹{Number(selectedBookingDetails.discount_amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="h-[1px] bg-border my-2" />

                  <div className="flex justify-between items-center text-sm font-black">
                    <span className="text-foreground">Grand Total</span>
                    <span className="font-mono text-base text-primary">
                      ₹{Number(selectedBookingDetails.grand_total || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-muted-foreground">Amount Paid (Advance / Collected)</span>
                    <span className="font-mono font-bold text-emerald-600">
                      ₹{Number(selectedBookingDetails.amount_paid || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {Number(selectedBookingDetails.outstanding_amount || 0) > 0 && (
                    <div className="flex justify-between text-xs pt-0.5">
                      <span className="text-amber-600 font-semibold">Pending Balance Due</span>
                      <span className="font-mono font-bold text-amber-600">
                        ₹{Number(selectedBookingDetails.outstanding_amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <Link href={`/admin/bookings`}>
                  <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl">
                    Manage in Bookings
                  </Button>
                </Link>
                <Button
                  onClick={() => setSelectedBookingDetails(null)}
                  className="w-full sm:w-auto text-xs font-bold rounded-xl"
                >
                  Close Details
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
