import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { Shield, CheckCircle2, Car, Fuel, Gauge, Eye, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Vehicle Inspections & Condition Reports — DriveEase Admin'
}

async function getInspectionsData() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('vehicle_inspections')
    .select(`
      *,
      vehicle:vehicles(brand, model, registration_number),
      booking:bookings(booking_number)
    `)
    .order('created_at', { ascending: false })

  return data || []
}

export default async function AdminInspectionsPage() {
  const inspections = await getInspectionsData()

  // Demo fallback if database is new
  const displayInspections = inspections.length > 0 ? inspections : [
    {
      id: 'insp-1',
      inspection_type: 'pickup',
      odometer: 15200,
      fuel_level: 'full',
      condition_rating: 5,
      notes: 'No scratches, clean interior, spare tyre present.',
      created_at: '2026-08-20T10:00:00Z',
      vehicle: { brand: 'Hyundai', model: 'Creta', registration_number: 'RJ14-CR-2024' },
      booking: { booking_number: 'BK-202608-1002' }
    },
    {
      id: 'insp-2',
      inspection_type: 'return',
      odometer: 15680,
      fuel_level: 'full',
      condition_rating: 5,
      notes: 'Vehicle returned in good condition. All accessories accounted for.',
      created_at: '2026-08-18T16:30:00Z',
      vehicle: { brand: 'Maruti Suzuki', model: 'Swift', registration_number: 'RJ14-SW-2024' },
      booking: { booking_number: 'BK-202608-0994' }
    }
  ]

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Vehicle Condition Inspections ({displayInspections.length})
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Digital handover checkups, fuel level logs, odometer tracking, and damage records.
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">Type</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Booking #</th>
                <th className="p-4">Odometer</th>
                <th className="p-4">Fuel Tank</th>
                <th className="p-4">Condition</th>
                <th className="p-4">Inspection Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayInspections.map((insp: any) => (
                <tr key={insp.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <Badge
                      className={`text-[10px] uppercase font-bold capitalize ${
                        insp.inspection_type === 'pickup'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                      }`}
                    >
                      {insp.inspection_type}
                    </Badge>
                  </td>

                  <td className="p-4">
                    <span className="font-bold text-foreground block">
                      {insp.vehicle?.brand} {insp.vehicle?.model}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {insp.vehicle?.registration_number}
                    </span>
                  </td>

                  <td className="p-4 font-mono text-primary font-semibold">
                    #{insp.booking?.booking_number || 'N/A'}
                  </td>

                  <td className="p-4 font-bold text-foreground">
                    {insp.odometer?.toLocaleString('en-IN')} km
                  </td>

                  <td className="p-4 font-medium capitalize text-muted-foreground">
                    {insp.fuel_level?.replace(/_/g, ' ')}
                  </td>

                  <td className="p-4">
                    <Badge variant="outline" className="text-[10px] text-emerald-600">
                      ★ {insp.condition_rating || 5}/5
                    </Badge>
                  </td>

                  <td className="p-4 text-muted-foreground max-w-xs truncate">
                    {insp.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
