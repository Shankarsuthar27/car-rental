'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Car,
  CheckCircle2,
  Key,
  Clock,
  ArrowRight,
  AlertTriangle,
  Zap,
  RotateCcw,
  Eye,
  Phone,
  User,
  Fuel,
  Gauge
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, differenceInMinutes, differenceInHours, isPast } from 'date-fns'
import type { Booking, Vehicle } from '@/types'
import { formatCustomer } from '@/lib/customers'
import { cn } from '@/lib/utils'

interface DashboardTablesProps {
  recentAssignments: any[]
  availableVehicles: Vehicle[]
  runningVehicles: any[]
  onOpenReturnModal?: (booking: any) => void
}

export function DashboardTables({
  recentAssignments,
  availableVehicles,
  runningVehicles,
  onOpenReturnModal,
}: DashboardTablesProps) {
  const [activeTab, setActiveTab] = useState<'assignments' | 'available' | 'running'>('assignments')

  // Calculate overdue message for active rentals
  const getOverdueInfo = (returnDatetimeStr: string) => {
    const returnTime = new Date(returnDatetimeStr)
    const now = new Date()

    if (isPast(returnTime)) {
      const diffMins = differenceInMinutes(now, returnTime)
      const diffHours = differenceInHours(now, returnTime)

      if (diffHours >= 1) {
        return {
          isOverdue: true,
          label: `🔴 Overdue by ${diffHours}h ${diffMins % 60}m`,
          badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400 font-bold',
        }
      }
      return {
        isOverdue: true,
        label: `🔴 Overdue by ${diffMins}m`,
        badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400 font-bold',
      }
    }

    const minsLeft = differenceInMinutes(returnTime, now)
    const hoursLeft = differenceInHours(returnTime, now)

    if (hoursLeft <= 3) {
      return {
        isOverdue: false,
        label: `⏳ Due in ${hoursLeft}h ${minsLeft % 60}m`,
        badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400 font-medium',
      }
    }

    return {
      isOverdue: false,
      label: `On Time (Due in ${hoursLeft}h)`,
      badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
    }
  }

  return (
    <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm space-y-0">
      <Tabs defaultValue="assignments" onValueChange={(val) => setActiveTab(val as any)}>
        {/* Table Navigation Header */}
        <div className="p-4 sm:p-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          <div>
            <h3 className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Fleet Operations & Live Activity
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quickly monitor assignments, available cars ready to dispatch, and running vehicles.
            </p>
          </div>

          <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
            <TabsList className="bg-muted/60 p-1 rounded-2xl h-auto min-h-10 border border-border/60 flex w-max sm:w-auto">
              <TabsTrigger value="assignments" className="text-xs rounded-xl font-bold gap-1.5 shrink-0">
                Recent Assignments ({recentAssignments.length})
              </TabsTrigger>
              <TabsTrigger value="available" className="text-xs rounded-xl font-bold gap-1.5 text-emerald-600 dark:text-emerald-400 shrink-0">
                🟢 Available Cars ({availableVehicles.length})
              </TabsTrigger>
              <TabsTrigger value="running" className="text-xs rounded-xl font-bold gap-1.5 text-blue-600 dark:text-blue-400 shrink-0">
                🔵 Running Cars ({runningVehicles.length})
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* 1. RECENT ASSIGNMENTS TABLE */}
        <TabsContent value="assignments" className="m-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Rental ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Car Details</th>
                  <th className="p-4">Rental Period</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No car assignments recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentAssignments.map((b) => {
                    const cust = b.customer ? formatCustomer(b.customer) : null
                    const customerName = cust?.profile?.full_name || b.customer?.emergency_contact_name || b.customer?.customer_code || 'Valued Customer'
                    const customerPhone = cust?.profile?.phone || b.customer?.emergency_contact_phone || '—'
                    const initials = customerName
                      .split(' ')
                      .map((p: string) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'C'
                    const vehicleName = b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Vehicle Unassigned'
                    const regNumber = b.vehicle?.registration_number || '—'

                    return (
                      <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-primary block">
                            {b.booking_number || `#${b.id.slice(0, 8)}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {format(new Date(b.created_at), 'dd MMM yyyy')}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg gradient-brand text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-foreground block truncate">{customerName}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-primary shrink-0" /> {customerPhone}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div>
                            <span className="font-bold text-foreground block">{vehicleName}</span>
                            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {regNumber}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-[11px] text-muted-foreground">
                          <div>
                            <span className="text-foreground font-medium">Start:</span>{' '}
                            {format(new Date(b.pickup_datetime), 'dd MMM, hh:mm a')}
                          </div>
                          <div>
                            <span className="text-foreground font-medium">Return:</span>{' '}
                            {format(new Date(b.return_datetime), 'dd MMM, hh:mm a')}
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-black text-foreground text-sm block">
                            ₹{Number(b.grand_total || 0).toLocaleString('en-IN')}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[9px] px-1 py-0 h-4 border-0 uppercase font-bold',
                              b.payment_status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-amber-500/10 text-amber-600'
                            )}
                          >
                            {b.payment_status}
                          </Badge>
                        </td>

                        <td className="p-4">
                          <Badge
                            className={cn(
                              'text-[10px] font-bold capitalize border',
                              b.status === 'active' && 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                              b.status === 'completed' && 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30',
                              b.status === 'confirmed' && 'bg-purple-500/10 text-purple-600 border-purple-500/30',
                              b.status === 'cancelled' && 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                            )}
                          >
                            {b.status}
                          </Badge>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/bookings`}>
                              <Button size="sm" variant="ghost" className="h-7 text-xs px-2 gap-1">
                                <Eye className="w-3.5 h-3.5" /> View
                              </Button>
                            </Link>
                            {b.status === 'active' && (
                              <Link href={`/admin/bookings?return_booking=${b.id}`}>
                                <Button size="sm" variant="outline" className="h-7 text-xs px-2 gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10">
                                  <RotateCcw className="w-3.5 h-3.5" /> Return
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* 2. AVAILABLE CARS TABLE */}
        <TabsContent value="available" className="m-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Car Details</th>
                  <th className="p-4">Registration</th>
                  <th className="p-4">Specs & Fuel</th>
                  <th className="p-4">Rental Rates</th>
                  <th className="p-4">Current Odometer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Instant Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {availableVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No vehicles are currently available. All cars are running or under maintenance.
                    </td>
                  </tr>
                ) : (
                  availableVehicles.map((car) => {
                    const primaryImg =
                      (car as any).images?.find((img: any) => img.is_primary)?.url ||
                      (car as any).images?.[0]?.url ||
                      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'

                    return (
                      <tr key={car.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={primaryImg}
                              alt={`${car.brand} ${car.model}`}
                              className="w-12 h-8 rounded-lg object-cover border border-border shrink-0 shadow-xs"
                            />
                            <div>
                              <span className="font-bold text-sm text-foreground block">
                                {car.brand} {car.model}
                              </span>
                              <span className="text-[10px] text-muted-foreground block">
                                {car.variant || 'Standard'} • {car.year}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted/80 text-foreground border border-border">
                            {car.registration_number}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="space-y-0.5 text-muted-foreground">
                            <span className="capitalize block text-foreground font-semibold">
                              {car.vehicle_type} • {car.transmission}
                            </span>
                            <span className="capitalize text-[10px] block">
                              {car.fuel_type} • {car.seating_capacity} Seats
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div>
                            <span className="font-black text-foreground block text-sm">
                              ₹{car.daily_rate}/day
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              ₹{car.hourly_rate}/hr • Dep: ₹{car.security_deposit}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 font-mono font-semibold text-foreground">
                          {car.current_odometer?.toLocaleString('en-IN') || 0} KM
                        </td>

                        <td className="p-4">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                            🟢 Available
                          </Badge>
                        </td>

                        <td className="p-4 text-right">
                          <Link href={`/admin/assign?vehicle_id=${car.id}`}>
                            <Button size="sm" className="gradient-brand text-white border-0 hover:opacity-90 font-bold text-xs h-8 gap-1.5 shadow-sm">
                              <Zap className="w-3.5 h-3.5 fill-current" /> Assign Now
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* 3. RUNNING CARS TABLE */}
        <TabsContent value="running" className="m-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Assigned Car</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Rental Start</th>
                  <th className="p-4">Expected Return</th>
                  <th className="p-4">Overdue / Return Status</th>
                  <th className="p-4">Starting KM</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runningVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No vehicles are currently running on active rentals.
                    </td>
                  </tr>
                ) : (
                  runningVehicles.map((b) => {
                    const car = b.vehicle
                    const cust = b.customer ? formatCustomer(b.customer) : null
                    const customerName = cust?.profile?.full_name || b.customer?.emergency_contact_name || b.customer?.customer_code || 'Valued Customer'
                    const customerPhone = cust?.profile?.phone || b.customer?.emergency_contact_phone || '—'
                    const initials = customerName
                      .split(' ')
                      .map((p: string) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'C'
                    const overdue = getOverdueInfo(b.return_datetime)

                    return (
                      <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div>
                            <span className="font-bold text-sm text-foreground block">
                              {car ? `${car.brand} ${car.model}` : 'Vehicle'}
                            </span>
                            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {car?.registration_number || '—'}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg gradient-brand text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-foreground block truncate">{customerName}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-primary shrink-0" /> {customerPhone}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-muted-foreground font-medium">
                          {format(new Date(b.pickup_datetime), 'dd MMM yyyy, hh:mm a')}
                        </td>

                        <td className="p-4 text-muted-foreground font-medium">
                          {format(new Date(b.return_datetime), 'dd MMM yyyy, hh:mm a')}
                        </td>

                        <td className="p-4">
                          <Badge className={cn('text-[10px] border', overdue.badgeClass)}>
                            {overdue.label}
                          </Badge>
                        </td>

                        <td className="p-4 font-mono font-semibold text-foreground">
                          {b.pickup_odometer || car?.current_odometer || 0} KM
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/bookings?return_booking=${b.id}`}>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Return Car
                              </Button>
                            </Link>
                            <Link href={`/admin/bookings`}>
                              <Button size="sm" variant="ghost" className="h-8 text-xs px-2">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
