import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { UserCog, Shield, Plus, Mail, Phone, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Employee Directory & RBAC Roles — DriveEase Admin'
}

export default async function AdminEmployeesPage() {
  const employees = [
    {
      id: 'emp-1',
      name: 'Vikramaditya Rathore',
      email: 'admin@driveease.in',
      phone: '+91 98290 11111',
      role: 'Super Admin',
      department: 'Executive Management',
      branch: 'Jaipur Main Branch',
      permissions: ['Full Access', 'Finance', 'Fleet Management', 'User Control']
    },
    {
      id: 'emp-2',
      name: 'Pooja Choudhary',
      email: 'pooja.c@driveease.in',
      phone: '+91 98290 22222',
      role: 'Accountant',
      department: 'Finance & Invoicing',
      branch: 'Jaipur Main Branch',
      permissions: ['View Payments', 'Generate Invoices', 'Process Refunds']
    },
    {
      id: 'emp-3',
      name: 'Suresh Meena',
      email: 'suresh.m@driveease.in',
      phone: '+91 98290 33333',
      role: 'Vehicle Manager',
      department: 'Fleet Operations',
      branch: 'Jodhpur Branch',
      permissions: ['Manage Vehicles', 'Schedule Maintenance', 'Perform Inspections']
    },
    {
      id: 'emp-4',
      name: 'Kavita Joshi',
      email: 'kavita.j@driveease.in',
      phone: '+91 98290 44444',
      role: 'Booking Manager',
      department: 'Customer Success',
      branch: 'Udaipur Branch',
      permissions: ['Manage Bookings', 'Verify KYC', 'Start & Return Handover']
    }
  ]

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Staff & Role-Based Access Control
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage employee profiles, department designations, and granular operational permissions.
          </p>
        </div>

        <Button className="gradient-brand text-white border-0 hover:opacity-90 font-bold gap-2 text-xs h-10 shadow-md">
          <Plus className="w-4 h-4" /> Add Team Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {employees.map(emp => (
          <div
            key={emp.id}
            className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl gradient-brand text-white flex items-center justify-center font-bold text-sm">
                  {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-base">{emp.name}</h3>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    {emp.role}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{emp.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{emp.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{emp.branch} • {emp.department}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">
                Authorized Permissions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {emp.permissions.map(perm => (
                  <Badge key={perm} variant="outline" className="text-[10px] bg-muted/30">
                    ✓ {perm}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
