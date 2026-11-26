import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkServerPermission } from '@/lib/server-permissions'

const DEFAULT_BUSINESS_SETTINGS = {
  name: 'Jalore Self Drive Car Rental',
  tagline: 'Premium Fleet & Self-Drive Car Rental',
  gstin: '08ABCDE1234F1Z5',
  currency: 'INR (₹)',
  email: 'Jalorecarrental@gmail.com',
  phone: '+91-2973-222333',
  address: 'Near Bus Stand, Collectorate Road, Jalore, Rajasthan 343001',
}

const DEFAULT_RENTAL_SETTINGS = {
  default_daily_rate: 2200,
  default_hourly_rate: 180,
  default_deposit: 10000,
  late_fee_per_hour: 200,
  extra_km_charge: 14,
  return_grace_period_minutes: 30,
  tax_rate: 18,
  weekend_multiplier: 1.25,
  partial_period_rule: 'round_up_hour',
  advance_payment_percentage: 30,
}

export async function GET() {
  try {
    const allowed = await checkServerPermission('settings.manage')
    if (!allowed) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to view system settings.' },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('settings')
      .select('key, value, updated_at')
      .in('key', ['company_profile', 'rental_policy'])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const byKey = new Map((data || []).map((row) => [row.key, row.value || {}]))

    const business = {
      ...DEFAULT_BUSINESS_SETTINGS,
      ...(byKey.get('company_profile') as Record<string, unknown> | undefined),
    }

    const rental = {
      ...DEFAULT_RENTAL_SETTINGS,
      ...(byKey.get('rental_policy') as Record<string, unknown> | undefined),
    }

    return NextResponse.json({ business, rental })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const allowed = await checkServerPermission('settings.manage')
    if (!allowed) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to modify system settings.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    // Fetch existing rows so we merge rather than drop unrelated keys
    const { data: existingRows } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['company_profile', 'rental_policy'])

    const existingMap = new Map(
      (existingRows || []).map((row) => [row.key, (row.value || {}) as Record<string, unknown>])
    )

    const upserts: Array<{
      key: string
      value: Record<string, unknown>
      description: string
      is_public: boolean
      updated_at: string
    }> = []

    if (body.business && typeof body.business === 'object') {
      const b = body.business
      const mergedBusiness = {
        ...DEFAULT_BUSINESS_SETTINGS,
        ...(existingMap.get('company_profile') || {}),
        name: String(b.name ?? DEFAULT_BUSINESS_SETTINGS.name).trim(),
        tagline: String(b.tagline ?? DEFAULT_BUSINESS_SETTINGS.tagline).trim(),
        gstin: String(b.gstin ?? DEFAULT_BUSINESS_SETTINGS.gstin).trim().toUpperCase(),
        currency: String(b.currency ?? DEFAULT_BUSINESS_SETTINGS.currency).trim(),
        email: String(b.email ?? DEFAULT_BUSINESS_SETTINGS.email).trim(),
        phone: String(b.phone ?? DEFAULT_BUSINESS_SETTINGS.phone).trim(),
        address: String(b.address ?? DEFAULT_BUSINESS_SETTINGS.address).trim(),
      }
      upserts.push({
        key: 'company_profile',
        value: mergedBusiness,
        description: 'Company details, brand identity, and GSTIN',
        is_public: true,
        updated_at: now,
      })
    }

    if (body.rental && typeof body.rental === 'object') {
      const r = body.rental
      const numOrDefault = (val: unknown, fallback: number) => {
        const parsed = Number(val)
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
      }
      const mergedRental = {
        ...DEFAULT_RENTAL_SETTINGS,
        ...(existingMap.get('rental_policy') || {}),
        default_daily_rate: numOrDefault(r.default_daily_rate, DEFAULT_RENTAL_SETTINGS.default_daily_rate),
        default_hourly_rate: numOrDefault(r.default_hourly_rate, DEFAULT_RENTAL_SETTINGS.default_hourly_rate),
        default_deposit: numOrDefault(r.default_deposit, DEFAULT_RENTAL_SETTINGS.default_deposit),
        late_fee_per_hour: numOrDefault(r.late_fee_per_hour, DEFAULT_RENTAL_SETTINGS.late_fee_per_hour),
        extra_km_charge: numOrDefault(r.extra_km_charge, DEFAULT_RENTAL_SETTINGS.extra_km_charge),
        return_grace_period_minutes: numOrDefault(
          r.return_grace_period_minutes,
          DEFAULT_RENTAL_SETTINGS.return_grace_period_minutes
        ),
        tax_rate: numOrDefault(r.tax_rate, DEFAULT_RENTAL_SETTINGS.tax_rate),
      }
      upserts.push({
        key: 'rental_policy',
        value: mergedRental,
        description: 'Pricing calculation rules and default rental fees',
        is_public: true,
        updated_at: now,
      })
    }

    if (upserts.length === 0) {
      return NextResponse.json(
        { error: 'No valid settings payload provided.' },
        { status: 400 }
      )
    }

    const { error: upsertError } = await supabase
      .from('settings')
      .upsert(upserts, { onConflict: 'key' })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
