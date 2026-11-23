'use client'

import { useState, useMemo } from 'react'
import {
  Users,
  UserPlus,
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

  // Group permissions by category
  const categories = useMemo(() => {
    const map = new Map<string, PermissionDefinition[]>()
    for (const p of AVAILABLE_PERMISSIONS) {
      if (!map.has(p.category)) map.set(p.category, [])
      map.get(p.category)!.push(p)
    }
    return Array.from(map.entries())
  }, [])

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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center text-white shadow-md shadow-primary/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Staff & Role Permissions
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create manager & staff accounts, assign granular permissions, and generate login IDs & passwords.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="gradient-brand text-white border-0 hover:opacity-90 font-bold gap-2 text-xs h-10 px-4 rounded-xl shadow-lg shadow-primary/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add Team Member
        </Button>
      </div>

      {/* Member Cards Grid */}
      {employees.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center space-y-3">
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
            className="gradient-brand text-white border-0 font-bold text-xs mt-2"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add First Manager
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map(emp => {
            const fullName = emp.profile?.full_name || 'Staff Member'
            const initials = getInitials(fullName, 'ST')
            const empRole = emp.designation || emp.profile?.role || 'staff'
            const activePermsCount = emp.permissions?.length || 0

            return (
              <div
                key={emp.id}
                className="bg-card border border-border/80 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Avatar & Role */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl gradient-brand text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">{fullName}</h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border-primary/20 bg-primary/10 text-primary mt-0.5"
                        >
                          {empRole.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMember(emp)}
                      className="text-muted-foreground/60 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Delete staff account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Credentials / Contact Snippet */}
                  <div className="bg-muted/40 border border-border/50 rounded-2xl p-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-mono text-[11px] truncate">{emp.profile?.email}</span>
                    </div>
                    {emp.profile?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{emp.profile.phone}</span>
                      </div>
                    )}
                    {emp.employee_code && (
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-mono font-bold text-[10px] text-foreground">
                          {emp.employee_code}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Active Permissions Badges */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-1.5">
                      <span>Allowed Operations</span>
                      <span className="text-primary font-bold">{activePermsCount} granted</span>
                    </div>

                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-0.5">
                      {emp.permissions && emp.permissions.length > 0 ? (
                        emp.permissions.map(permId => {
                          const def = AVAILABLE_PERMISSIONS.find(p => p.id === permId)
                          return (
                            <span
                              key={permId}
                              className="text-[10px] font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md border border-border/40 inline-flex items-center gap-1"
                            >
                              <Check className="w-2.5 h-2.5 text-emerald-500 stroke-[3]" />
                              {def?.label || permId}
                            </span>
                          )
                        })
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          No specific permissions assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Status: <strong className="text-emerald-500 font-semibold">Active</strong>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingEmployee(emp)
                      setEditPermissions([...(emp.permissions || [])])
                      setEditModalOpen(true)
                    }}
                    className="text-xs h-7 px-2.5 rounded-lg font-semibold gap-1 hover:bg-muted"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-primary" /> Edit Permissions
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

          <div className="bg-muted/60 border border-border/80 rounded-2xl p-4 my-4 text-left space-y-3 font-mono text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-sans font-bold">
                Assigned Role
              </span>
              <span className="font-bold text-foreground font-sans capitalize">
                {createdCredentials?.role.replace(/_/g, ' ')} ({createdCredentials?.employee_code})
              </span>
            </div>

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
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
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
    </div>
  )
}
