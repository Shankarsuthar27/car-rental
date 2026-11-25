import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminInvoicesClient } from '@/components/admin/invoices/AdminInvoicesClient'
import { PermissionGuard } from '@/components/admin/PermissionGuard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tax Invoices & Rental Receipts — DriveEase Admin'
}

async function getInvoicesData() {
  const supabase = createAdminClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, profile:profiles!customers_profile_id_fkey(full_name, email, phone)),
      booking:bookings(
        booking_number, pickup_datetime, return_datetime,
        vehicle:vehicles(brand, model, year, registration_number)
      ),
      items:invoice_items(*)
    `)
    .order('created_at', { ascending: false })

  return invoices || []
}

export default async function AdminInvoicesPage() {
  const invoices = await getInvoicesData()

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PermissionGuard permission="payments.view_invoices">
        <AdminInvoicesClient initialInvoices={invoices} />
      </PermissionGuard>
    </div>
  )
}
