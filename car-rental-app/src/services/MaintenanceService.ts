import { createAdminClient } from '@/lib/supabase/admin'
import type { VehicleMaintenance, MaintenanceType } from '@/types'
import { AuditService } from './AuditService'
import { NotificationService } from './NotificationService'

export class MaintenanceService {
  private static getClient() {
    return createAdminClient()
  }

  static async createRecord(
    data: Omit<VehicleMaintenance, 'id' | 'created_at' | 'updated_at'>,
    actorProfileId?: string
  ): Promise<VehicleMaintenance> {
    const supabase = this.getClient()

    const { data: record, error } = await supabase
      .from('vehicle_maintenance')
      .insert({
        vehicle_id: data.vehicle_id,
        maintenance_type: data.maintenance_type,
        description: data.description,
        scheduled_date: data.scheduled_date,
        completed_date: data.completed_date,
        cost: data.cost,
        odometer_at_service: data.odometer_at_service,
        next_service_date: data.next_service_date,
        next_service_odometer: data.next_service_odometer,
        vendor_name: data.vendor_name,
        vendor_phone: data.vendor_phone,
        invoice_url: data.invoice_url,
        notes: data.notes,
        is_completed: data.is_completed ?? false,
        created_by: actorProfileId,
      })
      .select()
      .single()

    if (error) throw error

    // If maintenance started — set vehicle status to maintenance
    if (!data.is_completed) {
      await supabase
        .from('vehicles')
        .update({ status: 'maintenance', updated_at: new Date().toISOString() })
        .eq('id', data.vehicle_id)
    }

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'maintenance_created',
        module: 'maintenance',
        recordId: record.id,
        newValue: { vehicleId: data.vehicle_id, type: data.maintenance_type },
      })
    }

    return record as unknown as VehicleMaintenance
  }

  static async completeRecord(
    id: string,
    completedDate: string,
    cost: number,
    nextServiceDate?: string,
    actorProfileId?: string
  ): Promise<void> {
    const supabase = this.getClient()

    const { data: record } = await supabase
      .from('vehicle_maintenance')
      .select('vehicle_id')
      .eq('id', id)
      .single()

    await supabase
      .from('vehicle_maintenance')
      .update({
        is_completed: true,
        completed_date: completedDate,
        cost,
        next_service_date: nextServiceDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    // Restore vehicle to available
    if (record?.vehicle_id) {
      await supabase
        .from('vehicles')
        .update({ status: 'available', updated_at: new Date().toISOString() })
        .eq('id', record.vehicle_id)
    }

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'maintenance_completed',
        module: 'maintenance',
        recordId: id,
        newValue: { completedDate, cost },
      })
    }
  }

  static async getVehicleMaintenance(vehicleId: string): Promise<VehicleMaintenance[]> {
    const supabase = this.getClient()
    const { data } = await supabase
      .from('vehicle_maintenance')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('scheduled_date', { ascending: false })

    return (data ?? []) as unknown as VehicleMaintenance[]
  }

  static async getUpcomingMaintenance(daysAhead = 30): Promise<VehicleMaintenance[]> {
    const supabase = this.getClient()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const { data } = await supabase
      .from('vehicle_maintenance')
      .select('*, vehicle:vehicles(brand, model, registration_number, branch:branches(name))')
      .eq('is_completed', false)
      .lte('scheduled_date', futureDate.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })

    return (data ?? []) as unknown as VehicleMaintenance[]
  }

  static async getAll(
    vehicleId?: string,
    page = 1,
    limit = 20
  ): Promise<{ data: VehicleMaintenance[]; total: number }> {
    const supabase = this.getClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('vehicle_maintenance')
      .select(
        `*, vehicle:vehicles(brand, model, registration_number, branch:branches(name))`,
        { count: 'exact' }
      )
      .order('scheduled_date', { ascending: false })

    if (vehicleId) query = query.eq('vehicle_id', vehicleId)
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return { data: (data ?? []) as unknown as VehicleMaintenance[], total: count ?? 0 }
  }
}
