'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
interface ActivityBooking { 
  id: string
  booking_number: string
  pickup_datetime?: string
  return_datetime?: string
  status: string
  customer: { profile: { full_name: string; phone: string } } | null
  vehicle: { brand: string; model: string; registration_number: string } | null
}

interface TodayActivityProps {
  pickups: ActivityBooking[]
  returns: ActivityBooking[]
}

function ActivityRow({ booking, type }: { booking: ActivityBooking; type: 'pickup' | 'return' }) {
  const datetime = type === 'pickup' ? booking.pickup_datetime : booking.return_datetime
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            type === 'pickup'
              ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400'
              : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
          }`}
        >
          {type === 'pickup' ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownLeft className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate flex items-center gap-1.5">
            <span className="font-semibold text-foreground truncate">
              {booking.customer?.profile?.full_name ?? (booking.customer as any)?.emergency_contact_name ?? 'Customer'}
            </span>
            {booking.customer?.profile?.phone && (
              <span className="text-[11px] font-normal text-muted-foreground shrink-0">
                • {booking.customer.profile.phone}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {booking.vehicle?.brand} {booking.vehicle?.model} •{' '}
            {booking.vehicle?.registration_number}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground">
          {datetime ? format(new Date(datetime), 'HH:mm') : '—'}
        </span>
        <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
          <Link href={`/admin/bookings/${booking.id}`}>View</Link>
        </Button>
      </div>
    </div>
  )
}

export function TodayActivity({ pickups, returns }: TodayActivityProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Today's Activity</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <ArrowUpRight className="w-3 h-3 text-green-500" />
              {pickups.length} Pickups
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <ArrowDownLeft className="w-3 h-3 text-blue-500" />
              {returns.length} Returns
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pickups">
          <TabsList className="mb-3 h-8">
            <TabsTrigger value="pickups" className="text-xs h-7">
              Pickups ({pickups.length})
            </TabsTrigger>
            <TabsTrigger value="returns" className="text-xs h-7">
              Returns ({returns.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pickups">
            {pickups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No pickups scheduled today
              </p>
            ) : (
              pickups.map((b) => <ActivityRow key={b.id} booking={b} type="pickup" />)
            )}
          </TabsContent>
          <TabsContent value="returns">
            {returns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No returns scheduled today
              </p>
            ) : (
              returns.map((b) => <ActivityRow key={b.id} booking={b} type="return" />)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
