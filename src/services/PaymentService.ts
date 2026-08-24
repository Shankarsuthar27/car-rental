import { createAdminClient } from '@/lib/supabase/admin'
import type { Payment, PaymentMethod, PaymentStatus } from '@/types'
import { AuditService } from './AuditService'
import crypto from 'crypto'

export class PaymentService {
  private static getClient() {
    return createAdminClient()
  }

  /**
   * Create a Razorpay order for a booking
   */
  static async createRazorpayOrder(
    bookingId: string,
    amount: number, // in INR
    currency = 'INR',
    notes?: Record<string, string>
  ): Promise<{ orderId: string; amount: number; currency: string; keyId: string }> {
    // Dynamic import to avoid issues at build time
    const Razorpay = (await import('razorpay')).default
    const rzp = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const order = await rzp.orders.create({
      amount: Math.round(amount * 100), // paise
      currency,
      receipt: bookingId,
      notes: notes ?? { booking_id: bookingId },
    })

    // Store pending payment record
    const supabase = this.getClient()
    const { data: booking } = await supabase
      .from('bookings')
      .select('customer_id')
      .eq('id', bookingId)
      .single()

    await supabase.from('payments').insert({
      booking_id: bookingId,
      customer_id: booking?.customer_id,
      amount,
      currency,
      payment_method: 'razorpay' as PaymentMethod,
      status: 'pending' as PaymentStatus,
      razorpay_order_id: order.id,
      description: `Payment for booking ${bookingId}`,
    })

    return {
      orderId: order.id,
      amount,
      currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    }
  }

  /**
   * Verify Razorpay payment signature (NEVER trust frontend-only)
   */
  static verifyRazorpaySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET!
    const body = orderId + '|' + paymentId
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    return expectedSignature === signature
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')
    return expectedSignature === signature
  }

  /**
   * Mark payment as successful after verification
   */
  static async markPaymentSuccess(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    actorProfileId?: string
  ): Promise<Payment> {
    // Verify signature first
    if (!this.verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      throw new Error('INVALID_SIGNATURE: Payment signature verification failed')
    }

    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'paid' as PaymentStatus,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpayOrderId)
      .select()
      .single()

    if (error) throw error

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'payment_success',
        module: 'payments',
        recordId: data.id,
        newValue: { amount: data.amount, razorpayPaymentId },
      })
    }

    return data as unknown as Payment
  }

  /**
   * Mark payment as failed
   */
  static async markPaymentFailed(razorpayOrderId: string): Promise<void> {
    const supabase = this.getClient()
    await supabase
      .from('payments')
      .update({ status: 'failed' as PaymentStatus, updated_at: new Date().toISOString() })
      .eq('razorpay_order_id', razorpayOrderId)
  }

  /**
   * Record a manual payment (cash/bank transfer)
   */
  static async recordManualPayment(
    bookingId: string,
    customerId: string,
    amount: number,
    method: PaymentMethod,
    referenceNumber?: string,
    notes?: string,
    actorProfileId?: string
  ): Promise<Payment> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        customer_id: customerId,
        amount,
        payment_method: method,
        status: 'paid' as PaymentStatus,
        reference_number: referenceNumber,
        payment_date: new Date().toISOString(),
        notes,
        processed_by: actorProfileId,
      })
      .select()
      .single()

    if (error) throw error

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'manual_payment_recorded',
        module: 'payments',
        recordId: data.id,
        newValue: { amount, method, referenceNumber },
      })
    }

    return data as unknown as Payment
  }

  /**
   * Process a refund via Razorpay
   */
  static async processRefund(
    paymentId: string,
    amount: number,
    reason: string,
    actorProfileId?: string
  ): Promise<void> {
    const supabase = this.getClient()

    const { data: payment } = await supabase
      .from('payments')
      .select('razorpay_payment_id, booking_id, customer_id')
      .eq('id', paymentId)
      .single()

    if (!payment) throw new Error('Payment not found')

    let rzpRefundId: string | undefined

    // Attempt Razorpay refund if it was a Razorpay payment
    if (payment.razorpay_payment_id) {
      try {
        const Razorpay = (await import('razorpay')).default
        const rzp = new Razorpay({
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!,
        })
        const refund = await rzp.payments.refund(payment.razorpay_payment_id, {
          amount: Math.round(amount * 100),
          notes: { reason },
        })
        rzpRefundId = refund.id
      } catch (e) {
        console.error('[PaymentService] Razorpay refund failed:', e)
      }
    }

    // Record refund
    await supabase.from('refunds').insert({
      booking_id: payment.booking_id,
      payment_id: paymentId,
      customer_id: payment.customer_id,
      amount,
      reason,
      status: rzpRefundId ? 'completed' : 'pending',
      razorpay_refund_id: rzpRefundId,
      processed_at: rzpRefundId ? new Date().toISOString() : null,
      processed_by: actorProfileId,
    })

    // Update payment status
    await supabase
      .from('payments')
      .update({
        status: 'refunded' as PaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'refund_processed',
        module: 'payments',
        recordId: paymentId,
        newValue: { amount, reason, rzpRefundId },
      })
    }
  }

  /**
   * Handle Razorpay webhook events
   */
  static async handleWebhook(event: {
    event: string
    payload: {
      payment?: { entity: Record<string, unknown> }
      order?: { entity: Record<string, unknown> }
    }
  }): Promise<void> {
    const supabase = this.getClient()

    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment?.entity
        if (payment?.order_id && payment?.id) {
          await supabase
            .from('payments')
            .update({
              status: 'paid' as PaymentStatus,
              razorpay_payment_id: payment.id as string,
              payment_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('razorpay_order_id', payment.order_id)
        }
        break
      }
      case 'payment.failed': {
        const payment = event.payload.payment?.entity
        if (payment?.order_id) {
          await supabase
            .from('payments')
            .update({
              status: 'failed' as PaymentStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('razorpay_order_id', payment.order_id)
        }
        break
      }
      case 'refund.processed': {
        const refundPaymentId = event.payload.payment?.entity?.id
        if (refundPaymentId) {
          await supabase
            .from('payments')
            .update({
              status: 'refunded' as PaymentStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('razorpay_payment_id', refundPaymentId)
        }
        break
      }
    }
  }

  /**
   * Get payments for a booking
   */
  static async getBookingPayments(bookingId: string): Promise<Payment[]> {
    const supabase = this.getClient()
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as unknown as Payment[]
  }
}
