'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import type { BookingStatus, PaymentStatus } from '@/types'
import { cn } from '@/lib/utils'

const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  kyc_pending: 'status-pending',
  payment_pending: 'status-pending',
  ready_for_pickup: 'status-reserved',
  active: 'status-active',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
  rejected: 'status-rejected',
  no_show: 'status-inactive',
}

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: 'status-pending',
  partially_paid: 'status-partial',
  paid: 'status-paid',
  failed: 'status-failed',
  refunded: 'status-inactive',
  partially_refunded: 'status-partial',
}

interface Booking {
  id: string
  booking_number: string
  status: BookingStatus
  payment_status: PaymentStatus
  grand_total: number
  pickup_datetime: string
  customer: { profile: { full_name: string; email: string } } | null
  vehicle: { brand: string; model: string; registration_number: string } | null
}

interface RecentBookingsProps {
  bookings: Booking[]
}

export function RecentBookings({ bookings }: RecentBookingsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/bookings" className="gap-1 text-xs">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No bookings yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Booking
                  </th>
                  <th className="text-left p-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="text-left p-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Vehicle
                  </th>
                  <th className="text-left p-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Pickup
                  </th>
                  <th className="text-left p-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="text-left p-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="p-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-primary">
                        {booking.booking_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">
                        {booking.customer?.profile?.full_name ?? (booking.customer as any)?.emergency_contact_name ?? 'Valued Customer'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {booking.vehicle
                        ? `${booking.vehicle.brand} ${booking.vehicle.model}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(new Date(booking.pickup_datetime), 'dd MMM, HH:mm')}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      ₹{booking.grand_total.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0 h-5 border-0',
                            BOOKING_STATUS_STYLES[booking.status]
                          )}
                        >
                          {booking.status.replace(/_/g, ' ')}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0 h-5 border-0',
                            PAYMENT_STATUS_STYLES[booking.payment_status]
                          )}
                        >
                          {booking.payment_status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                        <Link href={`/admin/bookings/${booking.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
