import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('--- ALL BOOKINGS IN DATABASE ---')
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, booking_number, vehicle_id, customer_id, status, pickup_datetime, return_datetime, created_at')
    .order('created_at', { ascending: false })

  console.log('Error:', error)
  console.log('Total bookings:', bookings?.length)
  console.log(JSON.stringify(bookings, null, 2))
}

main().catch(console.error)
