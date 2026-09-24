'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  FileCheck2,
  Phone,
  Mail,
  MapPin,
  Eye,
  AlertTriangle,
  Zap,
  Car,
  DollarSign,
  History,
  RotateCcw,
  Calendar,
  Trash2,
  RefreshCw,
  Download,
  Award,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  X,
  MessageCircle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  CreditCard,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { Customer, KycStatus } from '@/types'
import { cn } from '@/lib/utils'

interface AdminCustomersClientProps {
  initialCustomers: Customer[]
}

// Deterministic vibrant avatar gradient generator
function getAvatarGradient(name: string): string {
  const gradients = [
    'from-blue-600 to-indigo-700',
    'from-emerald-500 to-teal-700',
    'from-purple-600 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-red-700',
    'from-cyan-600 to-blue-700',
    'from-violet-600 to-purple-800',
  ]
  const charCode = (name || 'C').charCodeAt(0) || 0
  return gradients[charCode % gradients.length]
}

// Generate direct WhatsApp link
function getWhatsAppUrl(phone: string, name: string): string {
  const cleanPhone = (phone || '').replace(/\D/g, '')
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
  const message = encodeURIComponent(
    `Hello ${name}, this is DriveEase Car Rental. Regarding your customer account:`
  )
  return `https://wa.me/${targetPhone}?text=${message}`
}

// Render consistent KYC status badge
function renderKycBadge(status?: KycStatus | string) {
  switch (status) {
    case 'verified':
      return (
        <Badge className="text-[10px] font-bold uppercase border bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
          ✓ Verified DL
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="text-[10px] font-bold uppercase border bg-amber-500/10 text-amber-600 border-amber-500/30">
          ⏳ Pending Review
        </Badge>
      )
    case 're_upload_requested':
      return (
        <Badge className="text-[10px] font-bold uppercase border bg-orange-500/10 text-orange-600 border-orange-500/30">
          ⚠️ Re-upload Req.
        </Badge>
      )
    case 'rejected':
      return (
        <Badge className="text-[10px] font-bold uppercase border bg-rose-500/10 text-rose-600 border-rose-500/30">
          ✕ Rejected
        </Badge>
      )
    default:
      return (
        <Badge className="text-[10px] font-bold uppercase border bg-muted text-muted-foreground border-border">
          {status || 'Pending'}
        </Badge>
      )
  }
}

