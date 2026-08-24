import { createAdminClient } from '@/lib/supabase/admin'
import type { Customer, KycDocument, KycStatus } from '@/types'
import { AuditService } from './AuditService'
import { NotificationService } from './NotificationService'

export class CustomerService {
  private static getClient() {
    return createAdminClient()
  }

  static async getCustomers(
    search?: string,
    page = 1,
    limit = 20
  ): Promise<{ data: Customer[]; total: number }> {
    const supabase = this.getClient()
    const offset = (page - 1) * limit

    let query = supabase
      .from('customers')
      .select(
        `
        *,
        profile:profiles!customers_profile_id_fkey(id, full_name, email, phone, avatar_url, role)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(
        `customer_code.ilike.%${search}%`
      )
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return {
      data: (data ?? []) as unknown as Customer[],
      total: count ?? 0,
    }
  }

  static async getCustomerById(id: string): Promise<Customer | null> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('customers')
      .select(
        `
        *,
        profile:profiles!customers_profile_id_fkey(*),
        kyc_documents:kyc_documents(*)
      `
      )
      .eq('id', id)
      .single()

    if (error) return null
    return data as unknown as Customer
  }

  static async getCustomerByProfileId(profileId: string): Promise<Customer | null> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('customers')
      .select('*, profile:profiles!customers_profile_id_fkey(*), kyc_documents:kyc_documents(*)')
      .eq('profile_id', profileId)
      .single()

    if (error) return null
    return data as unknown as Customer
  }

  /**
   * Create customer record for a newly registered user
   */
  static async createCustomer(
    profileId: string,
    data?: Partial<Omit<Customer, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>
  ): Promise<Customer> {
    const supabase = this.getClient()

    // Generate customer code
    const customerCode = `CUS-${Date.now().toString(36).toUpperCase()}`

    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        profile_id: profileId,
        customer_code: customerCode,
        ...data,
      })
      .select()
      .single()

    if (error) throw error
    return customer as unknown as Customer
  }

  /**
   * Update KYC status after admin review
   */
  static async updateKycStatus(
    customerId: string,
    status: KycStatus,
    notes?: string,
    actorProfileId?: string
  ): Promise<void> {
    const supabase = this.getClient()

    const { data: customer } = await supabase
      .from('customers')
      .select('kyc_status, profile:profiles!customers_profile_id_fkey(id)')
      .eq('id', customerId)
      .single()

    await supabase
      .from('customers')
      .update({
        kyc_status: status,
        kyc_notes: notes,
        kyc_verified_at: status === 'verified' ? new Date().toISOString() : null,
        kyc_verified_by: actorProfileId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)

    // Send notification to customer
    const profileId = (customer?.profile as unknown as { id: string })?.id
    if (profileId) {
      await NotificationService.sendInApp(profileId, {
        type: status === 'verified' ? 'kyc_approved' : 'kyc_rejected',
        title: status === 'verified' ? 'KYC Approved ✓' : 'KYC Action Required',
        body:
          status === 'verified'
            ? 'Your identity has been verified. You can now proceed with bookings.'
            : `Your KYC was not approved. Reason: ${notes ?? 'Please re-upload documents.'}`,
        data: { customerId },
      })
    }

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'kyc_status_changed',
        module: 'customers',
        recordId: customerId,
        previousValue: { kyc_status: customer?.kyc_status },
        newValue: { kyc_status: status, notes },
      })
    }
  }

  /**
   * Upload KYC document
   */
  static async uploadKycDocument(
    customerId: string,
    documentType: KycDocument['document_type'],
    documentUrl: string,
    documentNumber?: string,
    expiryDate?: string
  ): Promise<KycDocument> {
    const supabase = this.getClient()

    // Check if document already exists for this type
    const { data: existing } = await supabase
      .from('kyc_documents')
      .select('id')
      .eq('customer_id', customerId)
      .eq('document_type', documentType)
      .single()

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('kyc_documents')
        .update({
          document_url: documentUrl,
          document_number: documentNumber,
          expiry_date: expiryDate,
          status: 'pending',
          verified_at: null,
          verified_by: null,
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as KycDocument
    }

    // Insert new
    const { data, error } = await supabase
      .from('kyc_documents')
      .insert({
        customer_id: customerId,
        document_type: documentType,
        document_url: documentUrl,
        document_number: documentNumber,
        expiry_date: expiryDate,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Update overall customer KYC status
    await supabase
      .from('customers')
      .update({ kyc_status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', customerId)

    return data as unknown as KycDocument
  }

  /**
   * Verify a specific KYC document
   */
  static async verifyDocument(
    documentId: string,
    status: KycStatus,
    rejectionReason?: string,
    actorProfileId?: string
  ): Promise<void> {
    const supabase = this.getClient()

    await supabase
      .from('kyc_documents')
      .update({
        status,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
        verified_by: actorProfileId,
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    if (actorProfileId) {
      await AuditService.log({
        userId: actorProfileId,
        action: 'kyc_document_reviewed',
        module: 'customers',
        recordId: documentId,
        newValue: { status, rejectionReason },
      })
    }
  }
}
