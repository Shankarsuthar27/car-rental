import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { Wrench, AlertTriangle, Calendar, Plus, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Fleet Maintenance & Expiry Alerts — DriveEase Admin'
}

async function getMaintenanceData() {
  const supabase = createAdminClient()

  const { data: logs } = await supabase
    .from('vehicle_maintenance')
    .select('*, vehicle:vehicles(brand, model, registration_number)')
    .order('scheduled_date', { ascending: false })

  const { data: vehiclesWithExpiry } = await supabase
    .from('vehicles')
    .select('id, brand, model, registration_number, insurance_expiry, registration_expiry, pollution_cert_expiry')
    .eq('is_active', true)

  return {
    logs: logs || [],
    vehicles: vehiclesWithExpiry || []
  }
}

export default async function AdminMaintenancePage() {
  const { logs, vehicles } = await getMaintenanceData()
  const displayLogs = logs

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Fleet Maintenance & Compliance
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Schedule routine service, track maintenance expenses, and monitor vehicle document expiries.
        </p>
      </div>

      {/* Compliance / Expiry Alert Spotlight */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="font-bold text-sm">Upcoming Document Renewal Reminders (Next 60 Days)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {vehicles.length === 0 ? (
            <div className="col-span-full p-4 bg-background rounded-2xl border border-border text-xs text-muted-foreground text-center">
              No vehicles registered in fleet. Add vehicles to track document expiries.
            </div>
          ) : (
            vehicles.map((v: any) => (
              <div key={v.id} className="p-3 bg-background rounded-2xl border border-border text-xs space-y-0.5">
                <span className="font-bold block">{v.brand} {v.model} ({v.registration_number})</span>
                <span className="text-muted-foreground block">Insurance Expiry</span>
                <span className="text-amber-600 font-bold block">{v.insurance_expiry || 'Not configured'}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Maintenance Logs Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="font-bold text-base">Service & Repair Logs</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">Service Type</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Description</th>
                <th className="p-4">Scheduled Date</th>
                <th className="p-4">Vendor / Workshop</th>
                <th className="p-4">Cost (₹)</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No service or repair logs recorded yet.
                  </td>
                </tr>
              ) : (
                displayLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <Badge className="text-[10px] uppercase font-bold capitalize bg-primary/10 text-primary border-primary/20">
                        {log.maintenance_type.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-foreground block">
                        {log.vehicle?.brand} {log.vehicle?.model}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {log.vehicle?.registration_number}
                      </span>
                    </td>

                    <td className="p-4 text-muted-foreground font-medium max-w-xs truncate">
                      {log.description}
                    </td>

                    <td className="p-4 text-muted-foreground">
                      {log.scheduled_date}
                    </td>

                    <td className="p-4 text-muted-foreground">
                      {log.vendor_name || 'Authorized Service'}
                    </td>

                    <td className="p-4 font-bold text-foreground">
                      ₹{Number(log.cost || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="p-4">
                      <Badge
                        className={`text-[10px] uppercase font-bold ${
                          log.is_completed
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}
                      >
                        {log.is_completed ? 'Completed' : 'Scheduled'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
