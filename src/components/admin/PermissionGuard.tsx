'use client'

import React from 'react'
import { usePermissions } from '@/context/PermissionContext'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PermissionGuardProps {
  permission?: string
  requireSuperAdmin?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({
  permission,
  requireSuperAdmin = false,
  children,
  fallback,
}: PermissionGuardProps) {
  const { can, isSuperAdmin } = usePermissions()

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h2 className="text-xl font-bold">Access Restricted</h2>
            <p className="text-sm text-muted-foreground">
              This area is strictly reserved for the Owner / Super Admin.
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline" className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </Button>
          </Link>
        </div>
      )
    )
  }

  if (permission && !can(permission)) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h2 className="text-xl font-bold">Access Restricted</h2>
            <p className="text-sm text-muted-foreground">
              You do not have the required permission (
              <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted">
                {permission}
              </span>
              ) to access this module. Please contact your system administrator.
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline" className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </Button>
          </Link>
        </div>
      )
    )
  }

  return <>{children}</>
}
