import { createAdminClient } from '@/lib/supabase/admin'
import type { Notification, NotificationType } from '@/types'

interface NotificationPayload {
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown>
}

export class NotificationService {
  private static getClient() {
    return createAdminClient()
  }

  /**
   * Send in-app notification to a user
   */
  static async sendInApp(
    userId: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const supabase = this.getClient()
      await supabase.from('notifications').insert({
        user_id: userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      })
    } catch {
      console.error('[NotificationService] Failed to send in-app notification')
    }
  }

  /**
   * Send email notification via Resend REST API (zero npm dependencies)
   */
  static async sendEmail(
    to: string,
    subject: string,
    htmlContent: string
  ): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
      console.log('[NotificationService] Email skipped — RESEND_API_KEY not set')
      return
    }

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'DriveEase <noreply@driveease.in>',
          to,
          subject,
          html: htmlContent
        })
      })
    } catch (e) {
      console.error('[NotificationService] Email send failed:', e)
    }
  }

  /**
   * Send SMS notification (modular — replace with Twilio/MSG91)
   */
  static async sendSms(phone: string, message: string): Promise<void> {
    if (!process.env.TWILIO_ACCOUNT_SID) {
      console.log('[NotificationService] SMS skipped — TWILIO_ACCOUNT_SID not set')
      return
    }
    console.log(`[SMS] To: ${phone} | Message: ${message}`)
  }

  /**
   * Send WhatsApp notification (modular)
   */
  static async sendWhatsApp(phone: string, message: string): Promise<void> {
    if (!process.env.WHATSAPP_API_KEY) {
      console.log('[NotificationService] WhatsApp skipped — API key not set')
      return
    }
    console.log(`[WhatsApp] To: ${phone} | Message: ${message}`)
  }

  /**
   * Send booking confirmation across all channels
   */
  static async notifyBookingConfirmed(
    userProfileId: string,
    bookingNumber: string,
    customerEmail: string,
    customerPhone: string,
    pickupDatetime: string,
    vehicleName: string
  ): Promise<void> {
    const message = `Your booking ${bookingNumber} for ${vehicleName} is confirmed. Pickup: ${new Date(pickupDatetime).toLocaleString('en-IN')}`

    await Promise.allSettled([
      this.sendInApp(userProfileId, {
        type: 'booking_confirmed',
        title: `Booking Confirmed — ${bookingNumber}`,
        body: message,
        data: { bookingNumber },
      }),
      this.sendEmail(
        customerEmail,
        `Booking Confirmed — ${bookingNumber} | DriveEase`,
        `<h2>Booking Confirmed!</h2><p>${message}</p><p>Thank you for choosing DriveEase.</p>`
      ),
      this.sendSms(customerPhone, message),
    ])
  }

  /**
   * Get unread notifications for a user
   */
  static async getNotifications(
    userId: string,
    unreadOnly = false,
    limit = 20
  ): Promise<Notification[]> {
    const supabase = this.getClient()

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data } = await query
    return (data ?? []) as unknown as Notification[]
  }

  /**
   * Mark notification as read
   */
  static async markRead(notificationId: string, userId: string): Promise<void> {
    const supabase = this.getClient()
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)
  }

  /**
   * Mark all notifications as read
   */
  static async markAllRead(userId: string): Promise<void> {
    const supabase = this.getClient()
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const supabase = this.getClient()
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    return count ?? 0
  }

  /**
   * Schedule pickup reminder
   */
  static async sendPickupReminders(): Promise<void> {
    const supabase = this.getClient()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStart = tomorrow.toISOString().split('T')[0] + 'T00:00:00'
    const tomorrowEnd = tomorrow.toISOString().split('T')[0] + 'T23:59:59'

    const { data: bookings } = await supabase
      .from('bookings')
      .select(
        `
        id, booking_number, pickup_datetime,
        customer:customers(
          profile:profiles(id, email, phone)
        ),
        vehicle:vehicles(brand, model)
      `
      )
      .eq('status', 'confirmed')
      .gte('pickup_datetime', tomorrowStart)
      .lte('pickup_datetime', tomorrowEnd)

    for (const booking of bookings ?? []) {
      const profile = (booking.customer as unknown as { profile: { id: string; email: string; phone: string } })?.profile
      const vehicle = booking.vehicle as unknown as { brand: string; model: string }
      if (profile) {
        await this.sendInApp(profile.id, {
          type: 'pickup_reminder',
          title: 'Pickup Reminder',
          body: `Your ${vehicle?.brand} ${vehicle?.model} pickup is scheduled for tomorrow at ${new Date(booking.pickup_datetime).toLocaleTimeString('en-IN')}`,
          data: { bookingNumber: booking.booking_number },
        })
      }
    }
  }
}
