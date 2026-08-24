import { createAdminClient } from '@/lib/supabase/admin'
import type { Vehicle, VehicleFilters, PaginatedResponse } from '@/types'

export class VehicleService {
  private static getClient() {
    return createAdminClient()
  }

  /**
   * Get all vehicles with optional filters and pagination
   */
  static async getVehicles(
    filters: VehicleFilters = {},
    page = 1,
    limit = 12
  ): Promise<PaginatedResponse<Vehicle>> {
    const supabase = this.getClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('vehicles')
      .select(
        `
        *,
        branch:branches(id, name, city),
        images:vehicle_images(id, url, thumbnail_url, is_primary, sort_order)
      `,
        { count: 'exact' }
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.vehicleType?.length) {
      query = query.in('vehicle_type', filters.vehicleType)
    }
    if (filters.fuelType?.length) {
      query = query.in('fuel_type', filters.fuelType)
    }
    if (filters.transmission?.length) {
      query = query.in('transmission', filters.transmission)
    }
    if (filters.brand?.length) {
      query = query.in('brand', filters.brand)
    }
    if (filters.seats) {
      query = query.gte('seating_capacity', filters.seats)
    }
    if (filters.branchId) {
      query = query.eq('branch_id', filters.branchId)
    }
    if (filters.minPrice) {
      query = query.gte('daily_rate', filters.minPrice)
    }
    if (filters.maxPrice) {
      query = query.lte('daily_rate', filters.maxPrice)
    }
    if (filters.search) {
      query = query.or(
        `brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,registration_number.ilike.%${filters.search}%`
      )
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('daily_rate', { ascending: true })
        break
      case 'price_desc':
        query = query.order('daily_rate', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: (data ?? []) as unknown as Vehicle[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    }
  }

  /**
   * Get a single vehicle by ID
   */
  static async getVehicleById(id: string): Promise<Vehicle | null> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('vehicles')
      .select(
        `
        *,
        branch:branches(*),
        images:vehicle_images(*)
      `
      )
      .eq('id', id)
      .single()

    if (error) return null
    return data as unknown as Vehicle
  }

  /**
   * Check vehicle availability for a date range
   */
  static async checkAvailability(
    vehicleId: string,
    pickupDatetime: string,
    returnDatetime: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    const supabase = this.getClient()

    // 1. Check vehicle status
    try {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('status, is_active')
        .eq('id', vehicleId)
        .maybeSingle()

      if (vehicle && (!vehicle.is_active || vehicle.status === 'inactive' || vehicle.status === 'maintenance')) {
        return false
      }
    } catch {
      // Non-fatal
    }

    // 2. Check for overlapping confirmed / active / reserved bookings
    try {
      const { data: conflicts, error: qErr } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('vehicle_id', vehicleId)
        .in('status', ['confirmed', 'active', 'ready_for_pickup', 'reserved'])
        .lt('pickup_datetime', returnDatetime)
        .gt('return_datetime', pickupDatetime)

      if (!qErr && conflicts) {
        const activeConflicts = excludeBookingId
          ? conflicts.filter((c: any) => c.id !== excludeBookingId)
          : conflicts

        return activeConflicts.length === 0
      }
    } catch {
      // Fallback
    }

    return true
  }

  /**
   * Get all available vehicles for a date range
   */
  static async getAvailableVehicles(
    pickupDatetime: string,
    returnDatetime: string,
    branchId?: string
  ): Promise<Vehicle[]> {
    const supabase = this.getClient()

    const { data, error } = await supabase.rpc('get_available_vehicles', {
      p_pickup_datetime: pickupDatetime,
      p_return_datetime: returnDatetime,
      p_branch_id: branchId ?? null,
    })

    if (error) throw error
    return (data ?? []) as unknown as Vehicle[]
  }

  /**
   * Create a new vehicle
   */
  static async createVehicle(
    vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Vehicle> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Vehicle
  }

  /**
   * Update vehicle
   */
  static async updateVehicle(
    id: string,
    updates: Partial<Vehicle>
  ): Promise<Vehicle> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('vehicles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Vehicle
  }

  /**
   * Update vehicle status
   */
  static async updateStatus(id: string, status: Vehicle['status']): Promise<void> {
    const supabase = this.getClient()

    const { error } = await supabase
      .from('vehicles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Soft delete (deactivate) a vehicle
   */
  static async deactivate(id: string): Promise<void> {
    await this.updateVehicle(id, { is_active: false, status: 'inactive' })
  }

  /**
   * Delete or deactivate a vehicle
   */
  static async deleteVehicle(
    id: string,
    hardDelete = true
  ): Promise<{ deleted: boolean; deactivated?: boolean }> {
    const supabase = this.getClient()
    if (hardDelete) {
      const { error } = await supabase.from('vehicles').delete().eq('id', id)
      if (error) {
        // If foreign key constraint prevents hard delete, soft delete instead
        await this.deactivate(id)
        return { deleted: false, deactivated: true }
      }
      return { deleted: true }
    } else {
      await this.deactivate(id)
      return { deleted: false, deactivated: true }
    }
  }

  /**
   * Add vehicle image
   */
  static async addImage(
    vehicleId: string,
    url: string,
    thumbnailUrl?: string,
    isPrimary = false
  ): Promise<void> {
    const supabase = this.getClient()

    if (isPrimary) {
      // Unset existing primary
      await supabase
        .from('vehicle_images')
        .update({ is_primary: false })
        .eq('vehicle_id', vehicleId)
    }

    const { error } = await supabase.from('vehicle_images').insert({
      vehicle_id: vehicleId,
      url,
      thumbnail_url: thumbnailUrl,
      is_primary: isPrimary,
    })

    if (error) throw error
  }

  /**
   * Get vehicles with upcoming maintenance or document expiry
   */
  static async getMaintenanceAlerts(): Promise<
    Array<Vehicle & { alert_type: string; alert_date: string }>
  > {
    const supabase = this.getClient()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const alertDate = thirtyDaysFromNow.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('vehicles')
      .select('*, branch:branches(name)')
      .eq('is_active', true)
      .or(
        `insurance_expiry.lte.${alertDate},registration_expiry.lte.${alertDate},pollution_cert_expiry.lte.${alertDate}`
      )

    if (error) return []

    const alerts: Array<Vehicle & { alert_type: string; alert_date: string }> = []
    for (const v of data ?? []) {
      if (v.insurance_expiry <= alertDate) {
        alerts.push({
          ...(v as unknown as Vehicle),
          alert_type: 'insurance_expiry',
          alert_date: v.insurance_expiry,
        })
      }
      if (v.registration_expiry <= alertDate) {
        alerts.push({
          ...(v as unknown as Vehicle),
          alert_type: 'registration_expiry',
          alert_date: v.registration_expiry,
        })
      }
      if (v.pollution_cert_expiry <= alertDate) {
        alerts.push({
          ...(v as unknown as Vehicle),
          alert_type: 'pollution_cert_expiry',
          alert_date: v.pollution_cert_expiry,
        })
      }
    }

    return alerts
  }
}
