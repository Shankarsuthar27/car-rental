import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      booking_id,
      return_datetime = new Date().toISOString(),
      ending_odometer,
      fuel_level = 'full',
      damage_description = '',
      damage_cost = 0,
      late_charges = 0,
      extra_km_charges = 0,
      cleaning_charges = 0,
      other_charges = 0,
      discount_amount = 0,
      tax_rate = 18,
      deposit_settlement = 'refunded', // 'refunded' | 'deducted' | 'held' | 'forfeited'
      payment_method = 'cash',
      payment_collected_now = 0,
      admin_notes = '',
    } = body

    if (!booking_id || ending_odometer === undefined) {
      return NextResponse.json(
        { success: false, error: { message: 'Booking ID and Ending Odometer are required.' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Fetch booking with vehicle and customer
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*, vehicle:vehicles(*), customer:customers(*)')
      .eq('id', booking_id)
      .single()

    if (fetchErr || !booking) {
      return NextResponse.json(
        { success: false, error: { message: 'Booking not found.' } },
        { status: 404 }
      )
    }

    const startOdo = Number(booking.pickup_odometer || booking.vehicle?.current_odometer || 0)
    const endOdo = Number(ending_odometer)

    if (endOdo < startOdo) {
      return NextResponse.json(
        {
          success: false,
          error: { message: `Ending odometer (${endOdo} KM) cannot be less than starting odometer (${startOdo} KM).` },
        },
        { status: 400 }
      )
    }

    const totalKmDriven = endOdo - startOdo
    const baseRental = Number(booking.base_rental || 0)
    const lateFee = Number(late_charges) || 0
    const extraKmFee = Number(extra_km_charges) || 0
    const damageFee = Number(damage_cost) || 0
    const cleaningFee = Number(cleaning_charges) || 0
    const otherFee = Number(other_charges) || 0
    const discount = Number(discount_amount) || 0
    const taxRateNum = Number(tax_rate || booking.tax_rate || 18)

    // Formula: Base Rental + Late + Extra KM + Damage + Cleaning + Other - Discount
    const subtotal = Math.max(
      0,
      baseRental + lateFee + extraKmFee + damageFee + cleaningFee + otherFee - discount
    )
    const taxAmount = Math.round((subtotal * (taxRateNum / 100)) * 100) / 100
    const secDeposit = Number(booking.security_deposit || 0)

    // Final total calculation
    const finalGrandTotal = Math.round((subtotal + taxAmount) * 100) / 100
    const previousPaid = Number(booking.amount_paid || 0)
    const paidNow = Number(payment_collected_now) || 0
    const totalPaid = previousPaid + paidNow

    const paymentStatus =
      totalPaid >= finalGrandTotal
        ? 'paid'
        : totalPaid > 0
        ? 'partially_paid'
        : 'pending'

    const returnTimestamp = new Date(return_datetime).toISOString()

    // 2. Update booking record to completed
    const { error: updateBookingErr } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        payment_status: paymentStatus,
        actual_return_datetime: returnTimestamp,
        return_odometer: endOdo,
        extra_km_charge: extraKmFee,
        late_fee: lateFee,
        discount_amount: discount,
        tax_amount: taxAmount,
        grand_total: finalGrandTotal,
        amount_paid: totalPaid,
        outstanding_amount: Math.max(0, finalGrandTotal - totalPaid),
        admin_notes: admin_notes
          ? `${booking.admin_notes || ''}\nReturn: ${admin_notes}`
          : booking.admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking_id)

    if (updateBookingErr) throw updateBookingErr

    // 3. Update vehicle status -> available and odometer -> endOdo
    await supabase
      .from('vehicles')
      .update({
        status: 'available',
        current_odometer: endOdo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.vehicle_id)

    // 4. Create vehicle return inspection record
    await supabase.from('vehicle_inspections').insert({
      booking_id: booking.id,
      vehicle_id: booking.vehicle_id,
      inspection_type: 'return',
      odometer: endOdo,
      fuel_level: fuel_level,
      condition_rating: damageFee > 0 ? 3 : 5,
      has_scratches: damageFee > 0,
      damage_description: damage_description || 'Standard return condition',
      notes: admin_notes || 'Vehicle returned and verified by admin.',
    })

    // 5. If damage reported, record vehicle damage
    if (damageFee > 0) {
      await supabase.from('vehicle_damage').insert({
        vehicle_id: booking.vehicle_id,
        booking_id: booking.id,
        customer_id: booking.customer_id,
        damage_type: 'Return Inspection Damage',
        description: damage_description || 'Reported upon vehicle return',
        estimated_cost: damageFee,
        final_cost: damageFee,
        is_customer_responsible: true,
        status: 'resolved',
      })
    }

    // 6. Record payment if collected now
    if (paidNow > 0) {
      await supabase.from('payments').insert({
        booking_id: booking.id,
        customer_id: booking.customer_id,
        amount: paidNow,
        currency: 'INR',
        payment_method: payment_method || 'cash',
        status: 'paid',
        reference_number: `RETURN-PAY-${Date.now()}`,
        payment_date: new Date().toISOString(),
        description: `Settlement balance payment on return for ${booking.booking_number}`,
      })
    }

    // 7. Update / insert invoice
    await supabase
      .from('invoices')
      .update({
        subtotal,
        discount,
        tax_rate: taxRateNum,
        tax_amount: taxAmount,
        total: finalGrandTotal,
        amount_paid: totalPaid,
        balance: Math.max(0, finalGrandTotal - totalPaid),
        is_paid: paymentStatus === 'paid',
        paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('booking_id', booking.id)

    // 8. Update customer stats
    const { data: customerRecord } = await supabase
      .from('customers')
      .select('total_rentals, total_spent')
      .eq('id', booking.customer_id)
      .single()

    if (customerRecord) {
      await supabase
        .from('customers')
        .update({
          total_rentals: (customerRecord.total_rentals || 0) + 1,
          total_spent: Number(customerRecord.total_spent || 0) + finalGrandTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.customer_id)
    }

    return NextResponse.json({
      success: true,
      data: {
        booking_id,
        vehicle_id: booking.vehicle_id,
        final_grand_total: finalGrandTotal,
        total_km_driven: totalKmDriven,
        status: 'completed',
        vehicle_status: 'available',
      },
      message: `Vehicle ${booking.vehicle?.brand} ${booking.vehicle?.model} return completed! Vehicle is now Available. Final bill: ₹${finalGrandTotal.toLocaleString('en-IN')}`,
    })
  } catch (error: any) {
    console.error('Return car error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to process vehicle return.' } },
      { status: 500 }
    )
  }
}
