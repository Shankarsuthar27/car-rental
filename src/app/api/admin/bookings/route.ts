import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Booking } from '@/types'

// GET: Fetch bookings
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customer_id')

    const supabase = createAdminClient()
    let query = supabase
      .from('bookings')
      .select(`
        *,
        vehicle:vehicles(id, brand, model, registration_number, vehicle_type, daily_rate, hourly_rate, extra_km_charge, images:vehicle_images(id, url, is_primary)),
        customer:customers(id, customer_code, profile:profiles!customers_profile_id_fkey(id, full_name, email, phone)),
        pickup_branch:branches!pickup_branch_id(id, name, city),
        return_branch:branches!return_branch_id(id, name, city)
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: (data ?? []) as unknown as Booking[]
    })
  } catch (error: any) {
    console.error('Fetch admin bookings error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch bookings' } },
      { status: 500 }
    )
  }
}

// PUT: Update Booking Pricing, Base Rental, Insurance, GST, and Status
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const {
      id,
      base_rental,
      insurance_charge,
      driver_charge,
      extra_km_charge,
      late_fee,
      fuel_charge,
      discount_amount,
      tax_rate,
      security_deposit,
      amount_paid,
      status,
      notes,
      admin_notes
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Booking ID is required.' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch existing booking
    const { data: existingBooking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !existingBooking) {
      return NextResponse.json(
        { success: false, error: { message: 'Booking not found.' } },
        { status: 404 }
      )
    }

    // Determine updated financial values
    const newBaseRental = base_rental !== undefined ? Number(base_rental) : Number(existingBooking.base_rental || 0)
    const newInsurance = insurance_charge !== undefined ? Number(insurance_charge) : Number(existingBooking.insurance_charge || 0)
    const newDriver = driver_charge !== undefined ? Number(driver_charge) : Number(existingBooking.driver_charge || 0)
    const newExtraKm = extra_km_charge !== undefined ? Number(extra_km_charge) : Number(existingBooking.extra_km_charge || 0)
    const newLateFee = late_fee !== undefined ? Number(late_fee) : Number(existingBooking.late_fee || 0)
    const newFuel = fuel_charge !== undefined ? Number(fuel_charge) : Number(existingBooking.fuel_charge || 0)
    const newDiscount = discount_amount !== undefined ? Number(discount_amount) : Number(existingBooking.discount_amount || 0)
    const couponDiscount = Number(existingBooking.coupon_discount || 0)
    const newTaxRate = tax_rate !== undefined ? Number(tax_rate) : Number(existingBooking.tax_rate ?? 18)
    const newDeposit = security_deposit !== undefined ? Number(security_deposit) : Number(existingBooking.security_deposit || 0)
    const newAmountPaid = amount_paid !== undefined ? Number(amount_paid) : Number(existingBooking.amount_paid || 0)

    // Calculate subtotal, tax amount, and grand total
    const subtotal = Math.max(
      0,
      newBaseRental + newInsurance + newDriver + newExtraKm + newLateFee + newFuel - newDiscount - couponDiscount
    )
    const newTaxAmount = Math.round((subtotal * (newTaxRate / 100)) * 100) / 100
    const newGrandTotal = Math.round((subtotal + newTaxAmount + newDeposit) * 100) / 100
    const newOutstanding = Math.max(0, Math.round((newGrandTotal - newAmountPaid) * 100) / 100)

    const updatePayload: Record<string, any> = {
      base_rental: newBaseRental,
      insurance_charge: newInsurance,
      driver_charge: newDriver,
      extra_km_charge: newExtraKm,
      late_fee: newLateFee,
      fuel_charge: newFuel,
      discount_amount: newDiscount,
      tax_rate: newTaxRate,
      tax_amount: newTaxAmount,
      security_deposit: newDeposit,
      grand_total: newGrandTotal,
      amount_paid: newAmountPaid,
      outstanding_amount: newOutstanding,
      with_insurance: newInsurance > 0,
      with_driver: newDriver > 0,
      updated_at: new Date().toISOString()
    }

    if (status !== undefined) updatePayload.status = status
    if (notes !== undefined) updatePayload.notes = notes
    if (admin_notes !== undefined) updatePayload.admin_notes = admin_notes

    const { error: updateErr } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)

    if (updateErr) throw updateErr

    // Also synchronize invoices if present
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('booking_id', id)
      .maybeSingle()

    if (invoice) {
      await supabase
        .from('invoices')
        .update({
          subtotal,
          tax_rate: newTaxRate,
          tax_amount: newTaxAmount,
          total: newGrandTotal,
          balance: newOutstanding,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id)
    }

    // Fetch full updated booking
    const { data: fullUpdatedBooking } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicle:vehicles(id, brand, model, registration_number, vehicle_type, daily_rate, hourly_rate, extra_km_charge, images:vehicle_images(id, url, is_primary)),
        customer:customers(id, customer_code, profile:profiles!customers_profile_id_fkey(id, full_name, email, phone)),
        pickup_branch:branches!pickup_branch_id(id, name, city),
        return_branch:branches!return_branch_id(id, name, city)
      `)
      .eq('id', id)
      .single()

    return NextResponse.json({
      success: true,
      data: fullUpdatedBooking as unknown as Booking,
      breakdown: {
        base_rental: newBaseRental,
        insurance_charge: newInsurance,
        driver_charge: newDriver,
        subtotal,
        tax_rate: newTaxRate,
        tax_amount: newTaxAmount,
        security_deposit: newDeposit,
        grand_total: newGrandTotal
      },
      message: 'Booking billing breakdown updated successfully!'
    })
  } catch (error: any) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update booking financials.' } },
      { status: 500 }
    )
  }
}
