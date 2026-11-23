'use client'

import React, { createContext, useContext, useMemo } from 'react'

interface PermissionContextType {
  role: string
  permissions: string[]
  can: (permission?: string) => boolean
  hasAny: (permissions: string[]) => boolean
  isSuperAdmin: boolean
}

// Default context = NO access (staff with zero permissions).
// Only the PermissionProvider (rendered by admin/layout.tsx) grants real access.
const PermissionContext = createContext<PermissionContextType>({
  role: 'staff',
  permissions: [],
  can: () => false,
  hasAny: () => false,
  isSuperAdmin: false,
})

interface PermissionProviderProps {
  children: React.ReactNode
  initialRole?: string
  initialPermissions?: string[]
}

export function PermissionProvider({
  children,
  initialRole = 'staff',
  initialPermissions = [],
}: PermissionProviderProps) {
  const isSuperAdmin = initialRole === 'super_admin' || initialRole === 'owner'

  const value = useMemo<PermissionContextType>(() => {
    return {
      role: initialRole,
      permissions: initialPermissions,
      can: (permission?: string) => {
        if (!permission) return true
        if (isSuperAdmin) return true
        return Array.isArray(initialPermissions) && initialPermissions.includes(permission)
      },
      hasAny: (reqPermissions: string[]) => {
        if (!reqPermissions || reqPermissions.length === 0) return true
        if (isSuperAdmin) return true
        return reqPermissions.some(p => initialPermissions.includes(p))
      },
      isSuperAdmin,
    }
  }, [initialRole, initialPermissions, isSuperAdmin])

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionContext)
  return context
}
