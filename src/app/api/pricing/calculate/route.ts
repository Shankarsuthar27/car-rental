import { NextResponse } from 'next/server'
import { RentalPricingService } from '@/services/RentalPricingService'
import { VehicleService } from '@/services/VehicleService'
import { CouponService } from '@/services/CouponService'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ExtendedPricingInput } from '@/services/RentalPricingService'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      vehicleId,
      pickupDateTime,
      returnDateTime,
      couponCode,
      customerId,
      extraKm = 0,
      withDriver = false,
      withInsurance = false,
      fuelCharge = 0
    } = body

    if (!vehicleId || !pickupDateTime || !returnDateTime) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Vehicle ID, pickup date/time, and return date/time are required.'
          }
        },
        { status: 400 }
      )
    }

    const pickup = new Date(pickupDateTime)
    const returnDt = new Date(returnDateTime)

    if (isNaN(pickup.getTime()) || isNaN(returnDt.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_DATES', message: 'Invalid date formats provided.' }
        },
        { status: 400 }
      )
    }

    if (returnDt <= pickup) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RETURN_BEFORE_PICKUP',
            message: 'Return date & time must be strictly after pickup date & time.'
          }
        },
        { status: 400 }
      )
    }

    // Fetch vehicle
    const vehicle = await VehicleService.getVehicleById(vehicleId)
    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found.' }
        },
        { status: 404 }
      )
    }

    // Check availability
    const isAvailable = await VehicleService.checkAvailability(
      vehicleId,
      pickup.toISOString(),
      returnDt.toISOString()
    )

    // Fetch active default pricing plan
    const supabase = createAdminClient()
    const { data: defaultPlan } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single()

    // Fetch holidays
    const { data: holidays } = await supabase.from('holidays').select('*')

    // Validate coupon if provided
    let coupon = undefined
    if (couponCode && customerId) {
      const couponCheck = await CouponService.validateCoupon(
        couponCode,
        customerId,
        vehicle.daily_rate || 1000,
        vehicle.vehicle_type,
        vehicle.branch_id
      )
      if (couponCheck.valid && couponCheck.coupon) {
        coupon = couponCheck.coupon
      }
    }

    // Calculate options
    const diffHours = (returnDt.getTime() - pickup.getTime()) / (1000 * 60 * 60)
    const days = Math.ceil(diffHours / 24)

    const driverCharge = withDriver ? 800 * Math.max(1, days) : 0
    const insuranceCharge = withInsurance ? 350 * Math.max(1, days) : 0

    const pricingInput: ExtendedPricingInput = {
      vehicle,
      pickupDateTime: pickup,
      returnDateTime: returnDt,
      pricingPlan: defaultPlan || undefined,
      extraKm,
      coupon,
      taxRate: 18,
      driverCharge,
      insuranceCharge,
      fuelCharge,
      includeDeposit: true,
      holidays: holidays || []
    }

    const breakdown = RentalPricingService.calculate(pricingInput)

    return NextResponse.json({
      success: true,
      data: {
        isAvailable,
        breakdown,
        vehicle: {
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          registrationNumber: vehicle.registration_number,
          securityDeposit: vehicle.security_deposit,
          dailyRate: vehicle.daily_rate,
          hourlyRate: vehicle.hourly_rate
        }
      },
      message: isAvailable
        ? 'Price calculated successfully.'
        : 'Vehicle is currently booked for part of this period, but price estimate is provided.'
    })
  } catch (error: any) {
    console.error('Pricing calculation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CALCULATION_FAILED',
          message: error.message || 'An error occurred while calculating rental price.'
        }
      },
      { status: 500 }
    )
  }
}