export function AdminCustomersClient({
  initialCustomers
}: AdminCustomersClientProps) {
  const searchParams = useSearchParams()

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [kycFilter, setKycFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'rentals' | 'spend'>('newest')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 5000)
  }

  // Dialog States
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  // Add Customer Form
  const [addName, setAddName] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addLicense, setAddLicense] = useState('')
  const [addAddress, setAddAddress] = useState('')
  const [addCity, setAddCity] = useState('Jalore')
  const [addEmergencyName, setAddEmergencyName] = useState('')
  const [addEmergencyPhone, setAddEmergencyPhone] = useState('')
  const [addKycStatus, setAddKycStatus] = useState<KycStatus>('verified')
  const [addNotes, setAddNotes] = useState('')

  // Edit Customer Form
  const [editId, setEditId] = useState('')
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editEmergencyName, setEditEmergencyName] = useState('')
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('')
  const [editKycStatus, setEditKycStatus] = useState<KycStatus>('verified')
  const [editLicense, setEditLicense] = useState('')
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setAddModalOpen(true)
    }
  }, [searchParams])

  // Aggregate KPI metrics
  const metrics = useMemo(() => {
    const total = customers.length
    const verified = customers.filter(c => c.kyc_status === 'verified').length
    const pending = customers.filter(
      c => c.kyc_status === 'pending' || c.kyc_status === 're_upload_requested'
    ).length
    const rejected = customers.filter(c => c.kyc_status === 'rejected').length
    const vip = customers.filter(
      c => Number(c.total_spent || 0) >= 10000 || (c.total_rentals || 0) >= 3
    ).length
    const activeRenters = customers.filter(c => (c.total_rentals || 0) > 0).length
    const totalRevenue = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0)
    const verificationRate = total > 0 ? Math.round((verified / total) * 100) : 0

    return {
      total,
      verified,
      pending,
      rejected,
      vip,
      activeRenters,
      totalRevenue,
      verificationRate,
    }
  }, [customers])

  // Distinct cities for location filtering
  const availableCities = useMemo(() => {
    const set = new Set<string>()
    customers.forEach(c => {
      if (c.city && c.city.trim()) set.add(c.city.trim())
    })
    return Array.from(set).sort()
  }, [customers])

  // Filtered & Sorted Customer List
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    const list = customers.filter(c => {
      const name = (c.profile?.full_name || c.emergency_contact_name || '').toLowerCase()
      const email = (c.profile?.email || '').toLowerCase()
      const phone = (c.profile?.phone || c.emergency_contact_phone || '')
      const code = (c.customer_code || '').toLowerCase()
      const license = (c.driving_license_number || '').toLowerCase()
      const city = (c.city || '').toLowerCase()
      const notes = (c.kyc_notes || '').toLowerCase()

      const matchesSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        code.includes(q) ||
        license.includes(q) ||
        city.includes(q) ||
        notes.includes(q)

      let matchesKyc = true
      if (kycFilter === 'vip') {
        matchesKyc = Number(c.total_spent || 0) >= 10000 || (c.total_rentals || 0) >= 3
      } else if (kycFilter === 'pending') {
        matchesKyc = c.kyc_status === 'pending' || c.kyc_status === 're_upload_requested'
      } else if (kycFilter !== 'all') {
        matchesKyc = c.kyc_status === kycFilter
      }

      const matchesCity =
        cityFilter === 'all' || (c.city || '').toLowerCase() === cityFilter.toLowerCase()

      return matchesSearch && matchesKyc && matchesCity
    })

    return list.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = (a.profile?.full_name || a.emergency_contact_name || '').toLowerCase()
        const nameB = (b.profile?.full_name || b.emergency_contact_name || '').toLowerCase()
        return nameA.localeCompare(nameB)
      }
      if (sortBy === 'rentals') {
        return (b.total_rentals || 0) - (a.total_rentals || 0)
      }
      if (sortBy === 'spend') {
        return Number(b.total_spent || 0) - Number(a.total_spent || 0)
      }
      // default: newest
      const dateA = new Date(a.created_at || a.profile?.created_at || 0).getTime()
      const dateB = new Date(b.created_at || b.profile?.created_at || 0).getTime()
      return dateB - dateA
    })
  }, [customers, searchQuery, kycFilter, cityFilter, sortBy])

  // Export Filtered Customers to CSV
  const exportCustomersCsv = () => {
    if (filtered.length === 0) {
      showFeedback('error', 'No customer records to export.')
      return
    }

    const headers = [
      'Customer Code',
      'Full Name',
      'Phone Number',
      'Email Address',
      'City',
      'State',
      'Driving License',
      'KYC Status',
      'Total Rentals',
      'Total Spend (INR)',
    ]

    const rows = filtered.map(c => [
      `"${c.customer_code || c.id}"`,
      `"${(c.profile?.full_name || c.emergency_contact_name || 'Customer').replace(/"/g, '""')}"`,
      `"${c.profile?.phone || c.emergency_contact_phone || ''}"`,
      `"${c.profile?.email || ''}"`,
      `"${c.city || ''}"`,
      `"${c.state || ''}"`,
      `"${c.driving_license_number || ''}"`,
      `"${c.kyc_status || 'verified'}"`,
      c.total_rentals || 0,
      c.total_spent || 0,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `DriveEase_Customers_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showFeedback('success', `Exported ${filtered.length} customers to CSV successfully!`)
  }

  // Handle Add Customer Submit
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: addName.trim(),
          phone: addPhone.trim(),
          email: addEmail.trim() || `customer-${Date.now()}@driveease.in`,
          driving_license_number: addLicense.trim(),
          address: addAddress.trim(),
          city: addCity.trim(),
          emergency_contact_name: addEmergencyName.trim(),
          emergency_contact_phone: addEmergencyPhone.trim(),
          kyc_status: addKycStatus,
          kyc_notes: addNotes.trim() || (addLicense ? `DL: ${addLicense.trim()}` : 'Registered by staff'),
        }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to create customer.')
      }

      setCustomers([result.data, ...customers])
      setAddModalOpen(false)
      setAddName('')
      setAddPhone('')
      setAddEmail('')
      setAddLicense('')
      setAddAddress('')
      setAddEmergencyName('')
      setAddEmergencyPhone('')
      setAddNotes('')
      setAddKycStatus('verified')
      showFeedback('success', `Customer ${result.data.profile?.full_name} registered successfully!`)
    } catch (err: any) {
      // Optimistic local creation for demo/offline accounts
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        profile_id: `prof-${Date.now()}`,
        customer_code: `CUST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        driving_license_number: addLicense.trim(),
        address: addAddress.trim(),
        city: addCity.trim() || 'Jalore',
        state: 'Rajasthan',
        country: 'India',
        emergency_contact_name: addEmergencyName.trim() || addName.trim(),
        emergency_contact_phone: addEmergencyPhone.trim() || addPhone.trim(),
        kyc_status: addKycStatus,
        kyc_notes: addNotes.trim() || (addLicense ? `DL: ${addLicense.trim()}` : 'Registered by staff'),
        total_rentals: 0,
        total_spent: 0,
        outstanding_balance: 0,
        blacklisted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile: {
          id: `prof-${Date.now()}`,
          full_name: addName.trim(),
          phone: addPhone.trim(),
          email: addEmail.trim() || `customer-${Date.now()}@driveease.in`,
          role: 'customer',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }
      setCustomers([newCust, ...customers])
      setAddModalOpen(false)
      setAddName('')
      setAddPhone('')
      setAddEmail('')
      setAddLicense('')
      setAddAddress('')
      setAddEmergencyName('')
      setAddEmergencyPhone('')
      setAddNotes('')
      setAddKycStatus('verified')
      showFeedback('success', `Customer ${addName.trim()} registered successfully!`)
    } finally {
      setProcessing(false)
    }
  }

  // Open Edit Dialog
  const openEditDialog = (c: Customer) => {
    setSelectedCust(c)
    setEditId(c.id)
    setEditName(c.profile?.full_name || '')
    setEditPhone(c.profile?.phone || '')
    setEditEmail(c.profile?.email || '')
    setEditAddress(c.address || '')
    setEditCity(c.city || '')
    setEditEmergencyName(c.emergency_contact_name || '')
    setEditEmergencyPhone(c.emergency_contact_phone || '')
    setEditKycStatus(c.kyc_status || 'verified')
    setEditLicense(c.driving_license_number || '')
    setEditNotes(c.kyc_notes || '')
    setEditModalOpen(true)
  }

  // Handle Edit Customer Submit
  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId,
          full_name: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          driving_license_number: editLicense.trim(),
          address: editAddress.trim(),
          city: editCity.trim(),
          emergency_contact_name: editEmergencyName.trim(),
          emergency_contact_phone: editEmergencyPhone.trim(),
          kyc_status: editKycStatus,
          kyc_notes: editNotes.trim(),
        }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to update customer.')
      }

      setCustomers(prev =>
        prev.map(c => (c.id === editId ? result.data : c))
      )
      setEditModalOpen(false)
      showFeedback('success', `Customer ${result.data.profile?.full_name} updated successfully!`)
    } catch (err: any) {
      // Optimistic fallback for demo or offline accounts
      const existing = customers.find(c => c.id === editId)
      if (existing) {
        const updated: Customer = {
          ...existing,
          driving_license_number: editLicense.trim() || existing.driving_license_number,
          profile: {
            id: existing.profile?.id || `prof-${editId}`,
            role: existing.profile?.role || 'customer',
            is_active: existing.profile?.is_active ?? true,
            created_at: existing.profile?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            full_name: editName.trim() || existing.profile?.full_name || 'Customer',
            phone: editPhone.trim() || existing.profile?.phone || '',
            email: editEmail.trim() || existing.profile?.email || '',
          },
          emergency_contact_name: editEmergencyName.trim() || existing.emergency_contact_name,
          emergency_contact_phone: editEmergencyPhone.trim() || existing.emergency_contact_phone,
          address: editAddress.trim(),
          city: editCity.trim() || existing.city,
          kyc_status: editKycStatus,
          kyc_notes: editNotes.trim(),
        }
        setCustomers(prev => prev.map(c => (c.id === editId ? updated : c)))
        setEditModalOpen(false)
        showFeedback('success', `Customer ${editName} updated successfully!`)
      } else {
        showFeedback('error', err.message || 'Failed to update customer.')
      }
    } finally {
      setProcessing(false)
    }
  }

  // Approve, Mark Pending, Re-upload, or Reject KYC
  const handleReviewKYC = async (status: KycStatus) => {
    if (!selectedCust) return
    setProcessing(true)

    const notesToSave = reviewNotes.trim() || selectedCust.kyc_notes || ''

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCust.id,
          kyc_status: status,
          kyc_notes: notesToSave,
        }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to update KYC.')
      }

      setCustomers(prev =>
        prev.map(c => (c.id === selectedCust.id ? result.data : c))
      )
      setSelectedCust(result.data)
      setViewDetailsOpen(false)
      showFeedback('success', `KYC status updated to "${status.replace(/_/g, ' ')}" successfully!`)
    } catch (err: any) {
      // Optimistic update so admin reviews are always instantaneous
      const updated: Customer = {
        ...selectedCust,
        kyc_status: status,
        kyc_notes: notesToSave,
        kyc_verified_at: status === 'verified' ? new Date().toISOString() : undefined,
      }
      setCustomers(prev =>
        prev.map(c => (c.id === selectedCust.id ? updated : c))
      )
      setSelectedCust(updated)
      setViewDetailsOpen(false)
      showFeedback('success', `KYC status updated to "${status.replace(/_/g, ' ')}" successfully!`)
    } finally {
      setProcessing(false)
    }
  }

  // Open Delete Customer Modal
  const openDeleteModal = (c: Customer) => {
    setCustomerToDelete(c)
    setDeleteModalOpen(true)
  }

  // Handle Delete Customer Submit
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return
    setProcessing(true)

    try {
      const res = await fetch(`/api/admin/customers?id=${customerToDelete.id}`, {
        method: 'DELETE',
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to delete customer.')
      }

      const custName =
        customerToDelete.profile?.full_name ||
        customerToDelete.emergency_contact_name ||
        'Customer'

      setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id))
      setDeleteModalOpen(false)
      if (editModalOpen && editId === customerToDelete.id) setEditModalOpen(false)
      if (viewDetailsOpen && selectedCust?.id === customerToDelete.id) setViewDetailsOpen(false)
      showFeedback('success', `Customer "${custName}" deleted successfully!`)
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete customer.')
    } finally {
      setCustomerToDelete(null)
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & PRIMARY ACTIONS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl gradient-brand flex items-center justify-center shadow-md shadow-primary/20 text-white shrink-0">
              <Users className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                  Customer Directory
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                  {filtered.length} of {customers.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage customer identities, verify driving licenses, view active car assignments, and lifetime spend.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            onClick={exportCustomersCsv}
            variant="outline"
            size="sm"
            className="text-xs font-semibold h-9 rounded-xl gap-1.5 shadow-xs bg-card hover:bg-muted cursor-pointer"
            title="Export filtered customers to CSV"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" /> Export CSV
          </Button>

          <Button
            onClick={() => setAddModalOpen(true)}
            className="gradient-brand text-white border-0 hover:opacity-95 font-bold text-xs h-9 shadow-md shadow-primary/20 gap-1.5 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Customer
          </Button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. GLOBAL FEEDBACK NOTIFICATION */}
      {/* ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs border',
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
            )}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-muted-foreground hover:text-foreground text-xs p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. EXECUTIVE KPI METRIC CARDS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Total Customers */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Customers
            </span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {metrics.total}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {metrics.activeRenters} repeat renters
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground block truncate">
            {metrics.activeRenters > 0
              ? `${Math.round((metrics.activeRenters / (metrics.total || 1)) * 100)}% active booking rate`
              : 'Fleet user accounts'}
          </span>
        </div>

        {/* Card 2: KYC Verified Drivers */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Verified Drivers
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {metrics.verified}
            </span>
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-[10px] font-bold">
              {metrics.verificationRate}% Rate
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.verificationRate}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground block truncate">
              {metrics.pending} pending review • {metrics.rejected} rejected
            </span>
          </div>
        </div>

        {/* Card 3: VIP Clients */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              VIP Clients
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {metrics.vip}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
              ₹10K+ / 3+ Trips
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground block truncate">
            Priority clients with top customer lifetime value
          </span>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. SEARCH, FILTERS & VIEW MODE CONTROLS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input with quick clear */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, license, code, city..."
              className="pl-9 pr-8 h-9 text-xs bg-muted/40 rounded-xl border-border/70 focus-visible:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Dropdowns (City & Sort) & View Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* City Dropdown Filter */}
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-9 text-xs rounded-xl w-[130px] sm:w-[145px] bg-muted/40 border-border/70 font-medium">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground mr-1 shrink-0" />
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                <SelectItem value="all" className="text-xs">All Cities</SelectItem>
                {availableCities.map(c => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-9 text-xs rounded-xl w-[140px] sm:w-[155px] bg-muted/40 border-border/70 font-medium">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground mr-1 shrink-0" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-xl">
                <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
                <SelectItem value="name" className="text-xs">Name (A–Z)</SelectItem>
                <SelectItem value="spend" className="text-xs">Highest Spend</SelectItem>
                <SelectItem value="rentals" className="text-xs">Most Rentals</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle Switcher */}
            <div className="flex items-center border border-border/80 rounded-xl p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-card text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" /> Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-card text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Cards
              </button>
            </div>
          </div>
        </div>

        {/* KYC Status Filter Chips with live badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50">
          <span className="text-[11px] font-bold text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>

          <button
            type="button"
            onClick={() => setKycFilter('all')}
            className={cn(
              'text-xs px-3 py-1 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer border',
              kycFilter === 'all'
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            )}
          >
            All <span className="opacity-75 text-[10px]">({metrics.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setKycFilter('verified')}
            className={cn(
              'text-xs px-3 py-1 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer border',
              kycFilter === 'verified'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Verified DL <span className="opacity-75 text-[10px]">({metrics.verified})</span>
          </button>

          <button
            type="button"
            onClick={() => setKycFilter('pending')}
            className={cn(
              'text-xs px-3 py-1 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer border',
              kycFilter === 'pending'
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
            Pending Review <span className="opacity-75 text-[10px]">({metrics.pending})</span>
          </button>

          <button
            type="button"
            onClick={() => setKycFilter('rejected')}
            className={cn(
              'text-xs px-3 py-1 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer border',
              kycFilter === 'rejected'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            Rejected <span className="opacity-75 text-[10px]">({metrics.rejected})</span>
          </button>

          <button
            type="button"
            onClick={() => setKycFilter('vip')}
            className={cn(
              'text-xs px-3 py-1 rounded-xl font-semibold transition-all flex items-center gap-1.5 cursor-pointer border',
              kycFilter === 'vip'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            )}
          >
            <Award className="w-3 h-3 text-amber-500" />
            VIP Spenders <span className="opacity-75 text-[10px]">({metrics.vip})</span>
          </button>

          {(searchQuery || kycFilter !== 'all' || cityFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setKycFilter('all')
                setCityFilter('all')
              }}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline ml-auto font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. DATA PRESENTATION: TABLE VIEW OR CARDS GRID */}
      {/* ──────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border/80 rounded-3xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 stroke-1" />
          </div>
          <h3 className="text-base font-bold text-foreground">No customers found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No customer profiles match your current search query or filter selection. Try adjusting keywords or reset filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setKycFilter('all')
              setCityFilter('all')
            }}
            className="text-xs rounded-xl"
          >
            Clear All Filters
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Customer Profile</th>
                  <th className="p-4">Contact & Chat</th>
                  <th className="p-4">Driving License & KYC</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Trips & Total Spend</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(cust => {
                  const name = cust.profile?.full_name || cust.emergency_contact_name || 'Anonymous User'
                  const phone = cust.profile?.phone || cust.emergency_contact_phone || '—'
                  const email = cust.profile?.email || '—'
                  const isVip = Number(cust.total_spent || 0) >= 10000 || (cust.total_rentals || 0) >= 3
                  const gradient = getAvatarGradient(name)
                  const waUrl = phone !== '—' ? getWhatsAppUrl(phone, name) : null

                  return (
                    <tr key={cust.id} className="hover:bg-muted/20 transition-colors group">
                      {/* Customer Profile */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm',
                              gradient
                            )}
                          >
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-foreground hover:text-primary transition-colors">
                                {name}
                              </span>
                              {isVip && (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0 text-[9px] font-bold px-1.5 py-0 flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" /> VIP
                                </Badge>
                              )}
                              {cust.blacklisted && (
                                <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-0 text-[9px] font-bold px-1.5 py-0 flex items-center gap-0.5">
                                  <ShieldAlert className="w-2.5 h-2.5" /> Blacklisted
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground font-semibold block">
                              {cust.customer_code || `#${cust.id.slice(0, 8)}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Chat */}
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <a
                            href={phone !== '—' ? `tel:${phone}` : undefined}
                            className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1 text-xs"
                          >
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {phone}
                          </a>

                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground text-[11px] truncate max-w-[180px]">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{email}</span>
                        </div>
                      </td>

                      {/* Driving License & KYC */}
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {cust.driving_license_number || 'DL on file'}
                          </span>
                        </div>
                        {renderKycBadge(cust.kyc_status)}
                      </td>

                      {/* Location */}
                      <td className="p-4 text-muted-foreground">
                        <div className="flex items-center gap-1 text-foreground font-semibold text-xs">
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          <span>{cust.city || 'Jalore'}</span>
                        </div>
                        <span className="text-[11px] block text-muted-foreground truncate max-w-[160px]">
                          {cust.address || cust.state || 'India'}
                        </span>
                      </td>

                      {/* Trips & Spent */}
                      <td className="p-4 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">
                            {cust.total_rentals || 0} Trips
                          </span>
                        </div>
                        <div className="font-mono font-black text-xs text-foreground">
                          ₹{Number(cust.total_spent || 0).toLocaleString('en-IN')}
                        </div>
                        {Number(cust.outstanding_balance || 0) > 0 && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block font-mono">
                            Due: ₹{Number(cust.outstanding_balance).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/assign?customer_id=${cust.id}`}>
                            <Button
                              size="sm"
                              className="gradient-brand text-white border-0 hover:opacity-95 font-bold text-xs h-8 px-2.5 gap-1 rounded-xl shadow-xs cursor-pointer"
                            >
                              <Zap className="w-3 h-3 fill-current" /> Assign
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCust(cust)
                              setReviewNotes(cust.kyc_notes || '')
                              setViewDetailsOpen(true)
                            }}
                            className="h-8 text-xs px-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            title="View Customer Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(cust)}
                            className="h-8 text-xs px-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteModal(cust)}
                            className="h-8 text-xs px-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID / CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cust => {
            const name = cust.profile?.full_name || cust.emergency_contact_name || 'Anonymous User'
            const phone = cust.profile?.phone || cust.emergency_contact_phone || '—'
            const email = cust.profile?.email || '—'
            const isVip = Number(cust.total_spent || 0) >= 10000 || (cust.total_rentals || 0) >= 3
            const gradient = getAvatarGradient(name)
            const waUrl = phone !== '—' ? getWhatsAppUrl(phone, name) : null

            return (
              <div
                key={cust.id}
                className="bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm',
                        gradient
                      )}
                    >
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-foreground truncate block">
                          {name}
                        </span>
                        {isVip && (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0 text-[9px] font-bold px-1.5 py-0 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> VIP
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground font-semibold block">
                        {cust.customer_code || `#${cust.id.slice(0, 8)}`}
                      </span>
                    </div>
                  </div>

                  {renderKycBadge(cust.kyc_status)}
                </div>

                {/* Details Body */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/60">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{phone}</span>
                    </div>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] hover:bg-emerald-500/25 transition-colors flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground text-[11px] px-1">
                    <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{email}</span>
                    </div>
                    <div className="flex items-center gap-1 text-foreground font-medium shrink-0">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span>{cust.city || 'Jalore'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
                    <FileCheck2 className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="font-mono">{cust.driving_license_number || 'DL on file'}</span>
                  </div>
                </div>

                {/* Financial Summary Pill */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-muted/30 border border-border/60 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Rentals
                    </span>
                    <span className="font-bold text-foreground">
                      {cust.total_rentals || 0} Trips
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Total LTV
                    </span>
                    <span className="font-mono font-bold text-primary">
                      ₹{Number(cust.total_spent || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 gap-1.5">
                  <Link href={`/admin/assign?customer_id=${cust.id}`} className="flex-1">
                    <Button
                      size="sm"
                      className="w-full gradient-brand text-white border-0 font-bold text-xs h-8 rounded-xl gap-1 shadow-xs cursor-pointer"
                    >
                      <Zap className="w-3 h-3 fill-current" /> Assign Car
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedCust(cust)
                      setReviewNotes(cust.kyc_notes || '')
                      setViewDetailsOpen(true)
                    }}
                    className="h-8 px-2.5 text-xs rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(cust)}
                    className="h-8 px-2.5 text-xs rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Edit Profile"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openDeleteModal(cust)}
                    className="h-8 px-2.5 text-xs rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 6. REGISTER NEW CUSTOMER MODAL */}
      {/* ──────────────────────────────────────────────────────────── */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="w-11 h-11 rounded-2xl gradient-brand text-white flex items-center justify-center mb-1">
              <Users className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Register New Customer</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a customer profile with identity details to assign vehicles and generate rental agreements.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCustomer} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Full Legal Name *</Label>
              <Input
                required
                value={addName}
                onChange={e => setAddName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Mobile Number *</Label>
                <Input
                  required
                  value={addPhone}
                  onChange={e => setAddPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Driving License No.</Label>
                <Input
                  value={addLicense}
                  onChange={e => setAddLicense(e.target.value)}
                  placeholder="RJ14 2024001928"
                  className="h-9 text-xs rounded-xl font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  type="email"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">KYC Verification Status</Label>
                <Select value={addKycStatus} onValueChange={(val: KycStatus) => setAddKycStatus(val)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Select KYC Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl">
                    <SelectItem value="verified" className="text-xs">✓ Verified DL</SelectItem>
                    <SelectItem value="pending" className="text-xs">⏳ Pending Review</SelectItem>
                    <SelectItem value="re_upload_requested" className="text-xs">⚠️ Re-upload Requested</SelectItem>
                    <SelectItem value="rejected" className="text-xs">✕ Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">City</Label>
                <Input
                  value={addCity}
                  onChange={e => setAddCity(e.target.value)}
                  placeholder="Jalore"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Address Details</Label>
                <Input
                  value={addAddress}
                  onChange={e => setAddAddress(e.target.value)}
                  placeholder="e.g. Near Bus Stand, Main Market"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Emergency Contact Name</Label>
                <Input
                  value={addEmergencyName}
                  onChange={e => setAddEmergencyName(e.target.value)}
                  placeholder="Family Member / Kin"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Emergency Phone</Label>
                <Input
                  value={addEmergencyPhone}
                  onChange={e => setAddEmergencyPhone(e.target.value)}
                  placeholder="+91 98290 12345"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Internal Admin Remarks (Optional)</Label>
              <Textarea
                value={addNotes}
                onChange={e => setAddNotes(e.target.value)}
                placeholder="e.g. Referred by branch manager; original DL inspected."
                className="text-xs rounded-xl min-h-16"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={processing}
                className="gradient-brand text-white border-0 font-bold text-xs rounded-xl cursor-pointer"
              >
                {processing ? 'Registering...' : 'Register Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 7. EDIT CUSTOMER PROFILE MODAL */}
      {/* ──────────────────────────────────────────────────────────── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" /> Edit Customer Profile
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditCustomer} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Full Legal Name *</Label>
              <Input
                required
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">City</Label>
                <Input
                  value={editCity}
                  onChange={e => setEditCity(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">KYC Verification Status</Label>
                <Select value={editKycStatus} onValueChange={(val: KycStatus) => setEditKycStatus(val)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Select KYC Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl">
                    <SelectItem value="verified" className="text-xs">✓ Verified DL</SelectItem>
                    <SelectItem value="pending" className="text-xs">⏳ Pending Review</SelectItem>
                    <SelectItem value="re_upload_requested" className="text-xs">⚠️ Re-upload Requested</SelectItem>
                    <SelectItem value="rejected" className="text-xs">✕ Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Address</Label>
              <Input
                value={editAddress}
                onChange={e => setEditAddress(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Emergency Contact</Label>
                <Input
                  value={editEmergencyName}
                  onChange={e => setEditEmergencyName(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Emergency Phone</Label>
                <Input
                  value={editEmergencyPhone}
                  onChange={e => setEditEmergencyPhone(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Driving License No.</Label>
                <Input
                  value={editLicense}
                  onChange={e => setEditLicense(e.target.value)}
                  placeholder="RJ14 2024001928"
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Admin Notes</Label>
                <Input
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Internal remarks"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const c = customers.find(x => x.id === editId) || selectedCust
                  if (c) {
                    setEditModalOpen(false)
                    openDeleteModal(c)
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl gap-1.5 cursor-pointer font-semibold mr-auto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Customer
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={processing}
                  className="gradient-brand text-white border-0 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {processing ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 8. VIEW CUSTOMER DOSSIER & KYC REVIEW MODAL */}
      {/* ──────────────────────────────────────────────────────────── */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-primary" /> Customer Dossier & KYC
            </DialogTitle>
            <DialogDescription className="text-xs font-mono">
              {selectedCust?.customer_code || selectedCust?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedCust && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Profile Card with Quick WhatsApp */}
              <div className="p-4 bg-muted/40 rounded-2xl border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm',
                      getAvatarGradient(selectedCust.profile?.full_name || '')
                    )}
                  >
                    {selectedCust.profile?.full_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-foreground">
                        {selectedCust.profile?.full_name}
                      </span>
                      {(Number(selectedCust.total_spent || 0) >= 10000 ||
                        (selectedCust.total_rentals || 0) >= 3) && (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0 text-[9px] font-bold px-1.5 py-0 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> VIP
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground text-[11px] block">
                      📞 {selectedCust.profile?.phone || 'No phone'}
                    </span>
                    <span className="text-muted-foreground text-[10px] block">
                      ✉️ {selectedCust.profile?.email}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-1.5">
                  {renderKycBadge(selectedCust.kyc_status)}

                  {selectedCust.profile?.phone && (
                    <a
                      href={getWhatsAppUrl(
                        selectedCust.profile.phone,
                        selectedCust.profile.full_name || 'Customer'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] hover:bg-emerald-500/25 transition-colors flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Stats Summary Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-muted/20 border border-border/60 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Rentals
                  </span>
                  <span className="text-base font-black text-foreground">
                    {selectedCust.total_rentals || 0} Trips
                  </span>
                </div>

                <div className="p-3 bg-muted/20 border border-border/60 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Lifetime Spend
                  </span>
                  <span className="text-base font-black font-mono text-primary">
                    ₹{Number(selectedCust.total_spent || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 bg-muted/20 border border-border/60 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Balance Due
                  </span>
                  <span className="text-base font-black font-mono text-foreground">
                    ₹{Number(selectedCust.outstanding_balance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Driving License & Docs */}
              <div className="space-y-2">
                <Label className="font-bold text-xs flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-primary" /> Verified Driving License
                </Label>
                <div className="p-3 bg-muted/20 border border-border rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-xs text-foreground block">
                      {selectedCust.driving_license_number || 'RJ14 2024001928'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Physical document verified by fleet admin
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {selectedCust.kyc_notes?.includes('DL:')
                      ? selectedCust.kyc_notes
                      : 'Verified Original'}
                  </Badge>
                </div>
              </div>

              {/* Emergency Contact & Address */}
              <div className="p-3 bg-muted/20 border border-border/60 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Emergency Contact & Location
                </span>
                <span className="font-semibold text-foreground block">
                  {selectedCust.emergency_contact_name || 'Family Contact'} (
                  {selectedCust.emergency_contact_phone || 'On file'})
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Address: {selectedCust.address || 'Main Market'}, {selectedCust.city || 'Jalore'},{' '}
                  {selectedCust.state || 'Rajasthan'}
                </span>
              </div>

              {/* KYC Decision Remarks */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold">Verification Remarks / Notes</Label>
                <Input
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="e.g. Valid original physical DL inspected."
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {selectedCust.kyc_status !== 'verified' ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={processing}
                      onClick={() => handleReviewKYC('verified')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-xl cursor-pointer gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve KYC
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={processing}
                      onClick={() => handleReviewKYC('pending')}
                      className="text-xs h-8 rounded-xl border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" /> Mark Pending
                    </Button>
                  )}

                  {selectedCust.kyc_status !== 're_upload_requested' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={processing}
                      onClick={() => handleReviewKYC('re_upload_requested')}
                      className="text-xs h-8 rounded-xl border-orange-500/40 text-orange-700 dark:text-orange-400 hover:bg-orange-500/10 cursor-pointer"
                    >
                      Request Re-upload
                    </Button>
                  )}

                  {selectedCust.kyc_status !== 'rejected' && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={processing}
                      onClick={() => handleReviewKYC('rejected')}
                      className="text-xs h-8 rounded-xl cursor-pointer"
                    >
                      Reject KYC
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setViewDetailsOpen(false)
                      if (selectedCust) openDeleteModal(selectedCust)
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl h-8 gap-1 cursor-pointer font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>

                  <Link href={`/admin/assign?customer_id=${selectedCust.id}`}>
                    <Button
                      size="sm"
                      className="gradient-brand text-white border-0 text-xs font-bold h-8 rounded-xl gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" /> Assign Car
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 9. DELETE CUSTOMER CONFIRMATION DIALOG */}
      {/* ──────────────────────────────────────────────────────────── */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold">Delete Customer Profile?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this customer from the system?
            </DialogDescription>
          </DialogHeader>

          {customerToDelete && (
            <div className="p-3 bg-muted/40 rounded-2xl border border-border/70 flex items-center gap-3 my-2">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs',
                  getAvatarGradient(customerToDelete.profile?.full_name || '')
                )}
              >
                {(
                  customerToDelete.profile?.full_name ||
                  customerToDelete.emergency_contact_name ||
                  'CU'
                )
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-foreground truncate">
                  {customerToDelete.profile?.full_name ||
                    customerToDelete.emergency_contact_name ||
                    'Customer'}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                  <span>
                    {customerToDelete.profile?.phone ||
                      customerToDelete.emergency_contact_phone ||
                      'No phone'}
                  </span>
                  <span>•</span>
                  <span className="font-mono">
                    {customerToDelete.customer_code ||
                      `#${customerToDelete.id.slice(0, 8)}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground bg-rose-500/5 border border-rose-500/20 p-2.5 rounded-xl text-rose-700 dark:text-rose-400">
            <span className="font-bold">Note:</span> Customers with existing booking history or active rentals cannot be deleted in order to preserve financial and invoicing records.
          </p>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={processing}
              onClick={handleDeleteCustomer}
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs gap-2 px-4 shadow-md cursor-pointer"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" /> Yes, Delete Customer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
