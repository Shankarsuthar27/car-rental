'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  Wrench,
  Key,
  Clock,
  MapPin,
  Fuel,
  Users,
  Eye,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Zap,
  DollarSign,
  Gauge,
  Tag,
  Image as ImageIcon,
  Check,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import type { Vehicle, Branch, VehicleStatus, VehicleType, FuelType, TransmissionType } from '@/types'
import { VehicleImageUploader } from '@/components/admin/vehicles/VehicleImageUploader'

interface AdminVehiclesClientProps {
  initialVehicles: Vehicle[]
  branches: Branch[]
}

const STATUS_BADGE_MAP: Record<VehicleStatus, string> = {
  available: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400',
  reserved: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400',
  rented: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-400',
  maintenance: 'bg-orange-500/10 text-orange-600 border-orange-500/30 dark:bg-orange-950/40 dark:text-orange-400',
  returned: 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:bg-purple-950/40 dark:text-purple-400',
  inactive: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/30 dark:bg-zinc-800/40 dark:text-zinc-400'
}

const COMMON_FEATURES = [
  'Power Steering',
  'Air Conditioning',
  'Touchscreen Infotainment',
  'ABS + Airbags',
  'Sunroof',
  '360° Camera',
  'Cruise Control',
  'Leather Seats',
  'Bluetooth Audio',
  'Push Button Start',
  'Ventilated Seats',
  'Wireless Charging'
]

