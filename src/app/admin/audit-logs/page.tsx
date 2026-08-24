import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { ScrollText, ShieldAlert, User, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Audit Logs & Security Trail — DriveEase Admin'
}

async function getAuditLogs() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('audit_logs')
    .select('*, user:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50)
  return data || []
}

export default async function AdminAuditLogsPage() {
  const logs = await getAuditLogs()

  // Demo fallback
  const displayLogs = logs.length > 0 ? logs : [
    {
      id: 'log-1',
      action: 'vehicle_status_changed',
      module: 'vehicles',
      user_email: 'admin@driveease.in',
      created_at: '2026-08-20T12:15:00Z',
      new_value: { status: 'rented', vehicle: 'Hyundai Creta (RJ14-CR-2024)' }
    },
    {
      id: 'log-2',
      action: 'payment_verified',
      module: 'payments',
      user_email: 'system_webhook',
      created_at: '2026-08-20T11:24:00Z',
      new_value: { amount: 1767, order_id: 'order_mock_1724141040' }
    },
    {
      id: 'log-3',
      action: 'kyc_verified',
      module: 'customers',
      user_email: 'admin@driveease.in',
      created_at: '2026-08-20T10:05:00Z',
      new_value: { customer: 'Rahul Sharma', status: 'verified' }
    }
  ]

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          System Audit Trail & Security Logs
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Immutable tracking of administrator operations, pricing modifications, KYC approvals, and financial adjustments.
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">Module</th>
                <th className="p-4">Triggered By</th>
                <th className="p-4">Payload / Details</th>
                <th className="p-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">
                    {log.action}
                  </td>

                  <td className="p-4">
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {log.module}
                    </Badge>
                  </td>

                  <td className="p-4 text-muted-foreground font-medium">
                    {log.user?.full_name || log.user_email || 'System'}
                  </td>

                  <td className="p-4 font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                    {JSON.stringify(log.new_value || {})}
                  </td>

                  <td className="p-4 text-right text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
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
