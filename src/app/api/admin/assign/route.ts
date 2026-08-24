import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCustomer } from '@/lib/customers'
import { NotificationService } from '@/services/NotificationService'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      customer_id,
      vehicle_id,
      rental_type, // 'hourly' | 'daily'
      pickup_datetime,
      return_datetime,
      starting_km,
      rental_price,
      security_deposit,
      driver_charge = 0,
      insurance_charge = 0,
      discount_amount = 0,
      tax_rate = 18,
      advance_amount_paid = 0,
      payment_method = 'cash',
      notes = '',
      admin_notes = '',
    } = body

    if (!customer_id || !vehicle_id || !pickup_datetime || !return_datetime) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Customer, Vehicle, and Pickup/Return Date Times are required.' },
        },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Verify that the vehicle is available (prevent double booking)
    const { data: vehicle, error: vehicleErr } = await supabase
      .from('vehicles')
      .select('id, brand, model, registration_number, current_odometer, status, daily_rate, hourly_rate')
      .eq('id', vehicle_id)
      .single()

    if (vehicleErr || !vehicle) {
      return NextResponse.json(
        { success: false, error: { message: 'Selected vehicle not found.' } },
        { status: 404 }
      )
    }

    if (vehicle.status !== 'available') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Vehicle ${vehicle.brand} ${vehicle.model} (${vehicle.registration_number}) is currently ${vehicle.status} and cannot be assigned.`,
          },
        },
        { status: 409 }
      )
    }

    // 2. Fetch customer details
    let customer: any = null
    const { data: foundCustomer } = await supabase
      .from('customers')
      .select('id, profile_id, emergency_contact_name, emergency_contact_phone, customer_code, profile:profiles!customers_profile_id_fkey(full_name, phone, email)')
      .eq('id', customer_id)
      .maybeSingle()

    if (foundCustomer) {
      customer = foundCustomer
    } else {
      const customerCode = `CUST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      const { data: newCust, error: custInsErr } = await supabase
        .from('customers')
        .insert({
          customer_code: customerCode,
          emergency_contact_name: 'Registered Customer',
          city: 'Jaipur',
          state: 'Rajasthan',
          country: 'India',
          kyc_status: 'verified',
        })
        .select('id, profile_id, emergency_contact_name, emergency_contact_phone, customer_code, profile:profiles!customers_profile_id_fkey(full_name, phone, email)')
        .single()

      if (custInsErr || !newCust) {
        return NextResponse.json(
          { success: false, error: { message: 'Selected customer record not found.' } },
          { status: 404 }
        )
      }
      customer = newCust
    }

    // 3. Financial calculations
    const baseRental = Number(rental_price) || 0
    const secDeposit = Number(security_deposit) || 0
    const driverFee = Number(driver_charge) || 0
    const insFee = Number(insurance_charge) || 0
    const discount = Number(discount_amount) || 0
    const taxRateNum = Number(tax_rate) || 18

    const subtotal = Math.max(0, baseRental + driverFee + insFee - discount)
    const taxAmount = Math.round((subtotal * (taxRateNum / 100)) * 100) / 100
    const grandTotal = Math.round((subtotal + taxAmount + secDeposit) * 100) / 100
    const amountPaid = Number(advance_amount_paid) || 0
    const outstanding = Math.max(0, grandTotal - amountPaid)

    const paymentStatus =
      amountPaid >= grandTotal
        ? 'paid'
        : amountPaid > 0
        ? 'partially_paid'
        : 'pending'

    const startingKmNum = Number(starting_km) || vehicle.current_odometer || 0

    // Unique Booking/Rental Number
    const bookingNumber = `RNT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

    // 4. Create active booking record
    const { data: newBooking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        customer_id,
        vehicle_id,
        status: 'active', // Immediately Running
        payment_status: paymentStatus,
        pickup_datetime: new Date(pickup_datetime).toISOString(),
        return_datetime: new Date(return_datetime).toISOString(),
        actual_pickup_datetime: new Date().toISOString(),
        pickup_odometer: startingKmNum,
        base_rental: baseRental,
        driver_charge: driverFee,
        insurance_charge: insFee,
        discount_amount: discount,
        tax_rate: taxRateNum,
        tax_amount: taxAmount,
        security_deposit: secDeposit,
        grand_total: grandTotal,
        amount_paid: amountPaid,
        outstanding_amount: outstanding,
        with_driver: driverFee > 0,
        with_insurance: insFee > 0,
        notes: notes || `Car assigned directly by admin. Rental Type: ${rental_type}`,
        admin_notes: admin_notes || 'Assigned via Admin Assign Car Workflow',
      })
      .select('*, vehicle:vehicles(*), customer:customers(*, profile:profiles!customers_profile_id_fkey(*))')
      .single()

    if (bookingErr || !newBooking) {
      throw bookingErr || new Error('Failed to create rental record.')
    }

    // 5. Update vehicle status from available -> rented (Running) and update odometer
    await supabase
      .from('vehicles')
      .update({
        status: 'rented',
        current_odometer: startingKmNum,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vehicle_id)

    // 6. Record payment if advance was collected
    if (amountPaid > 0) {
      await supabase.from('payments').insert({
        booking_id: newBooking.id,
        customer_id,
        amount: amountPaid,
        currency: 'INR',
        payment_method: payment_method || 'cash',
        status: 'paid',
        reference_number: `ASSIGN-${Date.now()}`,
        payment_date: new Date().toISOString(),
        description: `Advance rental & deposit payment for ${bookingNumber}`,
      })
    }

    // 7. Generate invoice
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    await supabase.from('invoices').insert({
      invoice_number: invoiceNumber,
      booking_id: newBooking.id,
      customer_id,
      invoice_type: 'rental_invoice',
      invoice_date: new Date().toISOString().split('T')[0],
      subtotal,
      discount,
      tax_rate: taxRateNum,
      tax_amount: taxAmount,
      total: grandTotal,
      amount_paid: amountPaid,
      balance: outstanding,
      is_paid: paymentStatus === 'paid',
    })

    const finalCustomer = formatCustomer(newBooking.customer || customer)
    const finalVehicle = newBooking.vehicle || vehicle
    const returnData = {
      ...newBooking,
      customer: finalCustomer,
      vehicle: finalVehicle,
    }

    // 8. Dispatch Email notification to Owner / Admin
    NotificationService.notifyCarAssignedToOwner({
      bookingNumber,
      vehicleBrand: vehicle.brand,
      vehicleModel: vehicle.model,
      registrationNumber: vehicle.registration_number,
      startingKm: startingKmNum,
      customerName: finalCustomer.profile?.full_name || 'Valued Customer',
      customerPhone: finalCustomer.profile?.phone || '—',
      customerEmail: finalCustomer.profile?.email,
      customerDl: finalCustomer.driving_license_number || finalCustomer.profile?.driving_license_number,
      rentalType,
      pickupDatetime,
      returnDatetime,
      grandTotal,
      advancePaid: amountPaid,
      outstandingBalance: outstanding,
      paymentMethod: payment_method || 'cash',
      paymentStatus,
      notes,
    }).catch(err => console.error('[AssignAPI] Notification dispatch error:', err))

    return NextResponse.json({
      success: true,
      data: returnData,
      message: `Car ${vehicle.brand} ${vehicle.model} (${vehicle.registration_number}) successfully assigned to ${finalCustomer.profile?.full_name || 'Customer'}! Rental ID: ${bookingNumber}`,
    })
  } catch (error: any) {
    console.error('Assign car error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to assign car.' } },
      { status: 500 }
    )
  }
}
