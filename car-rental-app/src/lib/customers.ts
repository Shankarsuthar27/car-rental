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
    city: c.city || 'Jaipur',
    state: c.state || 'Rajasthan',
    country: c.country || 'India',
    kyc_status: c.kyc_status || 'verified',
    total_rentals: c.total_rentals ?? 0,
    total_spent: c.total_spent ?? 0,
    outstanding_balance: c.outstanding_balance ?? 0,
  }
}

export const DEFAULT_DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cust-demo-1',
    profile_id: 'prof-demo-1',
    customer_code: 'CUST-2024-8192',
    date_of_birth: '1992-05-14',
    gender: 'male',
    address: 'Plot 42, Vaishali Nagar',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302021',
    country: 'India',
    emergency_contact_name: 'Vikramaditya Sharma',
    emergency_contact_phone: '+91 98290 12345',
    kyc_status: 'verified',
    kyc_verified_at: new Date().toISOString(),
    kyc_notes: 'Email: vikram.sharma@example.com | DL: RJ14 20210009876',
    blacklisted: false,
    total_rentals: 5,
    total_spent: 42500,
    outstanding_balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'prof-demo-1',
      email: 'vikram.sharma@example.com',
      full_name: 'Vikramaditya Sharma',
      phone: '+91 98290 12345',
      role: 'customer',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'cust-demo-2',
    profile_id: 'prof-demo-2',
    customer_code: 'CUST-2024-5541',
    date_of_birth: '1995-11-22',
    gender: 'female',
    address: 'B-12 Malviya Nagar',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302017',
    country: 'India',
    emergency_contact_name: 'Priya Patel',
    emergency_contact_phone: '+91 97840 56789',
    kyc_status: 'verified',
    kyc_verified_at: new Date().toISOString(),
    kyc_notes: 'Email: priya.patel@example.com | DL: RJ14 20220034112',
    blacklisted: false,
    total_rentals: 3,
    total_spent: 28000,
    outstanding_balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'prof-demo-2',
      email: 'priya.patel@example.com',
      full_name: 'Priya Patel',
      phone: '+91 97840 56789',
      role: 'customer',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'cust-demo-3',
    profile_id: 'prof-demo-3',
    customer_code: 'CUST-2024-9023',
    date_of_birth: '1988-08-09',
    gender: 'male',
    address: '15 High Court Colony',
    city: 'Jodhpur',
    state: 'Rajasthan',
    pincode: '342001',
    country: 'India',
    emergency_contact_name: 'Rajesh Kumar Meena',
    emergency_contact_phone: '+91 94140 33445',
    kyc_status: 'verified',
    kyc_verified_at: new Date().toISOString(),
    kyc_notes: 'Email: rajesh.meena@example.com | DL: RJ20 20190088712',
    blacklisted: false,
    total_rentals: 8,
    total_spent: 64000,
    outstanding_balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'prof-demo-3',
      email: 'rajesh.meena@example.com',
      full_name: 'Rajesh Kumar Meena',
      phone: '+91 94140 33445',
      role: 'customer',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'cust-demo-4',
    profile_id: 'prof-demo-4',
    customer_code: 'CUST-2024-3312',
    date_of_birth: '1997-03-30',
    gender: 'female',
    address: 'Saheli Marg, Panchwati',
    city: 'Udaipur',
    state: 'Rajasthan',
    pincode: '313001',
    country: 'India',
    emergency_contact_name: 'Ananya Kapoor',
    emergency_contact_phone: '+91 99280 66778',
    kyc_status: 'verified',
    kyc_verified_at: new Date().toISOString(),
    kyc_notes: 'Email: ananya.k@example.com | DL: RJ27 20230012903',
    blacklisted: false,
    total_rentals: 2,
    total_spent: 18500,
    outstanding_balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'prof-demo-4',
      email: 'ananya.k@example.com',
      full_name: 'Ananya Kapoor',
      phone: '+91 99280 66778',
      role: 'customer',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'cust-demo-5',
    profile_id: 'prof-demo-5',
    customer_code: 'CUST-2024-7749',
    date_of_birth: '1990-12-05',
    gender: 'male',
    address: 'C-Scheme, Ashok Nagar',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    country: 'India',
    emergency_contact_name: 'Rahul Verma',
    emergency_contact_phone: '+91 98291 99887',
    kyc_status: 'verified',
    kyc_verified_at: new Date().toISOString(),
    kyc_notes: 'Email: rahul.verma@example.com | DL: RJ14 20200055431',
    blacklisted: false,
    total_rentals: 6,
    total_spent: 51200,
    outstanding_balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profile: {
      id: 'prof-demo-5',
      email: 'rahul.verma@example.com',
      full_name: 'Rahul Verma',
      phone: '+91 98291 99887',
      role: 'customer',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
]
