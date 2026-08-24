import { createAdminClient } from '@/lib/supabase/admin'
import type { VehicleDamage, DamageStatus } from '@/types'
import { AuditService } from './AuditService'

export class DamageService {
  private static getClient() {
    return createAdminClient()
  }

  static async reportDamage(
    data: {
      vehicleId: string
      bookingId?: string
      customerId?: string
      inspectionId?: string
      damageType: string
      description: string
      locationOnVehicle?: string
      isCustomerResponsible?: boolean
      estimatedCost?: number
      notes?: string
    },
    actorProfileId?: string
  ): Promise<VehicleDamage> {
    const supabase = this.getClient()

    const { data: damage, error } = await supabase
      .from('vehicle_damage')
      .insert({
        vehicle_id: data.vehicleId,
        booking_id: data.bookingId,
        customer_id: data.customerId,
        inspection_id: data.inspectionId,
        damage_type: data.damageType,
        description: data.description,
        location_on_vehicle: data.locationOnVehicle,
        is_customer_responsible: data.isCustomerResponsible ?? true,
        estimated_cost: data.estimatedCost,
        notes: data.notes,
        status: 'reported' as DamageStatus,
      })
      .select()
      .single()

    if (error) throw error

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'damage_reported',
        module: 'damage',
        recordId: damage.id,
        newValue: { vehicleId: data.vehicleId, damageType: data.damageType },
      })
    }

    return damage as unknown as VehicleDamage
  }

  static async addPhoto(damageId: string, url: string, description?: string): Promise<void> {
    const supabase = this.getClient()
    await supabase.from('damage_photos').insert({ damage_id: damageId, url, description })
  }

  static async updateStatus(
    damageId: string,
    status: DamageStatus,
    finalCost?: number,
    actorProfileId?: string
  ): Promise<void> {
    const supabase = this.getClient()

    await supabase
      .from('vehicle_damage')
      .update({
        status,
        final_cost: finalCost,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', damageId)

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'damage_status_changed',
        module: 'damage',
        recordId: damageId,
        newValue: { status, finalCost },
      })
    }
  }

  /**
   * Deduct damage cost from security deposit
   */
  static async deductFromDeposit(
    damageId: string,
    bookingId: string,
    deductionAmount: number,
    actorProfileId?: string
  ): Promise<void> {
    const supabase = this.getClient()

    // Update damage record
    await supabase
      .from('vehicle_damage')
      .update({
        deducted_from_deposit: deductionAmount,
        status: 'charged' as DamageStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', damageId)

    // Update security deposit
    const { data: deposit } = await supabase
      .from('security_deposits')
      .select('damage_deduction, collected_amount')
      .eq('booking_id', bookingId)
      .single()

    if (deposit) {
      const newDeduction = (deposit.damage_deduction ?? 0) + deductionAmount
      const refundAmount = Math.max(0, deposit.collected_amount - newDeduction)

      await supabase
        .from('security_deposits')
        .update({
          damage_deduction: newDeduction,
          refund_amount: refundAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', bookingId)
    }

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'damage_deducted_from_deposit',
        module: 'damage',
        recordId: damageId,
        newValue: { deductionAmount, bookingId },
      })
    }
  }

  static async getVehicleDamage(vehicleId: string): Promise<VehicleDamage[]> {
    const supabase = this.getClient()
    const { data } = await supabase
      .from('vehicle_damage')
      .select('*, photos:damage_photos(*)')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })

    return (data ?? []) as unknown as VehicleDamage[]
  }

  static async getAll(
    page = 1,
    limit = 20
  ): Promise<{ data: VehicleDamage[]; total: number }> {
    const supabase = this.getClient()
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('vehicle_damage')
      .select(
        `*, photos:damage_photos(*), vehicle:vehicles(brand, model, registration_number)`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return { data: (data ?? []) as unknown as VehicleDamage[], total: count ?? 0 }
  }
}
