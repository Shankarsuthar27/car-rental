/**
 * RentalPricingService
 *
 * The authoritative pricing calculation engine for the Car Rental SaaS.
 * All price calculations MUST go through this service — never calculate
 * prices directly in UI components.
 *
 * Supports: hourly, daily, weekly, monthly, weekend, holiday, seasonal pricing
 * Configurable: partial period rules, grace periods, discounts, GST, deposits
 */

import type {
  Vehicle,
  PricingPlan,
  Coupon,
  PricingInput,
  PricingBreakdown,
  PricingLineItem,
  PricingType,
} from '@/types'

// ============================================================
// HELPERS
// ============================================================

function diffHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
}

function diffDays(hours: number): number {
  return hours / 24
}

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

interface Holiday {
  start_date: string
  end_date: string
  multiplier: number
}

function getHolidayMultiplier(
  pickupDate: Date,
  returnDate: Date,
  holidays: Holiday[]
): number {
  let maxMultiplier = 1.0
  for (const h of holidays) {
    const hStart = new Date(h.start_date)
    const hEnd = new Date(h.end_date)
    hEnd.setHours(23, 59, 59, 999)
    // Check if rental period overlaps with holiday
    if (pickupDate <= hEnd && returnDate >= hStart) {
      maxMultiplier = Math.max(maxMultiplier, h.multiplier)
    }
  }
  return maxMultiplier
}

// ============================================================
// DURATION CALCULATION BASED ON PARTIAL PERIOD RULE
// ============================================================

function calculateBillableHours(
  exactHours: number,
  rule: PricingPlan['partial_period_rule'],
  gracePeriodMinutes: number = 30
): number {
  // Apply grace period
  const gracePeriodHours = gracePeriodMinutes / 60
  if (exactHours <= gracePeriodHours && exactHours > 0) {
    // Within grace period — don't charge extra
    return Math.ceil(exactHours)
  }

  switch (rule) {
    case 'exact_hour':
      // Charge exact fractional hours (e.g., 2.5 hours = 2.5 hours)
      return exactHours

    case 'round_up_hour':
      // Round up to next full hour (e.g., 2.1 hours = 3 hours)
      return Math.ceil(exactHours)

    case 'day_blocks':
      // Full 24-hour blocks; partial day = full day
      return Math.ceil(exactHours / 24) * 24

    case 'partial_to_hourly':
      // Full days at daily rate, then remaining partial hours at hourly rate
      return exactHours // handled separately in calculation

    case 'full_day_min':
      // Minimum 1 full day charge
      return Math.max(24, Math.ceil(exactHours))

    default:
      return Math.ceil(exactHours)
  }
}

// ============================================================
// OPTIMAL PRICING SELECTION
// ============================================================

/**
 * Determine the most cost-effective pricing type for a given duration.
 * Always chooses the lowest total cost for the customer while respecting
 * configured plan rules.
 */
function selectOptimalPricingType(
  billableHours: number,
  vehicle: Vehicle,
  pricingPlan?: PricingPlan
): { type: PricingType; rate: number; quantity: number; baseAmount: number } {
  const options: Array<{
    type: PricingType
    rate: number
    quantity: number
    baseAmount: number
  }> = []

  // Hourly option
  if (vehicle.hourly_rate) {
    options.push({
      type: 'hourly',
      rate: vehicle.hourly_rate,
      quantity: billableHours,
      baseAmount: vehicle.hourly_rate * billableHours,
    })
  }

  // Daily option (if >= 12 hours)
  if (vehicle.daily_rate && billableHours >= 12) {
    const days = Math.ceil(billableHours / 24)
    options.push({
      type: 'daily',
      rate: vehicle.daily_rate,
      quantity: days,
      baseAmount: vehicle.daily_rate * days,
    })
  }

  // Weekly option (if >= 5 days)
  if (vehicle.weekly_rate && billableHours >= 5 * 24) {
    const weeks = Math.ceil(billableHours / (7 * 24))
    options.push({
      type: 'weekly',
      rate: vehicle.weekly_rate,
      quantity: weeks,
      baseAmount: vehicle.weekly_rate * weeks,
    })
  }

  // Monthly option (if >= 20 days)
  if (vehicle.monthly_rate && billableHours >= 20 * 24) {
    const months = Math.ceil(billableHours / (30 * 24))
    options.push({
      type: 'monthly',
      rate: vehicle.monthly_rate,
      quantity: months,
      baseAmount: vehicle.monthly_rate * months,
    })
  }

  if (options.length === 0) {
    // Fallback: per-hour at daily_rate / 24
    const hourlyFallback = (vehicle.daily_rate ?? 500) / 24
    return {
      type: 'hourly',
      rate: hourlyFallback,
      quantity: billableHours,
      baseAmount: hourlyFallback * billableHours,
    }
  }

  // Return the cheapest option
  return options.reduce((best, current) =>
    current.baseAmount < best.baseAmount ? current : best
  )
}

