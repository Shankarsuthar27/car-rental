import { createAdminClient } from '@/lib/supabase/admin'
import type { AuditLog } from '@/types'

interface LogInput {
  userId?: string
  userEmail?: string
  action: string
  module: string
  recordId?: string
  recordType?: string
  previousValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export class AuditService {
  static async log(input: LogInput): Promise<void> {
    try {
      const supabase = createAdminClient()
      await supabase.from('audit_logs').insert({
        user_id: input.userId,
        user_email: input.userEmail,
        action: input.action,
        module: input.module,
        record_id: input.recordId,
        record_type: input.recordType,
        previous_value: input.previousValue,
        new_value: input.newValue,
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
      })
    } catch {
      // Audit logging should never crash the application
      console.error('[AuditService] Failed to log:', input.action)
    }
  }

  static async getLogs(
    filters: {
      module?: string
      action?: string
      userId?: string
      dateFrom?: string
      dateTo?: string
    } = {},
    page = 1,
    limit = 50
  ): Promise<{ data: AuditLog[]; total: number }> {
    const supabase = createAdminClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('audit_logs')
      .select('*, user:profiles(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filters.module) query = query.eq('module', filters.module)
    if (filters.action) query = query.eq('action', filters.action)
    if (filters.userId) query = query.eq('user_id', filters.userId)
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo)

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return {
      data: (data ?? []) as unknown as AuditLog[],
      total: count ?? 0,
    }
  }
}
