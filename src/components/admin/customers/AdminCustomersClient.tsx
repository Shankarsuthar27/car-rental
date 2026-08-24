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
  Calendar
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
import { createClient } from '@/lib/supabase/client'
import type { Customer, KycStatus } from '@/types'
import { cn } from '@/lib/utils'

interface AdminCustomersClientProps {
  initialCustomers: Customer[]
}

export function AdminCustomersClient({
  initialCustomers
}: AdminCustomersClientProps) {
  const searchParams = useSearchParams()

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [kycFilter, setKycFilter] = useState<string>('all')

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
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  // Add Customer Form
  const [addName, setAddName] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addLicense, setAddLicense] = useState('')
  const [addAddress, setAddAddress] = useState('')
  const [addCity, setAddCity] = useState('Jaipur')
  const [addEmergencyName, setAddEmergencyName] = useState('')
  const [addEmergencyPhone, setAddEmergencyPhone] = useState('')
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
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setAddModalOpen(true)
    }
  }, [searchParams])

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const name = c.profile?.full_name || ''
      const email = c.profile?.email || ''
      const phone = c.profile?.phone || ''
      const code = c.customer_code || ''
      const notes = c.kyc_notes || ''

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery) ||
        code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notes.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesKyc = kycFilter === 'all' || c.kyc_status === kycFilter
      return matchesSearch && matchesKyc
    })
  }, [customers, searchQuery, kycFilter])

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
          kyc_status: 'verified',
          kyc_notes: addNotes.trim() || (addLicense ? `DL: ${addLicense}` : 'Registered by admin'),
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
      showFeedback('success', `Customer ${result.data.profile?.full_name} registered successfully!`)
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to add customer.')
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
      showFeedback('error', err.message || 'Failed to update customer.')
    } finally {
      setProcessing(false)
    }
  }

  // Approve or Reject KYC
  const handleReviewKYC = async (status: KycStatus) => {
    if (!selectedCust) return
    setProcessing(true)

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCust.id,
          kyc_status: status,
          kyc_notes: reviewNotes,
        }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to update KYC.')
      }

      setCustomers(prev =>
        prev.map(c => (c.id === selectedCust.id ? result.data : c))
      )
      setViewDetailsOpen(false)
      showFeedback('success', `KYC status updated to ${status}.`)
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update KYC.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-md shadow-primary/20 text-white">
              <Users className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Customer Directory ({customers.length})
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage customer identities, verify driving licenses, view active car assignments and rental history.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="gradient-brand text-white border-0 hover:opacity-90 font-bold text-xs h-9 shadow-md gap-1.5 rounded-xl self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Customer
        </Button>
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-sm border',
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          )}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </motion.div>
      )}

      {/* Search Bar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card border border-border/80 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, license..."
            className="pl-9 h-9 text-xs bg-muted/40 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['all', 'verified', 'pending', 'rejected'].map(status => (
            <Button
              key={status}
              variant={kycFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setKycFilter(status)}
              className={cn('text-xs capitalize h-8.5 rounded-xl font-semibold', kycFilter === status && 'shadow-xs')}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">City / Address</th>
                <th className="p-4">Trips & Spend</th>
                <th className="p-4">KYC / License</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(cust => {
                  const name = cust.profile?.full_name || 'Anonymous User'
                  const phone = cust.profile?.phone || '—'
                  const email = cust.profile?.email || '—'

                  return (
                    <tr key={cust.id} className="hover:bg-muted/20 transition-colors">
                      {/* Customer Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl gradient-brand text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-foreground block">
                              {name}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                              {cust.customer_code || `#${cust.id.slice(0, 8)}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span>{phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-40">{email}</span>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="p-4 text-muted-foreground">
                        <span className="font-medium text-foreground block">{cust.city || 'Jaipur'}</span>
                        <span className="text-[11px] block">{cust.address || cust.state || 'India'}</span>
                      </td>

                      {/* Rentals & Spent */}
                      <td className="p-4">
                        <span className="font-bold text-foreground block">
                          {cust.total_rentals || 0} Rentals
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono block">
                          ₹{Number(cust.total_spent || 0).toLocaleString('en-IN')} Total Spend
                        </span>
                      </td>

                      {/* KYC Status */}
                      <td className="p-4">
                        <Badge
                          className={cn(
                            'text-[10px] font-bold uppercase capitalize border',
                            cust.kyc_status === 'verified' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
                            cust.kyc_status === 'pending' && 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                            cust.kyc_status === 'rejected' && 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                          )}
                        >
                          {cust.kyc_status === 'verified' ? '✓ Verified DL' : cust.kyc_status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/assign?customer_id=${cust.id}`}>
                            <Button size="sm" className="gradient-brand text-white border-0 hover:opacity-90 font-bold text-xs h-7.5 px-2.5 gap-1 rounded-xl shadow-xs">
                              <Zap className="w-3 h-3 fill-current" /> Assign Car
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
                            className="h-7.5 text-xs px-2 rounded-xl"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(cust)}
                            className="h-7.5 text-xs px-2 rounded-xl text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. ADD NEW CUSTOMER MODAL */}
      {/* ============================================================ */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Register New Customer
            </DialogTitle>
            <DialogDescription className="text-xs">
              Add a customer profile to assign vehicles and issue rental agreements.
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
                <Label className="text-xs font-semibold">City</Label>
                <Input
                  value={addCity}
                  onChange={e => setAddCity(e.target.value)}
                  placeholder="Jaipur"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Residential Address</Label>
              <Input
                value={addAddress}
                onChange={e => setAddAddress(e.target.value)}
                placeholder="Street address, colony, locality"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Emergency Contact Name</Label>
                <Input
                  value={addEmergencyName}
                  onChange={e => setAddEmergencyName(e.target.value)}
                  placeholder="Parent / Spouse name"
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
              <Label className="text-xs font-semibold">Notes / Remarks</Label>
              <Textarea
                value={addNotes}
                onChange={e => setAddNotes(e.target.value)}
                placeholder="e.g. Verified Aadhaar card and DL photo in person."
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
                disabled={processing || !addName}
                className="gradient-brand text-white border-0 text-xs font-bold rounded-xl"
              >
                {processing ? 'Registering...' : '✓ Register Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 2. EDIT CUSTOMER MODAL */}
      {/* ============================================================ */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" /> Edit Customer Profile
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditCustomer} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Full Name *</Label>
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
                <Label className="text-xs font-semibold">Email</Label>
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
                <Label className="text-xs font-semibold">KYC Status</Label>
                <Select value={editKycStatus} onValueChange={(val: any) => setEditKycStatus(val)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Notes</Label>
              <Textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                className="text-xs rounded-xl min-h-16"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
                className="gradient-brand text-white border-0 text-xs font-bold rounded-xl"
              >
                {processing ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* 3. VIEW CUSTOMER DETAILS & KYC DRAWER */}
      {/* ============================================================ */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Customer Dossier & KYC
            </DialogTitle>
            <DialogDescription className="text-xs font-mono">
              {selectedCust?.customer_code || selectedCust?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedCust && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-4 bg-muted/40 rounded-2xl border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl gradient-brand text-white flex items-center justify-center font-bold text-sm">
                    {selectedCust.profile?.full_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-black text-sm text-foreground block">
                      {selectedCust.profile?.full_name}
                    </span>
                    <span className="text-muted-foreground text-[11px] block">
                      📞 {selectedCust.profile?.phone || 'No phone'}
                    </span>
                    <span className="text-muted-foreground text-[10px] block">
                      ✉️ {selectedCust.profile?.email}
                    </span>
                  </div>
                </div>

                <Badge
                  className={cn(
                    'text-[10px] uppercase font-bold border',
                    selectedCust.kyc_status === 'verified' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                  )}
                >
                  {selectedCust.kyc_status}
                </Badge>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/20 border border-border/60 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Rentals</span>
                  <span className="text-base font-black text-foreground">{selectedCust.total_rentals || 0} Trips</span>
                </div>

                <div className="p-3 bg-muted/20 border border-border/60 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Lifetime Spend</span>
                  <span className="text-base font-black font-mono text-primary">₹{Number(selectedCust.total_spent || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Attached Docs */}
              <div className="space-y-2">
                <Label className="font-bold text-xs">Attached Digital Verification</Label>
                <div className="p-3 bg-muted/20 border border-border rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-500" />
                    <span>Government Driving License</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {selectedCust.kyc_notes?.includes('DL:') ? selectedCust.kyc_notes : 'Verified Original'}
                  </Badge>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3 bg-muted/20 border border-border/60 rounded-xl space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Emergency Contact</span>
                <span className="font-medium text-foreground block">
                  {selectedCust.emergency_contact_name || 'Family Member'} ({selectedCust.emergency_contact_phone || 'Contact provided on file'})
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Address: {selectedCust.address || 'Jaipur, Rajasthan'}
                </span>
              </div>

              {/* KYC Decision Form */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-semibold">Verification Remarks / Notes</Label>
                <Input
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="e.g. Valid physical driving license inspected."
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={processing}
                    onClick={() => handleReviewKYC('rejected')}
                    className="text-xs h-8 rounded-xl"
                  >
                    Reject KYC
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={processing}
                    onClick={() => handleReviewKYC('verified')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-xl"
                  >
                    Approve KYC
                  </Button>
                </div>

                <Link href={`/admin/assign?customer_id=${selectedCust.id}`}>
                  <Button size="sm" className="gradient-brand text-white border-0 text-xs font-bold h-8 rounded-xl gap-1">
                    <Zap className="w-3.5 h-3.5 fill-current" /> Assign Car
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
