export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'branch_manager'
  | 'booking_manager'
  | 'accountant'
  | 'vehicle_manager'
  | 'staff'
  | 'customer'

export type VehicleStatus =
  | 'available'
  | 'reserved'
  | 'rented'
  | 'returned'
  | 'maintenance'
  | 'inactive'

export type VehicleType =
  | 'sedan'
  | 'suv'
  | 'hatchback'
  | 'muv'
  | 'luxury'
  | 'sports'
  | 'electric'
  | 'van'
  | 'truck'
  | 'bike'
  | 'other'

export type FuelType =
  | 'petrol'
  | 'diesel'
  | 'electric'
  | 'hybrid'
  | 'cng'
  | 'lpg'

export type TransmissionType = 'manual' | 'automatic' | 'amt' | 'cvt' | 'dct'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'kyc_pending'
  | 'payment_pending'
  | 'ready_for_pickup'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'no_show'

export type PaymentStatus =
  | 'pending'
  | 'partially_paid'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'

export type PaymentMethod =
  | 'razorpay'
  | 'upi'
  | 'card'
  | 'net_banking'
  | 'cash'
  | 'bank_transfer'
  | 'wallet'

export type KycStatus = 'pending' | 'verified' | 'rejected' | 're_upload_requested'

export type DocumentType =
  | 'driving_license'
  | 'aadhaar'
  | 'passport'
  | 'voter_id'
  | 'pan_card'
  | 'address_proof'
  | 'profile_photo'
  | 'vehicle_rc'
  | 'vehicle_insurance'
  | 'pollution_certificate'
  | 'other'

export type InspectionType = 'pickup' | 'return'

export type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarter' | 'full'

export type DamageStatus =
  | 'reported'
  | 'under_review'
  | 'approved'
  | 'charged'
  | 'resolved'

export type MaintenanceType =
  | 'service'
  | 'oil_change'
  | 'brake_service'
  | 'tyre'
  | 'battery'
  | 'repair'
  | 'insurance_renewal'
  | 'registration_renewal'
  | 'pollution_certificate'
  | 'cleaning'
  | 'other'

export type DepositStatus =
  | 'pending'
  | 'collected'
  | 'held'
  | 'partially_refunded'
  | 'refunded'
  | 'forfeited'

export type NotificationType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_success'
  | 'payment_failed'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'pickup_reminder'
  | 'return_reminder'
  | 'late_return'
  | 'payment_due'
  | 'deposit_refunded'
  | 'damage_charged'
  | 'maintenance_due'
  | 'insurance_expiry'
  | 'general'

export type PricingType = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'

export type InvoiceType =
  | 'rental_invoice'
  | 'rental_agreement'
  | 'payment_receipt'
  | 'deposit_receipt'
  | 'refund_receipt'
  | 'damage_invoice'

// ============================================================
// ENTITY TYPES
// ============================================================

export interface Branch {
  id: string
  name: string
  slug: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  phone?: string
  email?: string
  latitude?: number
  longitude?: number
  opening_time?: string
  closing_time?: string
  is_active: boolean
  meta: Json
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  phone?: string
  avatar_url?: string
  role: UserRole
  branch_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  branch?: Branch
}

export interface Employee {
  id: string
  profile_id: string
  employee_code?: string
  department?: string
  designation?: string
  branch_id?: string
  hire_date?: string
  salary?: number
  emergency_contact?: string
  address?: string
  is_active: boolean
  permissions: Json
  created_at: string
  updated_at: string
  profile?: Profile
  branch?: Branch
}

export interface Customer {
  id: string
  profile_id: string
  customer_code?: string
  date_of_birth?: string
  gender?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  country: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  driving_license_number?: string
  kyc_status: KycStatus
  kyc_verified_at?: string
  kyc_verified_by?: string
  kyc_notes?: string
  blacklisted: boolean
  blacklist_reason?: string
  total_rentals: number
  total_spent: number
  outstanding_balance: number
  created_at: string
  updated_at: string
  profile?: Profile
  kyc_documents?: KycDocument[]
}