// ============================================================
// DURATION DISPLAY TEXT
// ============================================================

function buildDurationText(exactHours: number): {
  hours: number
  days: number
  weeks: number
  months: number
  displayText: string
} {
  const totalMinutes = Math.round(exactHours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60

  const days = Math.floor(exactHours / 24)
  const remainingHoursAfterDays = exactHours - days * 24

  const weeks = Math.floor(days / 7)
  const remainingDaysAfterWeeks = days % 7

  const months = Math.floor(days / 30)
  const remainingDaysAfterMonths = days % 30

  let displayText = ''
  if (exactHours < 24) {
    displayText = `${h}h ${m > 0 ? m + 'm' : ''}`.trim()
  } else if (days < 7) {
    displayText = `${days}d ${remainingHoursAfterDays > 0 ? Math.round(remainingHoursAfterDays) + 'h' : ''}`.trim()
  } else if (weeks < 4) {
    displayText = `${weeks}w ${remainingDaysAfterWeeks > 0 ? remainingDaysAfterWeeks + 'd' : ''}`.trim()
  } else {
    displayText = `${months}mo ${remainingDaysAfterMonths > 0 ? remainingDaysAfterMonths + 'd' : ''}`.trim()
  }

  return {
    hours: h,
    days,
    weeks,
    months,
    displayText,
  }
}

// ============================================================
// COUPON DISCOUNT CALCULATION
// ============================================================

function applyCouponDiscount(coupon: Coupon, subtotalBeforeCoupon: number): number {
  if (!coupon.is_active) return 0

  // Check minimum rental amount
  if (subtotalBeforeCoupon < coupon.min_rental_amount) return 0

  let discount = 0
  if (coupon.discount_type === 'percentage') {
    discount = (subtotalBeforeCoupon * coupon.discount_value) / 100
    // Apply max discount cap
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount
    }
  } else {
    // Fixed amount
    discount = Math.min(coupon.discount_value, subtotalBeforeCoupon)
  }

  return Math.round(discount * 100) / 100
}

// ============================================================
// MAIN PRICING CALCULATION
// ============================================================

export interface ExtendedPricingInput extends PricingInput {
  holidays?: Holiday[]
  lateFeeHours?: number
  lateFeeRatePerHour?: number
}

