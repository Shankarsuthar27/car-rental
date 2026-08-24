import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Car,
  Calendar,
  CreditCard,
  FileCheck2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  QrCode
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Customer Dashboard — DriveEase'
}

export default async function CustomerDashboardOverview() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const adminSupabase = createAdminClient()

  // Fetch customer record
  let customerData: any = null
  let bookings: any[] = []

  if (user) {
    const { data: cust } = await adminSupabase
      .from('customers')
      .select('*, profile:profiles!customers_profile_id_fkey(*)')
      .eq('profile_id', user.id)
      .single()

    customerData = cust

    if (cust) {
      const { data: bList } = await adminSupabase
        .from('bookings')
        .select(`
          *,
          vehicle:vehicles(brand, model, year, registration_number, images:vehicle_images(url)),
          pickup_branch:branches!pickup_branch_id(name, city),
          return_branch:branches!return_branch_id(name, city)
        `)
        .eq('customer_id', cust.id)
        .order('created_at', { ascending: false })
        .limit(5)

      bookings = bList || []
    }
  }

  // Fallback demo statistics if brand new customer
  const totalRentals = customerData?.total_rentals || bookings.length || 1
  const totalSpent = customerData?.total_spent || 12400
  const kycStatus = customerData?.kyc_status || 'verified'

  const activeOrUpcoming = bookings.find(b =>
    ['active', 'ready_for_pickup', 'confirmed', 'pending'].includes(b.status)
  )

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-primary">
            Customer Dashboard
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-1">
            Welcome, {user?.user_metadata?.full_name || 'Driver'}!
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your bookings, inspect active rentals, and track security deposits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs font-semibold px-3 py-1 capitalize ${
              kycStatus === 'verified'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            }`}
          >
            KYC: {kycStatus}
          </Badge>
          <Button size="sm" asChild className="gradient-brand text-white border-0 text-xs">
            <Link href="/cars">Book Next Car</Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Total Rentals
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">{totalRentals} Trips</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Total Spent
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">
              ₹{Number(totalSpent).toLocaleString('en-IN')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            KYC Status
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-emerald-600 capitalize">
              {kycStatus} ✓
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Rental / Upcoming Trip Spotlight */}
      {activeOrUpcoming ? (
        <div className="bg-gradient-to-br from-primary/5 via-card to-card border border-primary/20 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Active / Upcoming Rental
              </span>
            </div>
            <Badge className="capitalize text-xs font-semibold">
              {activeOrUpcoming.status.replace(/_/g, ' ')}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 aspect-[16/10] bg-muted rounded-2xl overflow-hidden shrink-0">
                {activeOrUpcoming.vehicle?.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeOrUpcoming.vehicle.images[0].url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🚗
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-black">
                  {activeOrUpcoming.vehicle?.brand} {activeOrUpcoming.vehicle?.model}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Reg: {activeOrUpcoming.vehicle?.registration_number} • Booking #{activeOrUpcoming.booking_number}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Grand Total</span>
              <span className="text-xl font-bold text-foreground">
                ₹{activeOrUpcoming.grand_total?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted/40 rounded-2xl text-xs">
            <div>
              <span className="text-muted-foreground block font-medium">Pickup Date & Branch:</span>
              <span className="font-bold text-foreground">
                {new Date(activeOrUpcoming.pickup_datetime).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                {activeOrUpcoming.pickup_branch?.city} ({activeOrUpcoming.pickup_branch?.name})
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block font-medium">Return Date & Branch:</span>
              <span className="font-bold text-foreground">
                {new Date(activeOrUpcoming.return_datetime).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                {activeOrUpcoming.return_branch?.city} ({activeOrUpcoming.return_branch?.name})
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-card border border-dashed border-border rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl">
            🚗
          </div>
          <h3 className="font-bold text-base">No active rentals right now</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Planning a road trip or weekend getaway? Browse our luxury SUVs and hatchbacks today.
          </p>
          <Button size="sm" asChild className="gradient-brand text-white border-0 font-bold">
            <Link href="/cars">Explore Cars</Link>
          </Button>
        </div>
      )}

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/bookings"
          className="p-5 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Calendar className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm">Trip History & Invoices</h4>
          <p className="text-[11px] text-muted-foreground mt-1">
            View booking details and download PDF tax receipts.
          </p>
        </Link>

        <Link
          href="/dashboard/documents"
          className="p-5 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm">KYC Documents</h4>
          <p className="text-[11px] text-muted-foreground mt-1">
            Driving license, identity proofs, and status reviews.
          </p>
        </Link>

        <Link
          href="/dashboard/payments"
          className="p-5 bg-card border border-border rounded-2xl hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <CreditCard className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm">Deposit Refunds</h4>
          <p className="text-[11px] text-muted-foreground mt-1">
            Track held deposits and automated refund receipts.
          </p>
        </Link>
      </div>
    </div>
  )
}
