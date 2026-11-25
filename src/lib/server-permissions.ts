import { cookies } from 'next/headers'

export interface ServerPermissionState {
  role: string | undefined
  isUnrestricted: boolean
  permissions: string[]
}

/**
 * Reads the current session role and permission list from request cookies.
 */
export async function getServerPermissionState(): Promise<ServerPermissionState> {
  const cookieStore = await cookies()
  const role = cookieStore.get('driveease_demo_role')?.value
  if (role === 'super_admin' || role === 'owner') {
    return { role, isUnrestricted: true, permissions: ['*'] }
  }

  const userPermsRaw = cookieStore.get('driveease_user_permissions')?.value
  if (!userPermsRaw) {
    return { role, isUnrestricted: false, permissions: [] }
  }

  try {
    let raw = userPermsRaw
    try {
      raw = decodeURIComponent(userPermsRaw)
    } catch {
      // Preserve raw cookie value when URI decoding is unnecessary
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const permissions = parsed.filter((p): p is string => typeof p === 'string')
      return {
        role,
        isUnrestricted: permissions.includes('*'),
        permissions,
      }
    }
  } catch {
    // Malformed permission cookie resolves to no permissions
  }

  return { role, isUnrestricted: false, permissions: [] }
}

/**
 * Checks whether the current request holds a single required permission.
 */
export async function checkServerPermission(requiredPermission: string): Promise<boolean> {
  const state = await getServerPermissionState()
  if (state.isUnrestricted) return true
  return state.permissions.includes(requiredPermission)
}

/**
 * Checks whether the current request holds at least one of the listed permissions.
 */
export async function hasAnyServerPermission(requiredPermissions: string[]): Promise<boolean> {
  const state = await getServerPermissionState()
  if (state.isUnrestricted) return true
  return requiredPermissions.some((perm) => state.permissions.includes(perm))
}

/**
 * Redacts sensitive payment fields when the caller lacks granular payment permissions.
 */
export function redactPaymentRecord<
  T extends {
    status?: string | null
    amount?: number | string | null
    payment_method?: string | null
    reference_number?: string | null
    razorpay_payment_id?: string | null
    razorpay_order_id?: string | null
    description?: string | null
  },
>(payment: T, state: ServerPermissionState): T & { amount: number | null } {
  const hasPerm = (perm: string) =>
    state.isUnrestricted || state.permissions.includes(perm)

  const canViewAmounts = hasPerm('payments.view_amounts')
  const canViewBalances = hasPerm('payments.view_balances')
  const canViewDetails = hasPerm('payments.view_details')

  const isPending = payment.status === 'pending'
  const showAmount = isPending ? canViewAmounts || canViewBalances : canViewAmounts

  return {
    ...payment,
    amount: showAmount ? Number(payment.amount ?? 0) : null,
    payment_method: canViewDetails ? payment.payment_method : 'restricted',
    reference_number: canViewDetails ? payment.reference_number : null,
    razorpay_payment_id: canViewDetails ? payment.razorpay_payment_id : null,
    razorpay_order_id: canViewDetails ? payment.razorpay_order_id : null,
    description: canViewDetails ? payment.description : 'Restricted detail',
  }
}
