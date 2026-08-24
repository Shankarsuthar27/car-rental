import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCustomer, DEFAULT_DEMO_CUSTOMERS } from '@/lib/customers'
import type { Customer } from '@/types'

// GET: Fetch customers
export async function GET(req: Request) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        profile:profiles!customers_profile_id_fkey(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formatted = (data && data.length > 0)
      ? data.map(formatCustomer)
      : DEFAULT_DEMO_CUSTOMERS

    return NextResponse.json({
      success: true,
      data: formatted,
    })
  } catch (error: any) {
    console.error('Fetch customers error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch customers' } },
      { status: 500 }
    )
  }
}

// POST: Add new customer
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      full_name,
      phone,
      email,
      driving_license_number,
      address = '',
      city = 'Jaipur',
      state = 'Rajasthan',
      pincode = '302001',
      emergency_contact_name,
      emergency_contact_phone,
      kyc_status = 'verified',
      kyc_notes = '',
    } = body

    if (!full_name || !phone) {
      return NextResponse.json(
        { success: false, error: { message: 'Full name and phone number are required.' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Compose KYC notes containing contact email and driving license
    const notesParts: string[] = []
    if (email?.trim()) notesParts.push(`Email: ${email.trim()}`)
    if (driving_license_number?.trim()) notesParts.push(`DL: ${driving_license_number.trim()}`)
    if (kyc_notes?.trim()) notesParts.push(kyc_notes.trim())
    const combinedNotes = notesParts.join(' | ') || 'Registered by staff'

    const customerCode = `CUST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    const { data: newCustomer, error: custErr } = await supabase
      .from('customers')
      .insert({
        profile_id: null,
        customer_code: customerCode,
        emergency_contact_name: full_name.trim(),
        emergency_contact_phone: phone.trim(),
        address: address.trim(),
        city: city.trim() || 'Jaipur',
        state: state.trim() || 'Rajasthan',
        pincode: pincode.trim() || '302001',
        country: 'India',
        kyc_status: kyc_status || 'verified',
        kyc_notes: combinedNotes,
        kyc_verified_at: kyc_status === 'verified' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (custErr || !newCustomer) {
      throw custErr || new Error('Failed to insert customer record.')
    }

    const formatted = formatCustomer(newCustomer)

    return NextResponse.json({
      success: true,
      data: formatted,
      message: `Customer ${full_name} registered successfully!`,
    })
  } catch (error: any) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create customer.' } },
      { status: 500 }
    )
  }
}

// PUT: Update customer details
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const {
      id,
      full_name,
      phone,
      email,
      driving_license_number,
      address,
      city,
      state,
      pincode,
      emergency_contact_name,
      emergency_contact_phone,
      kyc_status,
      kyc_notes,
      blacklisted,
      blacklist_reason,
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Customer ID is required.' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Fetch current customer
    const { data: currentCustomer, error: fetchErr } = await supabase
      .from('customers')
      .select('*, profile:profiles!customers_profile_id_fkey(*)')
      .eq('id', id)
      .single()

    if (fetchErr || !currentCustomer) {
      return NextResponse.json(
        { success: false, error: { message: 'Customer not found.' } },
        { status: 404 }
      )
    }

    // 2. If profile exists, update profile
    if (currentCustomer.profile_id) {
      const profileUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (full_name !== undefined) profileUpdates.full_name = full_name
      if (phone !== undefined) profileUpdates.phone = phone
      if (email !== undefined) profileUpdates.email = email
      await supabase.from('profiles').update(profileUpdates).eq('id', currentCustomer.profile_id)
    }

    // 3. Update customer table
    const custUpdates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (full_name !== undefined) custUpdates.emergency_contact_name = full_name
    if (phone !== undefined) custUpdates.emergency_contact_phone = phone
    if (address !== undefined) custUpdates.address = address
    if (city !== undefined) custUpdates.city = city
    if (state !== undefined) custUpdates.state = state
    if (pincode !== undefined) custUpdates.pincode = pincode
    if (kyc_status !== undefined) custUpdates.kyc_status = kyc_status
    if (blacklisted !== undefined) custUpdates.blacklisted = blacklisted
    if (blacklist_reason !== undefined) custUpdates.blacklist_reason = blacklist_reason

    // If email or driving license is provided or updated, update kyc_notes
    if (email !== undefined || driving_license_number !== undefined || kyc_notes !== undefined) {
      const notesParts: string[] = []
      if (email?.trim()) notesParts.push(`Email: ${email.trim()}`)
      if (driving_license_number?.trim()) notesParts.push(`DL: ${driving_license_number.trim()}`)
      if (kyc_notes?.trim()) notesParts.push(kyc_notes.trim())
      if (notesParts.length > 0) {
        custUpdates.kyc_notes = notesParts.join(' | ')
      }
    }

    const { data: updatedCustomer, error: updateErr } = await supabase
      .from('customers')
      .update(custUpdates)
      .eq('id', id)
      .select('*, profile:profiles!customers_profile_id_fkey(*)')
      .single()

    if (updateErr) throw updateErr

    const formatted = formatCustomer(updatedCustomer)

    return NextResponse.json({
      success: true,
      data: formatted,
      message: 'Customer updated successfully!',
    })
  } catch (error: any) {
    console.error('Update customer error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update customer.' } },
      { status: 500 }
    )
  }
}
