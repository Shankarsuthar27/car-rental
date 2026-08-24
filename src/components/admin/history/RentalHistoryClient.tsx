'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  History,
  Car,
  Users,
  Search,
  Calendar,
  DollarSign,
  Gauge,
  RotateCcw,
  Wrench,
  AlertTriangle,
  FileText,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const customers = useMemo(() => rawCustomers.map(formatCustomer), [rawCustomers])
  const bookings = useMemo(() => rawBookings.map(b => ({
    ...b,
    customer: b.customer ? formatCustomer(b.customer) : b.customer,
  })), [rawBookings])
  const [activeTab, setActiveTab] = useState<'car_history' | 'customer_history'>('car_history')

  // Car History Filter
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '')
  const [carSearch, setCarSearch] = useState('')

  // Customer History Filter
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '')
  const [custSearch, setCustSearch] = useState('')

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
      if (b.return_odometer && b.pickup_odometer) {
        totalDistance += Math.max(0, b.return_odometer - b.pickup_odometer)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-md shadow-primary/20 text-white">
              <History className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Fleet & Customer Rental History
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit past trips, odometer mileage progressions, lifetime vehicle revenues, and customer rental track records.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="car_history" onValueChange={(val: any) => setActiveTab(val)}>
        <div className="flex items-center justify-between p-2 bg-muted/30 border border-border/80 rounded-2xl">
          <TabsList className="bg-muted/60 p-1 rounded-xl h-10 border border-border/60">
            <TabsTrigger value="car_history" className="text-xs rounded-lg font-bold gap-1.5">
              🚗 Vehicle Fleet History
            </TabsTrigger>
            <TabsTrigger value="customer_history" className="text-xs rounded-lg font-bold gap-1.5">
              👤 Customer Trip History
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ============================================================ */}
        {/* 1. CAR RENTAL HISTORY TAB */}
        {/* ============================================================ */}
        <TabsContent value="car_history" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 4 Cols: Vehicle Selector */}
            <div className="lg:col-span-4 bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Select Fleet Vehicle
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
                  placeholder="Filter cars..."
                  className="pl-8.5 h-8.5 text-xs rounded-xl bg-muted/40"
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
                          'p-3 rounded-2xl border text-xs cursor-pointer transition-all duration-150 relative select-none',
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
                          {car.status} • {car.current_odometer || 0} KM
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Right 8 Cols: Lifetime Stats & Past Trips Table */}
            <div className="lg:col-span-8 space-y-6">
              {selectedVehicle ? (
                <>
                  {/* Vehicle Hero Header */}
                  <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-foreground">
                          {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.variant}
                        </h2>
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase font-mono">
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

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Trips Completed</span>
                      <span className="text-xl sm:text-2xl font-black text-foreground">{vehicleStats.totalTrips}</span>
                    </div>

                    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Revenue Earned</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">₹{vehicleStats.totalRevenue.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Tracked KM</span>
                      <span className="text-xl sm:text-2xl font-black text-foreground font-mono">{vehicleStats.totalDistance.toLocaleString('en-IN')} KM</span>
                    </div>
                  </div>

                  {/* Trip History Table */}
                  <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-foreground">
                        Rental History & Customer Log ({vehicleBookings.length})
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
                            vehicleBookings.map((b) => (
                              <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                                <td className="p-3.5 font-mono font-bold text-primary">
                                  {b.booking_number}
                                </td>
                                <td className="p-3.5">
                                  <span className="font-bold text-foreground block">
                                    {b.customer?.profile?.full_name || b.customer?.emergency_contact_name || b.customer?.customer_code || 'Valued Customer'}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {b.customer?.profile?.phone || b.customer?.emergency_contact_phone || '—'}
                                  </span>
                                </td>
                                <td className="p-3.5 text-muted-foreground text-[11px]">
                                  <div>{format(new Date(b.pickup_datetime), 'dd MMM yyyy')}</div>
                                  <div>to {format(new Date(b.return_datetime), 'dd MMM yyyy')}</div>
                                </td>
                                <td className="p-3.5 font-mono text-muted-foreground">
                                  <div>Start: {b.pickup_odometer || 0} KM</div>
                                  <div>End: {b.return_odometer || '—'} KM</div>
                                </td>
                                <td className="p-3.5 font-bold font-mono text-foreground">
                                  ₹{Number(b.grand_total || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5">
                                  <Badge className="text-[9px] capitalize border">
                                    {b.status}
                                  </Badge>
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
                <div className="p-12 text-center text-muted-foreground bg-card border rounded-3xl">
                  Select a vehicle to inspect rental history.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* 2. CUSTOMER RENTAL HISTORY TAB */}
        {/* ============================================================ */}
        <TabsContent value="customer_history" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 4 Cols: Customer Selector */}
            <div className="lg:col-span-4 bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
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
                  placeholder="Filter customers..."
                  className="pl-8.5 h-8.5 text-xs rounded-xl bg-muted/40"
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
                          'p-3 rounded-2xl border text-xs cursor-pointer transition-all duration-150 relative select-none',
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

            {/* Right 8 Cols: Customer Stats & Trips Log */}
            <div className="lg:col-span-8 space-y-6">
              {selectedCustomer ? (
                <>
                  {/* Customer Hero Card */}
                  <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-foreground">
                          {selectedCustomer.profile?.full_name}
                        </h2>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                          ✓ Verified DL
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Phone: {selectedCustomer.profile?.phone || 'N/A'} • Email: {selectedCustomer.profile?.email} • City: {selectedCustomer.city || 'Jaipur'}
                      </p>
                    </div>

                    <Link href={`/admin/assign?customer_id=${selectedCustomer.id}`}>
                      <Button size="sm" className="gradient-brand text-white border-0 text-xs font-bold h-8.5 rounded-xl shadow-xs">
                        Assign New Car
                      </Button>
                    </Link>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Lifetime Rentals</span>
                      <span className="text-xl sm:text-2xl font-black text-foreground">{customerStats.totalTrips} Trips</span>
                    </div>

                    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Amount Spent</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">₹{customerStats.totalSpend.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Customer Previous Rentals Table */}
                  <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-foreground">
                        Customer Rented Vehicles History ({customerBookings.length})
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
                            customerBookings.map((b) => (
                              <tr key={b.id} className="hover:bg-muted/20 transition-colors">
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
                                  <div>{format(new Date(b.pickup_datetime), 'dd MMM yyyy')}</div>
                                  <div>to {format(new Date(b.return_datetime), 'dd MMM yyyy')}</div>
                                </td>
                                <td className="p-3.5 font-mono text-muted-foreground">
                                  <div>Start: {b.pickup_odometer || 0} KM</div>
                                  <div>End: {b.return_odometer || '—'} KM</div>
                                </td>
                                <td className="p-3.5 font-bold font-mono text-foreground">
                                  ₹{Number(b.grand_total || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3.5">
                                  <Badge className="text-[9px] capitalize border">
                                    {b.status}
                                  </Badge>
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
                <div className="p-12 text-center text-muted-foreground bg-card border rounded-3xl">
                  Select a customer to inspect rental history.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
