import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  checkServerPermission,
  getServerPermissionState,
  redactPaymentRecord,
} from '@/lib/server-permissions'

const PAYMENT_READ_PERMISSIONS = [
  'payments.view',
  'payments.view_amounts',
  'payments.view_balances',
  'payments.view_details',
]

// GET: List payments with permission-aware field redaction
export async function GET() {
  try {
    const state = await getServerPermissionState()
    const canRead =
      state.isUnrestricted ||
      PAYMENT_READ_PERMISSIONS.some((perm) => state.permissions.includes(perm))

    if (!canRead) {
      return NextResponse.json(
        { error: 'Unauthorized: Insufficient permission to view payments.' },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('payments')
      .select(
        '*, customer:customers(profile:profiles!customers_profile_id_fkey(full_name)), booking:bookings(booking_number)'
      )
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const sanitized = (data || []).map((payment) => redactPaymentRecord(payment, state))
    return NextResponse.json(sanitized)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

// POST: Record a manual counter payment
export async function POST(req: Request) {
  try {
    const allowed = await checkServerPermission('payments.collect')
    if (!allowed) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to collect or record payments.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const numericAmount = Number(body.amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'A valid positive payment amount is required.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    let customerId =
      typeof body.customer_id === 'string' && body.customer_id.trim()
        ? body.customer_id.trim()
        : null
    let bookingId =
      typeof body.booking_id === 'string' && body.booking_id.trim()
        ? body.booking_id.trim()
        : null

    // Resolve booking_number when staff enters a booking number instead of a UUID
    if (bookingId && !bookingId.includes('-')) {
      const { data: bookingMatch } = await supabase
        .from('bookings')
        .select('id, customer_id')
        .ilike('booking_number', bookingId)
        .maybeSingle()
      if (bookingMatch) {
        bookingId = bookingMatch.id
        if (!customerId) customerId = bookingMatch.customer_id
      }
    } else if (bookingId && /^RNT-/i.test(bookingId)) {
      const { data: bookingMatch } = await supabase
        .from('bookings')
        .select('id, customer_id')
        .ilike('booking_number', bookingId)
        .maybeSingle()
      if (bookingMatch) {
        bookingId = bookingMatch.id
        if (!customerId) customerId = bookingMatch.customer_id
      }
    }

    const insertPayload = {
      booking_id: bookingId || '11111111-0000-0000-0000-000000000001',
      customer_id: customerId || '11111111-0000-0000-0000-000000000001',
      amount: numericAmount,
      currency: 'INR',
      payment_method:
        typeof body.payment_method === 'string' && body.payment_method.trim()
          ? body.payment_method.trim()
          : 'cash',
      status:
        typeof body.status === 'string' && body.status.trim() ? body.status.trim() : 'paid',
      reference_number:
        typeof body.reference_number === 'string' && body.reference_number.trim()
          ? body.reference_number.trim()
          : `MANUAL-${Date.now()}`,
      payment_date: new Date().toISOString(),
      description:
        typeof body.description === 'string' && body.description.trim()
          ? body.description.trim()
          : 'Manual counter payment collection',
    }

    const { data: newPayment, error } = await supabase
      .from('payments')
      .insert(insertPayload)
      .select(
        '*, customer:customers(profile:profiles!customers_profile_id_fkey(full_name)), booking:bookings(booking_number)'
      )
      .single()

    if (error || !newPayment) {
      return NextResponse.json(
        { error: error?.message || 'Failed to record payment' },
        { status: 400 }
      )
    }

    const state = await getServerPermissionState()
    return NextResponse.json(redactPaymentRecord(newPayment, state), { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to record payment' },
      { status: 500 }
    )
  }
}