const IMAGE_PRESETS = [
  { label: 'Black SUV', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80' },
  { label: 'White SUV', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80' },
  { label: 'Red Sedan', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Luxury Sedan', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80' },
  { label: 'Off-Road 4x4', url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80' },
  { label: 'Electric EV', url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80' }
]

export function AdminVehiclesClient({
  initialVehicles,
  branches
}: AdminVehiclesClientProps) {
  const searchParams = useSearchParams()

  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // React to searchParams updates (e.g. from sidebar navigation)
  useEffect(() => {
    const statusParam = searchParams.get('status')
    if (statusParam) setStatusFilter(statusParam)
    const searchParam = searchParams.get('search')
    if (searchParam) setSearchQuery(searchParam)
    if (searchParams.get('action') === 'new') setAddModalOpen(true)
  }, [searchParams])

  // Notification / Alert Message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Dialog States
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Add Vehicle Form State
  const [newBrand, setNewBrand] = useState('')
  const [newModel, setNewModel] = useState('')
  const [newVariant, setNewVariant] = useState('')
  const [newYear, setNewYear] = useState('2024')
  const [newRegNumber, setNewRegNumber] = useState('')
  const [newType, setNewType] = useState<VehicleType>('suv')
  const [newFuel, setNewFuel] = useState<FuelType>('petrol')
  const [newTransmission, setNewTransmission] = useState<TransmissionType>('automatic')
  const [newSeats, setNewSeats] = useState('5')
  const [newColor, setNewColor] = useState('Polar White')
  const [newOdometer, setNewOdometer] = useState('5000')
  const [newDailyRate, setNewDailyRate] = useState('2500')
  const [newHourlyRate, setNewHourlyRate] = useState('200')
  const [newDeposit, setNewDeposit] = useState('10000')
  const [newExtraKm, setNewExtraKm] = useState('15')
  const [newIncludedKm, setNewIncludedKm] = useState('200')
  const [newBranch, setNewBranch] = useState(branches[0]?.id || '')
  const [newImageUrl, setNewImageUrl] = useState(IMAGE_PRESETS[0].url)
  const [newDescription, setNewDescription] = useState('')
  const [newFeatures, setNewFeatures] = useState<string[]>([
    'Power Steering',
    'Air Conditioning',
    'Touchscreen Infotainment',
    'ABS + Airbags'
  ])
  const [newStatus, setNewStatus] = useState<VehicleStatus>('available')

  // Edit Vehicle Form State
  const [editId, setEditId] = useState('')
  const [editBrand, setEditBrand] = useState('')
  const [editModel, setEditModel] = useState('')
  const [editVariant, setEditVariant] = useState('')
  const [editYear, setEditYear] = useState('2024')
  const [editRegNumber, setEditRegNumber] = useState('')
  const [editType, setEditType] = useState<VehicleType>('suv')
  const [editFuel, setEditFuel] = useState<FuelType>('petrol')
  const [editTransmission, setEditTransmission] = useState<TransmissionType>('automatic')
  const [editSeats, setEditSeats] = useState('5')
  const [editColor, setEditColor] = useState('')
  const [editOdometer, setEditOdometer] = useState('0')
  const [editDailyRate, setEditDailyRate] = useState('2500')
  const [editHourlyRate, setEditHourlyRate] = useState('200')
  const [editDeposit, setEditDeposit] = useState('10000')
  const [editExtraKm, setEditExtraKm] = useState('15')
  const [editIncludedKm, setEditIncludedKm] = useState('200')
  const [editBranch, setEditBranch] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editFeatures, setEditFeatures] = useState<string[]>([])
  const [editStatus, setEditStatus] = useState<VehicleStatus>('available')

  // Helper to show notification
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => {
      setFeedback(null)
    }, 6000)
  }

  // Filter calculations
  const filteredVehicles = vehicles.filter(v => {
    const search = searchQuery.toLowerCase()
    const matchesSearch =
      v.brand?.toLowerCase().includes(search) ||
      v.model?.toLowerCase().includes(search) ||
      v.registration_number?.toLowerCase().includes(search) ||
      (v.color && v.color.toLowerCase().includes(search))

    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    const matchesBranch = branchFilter === 'all' || v.branch_id === branchFilter
    const matchesType = typeFilter === 'all' || v.vehicle_type === typeFilter

    return matchesSearch && matchesStatus && matchesBranch && matchesType
  })

  // Stat metrics
  const totalCount = vehicles.length
  const availableCount = vehicles.filter(v => v.status === 'available').length
  const activeRentalCount = vehicles.filter(v => v.status === 'rented' || v.status === 'reserved').length
  const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length

  // Quick Status Updater
  const handleUpdateStatus = async (vehicleId: string, updatedStatus: VehicleStatus) => {
    try {
      const res = await fetch('/api/admin/vehicles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vehicleId, status: updatedStatus })
      })
      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to update status')
      }

      setVehicles(prev =>
        prev.map(v => (v.id === vehicleId ? { ...v, status: updatedStatus } : v))
      )
      showFeedback('success', `Vehicle status changed to "${updatedStatus}".`)
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update vehicle status.')
    }
  }

  // Open Edit Modal
  const openEditModal = (v: Vehicle) => {
    setEditId(v.id)
    setEditBrand(v.brand || '')
    setEditModel(v.model || '')
    setEditVariant(v.variant || '')
    setEditYear(String(v.year || 2024))
    setEditRegNumber(v.registration_number || '')
    setEditType(v.vehicle_type || 'suv')
    setEditFuel(v.fuel_type || 'petrol')
    setEditTransmission(v.transmission || 'automatic')
    setEditSeats(String(v.seating_capacity || 5))
    setEditColor(v.color || '')
    setEditOdometer(String(v.current_odometer || 0))
    setEditDailyRate(String(v.daily_rate || 2500))
    setEditHourlyRate(String(v.hourly_rate || 200))
    setEditDeposit(String(v.security_deposit || 10000))
    setEditExtraKm(String(v.extra_km_charge || 15))
    setEditIncludedKm(String(v.included_km_per_day || 200))
    setEditBranch(v.branch_id || branches[0]?.id || '')
    setEditImageUrl(v.images?.[0]?.url || '')
    setEditDescription(v.description || '')
    setEditFeatures(Array.isArray(v.features) ? v.features : [])
    setEditStatus(v.status || 'available')
    setEditModalOpen(true)
  }

  // Open Delete Modal
  const openDeleteModal = (v: Vehicle) => {
    setSelectedVehicle(v)
    setDeleteModalOpen(true)
  }

  // Toggle Feature in Add Form
  const toggleNewFeature = (feature: string) => {
    setNewFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    )
  }

  // Toggle Feature in Edit Form
  const toggleEditFeature = (feature: string) => {
    setEditFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    )
  }

  // Create Vehicle
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)

    try {
      const payload = {
        brand: newBrand,
        model: newModel,
        variant: newVariant,
        year: Number(newYear),
        registration_number: newRegNumber.toUpperCase().trim(),
        vehicle_type: newType,
        fuel_type: newFuel,
        transmission: newTransmission,
        seating_capacity: Number(newSeats),
        color: newColor,
        current_odometer: Number(newOdometer),
        daily_rate: Number(newDailyRate),
        hourly_rate: Number(newHourlyRate),
        security_deposit: Number(newDeposit),
        extra_km_charge: Number(newExtraKm),
        included_km_per_day: Number(newIncludedKm),
        branch_id: newBranch,
        image_url: newImageUrl,
        description: newDescription,
        features: newFeatures,
        status: newStatus
      }

      const res = await fetch('/api/admin/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to register vehicle')
      }

      const createdVehicle: Vehicle = result.data
      setVehicles([createdVehicle, ...vehicles])
      setAddModalOpen(false)
      showFeedback('success', `Vehicle "${createdVehicle.brand} ${createdVehicle.model}" (${createdVehicle.registration_number}) registered and stored in database successfully!`)

      // Reset
      setNewBrand('')
      setNewModel('')
      setNewVariant('')
      setNewRegNumber('')
      setNewDescription('')
    } catch (err: any) {
      showFeedback('error', err.message || 'Error registering vehicle.')
    } finally {
      setActionLoading(false)
    }
  }

  // Edit Vehicle Submit
  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)

    try {
      const payload = {
        id: editId,
        brand: editBrand,
        model: editModel,
        variant: editVariant,
        year: Number(editYear),
        registration_number: editRegNumber.toUpperCase().trim(),
        vehicle_type: editType,
        fuel_type: editFuel,
        transmission: editTransmission,
        seating_capacity: Number(editSeats),
        color: editColor,
        current_odometer: Number(editOdometer),
        daily_rate: Number(editDailyRate),
        hourly_rate: Number(editHourlyRate),
        security_deposit: Number(editDeposit),
        extra_km_charge: Number(editExtraKm),
        included_km_per_day: Number(editIncludedKm),
        branch_id: editBranch,
        image_url: editImageUrl,
        description: editDescription,
        features: editFeatures,
        status: editStatus
      }

      const res = await fetch('/api/admin/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to update vehicle')
      }

      const updated: Vehicle = result.data
      setVehicles(prev => prev.map(v => (v.id === editId ? updated : v)))
      setEditModalOpen(false)
      showFeedback('success', `Vehicle "${updated.brand} ${updated.model}" (${updated.registration_number}) updated successfully!`)
    } catch (err: any) {
      showFeedback('error', err.message || 'Error updating vehicle.')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Vehicle Submit
  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return
    setActionLoading(true)

    try {
      const res = await fetch(`/api/admin/vehicles?id=${selectedVehicle.id}`, {
        method: 'DELETE'
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to delete vehicle')
      }

      setVehicles(prev => prev.filter(v => v.id !== selectedVehicle.id))
      setDeleteModalOpen(false)
      showFeedback('success', result.message || `Vehicle ${selectedVehicle.brand} ${selectedVehicle.model} removed from fleet.`)
      setSelectedVehicle(null)
    } catch (err: any) {
      showFeedback('error', err.message || 'Error deleting vehicle.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Alert / Feedback Notification */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Vehicle Fleet Management
            </h1>
            <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5 border-primary/30 text-primary">
              {vehicles.length} Units
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Register new vehicles to the database, modify rental rates & specifications, manage live availability, and handle fleet lifecycle.
          </p>
        </div>

        {/* Add Vehicle Button & Dialog */}
        <Button
          onClick={() => setAddModalOpen(true)}
          className="gradient-brand text-white border-0 hover:opacity-90 font-bold gap-2 text-xs h-10 shadow-lg px-4 rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Register New Fleet Vehicle
        </Button>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-card border border-border/70 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Total Fleet</div>
            <div className="text-xl font-black">{totalCount}</div>
          </div>
        </div>

        <div className="p-4 bg-card border border-border/70 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Available</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{availableCount}</div>
          </div>
        </div>

        <div className="p-4 bg-card border border-border/70 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">On Rental / Res.</div>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400">{activeRentalCount}</div>
          </div>
        </div>

        <div className="p-4 bg-card border border-border/70 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Maintenance</div>
            <div className="text-xl font-black text-orange-600 dark:text-orange-400">{maintenanceCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by make, model, reg #, color..."
              className="pl-9 h-9 text-xs bg-muted/40 rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-xs rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-medium">All Statuses</SelectItem>
              <SelectItem value="available" className="text-xs font-medium">🟢 Available</SelectItem>
              <SelectItem value="reserved" className="text-xs font-medium">🟡 Reserved</SelectItem>
              <SelectItem value="rented" className="text-xs font-medium">🔵 Rented</SelectItem>
              <SelectItem value="maintenance" className="text-xs font-medium">🟠 Maintenance</SelectItem>
              <SelectItem value="inactive" className="text-xs font-medium">⚪ Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-9 text-xs rounded-xl capitalize">
              <SelectValue placeholder="Body Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Types</SelectItem>
              {['suv', 'sedan', 'hatchback', 'muv', 'luxury', 'electric', 'sports'].map(t => (
                <SelectItem key={t} value={t} className="text-xs capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-44 h-9 text-xs rounded-xl">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Branches</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id} className="text-xs">
                  {b.city} — {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredVehicles.length}</span> of {vehicles.length}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="p-4">Vehicle Details</th>
                <th className="p-4">Registration #</th>
                <th className="p-4">Branch Location</th>
                <th className="p-4">Rental Rates</th>
                <th className="p-4">Deposit & KM</th>
                <th className="p-4">Live Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <Car className="w-8 h-8 stroke-1 text-muted-foreground/50" />
                      <p className="text-sm font-medium">No vehicles found matching your criteria</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('')
                          setStatusFilter('all')
                          setBranchFilter('all')
                          setTypeFilter('all')
                        }}
                        className="text-xs h-8 mt-2"
                      >
                        Reset All Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(v => {
                  const primaryImg = v.images?.[0]?.url
                  return (
                    <tr key={v.id} className="hover:bg-muted/20 transition-colors group">
                      {/* Vehicle Details */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-10 bg-muted/60 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-border/50 shadow-inner">
                            {primaryImg ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={primaryImg}
                                alt={`${v.brand} ${v.model}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <Car className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-foreground">
                                {v.brand} {v.model}
                              </span>
                              {v.variant && (
                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                                  {v.variant}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground capitalize block">
                              {v.year} • {v.vehicle_type} • {v.fuel_type} • {v.transmission}
                              {v.color ? ` • ${v.color}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Registration */}
                      <td className="p-4">
                        <span className="font-mono font-bold text-xs bg-muted/50 px-2 py-1 rounded-lg border border-border/50 text-foreground">
                          {v.registration_number}
                        </span>
                        {v.current_odometer !== undefined && (
                          <span className="text-[10px] text-muted-foreground block mt-1 flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-muted-foreground/70" />
                            {v.current_odometer.toLocaleString('en-IN')} km
                          </span>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="p-4 text-muted-foreground font-medium">
                        {v.branch ? (
                          <div>
                            <span className="font-semibold text-foreground block">{v.branch.city}</span>
                            <span className="text-[10px] text-muted-foreground">{v.branch.name}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Rates */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-foreground block text-xs">
                            ₹{v.daily_rate?.toLocaleString('en-IN')}<span className="text-[10px] font-normal text-muted-foreground">/day</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            ₹{v.hourly_rate}/hr • Extra: ₹{v.extra_km_charge}/km
                          </span>
                        </div>
                      </td>

                      {/* Security Deposit & Inclusions */}
                      <td className="p-4 font-medium text-foreground">
                        <span className="block font-semibold">₹{v.security_deposit?.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-muted-foreground block">
                          Incl: {v.included_km_per_day || 200} km/day
                        </span>
                      </td>

                      {/* Status with Live Switcher Dropdown */}
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-full">
                              <Badge
                                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-all border ${
                                  STATUS_BADGE_MAP[v.status] || 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {v.status}
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-40 rounded-xl shadow-xl">
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(v.id, 'available')}
                              className="text-xs gap-2 font-medium cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Available
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(v.id, 'reserved')}
                              className="text-xs gap-2 font-medium cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-500" /> Reserved
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(v.id, 'rented')}
                              className="text-xs gap-2 font-medium cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5 text-blue-500" /> Rented
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(v.id, 'maintenance')}
                              className="text-xs gap-2 font-medium cursor-pointer"
                            >
                              <Wrench className="w-3.5 h-3.5 text-orange-500" /> Maintenance
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(v.id, 'inactive')}
                              className="text-xs gap-2 font-medium cursor-pointer text-muted-foreground"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" /> Inactive / Garage
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {v.status === 'available' ? (
                            <Button
                              size="sm"
                              asChild
                              className="h-8 px-3 text-xs gradient-brand text-white border-0 hover:opacity-90 font-bold rounded-xl shadow-xs gap-1 cursor-pointer shrink-0"
                              title="Assign car to customer"
                            >
                              <Link href={`/admin/assign?vehicle_id=${v.id}`}>
                                <Zap className="w-3.5 h-3.5 fill-current" /> Assign Car
                              </Link>
                            </Button>
                          ) : v.status === 'rented' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="h-8 px-2.5 text-xs text-blue-600 border-blue-500/30 hover:bg-blue-500/10 rounded-xl font-semibold gap-1 shrink-0"
                              title="Track running duty"
                            >
                              <Link href={`/admin/bookings?status=active`}>
                                <Key className="w-3.5 h-3.5" /> Running
                              </Link>
                            </Button>
                          ) : null}

                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                            title="View vehicle preview"
                          >
                            <Link href={`/cars/${v.id}`} target="_blank">
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(v)}
                            className="h-8 px-2.5 text-xs text-primary hover:bg-primary/10 rounded-lg cursor-pointer font-semibold"
                            title="Edit vehicle details"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(v)}
                            className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg cursor-pointer font-semibold"
                            title="Delete vehicle"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
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

      {/* ======================================================== */}
      {/* 1. REGISTER NEW VEHICLE DIALOG */}
      {/* ======================================================== */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Plus className="w-4 h-4" /> New Fleet Registration
            </div>
            <DialogTitle className="text-xl font-black">Register New Fleet Vehicle</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new car to the fleet inventory. Details will be saved in the database and made available for customer bookings immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateVehicle} className="space-y-5 pt-2">
            {/* Section: Basic Vehicle Identification */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-primary" /> Vehicle Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Make / Brand <span className="text-rose-500">*</span></Label>
                  <Input
                    required
                    placeholder="e.g. Hyundai, Tata, Mahindra"
                    value={newBrand}
                    onChange={e => setNewBrand(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Model <span className="text-rose-500">*</span></Label>
                  <Input
                    required
                    placeholder="e.g. Creta, Safari, Thar, City"
                    value={newModel}
                    onChange={e => setNewModel(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Variant / Trim</Label>
                  <Input
                    placeholder="e.g. SX(O) Turbo, Dark Edition"
                    value={newVariant}
                    onChange={e => setNewVariant(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Reg. Number <span className="text-rose-500">*</span></Label>
                  <Input
                    required
                    placeholder="e.g. RJ14-CR-2024"
                    value={newRegNumber}
                    onChange={e => setNewRegNumber(e.target.value)}
                    className="h-9 text-xs uppercase font-mono font-bold rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Model Year</Label>
                  <Input
                    type="number"
                    value={newYear}
                    onChange={e => setNewYear(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Color</Label>
                  <Input
                    placeholder="e.g. Polar White"
                    value={newColor}
                    onChange={e => setNewColor(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Current Odometer (km)</Label>
                  <Input
                    type="number"
                    value={newOdometer}
                    onChange={e => setNewOdometer(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Section: Category, Fuel & Branch */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" /> Configuration & Location
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Body Type</Label>
                  <Select value={newType} onValueChange={(val: VehicleType) => setNewType(val)}>
                    <SelectTrigger className="h-9 text-xs capitalize rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['suv', 'sedan', 'hatchback', 'muv', 'luxury', 'electric', 'sports'].map(t => (
                        <SelectItem key={t} value={t} className="text-xs capitalize">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Fuel Type</Label>
                  <Select value={newFuel} onValueChange={(val: FuelType) => setNewFuel(val)}>
                    <SelectTrigger className="h-9 text-xs capitalize rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['petrol', 'diesel', 'electric', 'hybrid', 'cng'].map(f => (
                        <SelectItem key={f} value={f} className="text-xs capitalize">
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Transmission</Label>
                  <Select value={newTransmission} onValueChange={(val: TransmissionType) => setNewTransmission(val)}>
                    <SelectTrigger className="h-9 text-xs capitalize rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic" className="text-xs">Automatic</SelectItem>
                      <SelectItem value="manual" className="text-xs">Manual</SelectItem>
                      <SelectItem value="cvt" className="text-xs">CVT</SelectItem>
                      <SelectItem value="dct" className="text-xs">DCT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Seats</Label>
                  <Input
                    type="number"
                    value={newSeats}
                    onChange={e => setNewSeats(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Branch Location <span className="text-rose-500">*</span></Label>
                  <Select value={newBranch} onValueChange={setNewBranch}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id} className="text-xs font-medium">
                          {b.city} ({b.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section: Pricing Structure */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary" /> Rental Pricing & Security Deposit
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Daily Rate (₹)</Label>
                  <Input
                    type="number"
                    required
                    value={newDailyRate}
                    onChange={e => setNewDailyRate(e.target.value)}
                    className="h-9 text-xs font-bold rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Hourly Rate (₹)</Label>
                  <Input
                    type="number"
                    value={newHourlyRate}
                    onChange={e => setNewHourlyRate(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Security Deposit (₹)</Label>
                  <Input
                    type="number"
                    value={newDeposit}
                    onChange={e => setNewDeposit(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Extra KM (₹/km)</Label>
                  <Input
                    type="number"
                    value={newExtraKm}
                    onChange={e => setNewExtraKm(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Included KM/Day</Label>
                  <Input
                    type="number"
                    value={newIncludedKm}
                    onChange={e => setNewIncludedKm(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Section: Image & Amenities */}
            <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-border/60">
              <VehicleImageUploader
                imageUrl={newImageUrl}
                onChange={setNewImageUrl}
                label="Vehicle Photo & Preview"
              />

              {/* Feature Chips */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-semibold">Key Amenities & Features</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_FEATURES.map(f => {
                    const isSelected = newFeatures.includes(f)
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleNewFeature(f)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary font-semibold'
                            : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-primary" />}
                        {f}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                size="sm"
                className="gradient-brand text-white border-0 font-bold rounded-xl text-xs gap-2 px-4 shadow-md cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving to Database...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Save & Register Vehicle
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 2. EDIT VEHICLE DIALOG */}
      {/* ======================================================== */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Edit className="w-4 h-4" /> Edit Fleet Specs
            </div>
            <DialogTitle className="text-xl font-black">
              Edit Vehicle — {editBrand} {editModel}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify rates, branch assignments, operational status, or vehicle details. All changes will synchronize to database in real-time.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateVehicle} className="space-y-5 pt-2">
            {/* Basic specs */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-primary" /> Vehicle Identification
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Make / Brand <span className="text-rose-500">*</span></Label>
                  <Input
                    required
                    value={editBrand}
                    onChange={e => setEditBrand(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Model <span className="text-rose-500">*</span></Label>
                  <Input
                    required
                    value={editModel}
                    onChange={e => setEditModel(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Variant / Trim</Label>
                  <Input
                    value={editVariant}
                    onChange={e => setEditVariant(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Reg. Number <span className="text-rose-500">*</span></Label>
                  <Input
                    required
                    value={editRegNumber}
                    onChange={e => setEditRegNumber(e.target.value)}
                    className="h-9 text-xs uppercase font-mono font-bold rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Model Year</Label>
                  <Input
                    type="number"
                    value={editYear}
                    onChange={e => setEditYear(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Color</Label>
                  <Input
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Current Odometer (km)</Label>
                  <Input
                    type="number"
                    value={editOdometer}
                    onChange={e => setEditOdometer(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Category & Status */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" /> Configuration, Branch & Status
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Body Type</Label>
                  <Select value={editType} onValueChange={(val: VehicleType) => setEditType(val)}>
                    <SelectTrigger className="h-9 text-xs capitalize rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['suv', 'sedan', 'hatchback', 'muv', 'luxury', 'electric', 'sports'].map(t => (
                        <SelectItem key={t} value={t} className="text-xs capitalize">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Fuel Type</Label>
                  <Select value={editFuel} onValueChange={(val: FuelType) => setEditFuel(val)}>
                    <SelectTrigger className="h-9 text-xs capitalize rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['petrol', 'diesel', 'electric', 'hybrid', 'cng'].map(f => (
                        <SelectItem key={f} value={f} className="text-xs capitalize">
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Transmission</Label>
                  <Select value={editTransmission} onValueChange={(val: TransmissionType) => setEditTransmission(val)}>
                    <SelectTrigger className="h-9 text-xs capitalize rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatic" className="text-xs">Automatic</SelectItem>
                      <SelectItem value="manual" className="text-xs">Manual</SelectItem>
                      <SelectItem value="cvt" className="text-xs">CVT</SelectItem>
                      <SelectItem value="dct" className="text-xs">DCT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Seats</Label>
                  <Input
                    type="number"
                    value={editSeats}
                    onChange={e => setEditSeats(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Branch</Label>
                  <Select value={editBranch} onValueChange={setEditBranch}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id} className="text-xs font-medium">
                          {b.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Live Status</Label>
                  <Select value={editStatus} onValueChange={(val: VehicleStatus) => setEditStatus(val)}>
                    <SelectTrigger className="h-9 text-xs rounded-xl capitalize font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available" className="text-xs">Available</SelectItem>
                      <SelectItem value="reserved" className="text-xs">Reserved</SelectItem>
                      <SelectItem value="rented" className="text-xs">Rented</SelectItem>
                      <SelectItem value="maintenance" className="text-xs">Maintenance</SelectItem>
                      <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary" /> Rates & Deposit
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Daily Rate (₹)</Label>
                  <Input
                    type="number"
                    required
                    value={editDailyRate}
                    onChange={e => setEditDailyRate(e.target.value)}
                    className="h-9 text-xs font-bold rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Hourly Rate (₹)</Label>
                  <Input
                    type="number"
                    value={editHourlyRate}
                    onChange={e => setEditHourlyRate(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Security Deposit (₹)</Label>
                  <Input
                    type="number"
                    value={editDeposit}
                    onChange={e => setEditDeposit(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Extra KM (₹/km)</Label>
                  <Input
                    type="number"
                    value={editExtraKm}
                    onChange={e => setEditExtraKm(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Included KM/Day</Label>
                  <Input
                    type="number"
                    value={editIncludedKm}
                    onChange={e => setEditIncludedKm(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Photo & Features */}
            <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-border/60">
              <VehicleImageUploader
                imageUrl={editImageUrl}
                onChange={setEditImageUrl}
                label="Vehicle Photo & Preview"
              />

              {/* Feature Chips */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-semibold">Amenities & Features</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_FEATURES.map(f => {
                    const isSelected = editFeatures.includes(f)
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleEditFeature(f)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary font-semibold'
                            : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-primary" />}
                        {f}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                size="sm"
                className="gradient-brand text-white border-0 font-bold rounded-xl text-xs gap-2 px-4 shadow-md cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating Database...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 3. DELETE VEHICLE CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-2 mx-auto sm:mx-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold">Remove Vehicle from Fleet?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this vehicle from the fleet inventory?
            </DialogDescription>
          </DialogHeader>

          {selectedVehicle && (
            <div className="p-3 bg-muted/40 rounded-2xl border border-border/70 flex items-center gap-3 my-2">
              <div className="w-12 h-10 bg-muted rounded-lg overflow-hidden shrink-0">
                {selectedVehicle.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedVehicle.images[0].url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-foreground truncate">
                  {selectedVehicle.brand} {selectedVehicle.model}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  Reg: <span className="font-bold text-foreground">{selectedVehicle.registration_number}</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground bg-rose-500/5 border border-rose-500/20 p-2.5 rounded-xl text-rose-700 dark:text-rose-400">
            <span className="font-bold">Note:</span> If this vehicle is linked to past customer rental agreements, it will be safely deactivated and archived in database to preserve invoicing history.
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
              disabled={actionLoading}
              onClick={handleDeleteVehicle}
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs gap-2 px-4 shadow-md cursor-pointer"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" /> Yes, Delete Vehicle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
