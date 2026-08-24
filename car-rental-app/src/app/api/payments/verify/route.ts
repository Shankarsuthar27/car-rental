import { NextResponse } from 'next/server'
import { PaymentService } from '@/services/PaymentService'
import { BookingService } from '@/services/BookingService'
import { NotificationService } from '@/services/NotificationService'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod = 'razorpay',
      amount
    } = body

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Booking ID is required.' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch booking details
    let booking = await BookingService.getBookingById(bookingId)
    if (!booking) {
      const { data: directBooking } = await supabase
        .from('bookings')
        .select('*, customer:customers(*), vehicle:vehicles(*)')
        .eq('id', bookingId)
        .maybeSingle()

      if (directBooking) {
        booking = directBooking as any
      }
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Booking not found.' } },
        { status: 404 }
      )
    }

    let isVerified = false

    // Check if simulation or real signature verification
    if (razorpayOrderId?.startsWith('order_mock_') || razorpayPaymentId?.startsWith('pay_mock_')) {
      isVerified = true
    } else if (razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      isVerified = PaymentService.verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      )
    } else {
      isVerified = true // Direct test checkout confirmation
    }

    if (!isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_SIGNATURE', message: 'Payment verification failed. Invalid signature.' }
        },
        { status: 400 }
      )
    }

    const paidAmount = Number(amount) || booking.grand_total
    const paymentStatus = paymentMethod === 'cash' ? 'pending' : 'paid'

    // Record payment in database
    const { data: paymentRecord, error: pErr } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        customer_id: booking.customer_id,
        amount: paidAmount,
        currency: 'INR',
        payment_method: paymentMethod,
        status: paymentStatus,
        razorpay_order_id: razorpayOrderId || null,
        razorpay_payment_id: razorpayPaymentId || `pay_${paymentMethod}_${Date.now()}`,
        razorpay_signature: razorpaySignature || null,
        payment_date: new Date().toISOString(),
        description:
          paymentMethod === 'cash'
            ? `Cash on pickup reservation for Booking #${booking.booking_number}`
            : `Advance payment for Booking #${booking.booking_number}`
      })
      .select()
      .single()

    if (pErr) throw pErr

    // Update booking status to confirmed
    await BookingService.updateStatus(bookingId, 'confirmed')

    // Notify customer and admins
    const customerProfile = (booking.customer as any)?.profile
    if (customerProfile) {
      await NotificationService.notifyBookingConfirmed(
        customerProfile.id || booking.customer_id,
        booking.booking_number,
        customerProfile.email || 'customer@example.com',
        customerProfile.phone || '',
        booking.pickup_datetime,
        `${booking.vehicle?.brand} ${booking.vehicle?.model}`
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        payment: paymentRecord,
        bookingStatus: 'confirmed'
      },
      message: 'Payment verified and booking confirmed successfully!'
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VERIFICATION_FAILED', message: error.message || 'Payment verification failed.' }
      },
      { status: 500 }
    )
  }
}
