import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VehicleService } from '@/services/VehicleService'
import type { Vehicle, VehicleStatus } from '@/types'

// GET: Fetch all vehicles with branches and images
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const branchId = searchParams.get('branch_id')

    const supabase = createAdminClient()
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        branch:branches(id, name, city),
        images:vehicle_images(id, url, is_primary, sort_order)
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (branchId && branchId !== 'all') {
      query = query.eq('branch_id', branchId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: (data ?? []) as unknown as Vehicle[]
    })
  } catch (error: any) {
    console.error('Fetch vehicles error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch vehicles' } },
      { status: 500 }
    )
  }
}

// POST: Register New Fleet Vehicle
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      brand,
      model,
      variant,
      year,
      registration_number,
      vehicle_type,
      fuel_type,
      transmission,
      seating_capacity,
      daily_rate,
      hourly_rate,
      security_deposit,
      extra_km_charge,
      included_km_per_day = 200,
      branch_id,
      color,
      current_odometer = 0,
      description,
      features = [],
      image_url,
      status = 'available'
    } = body

    if (!brand || !model || !registration_number || !branch_id) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Brand, Model, Registration Number, and Branch Location are required.' }
        },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const formattedReg = registration_number.trim().toUpperCase()

    // Check if registration number already exists
    const { data: existingReg } = await supabase
      .from('vehicles')
      .select('id, registration_number')
      .eq('registration_number', formattedReg)
      .maybeSingle()

    if (existingReg) {
      return NextResponse.json(
        {
          success: false,
          error: { message: `A vehicle with registration number "${formattedReg}" is already registered.` }
        },
        { status: 409 }
      )
    }

    const newVehiclePayload = {
      brand: brand.trim(),
      model: model.trim(),
      variant: variant?.trim() || null,
      year: Number(year) || new Date().getFullYear(),
      registration_number: formattedReg,
      vehicle_type: vehicle_type || 'suv',
      fuel_type: fuel_type || 'petrol',
      transmission: transmission || 'automatic',
      seating_capacity: Number(seating_capacity) || 5,
      daily_rate: Number(daily_rate) || 0,
      hourly_rate: Number(hourly_rate) || 0,
      security_deposit: Number(security_deposit) || 0,
      extra_km_charge: Number(extra_km_charge) || 0,
      included_km_per_day: Number(included_km_per_day) || 200,
      branch_id,
      color: color?.trim() || null,
      current_odometer: Number(current_odometer) || 0,
      description: description?.trim() || null,
      features: Array.isArray(features) ? features : [],
      status: (status as VehicleStatus) || 'available',
      is_active: true
    }

    const { data: createdVehicle, error: createErr } = await supabase
      .from('vehicles')
      .insert(newVehiclePayload)
      .select('*, branch:branches(id, name, city)')
      .single()

    if (createErr || !createdVehicle) {
      throw createErr || new Error('Failed to insert vehicle.')
    }

    // Add primary image if supplied
    if (image_url && image_url.trim()) {
      await supabase.from('vehicle_images').insert({
        vehicle_id: createdVehicle.id,
        url: image_url.trim(),
        is_primary: true,
        sort_order: 0
      })
    }

    // Fetch full vehicle with image relations
    const { data: fullVehicle } = await supabase
      .from('vehicles')
      .select(`
        *,
        branch:branches(id, name, city),
        images:vehicle_images(id, url, is_primary, sort_order)
      `)
      .eq('id', createdVehicle.id)
      .single()

    return NextResponse.json({
      success: true,
      data: fullVehicle as unknown as Vehicle,
      message: `${createdVehicle.brand} ${createdVehicle.model} registered successfully!`
    })
  } catch (error: any) {
    console.error('Create vehicle error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to register new vehicle.' } },
      { status: 500 }
    )
  }
}

