import { createAdminClient } from '@/lib/supabase/admin'
import type {
  Booking,
  BookingFilters,
  BookingStatus,
  PaginatedResponse,
} from '@/types'
import { VehicleService } from './VehicleService'
import { AuditService } from './AuditService'

export class BookingService {
  private static getClient() {
    return createAdminClient()
  }
 /**
   * Generate booking with all related data
   */
 
  static async getBookings(
    filters: BookingFilters = {},
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Booking>> {
    const supabase = this.getClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('bookings')
      .select(
        `
        *,
        customer:customers(
          id, customer_code,
          profile:profiles!customers_profile_id_fkey(full_name, email, phone, avatar_url)
        ),
        vehicle:vehicles(
          id, brand, model, year, registration_number,
          images:vehicle_images(url, is_primary)
        ),
        pickup_branch:branches!pickup_branch_id(id, name, city),
        return_branch:branches!return_branch_id(id, name, city)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }
    if (filters.paymentStatus?.length) {
      query = query.in('payment_status', filters.paymentStatus)
    }
    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId)
    }
    if (filters.vehicleId) {
      query = query.eq('vehicle_id', filters.vehicleId)
    }
    if (filters.branchId) {
      query = query.eq('pickup_branch_id', filters.branchId)
    }
    if (filters.dateFrom) {
      query = query.gte('pickup_datetime', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('pickup_datetime', filters.dateTo)
    }
    if (filters.search) {
      query = query.ilike('booking_number', `%${filters.search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return {
      data: (data ?? []) as unknown as Booking[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    }
  }

  /**
   * Get a single booking by ID with all relations
   */
  static async getBookingById(id: string): Promise<Booking | null> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        customer:customers(
          *,
          profile:profiles!customers_profile_id_fkey(*)
        ),
        vehicle:vehicles(
          *,
          branch:branches(*),
          images:vehicle_images(*)
        ),
        pickup_branch:branches!pickup_branch_id(*),
        return_branch:branches!return_branch_id(*),
        payments:payments(*),
        inspections:vehicle_inspections(
          *,
          photos:inspection_photos(*)
        ),
        security_deposit_record:security_deposits(*)
      `
      )
      .eq('id', id)
      .single()

    if (error) return null
    return data as unknown as Booking
  }

  /**
   * Get booking by booking number
   */
  static async getByBookingNumber(bookingNumber: string): Promise<Booking | null> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('bookings')
      .select('*, customer:customers(*, profile:profiles!customers_profile_id_fkey(*)), vehicle:vehicles(*)')
      .eq('booking_number', bookingNumber)
      .single()

    if (error) return null
    return data as unknown as Booking
  }

  /**
   * Create a new booking — includes double-booking prevention
   */
  static async createBooking(
    bookingData: Omit<Booking, 'id' | 'booking_number' | 'created_at' | 'updated_at'> & { booking_number?: string },
    actorProfileId?: string
  ): Promise<Booking> {
    const supabase = this.getClient()

    // Verify availability
    const isAvailable = await VehicleService.checkAvailability(
      bookingData.vehicle_id,
      bookingData.pickup_datetime,
      bookingData.return_datetime
    )

    if (!isAvailable) {
      throw new Error('VEHICLE_UNAVAILABLE: This vehicle is not available for the selected dates')
    }

    const bookingNumber =
      bookingData.booking_number ||
      `BK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        ...bookingData,
        booking_number: bookingNumber,
        created_by: actorProfileId || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23P01') {
        // Exclusion constraint violation = double booking
        throw new Error('VEHICLE_UNAVAILABLE: This vehicle is not available for the selected dates')
      }
      throw error
    }

    // Update vehicle status to reserved
    try {
      await VehicleService.updateStatus(bookingData.vehicle_id, 'reserved')
    } catch {
      // Non-fatal
    }

    // Create security deposit record
    if (bookingData.security_deposit > 0) {
      try {
        await supabase.from('security_deposits').insert({
          booking_id: data.id,
          customer_id: bookingData.customer_id,
          required_amount: bookingData.security_deposit,
          status: 'pending',
        })
      } catch {
        // Non-fatal
      }
    }

    if (actorProfileId) {
      try {
        await AuditService.log({
          userId: actorProfileId,
          action: 'booking_created',
          module: 'bookings',
          recordId: data.id,
          newValue: { booking_number: data.booking_number, status: data.status },
        })
      } catch {
        // Non-fatal
      }
    }

    return data as unknown as Booking
  }

  /**
   * Update booking status with audit trail
   */
  static async updateStatus(
    bookingId: string,
    status: BookingStatus,
    actorProfileId?: string,
    notes?: string
  ): Promise<void> {
    const supabase = this.getClient()

    const { data: old } = await supabase
      .from('bookings')
      .select('status, vehicle_id')
      .eq('id', bookingId)
      .single()

    const { error } = await supabase
      .from('bookings')
      .update({
        status,
        admin_notes: notes,
        updated_at: new Date().toISOString(),
        ...(status === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}),
      })
      .eq('id', bookingId)

    if (error) throw error

    // Update vehicle status based on booking status transitions
    if (old?.vehicle_id) {
      const vehicleStatusMap: Partial<Record<BookingStatus, string>> = {
        confirmed: 'reserved',
        active: 'rented',
        completed: 'available',
        cancelled: 'available',
        rejected: 'available',
        no_show: 'available',
      }

      const newVehicleStatus = vehicleStatusMap[status]
      if (newVehicleStatus) {
        await VehicleService.updateStatus(old.vehicle_id, newVehicleStatus as Vehicle['status'])
      }
    }

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'booking_status_changed',
        module: 'bookings',
        recordId: bookingId,
        previousValue: { status: old?.status },
        newValue: { status },
      })
    }
  }

  /**
   * Confirm a booking
   */
  static async confirmBooking(bookingId: string, actorProfileId?: string): Promise<void> {
    await this.updateStatus(bookingId, 'confirmed', actorProfileId)
  }

  /**
   * Cancel a booking with refund calculation
   */
  static async cancelBooking(
    bookingId: string,
    reason: string,
    actorProfileId?: string
  ): Promise<{ refundAmount: number }> {
    const supabase = this.getClient()

    const booking = await this.getBookingById(bookingId)
    if (!booking) throw new Error('Booking not found')

    // Calculate refund (simplified — use RentalPricingService for exact calculation)
    const hoursSinceCreation =
      (Date.now() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60)
    let refundPercent = 50
    if (hoursSinceCreation < 24) refundPercent = 100
    else if (hoursSinceCreation < 48) refundPercent = 75

    const refundAmount = Math.round((booking.amount_paid * refundPercent) / 100 * 100) / 100

    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: actorProfileId,
        cancellation_reason: reason,
        refund_amount: refundAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    // Free up the vehicle
    if (booking.vehicle_id) {
      await VehicleService.updateStatus(booking.vehicle_id, 'available')
    }

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'booking_cancelled',
        module: 'bookings',
        recordId: bookingId,
        newValue: { reason, refundAmount },
      })
    }

    return { refundAmount }
  }

  /**
   * Start rental (pickup) — change status to Active
   */
  static async startRental(
    bookingId: string,
    pickupOdometer: number,
    actorProfileId?: string
  ): Promise<void> {
    const supabase = this.getClient()

    await supabase
      .from('bookings')
      .update({
        status: 'active',
        actual_pickup_datetime: new Date().toISOString(),
        pickup_odometer: pickupOdometer,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    const { data: b } = await supabase.from('bookings').select('vehicle_id').eq('id', bookingId).single()
    if (b?.vehicle_id) {
      await VehicleService.updateStatus(b.vehicle_id, 'rented')
    }

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'rental_started',
        module: 'bookings',
        recordId: bookingId,
        newValue: { pickupOdometer },
      })
    }
  }

  /**
   * Close rental (return) — finalize charges and status
   */
  static async closeRental(
    bookingId: string,
    returnData: {
      returnOdometer: number
      extraKmCharge: number
      lateFee: number
      fuelCharge: number
      damageCharge?: number
      adminNotes?: string
    },
    actorProfileId?: string
  ): Promise<void> {
    const supabase = this.getClient()

    const booking = await this.getBookingById(bookingId)
    if (!booking) throw new Error('Booking not found')

    const totalExtra =
      returnData.extraKmCharge +
      returnData.lateFee +
      returnData.fuelCharge +
      (returnData.damageCharge ?? 0)

    const newTotal = booking.grand_total + totalExtra
    const newOutstanding = Math.max(0, newTotal - booking.amount_paid)

    await supabase
      .from('bookings')
      .update({
        status: 'completed',
        actual_return_datetime: new Date().toISOString(),
        return_odometer: returnData.returnOdometer,
        extra_km: returnData.returnOdometer - (booking.pickup_odometer ?? 0),
        extra_km_charge: returnData.extraKmCharge,
        late_fee: returnData.lateFee,
        fuel_charge: returnData.fuelCharge,
        grand_total: newTotal,
        outstanding_amount: newOutstanding,
        admin_notes: returnData.adminNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    // Return vehicle to available
    if (booking.vehicle_id) {
      await VehicleService.updateStatus(booking.vehicle_id, 'available')
    }

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'rental_closed',
        module: 'bookings',
        recordId: bookingId,
        newValue: returnData,
      })
    }
  }

  /**
   * Get today's pickups and returns
   */
  static async getTodayActivity(branchId?: string): Promise<{
    pickups: Booking[]
    returns: Booking[]
  }> {
    const supabase = this.getClient()
    const today = new Date().toISOString().split('T')[0]

    let pickupQuery = supabase
      .from('bookings')
      .select('*, customer:customers(profile:profiles!customers_profile_id_fkey(full_name, phone)), vehicle:vehicles(brand, model, registration_number)')
      .eq('status', 'ready_for_pickup')
      .gte('pickup_datetime', `${today}T00:00:00`)
      .lte('pickup_datetime', `${today}T23:59:59`)

    let returnQuery = supabase
      .from('bookings')
      .select('*, customer:customers(profile:profiles!customers_profile_id_fkey(full_name, phone)), vehicle:vehicles(brand, model, registration_number)')
      .eq('status', 'active')
      .gte('return_datetime', `${today}T00:00:00`)
      .lte('return_datetime', `${today}T23:59:59`)

    if (branchId) {
      pickupQuery = pickupQuery.eq('pickup_branch_id', branchId)
      returnQuery = returnQuery.eq('return_branch_id', branchId)
    }

    const [pickups, returns] = await Promise.all([pickupQuery, returnQuery])

    return {
      pickups: (pickups.data ?? []) as unknown as Booking[],
      returns: (returns.data ?? []) as unknown as Booking[],
    }
  }
}

// Fix missing import
import type { Vehicle } from '@/types'
