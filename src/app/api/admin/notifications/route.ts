import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerPermissionState } from '@/lib/server-permissions'

export async function GET() {
  try {
    const state = await getServerPermissionState()
    if (!state.role || state.role === 'customer') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin session required.' },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, body, data, is_read, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data || [])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch notifications'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const state = await getServerPermissionState()
    if (!state.role || state.role === 'customer') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin session required.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    if (body?.markAll) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: now })
        .eq('is_read', false)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    if (typeof body?.id === 'string' && body.id.trim()) {
      const notifId = body.id.trim()
      const action = body?.action === 'accept' || body?.action === 'reject' ? body.action : null

      if (action) {
        const { data: existing, error: fetchErr } = await supabase
          .from('notifications')
          .select('id, data')
          .eq('id', notifId)
          .single()

        if (fetchErr || !existing) {
          return NextResponse.json(
            { error: fetchErr?.message || 'Notification not found' },
            { status: 404 }
          )
        }

        const prevData =
          existing.data && typeof existing.data === 'object'
            ? (existing.data as Record<string, unknown>)
            : {}
        const inquiryStatus = action === 'accept' ? 'accepted' : 'rejected'
        const updatedData = {
          ...prevData,
          inquiry_status: inquiryStatus,
          reviewed_at: now,
        }

        const { error: updateErr } = await supabase
          .from('notifications')
          .update({ data: updatedData, is_read: true, read_at: now })
          .eq('id', notifId)

        if (updateErr) {
          return NextResponse.json({ error: updateErr.message }, { status: 400 })
        }

        // If linked to an existing booking record, sync its status too
        if (typeof prevData.booking_id === 'string' && prevData.booking_id.trim()) {
          await supabase
            .from('bookings')
            .update({ status: action === 'accept' ? 'confirmed' : 'cancelled' })
            .eq('id', prevData.booking_id.trim())
        }

        return NextResponse.json({ success: true, inquiry_status: inquiryStatus })
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: now })
        .eq('id', notifId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update notifications'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const state = await getServerPermissionState()
    if (!state.role || state.role === 'customer') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin session required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    let id = searchParams.get('id')?.trim() || ''

    if (!id) {
      try {
        const body = await req.json()
        if (typeof body?.id === 'string') {
          id = body.id.trim()
        }
      } catch {
        // Ignore empty body when id is missing
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.from('notifications').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete notification'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