export interface KycDocument {
  id: string
  customer_id: string
  document_type: DocumentType
  document_number?: string
  document_url: string
  thumbnail_url?: string
  expiry_date?: string
  status: KycStatus
  verified_at?: string
  verified_by?: string
  rejection_reason?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  branch_id: string
  brand: string
  model: string
  variant?: string
  year: number
  registration_number: string
  vehicle_type: VehicleType
  fuel_type: FuelType
  transmission: TransmissionType
  seating_capacity: number
  color?: string
  description?: string
  features: string[]
  current_odometer: number
  mileage?: number
  hourly_rate?: number
  daily_rate?: number
  weekly_rate?: number
  monthly_rate?: number
  security_deposit: number
  extra_km_charge: number
  included_km_per_day: number
  status: VehicleStatus
  is_active: boolean
  insurance_expiry?: string
  registration_expiry?: string
  pollution_cert_expiry?: string
  current_location?: string
  latitude?: number
  longitude?: number
  meta: Json
  created_at: string
  updated_at: string
  branch?: Branch
  images?: VehicleImage[]
  primary_image?: string
}

export interface VehicleImage {
  id: string
  vehicle_id: string
  url: string
  thumbnail_url?: string
  is_primary: boolean
  sort_order: number
  created_at: string
}

export interface PricingPlan {
  id: string
  name: string
  description?: string
  is_default: boolean
  is_active: boolean
  partial_period_rule: 'exact_hour' | 'round_up_hour' | 'day_blocks' | 'partial_to_hourly' | 'full_day_min'
  grace_period_minutes: number
  created_at: string
  updated_at: string
  rules?: PricingRule[]
}

export interface PricingRule {
  id: string
  plan_id: string
  vehicle_id?: string
  pricing_type: PricingType
  rate: number
  min_hours?: number
  max_hours?: number
  is_active: boolean
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_rental_amount: number
  max_discount?: number
  start_date?: string
  expiry_date?: string
  usage_limit?: number
  per_customer_limit: number
  times_used: number
  applicable_vehicle_types: string[]
  applicable_branch_ids: string[]
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  booking_number: string
  customer_id: string
  vehicle_id: string
  pickup_branch_id?: string
  return_branch_id?: string
  pickup_datetime: string
  return_datetime: string
  actual_pickup_datetime?: string
  actual_return_datetime?: string
  pricing_plan_id?: string
  base_rental: number
  extra_km_charge: number
  late_fee: number
  driver_charge: number
  insurance_charge: number
  fuel_charge: number
  discount_amount: number
  coupon_id?: string
  coupon_discount: number
  tax_rate: number
  tax_amount: number
  security_deposit: number
  grand_total: number
  amount_paid: number
  outstanding_amount: number
  status: BookingStatus
  payment_status: PaymentStatus
  pickup_odometer?: number
  return_odometer?: number
  included_km?: number
  extra_km: number
  with_driver: boolean
  with_insurance: boolean
  notes?: string
  admin_notes?: string
  cancelled_at?: string
  cancelled_by?: string
  cancellation_reason?: string
  refund_amount: number
  created_by?: string
  created_at: string
  updated_at: string
  // Relations
  customer?: Customer
  vehicle?: Vehicle
  pickup_branch?: Branch
  return_branch?: Branch
  payments?: Payment[]
  inspections?: VehicleInspection[]
  security_deposit_record?: SecurityDeposit
}

export interface Payment {
  id: string
  booking_id: string
  customer_id: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  status: PaymentStatus
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
  reference_number?: string
  payment_date?: string
  description?: string
  notes?: string
  processed_by?: string
  created_at: string
  updated_at: string
  booking?: Booking
  customer?: Customer
}

