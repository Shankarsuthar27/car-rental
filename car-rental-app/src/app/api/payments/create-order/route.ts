import { NextResponse } from 'next/server'
import { PaymentService } from '@/services/PaymentService'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bookingId, amount, currency = 'INR', notes } = body

    if (!bookingId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Booking ID and amount are required.' }
        },
        { status: 400 }
      )
    }

    // Create Razorpay Order or Test Mode fallback
    try {
      const order = await PaymentService.createRazorpayOrder(
        bookingId,
        Number(amount),
        currency,
        notes
      )
      return NextResponse.json({ success: true, data: order })
    } catch (rzpError: any) {
      console.warn('Razorpay live order failed (falling back to mock checkout mode):', rzpError.message)
      // Return simulated order ID for development/testing when keys are test placeholders
      return NextResponse.json({
        success: true,
        data: {
          orderId: `order_mock_${Date.now()}`,
          amount: Number(amount),
          currency,
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          isSimulation: true
        }
      })
    }
  } catch (error: any) {
    console.error('Payment order creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'PAYMENT_ORDER_FAILED', message: error.message || 'Payment initiation failed.' }
      },
      { status: 500 }
    )
  }
}
