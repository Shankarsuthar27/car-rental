import type { Metadata } from 'next'
import { User, Mail, Phone, MapPin, Save, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata: Metadata = {
  title: 'Profile Settings — DriveEase'
}

export default function CustomerProfilePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile & Address Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your personal information and default billing addresses.
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-white text-xl font-bold">
            RS
          </div>
          <div>
            <h3 className="font-bold text-base">Rahul Sharma</h3>
            <p className="text-xs text-muted-foreground">Verified Customer • Joined August 2026</p>
          </div>
        </div>

        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Full Legal Name</Label>
              <Input defaultValue="Rahul Sharma" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input defaultValue="rahul.sharma@example.com" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Phone Number</Label>
              <Input defaultValue="+91 98765 43210" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Emergency Contact</Label>
              <Input defaultValue="+91 98290 12345 (Brother)" className="h-10 rounded-xl" />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-semibold">Residential / Billing Address</Label>
            <Input defaultValue="42, Civil Lines" className="h-10 rounded-xl" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">City</Label>
              <Input defaultValue="Jaipur" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">State</Label>
              <Input defaultValue="Rajasthan" className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Pincode</Label>
              <Input defaultValue="302006" className="h-10 rounded-xl" />
            </div>
          </div>

          <Button type="button" className="gradient-brand text-white border-0 font-semibold gap-2 mt-4 rounded-xl">
            <Save className="w-4 h-4" /> Save Profile Changes
          </Button>
        </form>
      </div>
    </div>
  )
}