export interface SecurityDeposit {
  id: string
  booking_id: string
  customer_id: string
  required_amount: number
  collected_amount: number
  payment_id?: string
  damage_deduction: number
  other_deductions: number
  deduction_notes?: string
  refund_amount?: number
  refund_date?: string
  refund_payment_id?: string
  status: DepositStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface VehicleInspection {
  id: string
  booking_id: string
  vehicle_id: string
  inspection_type: InspectionType
  inspected_by?: string
  inspection_datetime: string
  odometer: number
  fuel_level: FuelLevel
  condition_rating?: number
  has_scratches: boolean
  has_dents: boolean
  has_broken_parts: boolean
  damage_description?: string
  notes?: string
  customer_notes?: string
  customer_signature_url?: string
  staff_signature_url?: string
  created_at: string
  photos?: InspectionPhoto[]
}

export interface InspectionPhoto {
  id: string
  inspection_id: string
  url: string
  thumbnail_url?: string
  area?: string
  description?: string
  created_at: string
}

export interface VehicleDamage {
  id: string
  vehicle_id: string
  booking_id?: string
  customer_id?: string
  inspection_id?: string
  damage_type: string
  description: string
  location_on_vehicle?: string
  is_customer_responsible: boolean
  estimated_cost?: number
  final_cost?: number
  deducted_from_deposit: number
  status: DamageStatus
  resolved_at?: string
  notes?: string
  created_at: string
  updated_at: string
  photos?: { id: string; url: string; description?: string }[]
}

export interface VehicleMaintenance {
  id: string
  vehicle_id: string
  maintenance_type: MaintenanceType
  description?: string
  scheduled_date?: string
  completed_date?: string
  cost?: number
  odometer_at_service?: number
  next_service_date?: string
  next_service_odometer?: number
  vendor_name?: string
  vendor_phone?: string
  invoice_url?: string
  notes?: string
  is_completed: boolean
  created_by?: string
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

export interface Invoice {
  id: string
  invoice_number: string
  booking_id?: string
  customer_id: string
  invoice_type: InvoiceType
  invoice_date: string
  due_date?: string
  subtotal: number
  discount: number
  tax_rate: number
  tax_amount: number
  total: number
  amount_paid: number
  balance: number
  pdf_url?: string
  is_paid: boolean
  paid_at?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  items?: InvoiceItem[]
  customer?: Customer
  booking?: Booking
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  total: number
  sort_order: number
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  data: Json
  is_read: boolean
  read_at?: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id?: string
  user_email?: string
  action: string
  module: string
  record_id?: string
  record_type?: string
  previous_value?: Json
  new_value?: Json
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: Profile
}

// ============================================================
// PRICING CALCULATION TYPES
// ============================================================

export interface PricingInput {
  vehicle: Vehicle
  pickupDateTime: Date
  returnDateTime: Date
  pricingPlan?: PricingPlan
  extraKm?: number
  discountAmount?: number
  coupon?: Coupon
  taxRate?: number
  driverCharge?: number
  insuranceCharge?: number
  fuelCharge?: number
  includeDeposit?: boolean
}

export interface PricingBreakdown {
  rentalDuration: {
    hours: number
    days: number
    weeks: number
    months: number
    displayText: string
  }
  baseRental: number
  extraKmCharge: number
  lateFee: number
  driverCharge: number
  insuranceCharge: number
  fuelCharge: number
  subtotal: number
  discountAmount: number
  couponDiscount: number
  taxRate: number
  taxAmount: number
  securityDeposit: number
  grandTotal: number
  lineItems: PricingLineItem[]
  appliedPricingType: PricingType
}

export interface PricingLineItem {
  description: string
  quantity?: number
  unit?: string
  unitPrice: number
  total: number
  type: 'base' | 'extra' | 'discount' | 'tax' | 'deposit'
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ============================================================
// FILTER / QUERY TYPES
// ============================================================

export interface VehicleFilters {
  vehicleType?: VehicleType[]
  fuelType?: FuelType[]
  transmission?: TransmissionType[]
  minPrice?: number
  maxPrice?: number
  brand?: string[]
  seats?: number
  branchId?: string
  pickupDatetime?: string
  returnDatetime?: string
  search?: string
  sortBy?: 'price_asc' | 'price_desc' | 'popular' | 'newest' | 'recommended'
}

export interface BookingFilters {
  status?: BookingStatus[]
  paymentStatus?: PaymentStatus[]
  customerId?: string
  vehicleId?: string
  branchId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================================
// DASHBOARD TYPES
// ============================================================

export interface DashboardKPIs {
  total_vehicles: number
  available_vehicles: number
  reserved_vehicles: number
  rented_vehicles: number
  maintenance_vehicles: number
  today_bookings: number
  today_revenue: number
  pending_payments: number
  pending_returns: number
  outstanding_amount: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
}

export interface BookingTrend {
  date: string
  bookings: number
  completed: number
  cancelled: number
}