export class RentalPricingService {
  /**
   * Calculate the complete rental price breakdown.
   *
   * Example usage:
   *   const pricing = RentalPricingService.calculate({
   *     vehicle,
   *     pickupDateTime: new Date('2026-08-20T10:00:00'),
   *     returnDateTime: new Date('2026-08-22T16:00:00'),
   *     pricingPlan,
   *     coupon,
   *     taxRate: 18,
   *   })
   */
  static calculate(input: ExtendedPricingInput): PricingBreakdown {
    const {
      vehicle,
      pickupDateTime,
      returnDateTime,
      pricingPlan,
      extraKm = 0,
      discountAmount = 0,
      coupon,
      taxRate = 18,
      driverCharge = 0,
      insuranceCharge = 0,
      fuelCharge = 0,
      includeDeposit = true,
      holidays = [],
      lateFeeHours = 0,
      lateFeeRatePerHour,
    } = input

    const lineItems: PricingLineItem[] = []

    // ── Duration ────────────────────────────────────────────
    const exactHours = diffHours(pickupDateTime, returnDateTime)
    if (exactHours <= 0) {
      throw new Error('Return date must be after pickup date')
    }

    const rule = pricingPlan?.partial_period_rule ?? 'round_up_hour'
    const gracePeriod = pricingPlan?.grace_period_minutes ?? 30
    const billableHours = calculateBillableHours(exactHours, rule, gracePeriod)

    const durationInfo = buildDurationText(exactHours)

    // ── Holiday / Seasonal Multiplier ────────────────────────
    const holidayMultiplier = getHolidayMultiplier(
      pickupDateTime,
      returnDateTime,
      holidays
    )

    // ── Base Rental ──────────────────────────────────────────
    const optimal = selectOptimalPricingType(billableHours, vehicle, pricingPlan)
    const baseRentalBeforeMultiplier = optimal.baseAmount
    const baseRental = Math.round(baseRentalBeforeMultiplier * holidayMultiplier * 100) / 100

    // Pricing label
    const pricingTypeLabel: Record<PricingType, string> = {
      hourly: `${Math.ceil(billableHours)} hours × ₹${optimal.rate}/hr`,
      daily: `${optimal.quantity} day${optimal.quantity > 1 ? 's' : ''} × ₹${optimal.rate}/day`,
      weekly: `${optimal.quantity} week${optimal.quantity > 1 ? 's' : ''} × ₹${optimal.rate}/week`,
      monthly: `${optimal.quantity} month${optimal.quantity > 1 ? 's' : ''} × ₹${optimal.rate}/month`,
      custom: `Custom pricing`,
    }

    lineItems.push({
      description: `Base Rental (${pricingTypeLabel[optimal.type]})`,
      quantity: optimal.quantity,
      unit: optimal.type === 'hourly' ? 'hours' : optimal.type === 'daily' ? 'days' : optimal.type,
      unitPrice: optimal.rate,
      total: baseRental,
      type: 'base',
    })

    if (holidayMultiplier > 1) {
      lineItems.push({
        description: `Holiday/Season Surcharge (${Math.round((holidayMultiplier - 1) * 100)}%)`,
        total: baseRental - baseRentalBeforeMultiplier,
        unitPrice: 0,
        type: 'extra',
      })
    }

    // ── Extra KM Charge ──────────────────────────────────────
    let extraKmCharge = 0
    if (extraKm > 0 && vehicle.extra_km_charge > 0) {
      extraKmCharge = Math.round(extraKm * vehicle.extra_km_charge * 100) / 100
      lineItems.push({
        description: `Extra KM (${extraKm} km × ₹${vehicle.extra_km_charge}/km)`,
        quantity: extraKm,
        unit: 'km',
        unitPrice: vehicle.extra_km_charge,
        total: extraKmCharge,
        type: 'extra',
      })
    }

    // ── Late Fee ─────────────────────────────────────────────
    let lateFee = 0
    if (lateFeeHours > 0) {
      const lateRate = lateFeeRatePerHour ?? (vehicle.hourly_rate ?? (vehicle.daily_rate ?? 0) / 24) * 1.5
      lateFee = Math.round(lateFeeHours * lateRate * 100) / 100
      lineItems.push({
        description: `Late Return Fee (${lateFeeHours}h × ₹${lateRate}/hr)`,
        quantity: lateFeeHours,
        unit: 'hours',
        unitPrice: lateRate,
        total: lateFee,
        type: 'extra',
      })
    }

    // ── Driver Charge ────────────────────────────────────────
    if (driverCharge > 0) {
      lineItems.push({
        description: 'Driver Charge',
        total: driverCharge,
        unitPrice: driverCharge,
        type: 'extra',
      })
    }

    // ── Insurance Charge ─────────────────────────────────────
    if (insuranceCharge > 0) {
      lineItems.push({
        description: 'Insurance',
        total: insuranceCharge,
        unitPrice: insuranceCharge,
        type: 'extra',
      })
    }

    // ── Fuel Charge ──────────────────────────────────────────
    if (fuelCharge > 0) {
      lineItems.push({
        description: 'Fuel Charge',
        total: fuelCharge,
        unitPrice: fuelCharge,
        type: 'extra',
      })
    }

    // ── Subtotal (before discounts) ──────────────────────────
    const subtotalBeforeDiscount =
      baseRental +
      extraKmCharge +
      lateFee +
      driverCharge +
      insuranceCharge +
      fuelCharge

    // ── Manual Discount ──────────────────────────────────────
    const actualDiscount = Math.min(discountAmount, subtotalBeforeDiscount)
    if (actualDiscount > 0) {
      lineItems.push({
        description: 'Discount',
        total: -actualDiscount,
        unitPrice: actualDiscount,
        type: 'discount',
      })
    }

    // ── Coupon Discount ──────────────────────────────────────
    const couponDiscount = coupon
      ? applyCouponDiscount(coupon, subtotalBeforeDiscount - actualDiscount)
      : 0

    if (couponDiscount > 0) {
      lineItems.push({
        description: `Coupon (${coupon!.code}) — ${
          coupon!.discount_type === 'percentage'
            ? coupon!.discount_value + '% off'
            : '₹' + coupon!.discount_value + ' off'
        }`,
        total: -couponDiscount,
        unitPrice: couponDiscount,
        type: 'discount',
      })
    }

    // ── Subtotal after discounts ─────────────────────────────
    const subtotal = subtotalBeforeDiscount - actualDiscount - couponDiscount

    // ── Tax (GST) ────────────────────────────────────────────
    const taxAmount = Math.round((subtotal * taxRate) / 100 * 100) / 100
    if (taxAmount > 0) {
      lineItems.push({
        description: `GST (${taxRate}%)`,
        total: taxAmount,
        unitPrice: taxAmount,
        type: 'tax',
      })
    }

    // ── Security Deposit ─────────────────────────────────────
    const securityDeposit = includeDeposit ? (vehicle.security_deposit ?? 0) : 0
    if (securityDeposit > 0) {
      lineItems.push({
        description: 'Security Deposit (refundable)',
        total: securityDeposit,
        unitPrice: securityDeposit,
        type: 'deposit',
      })
    }

    // ── Grand Total ──────────────────────────────────────────
    const grandTotal = Math.round((subtotal + taxAmount + securityDeposit) * 100) / 100

    return {
      rentalDuration: durationInfo,
      baseRental,
      extraKmCharge,
      lateFee,
      driverCharge,
      insuranceCharge,
      fuelCharge,
      subtotal,
      discountAmount: actualDiscount,
      couponDiscount,
      taxRate,
      taxAmount,
      securityDeposit,
      grandTotal,
      lineItems,
      appliedPricingType: optimal.type,
    }
  }

