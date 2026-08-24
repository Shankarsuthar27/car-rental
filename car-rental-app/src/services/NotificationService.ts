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
  ): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey || apiKey === 're_placeholder') {
      console.log('[NotificationService] Email skipped — RESEND_API_KEY not configured')
      return false
    }

    const fromAddress = process.env.RESEND_FROM_EMAIL || 'DriveEase Fleet <onboarding@resend.dev>'

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: Array.isArray(to) ? to : [to],
          subject,
          html: htmlContent
        })
      })

      const result = await response.json()
      if (!response.ok) {
        console.error('[NotificationService] Resend API Error:', result)
        return false
      }

      console.log(`[NotificationService] Email successfully sent to ${to} (ID: ${result.id})`)
      return true
    } catch (e) {
      console.error('[NotificationService] Email send exception:', e)
      return false
    }
  }

  /**
   * Send Password Reset OTP Email
   */
  static async notifyPasswordResetOtp(to: string, otp: string, expiryMinutes = 10): Promise<boolean> {
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'DriveEase'
    const emailSubject = `🔐 ${otp} is your password reset code | ${appName}`

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px 25px; text-align: center;">
              <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #e0e7ff; margin-bottom: 6px;">
                🛡️ Security Verification
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; line-height: 1.2;">
                Reset Your Password
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 30px 25px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #e5e7eb; line-height: 1.5;">
                Hello,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                We received a request to reset the password for your <strong>${appName}</strong> administrator account. Use the 6-digit verification code below to proceed:
              </p>

              <!-- OTP Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background: #1f2937; border: 2px dashed #6366f1; border-radius: 16px; padding: 20px 10px;">
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #a5b4fc; text-indent: 12px;">
                      ${otp}
                    </div>
                    <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
                      ⏱️ Valid for <strong>${expiryMinutes} minutes</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <div style="background-color: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #fca5a5; line-height: 1.5;">
                  <strong>Security Reminder:</strong> Never share this OTP with anyone. DriveEase staff will never ask for your password or verification code.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                If you did not request a password reset, you can safely ignore this email. Your existing password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 25px; border-top: 1px solid #1f2937; text-align: center; font-size: 11px; color: #6b7280;">
              ${appName} Fleet Management System • Automated Security Alert<br>
              Sent to: <span style="color: #9ca3af;">${to}</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
    return await this.sendEmail(to, emailSubject, htmlContent)
  }

  /**
   * Send comprehensive Car Assignment & Dispatch notification to Owner & Admin
   */
  static async notifyCarAssignedToOwner(params: {
    bookingNumber: string
    vehicleBrand: string
    vehicleModel: string
    registrationNumber: string
    startingKm: number
    customerName: string
    customerPhone: string
    customerEmail?: string
    customerDl?: string
    rentalType: string
    pickupDatetime: string
    returnDatetime: string
    grandTotal: number
    advancePaid: number
    outstandingBalance: number
    paymentMethod: string
    paymentStatus: string
    notes?: string
  }): Promise<void> {
    const {
      bookingNumber,
      vehicleBrand,
      vehicleModel,
      registrationNumber,
      startingKm,
      customerName,
      customerPhone,
      customerEmail,
      customerDl,
      rentalType,
      pickupDatetime,
      returnDatetime,
      grandTotal,
      advancePaid,
      outstandingBalance,
      paymentMethod,
      paymentStatus,
      notes,
    } = params

    const ownerEmail = process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL || 'ss2137789@gmail.com'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driveease.in'

    const emailSubject = `🚗 Car Assigned: ${vehicleBrand} ${vehicleModel} (${registrationNumber}) → ${customerName} [${bookingNumber}]`

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #e0e7ff; margin-bottom: 6px;">
                ⚡ Fleet Dispatch Alert
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; line-height: 1.2;">
                Vehicle Assigned & Dispatched!
              </h1>
              <div style="margin-top: 10px; display: inline-block; background-color: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 9999px; font-family: monospace; font-size: 13px; color: #ffffff;">
                Rental ID: <strong>${bookingNumber}</strong>
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 30px 25px;">
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
                A fleet vehicle has just been marked as <strong style="color: #3b82f6;">Running</strong> and dispatched to an active customer. Here are the full rental details:
              </p>

              <!-- Vehicle Details Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; margin-bottom: 16px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #374151; background-color: #273142;">
                    <strong style="color: #a78bfa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">🚘 Assigned Vehicle</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 18px;">
                    <div style="font-size: 18px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">
                      ${vehicleBrand} ${vehicleModel}
                    </div>
                    <div style="font-size: 13px; color: #9ca3af; font-family: monospace;">
                      Plate Number: <strong style="color: #60a5fa;">${registrationNumber}</strong>
                    </div>
                    <div style="font-size: 12px; color: #9ca3af; margin-top: 6px;">
                      Starting Odometer: <strong>${startingKm.toLocaleString('en-IN')} KM</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Customer Details Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; margin-bottom: 16px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #374151; background-color: #273142;">
                    <strong style="color: #34d399; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">👤 Customer & Driver Information</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 18px;">
                    <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 6px;">
                      ${customerName}
                    </div>
                    <div style="font-size: 13px; color: #d1d5db; margin-bottom: 4px;">
                      📞 Phone: <a href="tel:${customerPhone}" style="color: #60a5fa; text-decoration: none;">${customerPhone}</a>
                    </div>
                    ${customerEmail ? `<div style="font-size: 13px; color: #d1d5db; margin-bottom: 4px;">✉️ Email: <a href="mailto:${customerEmail}" style="color: #60a5fa; text-decoration: none;">${customerEmail}</a></div>` : ''}
                    ${customerDl ? `<div style="font-size: 13px; color: #9ca3af;">🪪 Driving License: <strong style="color: #f3f4f6;">${customerDl}</strong></div>` : ''}
                  </td>
                </tr>
              </table>

              <!-- Schedule & Terms Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; margin-bottom: 16px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #374151; background-color: #273142;">
                    <strong style="color: #fbbf24; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">⏱️ Rental Period & Terms</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 18px; font-size: 13px; color: #d1d5db; line-height: 1.6;">
                    <div>Rate Plan: <strong style="text-transform: capitalize; color: #ffffff;">${rentalType} Rental</strong></div>
                    <div>Pickup: <strong style="color: #ffffff;">${new Date(pickupDatetime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong></div>
                    <div>Expected Return: <strong style="color: #ffffff;">${new Date(returnDatetime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong></div>
                  </td>
                </tr>
              </table>

              <!-- Financial Summary Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1f2937; border: 1px solid #374151; border-radius: 14px; margin-bottom: 24px; overflow: hidden;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #374151; background-color: #273142;">
                    <strong style="color: #60a5fa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">💳 Financial Summary</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 18px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px; color: #9ca3af;">
                      <tr>
                        <td>Grand Total:</td>
                        <td align="right" style="font-weight: 700; color: #ffffff; font-size: 15px;">₹${grandTotal.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td>Advance Paid (${paymentMethod}):</td>
                        <td align="right" style="font-weight: 700; color: #34d399;">₹${advancePaid.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td>Outstanding Balance:</td>
                        <td align="right" style="font-weight: 700; color: ${outstandingBalance > 0 ? '#f87171' : '#34d399'};">₹${outstandingBalance.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td>Payment Status:</td>
                        <td align="right" style="text-transform: uppercase; font-weight: 800; color: ${paymentStatus === 'paid' ? '#34d399' : '#fbbf24'}; font-size: 11px;">${paymentStatus}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${notes ? `
              <div style="background-color: rgba(255,255,255,0.03); border-left: 3px solid #6366f1; padding: 10px 14px; margin-bottom: 20px; font-size: 12px; color: #9ca3af; border-radius: 0 8px 8px 0;">
                <strong>Assignment Notes:</strong> ${notes}
              </div>
              ` : ''}

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/admin/dashboard" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                      Open Fleet Operations Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 25px; border-top: 1px solid #1f2937; text-align: center; font-size: 11px; color: #6b7280;">
              DriveEase Fleet Management System • Automated Dispatch Notification<br>
              Sent securely to authorized owner: <span style="color: #9ca3af;">${ownerEmail}</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

    // 1. Send to Owner / Administrator
    await this.sendEmail(ownerEmail, emailSubject, htmlContent)

    // 2. Also send confirmation to customer if customer email is available
    if (customerEmail && customerEmail.includes('@') && customerEmail !== ownerEmail) {
      await this.sendEmail(
        customerEmail,
        `Your Rental Confirmation — ${vehicleBrand} ${vehicleModel} [${bookingNumber}] | DriveEase`,
        htmlContent
      )
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
