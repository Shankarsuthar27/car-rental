import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { AlertTriangle, Plus, ShieldCheck, DollarSign, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Damage Reports & Deposit Deductions — DriveEase Admin'
}

async function getDamageData() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('vehicle_damage')
    .select(`
      *,
      vehicle:vehicles(brand, model, registration_number),
      customer:customers(profile:profiles!customers_profile_id_fkey(full_name))
    `)
    .order('created_at', { ascending: false })

  return data || []
}

export default async function AdminDamagePage() {
  const damages = await getDamageData()

  // Demo fallback
  const displayDamages = damages.length > 0 ? damages : [
    {
      id: 'dmg-1',
      damage_type: 'Rear Bumper Scratch',
      description: 'Minor 4-inch scratch on rear right bumper.',
      location_on_vehicle: 'Rear Bumper',
      estimated_cost: 1500,
      deducted_from_deposit: 1500,
      status: 'charged',
      created_at: '2026-08-16T12:00:00Z',
      vehicle: { brand: 'Maruti Suzuki', model: 'Baleno', registration_number: 'RJ14-BL-2024' },
      customer: { profile: { full_name: 'Anjali Mehta' } }
    }
  ]

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Damage Management & Claims ({displayDamages.length})
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Record scratches, body dents, repair cost estimations, and security deposit deductions.
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">Damage Description</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Estimated Repair</th>
                <th className="p-4">Deposit Deducted</th>
                <th className="p-4">Claim Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayDamages.map((d: any) => (
                <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-foreground block">{d.damage_type}</span>
                    <span className="text-[11px] text-muted-foreground">{d.description}</span>
                  </td>

                  <td className="p-4">
                    <span className="font-bold text-foreground block">
                      {d.vehicle?.brand} {d.vehicle?.model}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {d.vehicle?.registration_number}
                    </span>
                  </td>

                  <td className="p-4 font-medium text-foreground">
                    {d.customer?.profile?.full_name || d.customer?.emergency_contact_name || d.customer?.customer_code || 'Valued Customer'}
                  </td>

                  <td className="p-4 font-bold text-foreground">
                    ₹{Number(d.estimated_cost || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="p-4 font-bold text-rose-600">
                    ₹{Number(d.deducted_from_deposit || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="p-4">
                    <Badge
                      className={`text-[10px] uppercase font-bold capitalize ${
                        d.status === 'charged'
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      }`}
                    >
                      {d.status}
                    </Badge>
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
