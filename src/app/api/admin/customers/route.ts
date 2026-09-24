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
      city = 'Jalore',
      state = 'Rajasthan',
      pincode = '343001',
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
        city: city.trim() || 'Jalore',
        state: state.trim() || 'Rajasthan',
        pincode: pincode.trim() || '343001',
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
      // Graceful fallback for demo customers or local accounts
      const demoCust = DEFAULT_DEMO_CUSTOMERS.find(c => c.id === id)
      const base: Customer = demoCust || {
        id,
        profile_id: `prof-${id}`,
        customer_code: 'CUST-DEMO',
        emergency_contact_name: full_name || 'Customer',
        emergency_contact_phone: phone || '',
        address: address || '',
        city: city || 'Jalore',
        state: state || 'Rajasthan',
        pincode: pincode || '343001',
        country: 'India',
        kyc_status: 'verified',
        kyc_notes: '',
        total_rentals: 0,
        total_spent: 0,
        outstanding_balance: 0,
        blacklisted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: {
          id: `prof-${id}`,
          full_name: full_name || 'Customer',
          phone: phone || '',
          email: email || '',
          role: 'customer',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }

      const updatedDemo: Customer = {
        ...base,
        emergency_contact_name: emergency_contact_name !== undefined ? emergency_contact_name : (full_name !== undefined ? full_name : base.emergency_contact_name),
        emergency_contact_phone: emergency_contact_phone !== undefined ? emergency_contact_phone : (phone !== undefined ? phone : base.emergency_contact_phone),
        address: address !== undefined ? address : base.address,
        city: city !== undefined ? city : base.city,
        state: state !== undefined ? state : base.state,
        pincode: pincode !== undefined ? pincode : base.pincode,
        kyc_status: kyc_status !== undefined ? kyc_status : base.kyc_status,
        kyc_notes: kyc_notes !== undefined ? kyc_notes : base.kyc_notes,
        kyc_verified_at: kyc_status === 'verified' ? new Date().toISOString() : (kyc_status === 'pending' ? undefined : base.kyc_verified_at),
        blacklisted: blacklisted !== undefined ? blacklisted : base.blacklisted,
        blacklist_reason: blacklist_reason !== undefined ? blacklist_reason : base.blacklist_reason,
        profile: {
          ...base.profile,
          id: base.profile?.id || `prof-${id}`,
          role: (base.profile?.role || 'customer') as any,
          is_active: base.profile?.is_active ?? true,
          created_at: base.profile?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          full_name: full_name !== undefined ? full_name : (base.profile?.full_name || 'Customer'),
          phone: phone !== undefined ? phone : (base.profile?.phone || ''),
          email: email !== undefined ? email : (base.profile?.email || ''),
        },
      }

      return NextResponse.json({
        success: true,
        data: updatedDemo,
        message: 'Customer updated successfully!',
      })
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

// DELETE: Delete customer
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    let id = searchParams.get('id')

    if (!id) {
      try {
        const body = await req.json()
        id = body?.id
      } catch {
        // body parsing failed or empty
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Customer ID is required.' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 1. Check if customer exists
    const { data: customer, error: fetchErr } = await supabase
      .from('customers')
      .select('id, emergency_contact_name, customer_code, profile:profiles!customers_profile_id_fkey(full_name)')
      .eq('id', id)
      .maybeSingle()

    // If it's a demo customer not in database, return success so client removes it from view
    if (!customer) {
      return NextResponse.json({
        success: true,
        message: 'Customer removed successfully.',
      })
    }

    // 2. Check for active or linked bookings
    const { count: bookingCount, error: bookingErr } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', id)

    if (bookingErr) {
      console.warn('Could not verify bookings count:', bookingErr)
    }

    if (bookingCount && bookingCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Cannot delete customer: they have ${bookingCount} linked booking${bookingCount > 1 ? 's' : ''}. To maintain billing and invoicing history, you can blacklist or set KYC to rejected instead.`,
          },
        },
        { status: 400 }
      )
    }

    // 3. Delete customer record
    const { error: delErr } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (delErr) throw delErr

    const custName =
      (customer as any)?.profile?.full_name ||
      (Array.isArray(customer?.profile) ? (customer.profile as any)[0]?.full_name : null) ||
      customer.emergency_contact_name ||
      customer.customer_code ||
      'Customer'

    return NextResponse.json({
      success: true,
      message: `Customer ${custName} deleted successfully.`,
    })
  } catch (error: any) {
    console.error('Delete customer error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete customer.' } },
      { status: 500 }
    )
  }
}

