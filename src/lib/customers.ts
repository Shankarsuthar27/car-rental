import type { Customer, Profile } from '@/types'

export function extractDrivingLicense(c: any): string {
  if (!c) return ''
  if (c.driving_license_number) return c.driving_license_number
  if (c.kyc_documents && Array.isArray(c.kyc_documents)) {
    const doc = c.kyc_documents.find(
      (d: any) => d.document_type === 'driving_license' || d.document_type === 'dl'
    )
    if (doc?.document_number) return doc.document_number
  }
  if (c.kyc_notes) {
    const dlMatch = c.kyc_notes.match(/DL:\s*([^|]+)/i)
    if (dlMatch && dlMatch[1]) return dlMatch[1].trim()
  }
  return ''
}

export function extractEmail(c: any): string {
  if (!c) return ''
  if (c.profile?.email) return c.profile.email
  if (c.email) return c.email
  if (c.kyc_notes) {
    const emailMatch = c.kyc_notes.match(/Email:\s*([^\s|]+)/i)
    if (emailMatch && emailMatch[1]) return emailMatch[1].trim()
  }
  if (c.customer_code) return `${c.customer_code.toLowerCase().replace(/[^a-z0-9]/g, '')}@driveease.in`
  return 'customer@driveease.in'
}

export function extractFullName(c: any): string {
  if (!c) return 'Customer'
  if (c.profile?.full_name && c.profile.full_name !== 'Customer') return c.profile.full_name
  if (c.full_name && c.full_name !== 'Customer') return c.full_name
  if (c.emergency_contact_name && c.emergency_contact_name !== 'Customer') return c.emergency_contact_name
  if (c.customer_code) return `Customer (${c.customer_code})`
  return 'Registered Customer'
}

export function extractPhone(c: any): string {
  if (!c) return '—'
  if (c.profile?.phone && c.profile.phone !== '—' && c.profile.phone !== 'No phone') return c.profile.phone
  if (c.phone && c.phone !== '—') return c.phone
  if (c.emergency_contact_phone && c.emergency_contact_phone !== '—') return c.emergency_contact_phone
  return '—'
}

export function formatCustomer(c: any): Customer {
  if (!c) return c

  const dlNumber = extractDrivingLicense(c)
  const resolvedEmail = extractEmail(c)
  const resolvedName = extractFullName(c)
  const resolvedPhone = extractPhone(c)

  const profile: Profile = {
    id: c.profile_id || c.id || `prof-${Date.now()}`,
    email: resolvedEmail,
    full_name: resolvedName,
    phone: resolvedPhone,
    role: (c.profile?.role || 'customer') as any,
    is_active: c.profile?.is_active ?? true,
    avatar_url: c.profile?.avatar_url || '',
    created_at: c.profile?.created_at || c.created_at || new Date().toISOString(),
    updated_at: c.profile?.updated_at || c.updated_at || new Date().toISOString(),
  }

  return {
    ...c,
    profile,
    driving_license_number: dlNumber || c.driving_license_number || '',
    emergency_contact_name: c.emergency_contact_name || resolvedName,
    emergency_contact_phone: c.emergency_contact_phone || resolvedPhone,
    city: c.city || 'Jalore',
    state: c.state || 'Rajasthan',
    country: c.country || 'India',
    kyc_status: c.kyc_status || 'verified',
    total_rentals: c.total_rentals ?? 0,
    total_spent: c.total_spent ?? 0,
    outstanding_balance: c.outstanding_balance ?? 0,
  }
}

export const DEFAULT_DEMO_CUSTOMERS: Customer[] = []