// PUT: Update Fleet Vehicle
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const {
      id,
      brand,
      model,
      variant,
      year,
      registration_number,
      vehicle_type,
      fuel_type,
      transmission,
      seating_capacity,
      daily_rate,
      hourly_rate,
      security_deposit,
      extra_km_charge,
      included_km_per_day,
      branch_id,
      color,
      current_odometer,
      description,
      features,
      image_url,
      status,
      is_active
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Vehicle ID is required for update.' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const formattedReg = registration_number ? registration_number.trim().toUpperCase() : undefined

    // If updating registration number, check for duplicates
    if (formattedReg) {
      const { data: duplicate } = await supabase
        .from('vehicles')
        .select('id')
        .eq('registration_number', formattedReg)
        .neq('id', id)
        .maybeSingle()

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: { message: `Registration number "${formattedReg}" is already used by another vehicle.` }
          },
          { status: 409 }
        )
      }
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (brand !== undefined) updatePayload.brand = brand.trim()
    if (model !== undefined) updatePayload.model = model.trim()
    if (variant !== undefined) updatePayload.variant = variant?.trim() || null
    if (year !== undefined) updatePayload.year = Number(year)
    if (formattedReg !== undefined) updatePayload.registration_number = formattedReg
    if (vehicle_type !== undefined) updatePayload.vehicle_type = vehicle_type
    if (fuel_type !== undefined) updatePayload.fuel_type = fuel_type
    if (transmission !== undefined) updatePayload.transmission = transmission
    if (seating_capacity !== undefined) updatePayload.seating_capacity = Number(seating_capacity)
    if (daily_rate !== undefined) updatePayload.daily_rate = Number(daily_rate)
    if (hourly_rate !== undefined) updatePayload.hourly_rate = Number(hourly_rate)
    if (security_deposit !== undefined) updatePayload.security_deposit = Number(security_deposit)
    if (extra_km_charge !== undefined) updatePayload.extra_km_charge = Number(extra_km_charge)
    if (included_km_per_day !== undefined) updatePayload.included_km_per_day = Number(included_km_per_day)
    if (branch_id !== undefined) updatePayload.branch_id = branch_id
    if (color !== undefined) updatePayload.color = color?.trim() || null
    if (current_odometer !== undefined) updatePayload.current_odometer = Number(current_odometer)
    if (description !== undefined) updatePayload.description = description?.trim() || null
    if (features !== undefined) updatePayload.features = Array.isArray(features) ? features : []
    if (status !== undefined) updatePayload.status = status
    if (is_active !== undefined) updatePayload.is_active = Boolean(is_active)

    const { error: updateErr } = await supabase
      .from('vehicles')
      .update(updatePayload)
      .eq('id', id)

    if (updateErr) {
      throw updateErr
    }

    // Handle primary image update if provided
    if (image_url !== undefined && image_url !== null) {
      const trimmedUrl = image_url.trim()
      if (trimmedUrl) {
        const { data: existingImg } = await supabase
          .from('vehicle_images')
          .select('id')
          .eq('vehicle_id', id)
          .eq('is_primary', true)
          .maybeSingle()

        if (existingImg) {
          await supabase
            .from('vehicle_images')
            .update({ url: trimmedUrl })
            .eq('id', existingImg.id)
        } else {
          await supabase.from('vehicle_images').insert({
            vehicle_id: id,
            url: trimmedUrl,
            is_primary: true,
            sort_order: 0
          })
        }
      }
    }

    // Return the updated vehicle record with branches and images
    const { data: updatedVehicle, error: fetchErr } = await supabase
      .from('vehicles')
      .select(`
        *,
        branch:branches(id, name, city),
        images:vehicle_images(id, url, is_primary, sort_order)
      `)
      .eq('id', id)
      .single()

    if (fetchErr) throw fetchErr

    return NextResponse.json({
      success: true,
      data: updatedVehicle as unknown as Vehicle,
      message: 'Vehicle updated successfully!'
    })
  } catch (error: any) {
    console.error('Update vehicle error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update vehicle.' } },
      { status: 500 }
    )
  }
}

// PATCH: Quick Update Status
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, status, is_active } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Vehicle ID is required.' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (status) updates.status = status
    if (is_active !== undefined) updates.is_active = is_active

    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        branch:branches(id, name, city),
        images:vehicle_images(id, url, is_primary, sort_order)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data as unknown as Vehicle,
      message: 'Vehicle status updated.'
    })
  } catch (error: any) {
    console.error('Patch vehicle error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update status.' } },
      { status: 500 }
    )
  }
}

// DELETE: Delete or Deactivate Fleet Vehicle
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    let id = searchParams.get('id')

    if (!id) {
      // Try body
      try {
        const body = await req.json()
        id = body?.id
      } catch {
        // No body
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: { message: 'Vehicle ID is required for deletion.' } },
        { status: 400 }
      )
    }

    const result = await VehicleService.deleteVehicle(id, true)

    return NextResponse.json({
      success: true,
      data: result,
      message: result.deactivated
        ? 'Vehicle archived & marked inactive (retained due to associated rental history).'
        : 'Vehicle deleted permanently from the database.'
    })
  } catch (error: any) {
    console.error('Delete vehicle error:', error)
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete vehicle.' } },
      { status: 500 }
    )
  }
}
