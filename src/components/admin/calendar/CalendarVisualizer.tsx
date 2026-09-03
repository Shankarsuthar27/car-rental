'use client'

import { useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Car,
  Clock,
  User,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CalendarVisualizerProps {
  vehicles: any[]
  bookings: any[]
}

export function CalendarVisualizer({
  vehicles,
  bookings
}: CalendarVisualizerProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Generate 7 days view from current date
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + i)
    return d
  })

  const handlePrev = () => {
    const next = new Date(currentDate)
    next.setDate(next.getDate() - 7)
    setCurrentDate(next)
  }

  const handleNext = () => {
    const next = new Date(currentDate)
    next.setDate(next.getDate() + 7)
    setCurrentDate(next)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Fleet Schedule Calendar
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visualize vehicle occupancy, active trips, and upcoming pickup slots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev} className="h-9">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="text-xs h-9 font-semibold"
          >
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext} className="h-9">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Gantt Timeline Board */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="p-3 sm:p-4 w-36 sm:w-56 sticky left-0 bg-card border-r border-border z-20 font-bold uppercase text-[10px] text-muted-foreground tracking-wider shadow-xs">
                  Vehicle ({vehicles.length})
                </th>
                {days.map((day, idx) => {
                  const isToday =
                    day.toISOString().split('T')[0] ===
                    new Date().toISOString().split('T')[0]
                  return (
                    <th
                      key={idx}
                      className={`p-3 text-center border-l border-border min-w-[95px] sm:min-w-[120px] ${
                        isToday ? 'bg-primary/5 text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <span className="block text-[10px] uppercase font-semibold">
                        {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-foreground">
                        {day.getDate()} {day.toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vehicles.map(v => {
                const vehicleBookings = bookings.filter(b => b.vehicle_id === v.id)

                return (
                  <tr key={v.id} className="hover:bg-muted/10 transition-colors">
                    {/* Sticky Vehicle Title */}
                    <td className="p-3 sm:p-4 sticky left-0 bg-card border-r border-border z-10 shadow-xs">
                      <div className="font-bold text-xs text-foreground truncate max-w-[130px] sm:max-w-none">
                        {v.brand} {v.model}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {v.registration_number}
                      </div>
                    </td>

                    {/* Day Slots */}
                    {days.map((day, dIdx) => {
                      const dayStr = day.toISOString().split('T')[0]
                      // Check if any booking overlaps this day
                      const activeBooking = vehicleBookings.find(b => {
                        const start = b.pickup_datetime.split('T')[0]
                        const end = b.return_datetime.split('T')[0]
                        return dayStr >= start && dayStr <= end
                      })

                      return (
                        <td
                          key={dIdx}
                          className="p-2 border-l border-border text-center align-middle h-16"
                        >
                          {activeBooking ? (
                            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-left space-y-0.5 shadow-sm">
                              <span className="font-bold text-[10px] block truncate">
                                {(activeBooking.customer as any)?.profile?.full_name || (activeBooking.customer as any)?.emergency_contact_name || (activeBooking.customer as any)?.customer_code || 'Booked'}
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground block truncate">
                                #{activeBooking.booking_number}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-600/70 font-semibold">
                              Available
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
