import { createAdminClient } from '@/lib/supabase/admin'
import type { Coupon } from '@/types'

export class CouponService {
  private static getClient() {
    return createAdminClient()
  }

  /**
   * Validate and return coupon details
   */
  static async validateCoupon(
    code: string,
    customerId: string,
    rentalAmount: number,
    vehicleType?: string,
    branchId?: string
  ): Promise<{ valid: boolean; coupon?: Coupon; message?: string }> {
    const supabase = this.getClient()

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !coupon) {
      return { valid: false, message: 'Invalid coupon code' }
    }

    // Check expiry
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return { valid: false, message: 'Coupon has expired' }
    }

    // Check start date
    if (coupon.start_date && new Date(coupon.start_date) > new Date()) {
      return { valid: false, message: 'Coupon is not yet active' }
    }

    // Check minimum rental amount
    if (rentalAmount < coupon.min_rental_amount) {
      return {
        valid: false,
        message: `Minimum rental amount of ₹${coupon.min_rental_amount} required`,
      }
    }

    // Check global usage limit
    if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
      return { valid: false, message: 'Coupon usage limit reached' }
    }

    // Check per-customer usage
    const { count } = await supabase
      .from('coupon_usages')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('customer_id', customerId)

    if (coupon.per_customer_limit && (count ?? 0) >= coupon.per_customer_limit) {
      return { valid: false, message: 'You have already used this coupon' }
    }

    // Check vehicle type restriction
    if (
      vehicleType &&
      coupon.applicable_vehicle_types &&
      (coupon.applicable_vehicle_types as string[]).length > 0 &&
      !(coupon.applicable_vehicle_types as string[]).includes(vehicleType)
    ) {
      return { valid: false, message: 'Coupon not applicable for this vehicle type' }
    }

    // Check branch restriction
    if (
      branchId &&
      coupon.applicable_branch_ids &&
      (coupon.applicable_branch_ids as string[]).length > 0 &&
      !(coupon.applicable_branch_ids as string[]).includes(branchId)
    ) {
      return { valid: false, message: 'Coupon not applicable for this branch' }
    }

    return { valid: true, coupon: coupon as unknown as Coupon }
  }

  static async getCoupons(page = 1, limit = 20): Promise<{ data: Coupon[]; total: number }> {
    const supabase = this.getClient()
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return { data: (data ?? []) as unknown as Coupon[], total: count ?? 0 }
  }

  static async createCoupon(
    couponData: Omit<Coupon, 'id' | 'times_used' | 'created_at' | 'updated_at'>
  ): Promise<Coupon> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('coupons')
      .insert({ ...couponData, code: couponData.code.toUpperCase() })
      .select()
      .single()

    if (error) throw error
    return data as unknown as Coupon
  }

  static async updateCoupon(id: string, updates: Partial<Coupon>): Promise<void> {
    const supabase = this.getClient()
    await supabase
      .from('coupons')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  static async toggleActive(id: string, isActive: boolean): Promise<void> {
    await this.updateCoupon(id, { is_active: isActive })
  }
}
