'use client'

import { useState, useMemo } from 'react'
import {
  Users,
  UserPlus,
  UserCheck,
  Shield,
  ShieldCheck,
  Check,
  Copy,
  Trash2,
  Lock,
  Mail,
  Phone,
  Building2,
  KeyRound,
  AlertCircle,
  Loader2,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Pencil,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AVAILABLE_PERMISSIONS,
  ROLE_PRESETS,
  type PermissionDefinition,
} from '@/lib/permissions'
import { getInitials } from '@/lib/utils'

interface EmployeeRecord {
  id: string
  profile_id: string
  employee_code?: string
  department?: string
  designation?: string
  emergency_contact?: string
  is_active: boolean
  permissions: string[]
  created_at: string
  profile?: {
    id: string
    email: string
    full_name: string
    phone?: string
    role: string
    is_active: boolean
  }
  branch?: {
    id: string
    name: string
    city: string
  }
}

interface StaffManagementClientProps {
  initialEmployees: EmployeeRecord[]
  branches: { id: string; name: string; city: string }[]
}

export function StaffManagementClient({
  initialEmployees,
  branches,
}: StaffManagementClientProps) {
  const [employees, setEmployees] = useState<EmployeeRecord[]>(initialEmployees)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Success Credentials Dialog
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{
    id?: string
    name: string
    username?: string
    email: string
    password: string
    role: string
    employee_code: string
    permissions: string[]
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(true)

  // Created credentials inline editing
  const [isEditingCreatedCreds, setIsEditingCreatedCreds] = useState(false)
  const [customIdInput, setCustomIdInput] = useState('')
  const [customPassInput, setCustomPassInput] = useState('')
  const [savingCustomCreds, setSavingCustomCreds] = useState(false)
  const [customCredsSuccessMsg, setCustomCredsSuccessMsg] = useState<string | null>(null)

  // Dedicated Edit Credentials Modal (from staff cards)
  const [editCredsModalOpen, setEditCredsModalOpen] = useState(false)
  const [targetCredsEmp, setTargetCredsEmp] = useState<EmployeeRecord | null>(null)
  const [targetCredsUsername, setTargetCredsUsername] = useState('')
  const [targetCredsPassword, setTargetCredsPassword] = useState('')
  const [targetCredsShowPassword, setTargetCredsShowPassword] = useState(true)
  const [savingTargetCreds, setSavingTargetCreds] = useState(false)
  const [targetCredsError, setTargetCredsError] = useState<string | null>(null)
  const [targetCredsSuccess, setTargetCredsSuccess] = useState(false)

  // Form states for creating member
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedRolePreset, setSelectedRolePreset] = useState<string>('branch_manager')
  const [department, setDepartment] = useState('Operations')
  const [branchId, setBranchId] = useState<string>(branches[0]?.id || '')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    ROLE_PRESETS.branch_manager.defaultPermissions 
  )

  // Edit permissions modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null)
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Dashboard filters, search, copy & expansion states
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [expandedPerms, setExpandedPerms] = useState<Record<string, boolean>>({})

  // Group permissions by category
  const categories = useMemo(() => {
    const map = new Map<string, PermissionDefinition[]>()
    for (const p of AVAILABLE_PERMISSIONS) {
      if (!map.has(p.category)) map.set(p.category, [])
      map.get(p.category)!.push(p)
    }
    return Array.from(map.entries())
  }, [])

  // Overview stats & role tabs
  const stats = useMemo(() => {
    const total = employees.length
    const active = employees.filter(e => e.is_active !== false).length
    const branchManagers = employees.filter(
      e => (e.designation || e.profile?.role) === 'branch_manager'
    ).length
    return {
      total,
      active,
      inactive: total - active,
      branchManagers,
      categoryCount: categories.length,
      controlCount: AVAILABLE_PERMISSIONS.length,
    }
  }, [employees, categories])

  const roleTabs = useMemo(() => {
    const presentRoles = new Set<string>()
    for (const emp of employees) {
      const r = emp.designation || emp.profile?.role
      if (r) presentRoles.add(r)
    }
    // Always include present roles, ordered by ROLE_PRESETS
    const orderedKeys = [
      ...Object.keys(ROLE_PRESETS).filter(k => presentRoles.has(k)),
      ...Array.from(presentRoles).filter(k => !ROLE_PRESETS[k]),
    ]
    return [
      { key: 'all', label: 'All Roles' },
      ...orderedKeys.map(key => ({
        key,
        label: ROLE_PRESETS[key]?.label || key.replace(/_/g, ' '),
      })),
    ]
  }, [employees])

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return employees.filter(emp => {
      const empRole = emp.designation || emp.profile?.role || 'staff'
      if (roleFilter !== 'all' && empRole !== roleFilter) return false

      const isActive = emp.is_active !== false
      if (statusFilter === 'active' && !isActive) return false
      if (statusFilter === 'inactive' && isActive) return false

      if (q) {
        const name = (emp.profile?.full_name || '').toLowerCase()
        const email = (emp.profile?.email || '').toLowerCase()
        const phone = (emp.profile?.phone || '').toLowerCase()
        const code = (emp.employee_code || '').toLowerCase()
        let username = ''
        if (emp.emergency_contact) {
          try {
            const meta = JSON.parse(emp.emergency_contact)
            username = (meta.username || meta.short_username || '').toLowerCase()
          } catch {}
        }
        if (
          !name.includes(q) &&
          !email.includes(q) &&
          !phone.includes(q) &&
          !code.includes(q) &&
          !username.includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [employees, roleFilter, statusFilter, searchQuery])

  const handleCopyValue = (key: string, value: string) => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopiedField(key)
    setTimeout(() => setCopiedField(prev => (prev === key ? null : prev)), 1500)
  }

  // Handle Preset change
  const handlePresetChange = (presetKey: string) => {
    setSelectedRolePreset(presetKey)
    if (ROLE_PRESETS[presetKey]) {
      setSelectedPermissions([...ROLE_PRESETS[presetKey].defaultPermissions])
    }
  }

  // Toggle single permission
  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    )
  }

  // Toggle in edit modal
  const toggleEditPermission = (permId: string) => {
    setEditPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    )
  }

  // Submit create member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Please enter the team member full name.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/admin/members/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          role: selectedRolePreset,
          department,
          branch_id: branchId,
          permissions: selectedPermissions,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create member.')
      }

      // Add to local state
      const newEmp: EmployeeRecord = {
        id: json.employee?.id || json.credentials?.id,
        profile_id: json.credentials?.id,
        employee_code: json.credentials?.employee_code,
        designation: json.credentials?.role,
        department,
        emergency_contact: json.employee?.emergency_contact,
        is_active: true,
        permissions: selectedPermissions,
        created_at: new Date().toISOString(),
        profile: {
          id: json.credentials?.id,
          email: json.credentials?.email,
          full_name: json.credentials?.name,
          phone: phone.trim(),
          role: json.credentials?.role,
          is_active: true,
        },
        branch: branches.find(b => b.id === branchId),
      }

      setEmployees(prev => [newEmp, ...prev])
      setCreatedCredentials(json.credentials)
      setCustomIdInput(json.credentials?.username || json.credentials?.email || '')
      setCustomPassInput(json.credentials?.password || '')
      setIsEditingCreatedCreds(false)
      setCustomCredsSuccessMsg(null)
      setAddModalOpen(false)
      setCredentialsModalOpen(true)

      // Reset form
      setName('')
      setPhone('')
      setSelectedPermissions(ROLE_PRESETS.branch_manager.defaultPermissions)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating staff account.')
    } finally {
      setSubmitting(false)
    }
  }

  // Helper: Generate clean 9-character random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$'
    let res = ''
    for (let i = 0; i < 9; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return res
  }

  // Save credentials edited in Created Credentials Modal
  const handleSaveCreatedCreds = async () => {
    if (!createdCredentials?.id) return
    if (!customIdInput.trim()) {
      alert('Please enter a valid Username / ID.')
      return
    }
    if (!customPassInput.trim() || customPassInput.trim().length < 4) {
      alert('Password must be at least 4 characters long.')
      return
    }

    setSavingCustomCreds(true)
    setCustomCredsSuccessMsg(null)

    try {
      const res = await fetch('/api/admin/members/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: createdCredentials.id,
          username: customIdInput.trim(),
          password: customPassInput.trim(),
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update credentials.')

      setCreatedCredentials(prev =>
        prev
          ? {
              ...prev,
              username: json.credentials?.username || customIdInput.trim(),
              email: json.credentials?.email || prev.email,
              password: customPassInput.trim(),
            }
          : null
      )

      // Update in employees list
      setEmployees(prev =>
        prev.map(e => {
          if (e.id === createdCredentials.id) {
            let meta: any = {}
            try { meta = JSON.parse(e.emergency_contact || '{}') } catch {}
            const nextEmail = json.credentials?.email || meta.email
            meta.username = json.credentials?.username || customIdInput.trim()
            meta.short_username = json.credentials?.short_username || customIdInput.trim()
            meta.email = nextEmail
            return {
              ...e,
              emergency_contact: JSON.stringify(meta),
              profile: e.profile ? { ...e.profile, email: nextEmail } : e.profile,
            }
          }
          return e
        })
      )

      setIsEditingCreatedCreds(false)
      setCustomCredsSuccessMsg('Login ID & Password saved successfully!')
      setTimeout(() => setCustomCredsSuccessMsg(null), 3000)
    } catch (err: any) {
      alert(err.message || 'Error updating credentials.')
    } finally {
      setSavingCustomCreds(false)
    }
  }

  // Open modal to edit credentials from staff card
  const openEditCredentialsModal = (emp: EmployeeRecord) => {
    setTargetCredsEmp(emp)
    let username = emp.employee_code || ''
    if (emp.emergency_contact) {
      try {
        const meta = JSON.parse(emp.emergency_contact)
        username = meta.username || meta.short_username || meta.email || emp.employee_code || ''
      } catch {}
    }
    setTargetCredsUsername(username)
    setTargetCredsPassword(generateRandomPassword())
    setTargetCredsError(null)
    setTargetCredsSuccess(false)
    setEditCredsModalOpen(true)
  }

  // Save credentials from staff card modal
  const handleSaveTargetCreds = async () => {
    if (!targetCredsEmp?.id) return
    if (!targetCredsUsername.trim()) {
      setTargetCredsError('Please enter a valid Username / ID.')
      return
    }
    if (!targetCredsPassword.trim() || targetCredsPassword.trim().length < 4) {
      setTargetCredsError('Password must be at least 4 characters long.')
      return
    }

    setSavingTargetCreds(true)
    setTargetCredsError(null)

    try {
      const res = await fetch('/api/admin/members/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: targetCredsEmp.id,
          username: targetCredsUsername.trim(),
          password: targetCredsPassword.trim(),
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update credentials.')

      // Update in employees list
      setEmployees(prev =>
        prev.map(e => {
          if (e.id === targetCredsEmp.id) {
            let meta: any = {}
            try { meta = JSON.parse(e.emergency_contact || '{}') } catch {}
            const nextEmail = json.credentials?.email || meta.email
            meta.username = json.credentials?.username || targetCredsUsername.trim()
            meta.short_username = json.credentials?.short_username || targetCredsUsername.trim()
            meta.email = nextEmail
            return {
              ...e,
              emergency_contact: JSON.stringify(meta),
              profile: e.profile ? { ...e.profile, email: nextEmail } : e.profile,
            }
          }
          return e
        })
      )

      setTargetCredsSuccess(true)
      setTimeout(() => {
        setEditCredsModalOpen(false)
        setTargetCredsSuccess(false)
      }, 1500)
    } catch (err: any) {
      setTargetCredsError(err.message || 'Failed to update credentials.')
    } finally {
      setSavingTargetCreds(false)
    }
  }

  // Save edit permissions
  const handleSaveEditPermissions = async () => {
    if (!editingEmployee) return
    setEditSubmitting(true)

    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEmployee.id,
          permissions: editPermissions,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update.')

      setEmployees(prev =>
        prev.map(emp =>
          emp.id === editingEmployee.id ? { ...emp, permissions: editPermissions } : emp
        )
      )
      setEditModalOpen(false)
      setEditingEmployee(null)
    } catch (err: any) {
      alert(err.message || 'Error updating permissions.')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Delete member
  const handleDeleteMember = async (emp: EmployeeRecord) => {
    const memberName = emp.profile?.full_name || 'this member'
    if (!confirm(`Are you sure you want to remove ${memberName}? They will immediately lose access.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/members?id=${emp.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete.')

      setEmployees(prev => prev.filter(e => e.id !== emp.id))
    } catch (err: any) {
      alert(err.message || 'Error deleting member.')
    }
  }

  // Copy credentials helper
  const handleCopyCredentials = () => {
    if (!createdCredentials) return
    const text = `--- DriveEase / JSD Staff Login Credentials ---
Staff Name: ${createdCredentials.name}
Role: ${createdCredentials.role.replace(/_/g, ' ').toUpperCase()} (${createdCredentials.employee_code})
Username / ID: ${createdCredentials.username || createdCredentials.email}
Email: ${createdCredentials.email}
Password: ${createdCredentials.password}

Login URL: ${window.location.origin}/login
-----------------------------------------------`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const roleStyles: Record<string, { avatar: string; badge: string }> = {
    branch_manager: {
      avatar: 'bg-[#1f6bff]',
      badge: 'bg-blue-50 text-blue-600 border-blue-200/80 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    },
    vehicle_manager: {
      avatar: 'bg-[#6d28d9]',
      badge: 'bg-violet-50 text-violet-600 border-violet-200/80 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
    },
    booking_manager: {
      avatar: 'bg-[#059669]',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    },
    accountant: {
      avatar: 'bg-[#0284c7]',
      badge: 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
    },
    staff: {
      avatar: 'bg-[#0d9488]',
      badge: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
    },
    admin: {
      avatar: 'bg-[#4f46e5]',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
    },
  }

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/70 dark:border-blue-500/20 flex items-center justify-center text-[#1f6bff] shrink-0 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Staff & Role Permissions
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create manager & staff accounts, assign granular permissions, and manage login credentials.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-[#1f6bff] hover:bg-[#175ce0] text-white border-0 font-semibold gap-2 text-xs h-10 px-4 rounded-xl shadow-sm cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Add Team Member
        </Button>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Team Members */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Team Members
              </span>
              <span className="text-3xl font-extrabold text-foreground block mt-1 leading-none">
                {stats.total}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            Registered across JSD fleet
          </span>
        </div>

        {/* Card 2: Active Accounts */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Active Accounts
              </span>
              <span className="text-3xl font-extrabold text-foreground block mt-1 leading-none">
                {stats.active}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
            <span>
              {stats.inactive === 0 ? 'All accounts enabled' : `${stats.inactive} inactive account${stats.inactive > 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Card 3: Branch Managers */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Branch Managers
              </span>
              <span className="text-3xl font-extrabold text-foreground block mt-1 leading-none">
                {stats.branchManagers}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#1f6bff] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#1f6bff] border border-blue-200/60 dark:border-blue-500/20">
              Manager Tier
            </span>
          </div>
        </div>

        {/* Card 4: Permission Modules */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Permission Modules
              </span>
              <span className="text-3xl font-extrabold text-foreground block mt-1 leading-none">
                {stats.categoryCount}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {stats.categoryCount} Categories • {stats.controlCount} Controls
          </span>
        </div>
      </div>

      {/* Role Tabs + Search & Status Filter Toolbar */}
      <div className="bg-card border border-border/80 rounded-2xl px-3.5 py-2.5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Role Pill Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {roleTabs.map(tab => {
            const active = roleFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Right Controls: Search + Count + Status Filter */}
        <div className="flex flex-wrap items-center gap-2.5 justify-between lg:justify-end">
          <div className="relative flex-1 sm:flex-initial sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search staff, EMP ID, email..."
              className="pl-8 pr-7 h-8 text-xs rounded-full bg-muted/40 border-border/70"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
            Showing <strong className="text-foreground font-semibold">{filteredEmployees.length}</strong> of {employees.length} members
          </span>

          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="h-8 w-[115px] text-xs font-medium rounded-full bg-card border-border/80">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs">All Status</SelectItem>
              <SelectItem value="active" className="text-xs">Active</SelectItem>
              <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Member Cards Grid */}
      {employees.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">No custom staff members created yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Click &quot;Add Team Member&quot; to create a manager or staff account. The software will automatically generate their login ID, password, and enforce their assigned permissions.
            </p>
          </div>
          <Button
            onClick={() => setAddModalOpen(true)}
            size="sm"
            className="bg-[#1f6bff] hover:bg-[#175ce0] text-white border-0 font-semibold text-xs mt-2 rounded-xl"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add First Manager
          </Button>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm font-bold text-foreground">No matching staff members found</p>
          <p className="text-xs text-muted-foreground">
            Try clearing your search query or switching role/status filters.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setRoleFilter('all')
              setStatusFilter('all')
              setSearchQuery('')
            }}
            className="text-xs rounded-xl"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredEmployees.map((emp, idx) => {
            const fullName = emp.profile?.full_name || 'Staff Member'
            const initials = getInitials(fullName, 'ST')
            const empRole = emp.designation || emp.profile?.role || 'staff'
            const roleLabel = (ROLE_PRESETS[empRole]?.label || empRole.replace(/_/g, ' ')).toUpperCase()
            const style = roleStyles[empRole] || {
              avatar: ['bg-[#1f6bff]', 'bg-[#6d28d9]', 'bg-[#059669]'][idx % 3],
              badge: 'bg-blue-50 text-blue-600 border-blue-200/80 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
            }
            const isActive = emp.is_active !== false
            const perms = Array.isArray(emp.permissions) ? emp.permissions : []
            const activePermsCount = perms.length
            const isExpanded = Boolean(expandedPerms[emp.id])
            const visiblePerms = isExpanded ? perms : perms.slice(0, 6)
            const hiddenCount = perms.length - visiblePerms.length
            const displayEmail = emp.profile?.email || ''

            return (
              <div
                key={emp.id}
                className="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-4">
                  {/* Top Bar: Avatar, Name, Role Badge, Status Pill & Delete */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl ${style.avatar} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-[15px] text-foreground truncate leading-snug">
                          {fullName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${style.badge}`}
                          >
                            {roleLabel}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMember(emp)}
                      className="text-muted-foreground/50 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                      title="Delete staff account"
                      aria-label={`Delete ${fullName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Credentials / Contact Box with One-Click Copy */}
                  <div className="bg-slate-50/85 dark:bg-muted/40 border border-border/60 rounded-xl p-3 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                        <span className="font-mono text-[11px] text-foreground/85 truncate">
                          {displayEmail || 'No login email'}
                        </span>
                      </div>
                      {displayEmail && (
                        <button
                          type="button"
                          onClick={() => handleCopyValue(`${emp.id}-email`, displayEmail)}
                          className="text-muted-foreground/60 hover:text-foreground p-0.5 rounded transition-colors cursor-pointer shrink-0"
                          title="Copy email / login ID"
                        >
                          {copiedField === `${emp.id}-email` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {emp.profile?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                        <span className="text-[11px] text-foreground/80">{emp.profile.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Allowed Operations */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-muted-foreground">Allowed Operations</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1f6bff] dark:bg-blue-500/10 dark:text-blue-400">
                        {activePermsCount} granted
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {perms.length > 0 ? (
                        <>
                          {visiblePerms.map(permId => {
                            const def = AVAILABLE_PERMISSIONS.find(p => p.id === permId)
                            return (
                              <span
                                key={permId}
                                className="text-[11px] font-medium bg-slate-50 dark:bg-muted/50 text-foreground/90 px-2 py-1 rounded-lg border border-border/70 inline-flex items-center gap-1.5"
                              >
                                <Check className="w-3 h-3 text-emerald-500 stroke-[2.5] shrink-0" />
                                <span>{def?.label || permId}</span>
                              </span>
                            )
                          })}
                          {hiddenCount > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPerms(prev => ({ ...prev, [emp.id]: true }))
                              }
                              className="text-[11px] font-bold bg-blue-50/80 dark:bg-blue-500/10 text-[#1f6bff] px-2.5 py-1 rounded-lg border border-blue-200/70 dark:border-blue-500/20 hover:bg-blue-100/80 transition-colors cursor-pointer"
                            >
                              +{hiddenCount} more
                            </button>
                          )}
                          {isExpanded && perms.length > 6 && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedPerms(prev => ({ ...prev, [emp.id]: false }))
                              }
                              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg cursor-pointer"
                            >
                              Show less
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          No specific permissions assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Split Buttons */}
                <div className="pt-3 border-t border-border/70 grid grid-cols-2 gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditCredentialsModal(emp)}
                    className="h-9 text-xs font-semibold rounded-xl gap-1.5 border-border/80 hover:bg-muted/60 cursor-pointer w-full"
                    title="Edit Login Username & Password"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Edit ID / Pass</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingEmployee(emp)
                      setEditPermissions([...(emp.permissions || [])])
                      setEditModalOpen(true)
                    }}
                    className="h-9 text-xs font-semibold rounded-xl gap-1.5 border-blue-200 dark:border-blue-500/30 bg-blue-50/40 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/15 text-foreground cursor-pointer w-full"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#1f6bff] shrink-0" />
                    <span>Edit Permissions</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================== */}
      {/* 1. ADD TEAM MEMBER MODAL                                   */}
      {/* ========================================================== */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" /> Team & Authorization Management
            </div>
            <DialogTitle className="text-xl font-black">Register New Team Member</DialogTitle>
            <DialogDescription className="text-xs">
              Configure employee profile and select allowed operations. The software will generate their login ID and password.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateMember} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Legal Name *</Label>
                <Input
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role Designation Preset</Label>
                <Select value={selectedRolePreset} onValueChange={handlePresetChange}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {Object.entries(ROLE_PRESETS).map(([key, item]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground block">
                  Selecting a preset auto-toggles standard permissions below.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Assigned Branch</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.city} — {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Granular Permissions Checkboxes */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-foreground">
                    Operational Permissions Checklist
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Check the operations this user is allowed to access. Unchecked operations will be hidden.
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs font-mono font-bold">
                  {selectedPermissions.length} selected
                </Badge>
              </div>

              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {categories.map(([category, perms]) => (
                  <div
                    key={category}
                    className="p-3 bg-muted/30 border border-border/60 rounded-2xl space-y-2"
                  >
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                      {category}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map(p => {
                        const isChecked = selectedPermissions.includes(p.id)
                        return (
                          <div
                            key={p.id}
                            onClick={() => togglePermission(p.id)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                              isChecked
                                ? 'bg-primary/10 border-primary/40 text-foreground font-semibold shadow-2xs'
                                : 'bg-card border-border/50 text-muted-foreground hover:bg-muted/50'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isChecked
                                  ? 'bg-primary text-white'
                                  : 'border border-muted-foreground/40 bg-card'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="min-w-0">
                              <span className="block leading-tight">{p.label}</span>
                              <span className="text-[10px] text-muted-foreground font-normal line-clamp-1 mt-0.5">
                                {p.description}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="gradient-brand text-white border-0 font-bold text-xs gap-1.5 shadow-md shadow-primary/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating Credentials...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Generate ID & Create Member
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================== */}
      {/* 2. CREATED CREDENTIALS SUCCESS MODAL                       */}
      {/* ========================================================== */}
      <Dialog open={credentialsModalOpen} onOpenChange={setCredentialsModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <DialogTitle className="text-xl font-black">
            Staff Account Created!
          </DialogTitle>
          <DialogDescription className="text-xs">
            Copy and securely deliver these credentials to <strong>{createdCredentials?.name}</strong>.
            They will only see the authorized operations when logged in.
          </DialogDescription>

          {customCredsSuccessMsg && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{customCredsSuccessMsg}</span>
            </div>
          )}

          <div className="bg-muted/60 border border-border/80 rounded-2xl p-4 my-3 text-left space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-sans font-bold">
                  Assigned Role
                </span>
                <span className="font-bold text-foreground font-sans capitalize">
                  {createdCredentials?.role.replace(/_/g, ' ')} ({createdCredentials?.employee_code})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isEditingCreatedCreds) {
                    setCustomIdInput(createdCredentials?.username || createdCredentials?.email || '')
                    setCustomPassInput(createdCredentials?.password || '')
                  }
                  setIsEditingCreatedCreds(!isEditingCreatedCreds)
                }}
                className="text-[11px] font-sans font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/10 px-2 py-1 rounded-lg"
              >
                <Pencil className="w-3 h-3" />
                {isEditingCreatedCreds ? 'Cancel' : 'Edit ID & Password'}
              </button>
            </div>

            {isEditingCreatedCreds ? (
              <div className="space-y-3 pt-2 border-t border-border/60 font-sans">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-bold">
                    Custom Login ID / Username
                  </span>
                  <Input
                    type="text"
                    value={customIdInput}
                    onChange={e => setCustomIdInput(e.target.value)}
                    placeholder="e.g. shankr or shankr12"
                    className="h-9 bg-card text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-bold">
                      Custom Password
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomPassInput(generateRandomPassword())}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Random
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={customPassInput}
                      onChange={e => setCustomPassInput(e.target.value)}
                      placeholder="Enter new password"
                      className="h-9 bg-card text-xs font-mono font-bold pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={savingCustomCreds}
                  onClick={handleSaveCreatedCreds}
                  className="w-full h-8 text-xs font-bold gradient-brand text-white border-0"
                >
                  {savingCustomCreds ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" /> Save Updated ID & Password
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-sans font-bold">
                    Login Username / ID
                  </span>
                  <div className="bg-card px-3 py-2 rounded-xl border border-border flex items-center justify-between mt-1">
                    <span className="text-primary font-bold truncate">
                      {createdCredentials?.username || createdCredentials?.email}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-sans">Can sign in with ID or Email</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-sans font-bold">
                    Generated Password
                  </span>
                  <div className="bg-card px-3 py-2 rounded-xl border border-border flex items-center justify-between mt-1">
                    <span className="font-bold text-foreground tracking-wider">
                      {showPassword ? createdCredentials?.password : '•••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <Button
            type="button"
            onClick={handleCopyCredentials}
            className={`w-full font-bold text-xs h-11 rounded-xl shadow-md gap-2 transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'gradient-brand text-white border-0 hover:opacity-90'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" /> Credentials Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Login Credentials
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCredentialsModalOpen(false)}
            className="w-full text-xs text-muted-foreground mt-2"
          >
            Done & Return to List
          </Button>
        </DialogContent>
      </Dialog>

      {/* ========================================================== */}
      {/* 3. EDIT PERMISSIONS MODAL                                  */}
      {/* ========================================================== */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <SlidersHorizontal className="w-4 h-4" /> Access Control
            </div>
            <DialogTitle className="text-lg font-black">
              Edit Permissions: {editingEmployee?.profile?.full_name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update allowed functions for this staff member in real-time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1 py-2">
            {categories.map(([category, perms]) => (
              <div
                key={category}
                className="p-3 bg-muted/30 border border-border/60 rounded-2xl space-y-2"
              >
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                  {category}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perms.map(p => {
                    const isChecked = editPermissions.includes(p.id)
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleEditPermission(p.id)}
                        className={`p-2 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-center gap-2 ${
                          isChecked
                            ? 'bg-primary/10 border-primary/40 text-foreground font-semibold'
                            : 'bg-card border-border/50 text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'bg-primary text-white'
                              : 'border border-muted-foreground/40 bg-card'
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="leading-tight truncate">{p.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={editSubmitting}
              onClick={handleSaveEditPermissions}
              className="gradient-brand text-white border-0 font-bold text-xs"
            >
              {editSubmitting ? 'Saving...' : 'Save Permissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================== */}
      {/* 4. EDIT LOGIN ID & PASSWORD MODAL (From Staff Card)       */}
      {/* ========================================================== */}
      <Dialog open={editCredsModalOpen} onOpenChange={setEditCredsModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <KeyRound className="w-4 h-4 text-amber-500" /> Account Access Credentials
            </div>
            <DialogTitle className="text-lg font-black text-foreground">
              Edit Login ID & Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Change login ID/username or set a new password for{' '}
              <strong className="text-foreground">{targetCredsEmp?.profile?.full_name || 'Staff Member'}</strong> (
              <span className="font-mono">{targetCredsEmp?.employee_code}</span>).
            </DialogDescription>
          </DialogHeader>

          {targetCredsSuccess ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5 my-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Credentials Updated Successfully!</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  The staff member can now sign in with their updated login ID and password.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 my-2">
              {targetCredsError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{targetCredsError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Staff Login ID / Username</Label>
                <Input
                  type="text"
                  value={targetCredsUsername}
                  onChange={e => setTargetCredsUsername(e.target.value)}
                  placeholder="e.g. shankr or shankr12"
                  className="h-10 text-xs font-mono font-bold rounded-xl bg-muted/30"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Staff member can type this ID or their email on the login screen.
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">New Password</Label>
                  <button
                    type="button"
                    onClick={() => setTargetCredsPassword(generateRandomPassword())}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RefreshCw className="w-3 h-3" /> Generate Random
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={targetCredsShowPassword ? 'text' : 'password'}
                    value={targetCredsPassword}
                    onChange={e => setTargetCredsPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="h-10 text-xs font-mono font-bold rounded-xl bg-muted/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetCredsShowPassword(!targetCredsShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
                  >
                    {targetCredsShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  Minimum 4 characters. Will securely hash and activate immediately.
                </span>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditCredsModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={savingTargetCreds}
                  onClick={handleSaveTargetCreds}
                  className="gradient-brand text-white border-0 font-bold text-xs rounded-xl shadow-md gap-1.5"
                >
                  {savingTargetCreds ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save Updated Credentials
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