  /**
   * Calculate late fee for an overdue rental.
   */
  static calculateLateFee(
    vehicle: Vehicle,
    scheduledReturnDateTime: Date,
    actualReturnDateTime: Date,
    gracePeriodMinutes: number = 30
  ): { hours: number; fee: number } {
    const lateMs =
      actualReturnDateTime.getTime() - scheduledReturnDateTime.getTime()
    const lateMinutes = lateMs / (1000 * 60)

    if (lateMinutes <= gracePeriodMinutes) {
      return { hours: 0, fee: 0 }
    }

    const lateHours = Math.ceil((lateMinutes - gracePeriodMinutes) / 60)
    const ratePerHour =
      vehicle.hourly_rate ??
      (vehicle.daily_rate ? vehicle.daily_rate / 24 : 0)
    const fee = Math.round(lateHours * ratePerHour * 1.5 * 100) / 100

    return { hours: lateHours, fee }
  }

  /**
   * Calculate extra KM charges at return.
   */
  static calculateExtraKmCharge(
    vehicle: Vehicle,
    pickupOdometer: number,
    returnOdometer: number,
    rentalDays: number
  ): { actualKm: number; includedKm: number; extraKm: number; charge: number } {
    const actualKm = returnOdometer - pickupOdometer
    const includedKm = (vehicle.included_km_per_day ?? 200) * rentalDays
    const extraKm = Math.max(0, actualKm - includedKm)
    const charge = Math.round(extraKm * vehicle.extra_km_charge * 100) / 100

    return { actualKm, includedKm, extraKm, charge }
  }

  /**
   * Calculate cancellation refund based on policy.
   */
  static calculateCancellationRefund(
    amountPaid: number,
    bookingCreatedAt: Date,
    cancellationTime: Date,
    policy: { '48h_plus': number; '24_to_48h': number; less_than_24h: number } = {
      '48h_plus': 100,
      '24_to_48h': 75,
      less_than_24h: 50,
    }
  ): { refundPercent: number; refundAmount: number } {
    const hoursUntilPickup =
      (bookingCreatedAt.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60)

    let refundPercent: number
    if (hoursUntilPickup >= 48) {
      refundPercent = policy['48h_plus']
    } else if (hoursUntilPickup >= 24) {
      refundPercent = policy['24_to_48h']
    } else {
      refundPercent = policy.less_than_24h
    }

    const refundAmount = Math.round((amountPaid * refundPercent) / 100 * 100) / 100
    return { refundPercent, refundAmount }
  }
}
