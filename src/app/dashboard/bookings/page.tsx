import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Calendar,
  Car,
  Clock,
  MapPin,
  FileText,
  CreditCard,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'My Bookings — DriveEase'
}

export default async function CustomerBookingsPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const adminSupabase = createAdminClient()

  let bookings: any[] = []

  if (user) {
    const { data: cust } = await adminSupabase
      .from('customers')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (cust) {
      const { data } = await adminSupabase
        .from('bookings')
        .select(`
          *,
          vehicle:vehicles(brand, model, year, registration_number, images:vehicle_images(url)),
          pickup_branch:branches!pickup_branch_id(name, city),
          return_branch:branches!return_branch_id(name, city)
        `)
        .eq('customer_id', cust.id)
        .order('created_at', { ascending: false })

      bookings = data || []
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            View your upcoming and past self-drive reservations.
          </p>
        </div>
        <Button size="sm" asChild className="gradient-brand text-white border-0 text-xs">
          <Link href="/cars">+ New Reservation</Link>
        </Button>
      </div>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Car className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-foreground">No bookings found</h3>
              <p className="text-xs text-muted-foreground">
                You haven&apos;t reserved any vehicles yet. Explore our fleet to book your first car!
              </p>
            </div>
            <Button asChild className="rounded-xl font-bold text-xs">
              <Link href="/cars">Browse Available Cars</Link>
            </Button>
          </div>
        ) : (
          bookings.map(b => {
            const isUpcoming = ['pending', 'confirmed', 'ready_for_pickup', 'active'].includes(
              b.status
            )

            return (
              <div
                key={b.id}
                className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">
                      #{b.booking_number}
                    </span>
                    <Badge
                      className={`text-[10px] uppercase font-bold capitalize ${
                        b.status === 'confirmed' || b.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : b.status === 'active'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      {b.status.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      Payment: {b.payment_status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Grand Total</span>
                    <span className="text-base font-extrabold font-mono text-foreground">
                      ₹{b.grand_total?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Main Trip Card Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 bg-muted/60 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                      <Car className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">
                        {b.vehicle?.brand} {b.vehicle?.model}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {b.vehicle?.year} • {b.vehicle?.registration_number}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {new Date(b.pickup_datetime).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span>→</span>
                      <span>
                        {new Date(b.return_datetime).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                      <MapPin className="w-3 h-3" />
                      <span>{b.pickup_branch?.city} Branch</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-start md:justify-end gap-2">
                    <Button variant="outline" size="sm" asChild className="text-xs h-8">
                      <Link href={`/admin/invoices`}>
                        <FileText className="w-3.5 h-3.5 mr-1" /> Invoice
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
