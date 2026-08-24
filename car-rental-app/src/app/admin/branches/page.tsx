import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { Building2, MapPin, Phone, Mail, Clock, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Branch & Location Management — DriveEase Admin'
}

async function getBranchesData() {
  const supabase = createAdminClient()
  const { data } = await supabase.from('branches').select('*').order('name')
  return data || []
}

export default async function AdminBranchesPage() {
  const branches = await getBranchesData()

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Branch Network ({branches.length})
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational hubs across Rajasthan and Gujarat supporting inter-branch and one-way rentals.
          </p>
        </div>

        <Button className="gradient-brand text-white border-0 hover:opacity-90 font-bold gap-2 text-xs h-10 shadow-md">
          <Plus className="w-4 h-4" /> Add New Branch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((b: any) => (
          <div
            key={b.id}
            className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{b.name}</h3>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                    Active Location
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{b.address}, {b.city}, {b.state} - {b.pincode}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{b.phone || '+91 141 2345678'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{b.email || 'support@driveease.in'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Operating Hours: {b.opening_time || '08:00'} – {b.closing_time || '22:00'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
