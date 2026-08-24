import { createAdminClient } from '@/lib/supabase/admin'
import type { VehicleInspection, InspectionType, FuelLevel } from '@/types'

export class InspectionService {
  private static getClient() {
    return createAdminClient()
  }

  static async createInspection(data: {
    bookingId: string
    vehicleId: string
    inspectionType: InspectionType
    inspectedBy?: string
    odometer: number
    fuelLevel: FuelLevel
    conditionRating?: number
    hasScratches?: boolean
    hasDents?: boolean
    hasBrokenParts?: boolean
    damageDescription?: string
    notes?: string
    customerNotes?: string
    customerSignatureUrl?: string
    staffSignatureUrl?: string
  }): Promise<VehicleInspection> {
    const supabase = this.getClient()

    const { data: inspection, error } = await supabase
      .from('vehicle_inspections')
      .insert({
        booking_id: data.bookingId,
        vehicle_id: data.vehicleId,
        inspection_type: data.inspectionType,
        inspected_by: data.inspectedBy,
        odometer: data.odometer,
        fuel_level: data.fuelLevel,
        condition_rating: data.conditionRating,
        has_scratches: data.hasScratches ?? false,
        has_dents: data.hasDents ?? false,
        has_broken_parts: data.hasBrokenParts ?? false,
        damage_description: data.damageDescription,
        notes: data.notes,
        customer_notes: data.customerNotes,
        customer_signature_url: data.customerSignatureUrl,
        staff_signature_url: data.staffSignatureUrl,
      })
      .select()
      .single()

    if (error) throw error

    // Update vehicle odometer
    await supabase
      .from('vehicles')
      .update({ current_odometer: data.odometer, updated_at: new Date().toISOString() })
      .eq('id', data.vehicleId)

    return inspection as unknown as VehicleInspection
  }

  static async addPhoto(
    inspectionId: string,
    url: string,
    area?: string,
    description?: string
  ): Promise<void> {
    const supabase = this.getClient()
    await supabase.from('inspection_photos').insert({
      inspection_id: inspectionId,
      url,
      area,
      description,
    })
  }

  static async getBookingInspections(bookingId: string): Promise<VehicleInspection[]> {
    const supabase = this.getClient()
    const { data } = await supabase
      .from('vehicle_inspections')
      .select('*, photos:inspection_photos(*)')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    return (data ?? []) as unknown as VehicleInspection[]
  }

  static async getInspectionById(id: string): Promise<VehicleInspection | null> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('vehicle_inspections')
      .select('*, photos:inspection_photos(*)')
      .eq('id', id)
      .single()

    if (error) return null
    return data as unknown as VehicleInspection
  }
}
