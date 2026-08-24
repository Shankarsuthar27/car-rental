import { createAdminClient } from '@/lib/supabase/admin'
import type { Invoice, InvoiceItem, InvoiceType, Booking } from '@/types'
import { AuditService } from './AuditService'

export class InvoiceService {
  private static getClient() {
    return createAdminClient()
  }

  /**
   * Create invoice from a booking
   */
  static async createFromBooking(
    bookingId: string,
    invoiceType: InvoiceType = 'rental_invoice',
    actorProfileId?: string
  ): Promise<Invoice> {
    const supabase = this.getClient()

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select(
        `
        *,
        customer:customers(*, profile:profiles!customers_profile_id_fkey(*)),
        vehicle:vehicles(brand, model, registration_number)
      `
      )
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) throw new Error('Booking not found')

    const b = booking as unknown as Booking & {
      vehicle: { brand: string; model: string; registration_number: string }
    }

    // Build line items
    const items: Omit<InvoiceItem, 'id' | 'invoice_id'>[] = []
    let sort = 0

    if (b.base_rental > 0) {
      items.push({
        description: 'Base Rental Charge',
        quantity: 1,
        unit_price: b.base_rental,
        total: b.base_rental,
        sort_order: sort++,
      })
    }
    if (b.driver_charge > 0) {
      items.push({ description: 'Driver Charge', quantity: 1, unit_price: b.driver_charge, total: b.driver_charge, sort_order: sort++ })
    }
    if (b.insurance_charge > 0) {
      items.push({ description: 'Insurance', quantity: 1, unit_price: b.insurance_charge, total: b.insurance_charge, sort_order: sort++ })
    }
    if (b.extra_km_charge > 0) {
      items.push({ description: `Extra KM Charge (${b.extra_km} km)`, quantity: b.extra_km, unit_price: b.vehicle?.registration_number ? 0 : b.extra_km_charge, total: b.extra_km_charge, sort_order: sort++ })
    }
    if (b.late_fee > 0) {
      items.push({ description: 'Late Return Fee', quantity: 1, unit_price: b.late_fee, total: b.late_fee, sort_order: sort++ })
    }
    if (b.fuel_charge > 0) {
      items.push({ description: 'Fuel Charge', quantity: 1, unit_price: b.fuel_charge, total: b.fuel_charge, sort_order: sort++ })
    }

    const subtotal = b.base_rental + b.driver_charge + b.insurance_charge +
      b.extra_km_charge + b.late_fee + b.fuel_charge
    const discount = b.discount_amount + b.coupon_discount
    const taxableAmount = subtotal - discount
    const taxAmount = b.tax_amount
    const total = taxableAmount + taxAmount

    const { data: invoice, error: iErr } = await supabase
      .from('invoices')
      .insert({
        booking_id: bookingId,
        customer_id: b.customer_id,
        invoice_type: invoiceType,
        invoice_date: new Date().toISOString().split('T')[0],
        subtotal,
        discount,
        tax_rate: b.tax_rate,
        tax_amount: taxAmount,
        total,
        amount_paid: b.amount_paid,
        balance: Math.max(0, total - b.amount_paid),
        is_paid: b.amount_paid >= total,
        created_by: actorProfileId,
      })
      .select()
      .single()

    if (iErr) throw iErr

    // Insert line items
    if (items.length > 0) {
      await supabase.from('invoice_items').insert(
        items.map((item) => ({ ...item, invoice_id: invoice.id }))
      )
    }

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'invoice_created',
        module: 'invoices',
        recordId: invoice.id,
        newValue: { invoiceNumber: invoice.invoice_number, total },
      })
    }

    return invoice as unknown as Invoice
  }

  /**
   * Get invoice by ID with items
   */
  static async getInvoiceById(id: string): Promise<Invoice | null> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('invoices')
      .select(
        `
        *,
        items:invoice_items(*),
        customer:customers(*, profile:profiles!customers_profile_id_fkey(*)),
        booking:bookings(booking_number, pickup_datetime, return_datetime, vehicle:vehicles(brand, model))
      `
      )
      .eq('id', id)
      .single()

    if (error) return null
    return data as unknown as Invoice
  }

  /**
   * Get invoices for a customer
   */
  static async getCustomerInvoices(customerId: string): Promise<Invoice[]> {
    const supabase = this.getClient()

    const { data } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*), booking:bookings(booking_number)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    return (data ?? []) as unknown as Invoice[]
  }

  /**
   * Store the generated PDF URL
   */
  static async storePdfUrl(invoiceId: string, pdfUrl: string): Promise<void> {
    const supabase = this.getClient()
    await supabase
      .from('invoices')
      .update({ pdf_url: pdfUrl, updated_at: new Date().toISOString() })
      .eq('id', invoiceId)
  }

  /**
   * Get all invoices with filters
   */
  static async getInvoices(
    filters: { customerId?: string; isPaid?: boolean; dateFrom?: string; dateTo?: string } = {},
    page = 1,
    limit = 20
  ): Promise<{ data: Invoice[]; total: number }> {
    const supabase = this.getClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('invoices')
      .select(
        `*, customer:customers(profile:profiles!customers_profile_id_fkey(full_name, email)), booking:bookings(booking_number)`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    if (filters.customerId) query = query.eq('customer_id', filters.customerId)
    if (filters.isPaid !== undefined) query = query.eq('is_paid', filters.isPaid)
    if (filters.dateFrom) query = query.gte('invoice_date', filters.dateFrom)
    if (filters.dateTo) query = query.lte('invoice_date', filters.dateTo)

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return { data: (data ?? []) as unknown as Invoice[], total: count ?? 0 }
  }
}
