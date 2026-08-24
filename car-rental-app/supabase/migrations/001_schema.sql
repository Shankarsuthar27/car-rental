-- ============================================================
-- CAR RENTAL MANAGEMENT SAAS - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'super_admin', 'admin', 'branch_manager', 'booking_manager',
  'accountant', 'vehicle_manager', 'staff', 'customer'
);

CREATE TYPE vehicle_status AS ENUM (
  'available', 'reserved', 'rented', 'returned', 'maintenance', 'inactive'
);

CREATE TYPE vehicle_type AS ENUM (
  'sedan', 'suv', 'hatchback', 'muv', 'luxury', 'sports',
  'electric', 'van', 'truck', 'bike', 'other'
);

CREATE TYPE fuel_type AS ENUM (
  'petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'
);

CREATE TYPE transmission_type AS ENUM ('manual', 'automatic', 'amt', 'cvt', 'dct');

CREATE TYPE booking_status AS ENUM (
  'pending', 'confirmed', 'kyc_pending', 'payment_pending',
  'ready_for_pickup', 'active', 'completed', 'cancelled',
  'rejected', 'no_show'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'partially_paid', 'paid', 'failed', 'refunded', 'partially_refunded'
);

CREATE TYPE payment_method AS ENUM (
  'razorpay', 'upi', 'card', 'net_banking', 'cash', 'bank_transfer', 'wallet'
);

CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected', 're_upload_requested');

CREATE TYPE document_type AS ENUM (
  'driving_license', 'aadhaar', 'passport', 'voter_id', 'pan_card',
  'address_proof', 'profile_photo', 'vehicle_rc', 'vehicle_insurance',
  'pollution_certificate', 'other'
);

CREATE TYPE inspection_type AS ENUM ('pickup', 'return');

CREATE TYPE fuel_level AS ENUM ('empty', 'quarter', 'half', 'three_quarter', 'full');

CREATE TYPE damage_status AS ENUM (
  'reported', 'under_review', 'approved', 'charged', 'resolved'
);

CREATE TYPE maintenance_type AS ENUM (
  'service', 'oil_change', 'brake_service', 'tyre', 'battery',
  'repair', 'insurance_renewal', 'registration_renewal',
  'pollution_certificate', 'cleaning', 'other'
);

CREATE TYPE deposit_status AS ENUM (
  'pending', 'collected', 'held', 'partially_refunded', 'refunded', 'forfeited'
);

CREATE TYPE refund_status AS ENUM (
  'pending', 'processing', 'completed', 'failed'
);

CREATE TYPE notification_type AS ENUM (
  'booking_created', 'booking_confirmed', 'booking_cancelled',
  'payment_success', 'payment_failed', 'kyc_approved', 'kyc_rejected',
  'pickup_reminder', 'return_reminder', 'late_return',
  'payment_due', 'deposit_refunded', 'damage_charged',
  'maintenance_due', 'insurance_expiry', 'general'
);

CREATE TYPE pricing_type AS ENUM ('hourly', 'daily', 'weekly', 'monthly', 'custom');

CREATE TYPE coupon_discount_type AS ENUM ('percentage', 'fixed');

CREATE TYPE invoice_type AS ENUM (
  'rental_invoice', 'rental_agreement', 'payment_receipt',
  'deposit_receipt', 'refund_receipt', 'damage_invoice'
);

-- ============================================================
-- BRANCHES
-- ============================================================

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  opening_time TIME,
  closing_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'customer',
  branch_id UUID REFERENCES branches(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEES
-- ============================================================

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  employee_code TEXT UNIQUE,
  department TEXT,
  designation TEXT,
  branch_id UUID REFERENCES branches(id),
  hire_date DATE,
  salary DECIMAL(12,2),
  emergency_contact TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  customer_code TEXT UNIQUE,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  kyc_status kyc_status DEFAULT 'pending',
  kyc_verified_at TIMESTAMPTZ,
  kyc_verified_by UUID REFERENCES profiles(id),
  kyc_notes TEXT,
  blacklisted BOOLEAN DEFAULT FALSE,
  blacklist_reason TEXT,
  total_rentals INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- KYC DOCUMENTS
-- ============================================================

CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  document_number TEXT,
  document_url TEXT NOT NULL,
  thumbnail_url TEXT,
  expiry_date DATE,
  status kyc_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VEHICLES
-- ============================================================

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT,
  year INTEGER NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  fuel_type fuel_type NOT NULL,
  transmission transmission_type NOT NULL,
  seating_capacity INTEGER NOT NULL DEFAULT 5,
  color TEXT,
  description TEXT,
  features JSONB DEFAULT '[]',
  current_odometer INTEGER DEFAULT 0,
  mileage DECIMAL(5,2),
  -- Pricing
  hourly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  security_deposit DECIMAL(10,2) DEFAULT 0,
  extra_km_charge DECIMAL(8,2) DEFAULT 0,
  included_km_per_day INTEGER DEFAULT 200,
  -- Status
  status vehicle_status DEFAULT 'available',
  is_active BOOLEAN DEFAULT TRUE,
  -- Insurance / docs
  insurance_expiry DATE,
  registration_expiry DATE,
  pollution_cert_expiry DATE,
  -- Location
  current_location TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_branch ON vehicles(branch_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_vehicles_fuel ON vehicles(fuel_type);
CREATE INDEX idx_vehicles_registration ON vehicles(registration_number);

-- ============================================================
-- VEHICLE IMAGES
-- ============================================================

CREATE TABLE vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_images_vehicle ON vehicle_images(vehicle_id);

-- ============================================================
-- VEHICLE DOCUMENTS
-- ============================================================

CREATE TABLE vehicle_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  document_number TEXT,
  document_url TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRICING PLANS
-- ============================================================

CREATE TABLE pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  -- Partial period rule
  partial_period_rule TEXT DEFAULT 'round_up_hour'
    CHECK (partial_period_rule IN ('exact_hour','round_up_hour','day_blocks','partial_to_hourly','full_day_min')),
  grace_period_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE, -- null = applies to all
  pricing_type pricing_type NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  min_hours INTEGER,
  max_hours INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Holiday / seasonal pricing
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  multiplier DECIMAL(4,2) DEFAULT 1.0, -- e.g. 1.5 = 50% surcharge
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COUPONS
-- ============================================================

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type coupon_discount_type NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  min_rental_amount DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  start_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  usage_limit INTEGER,
  per_customer_limit INTEGER DEFAULT 1,
  times_used INTEGER DEFAULT 0,
  applicable_vehicle_types JSONB DEFAULT '[]', -- empty = all
  applicable_branch_ids JSONB DEFAULT '[]',    -- empty = all
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS
-- ============================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  -- Branch
  pickup_branch_id UUID REFERENCES branches(id),
  return_branch_id UUID REFERENCES branches(id),
  -- Dates
  pickup_datetime TIMESTAMPTZ NOT NULL,
  return_datetime TIMESTAMPTZ NOT NULL,
  actual_pickup_datetime TIMESTAMPTZ,
  actual_return_datetime TIMESTAMPTZ,
  -- Pricing
  pricing_plan_id UUID REFERENCES pricing_plans(id),
  base_rental DECIMAL(12,2) DEFAULT 0,
  extra_km_charge DECIMAL(12,2) DEFAULT 0,
  late_fee DECIMAL(12,2) DEFAULT 0,
  driver_charge DECIMAL(12,2) DEFAULT 0,
  insurance_charge DECIMAL(12,2) DEFAULT 0,
  fuel_charge DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  coupon_id UUID REFERENCES coupons(id),
  coupon_discount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 18,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  security_deposit DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  outstanding_amount DECIMAL(12,2) DEFAULT 0,
  -- Status
  status booking_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  -- Odometer
  pickup_odometer INTEGER,
  return_odometer INTEGER,
  included_km INTEGER,
  extra_km INTEGER DEFAULT 0,
  -- Options
  with_driver BOOLEAN DEFAULT FALSE,
  with_insurance BOOLEAN DEFAULT FALSE,
  notes TEXT,
  admin_notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  cancellation_reason TEXT,
  refund_amount DECIMAL(12,2) DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- PREVENT OVERLAPPING ACTIVE BOOKINGS
  CONSTRAINT no_overlapping_bookings EXCLUDE USING GIST (
    vehicle_id WITH =,
    tstzrange(pickup_datetime, return_datetime, '[)') WITH &&
  ) WHERE (status NOT IN ('cancelled', 'rejected', 'no_show', 'completed'))
);

CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_pickup ON bookings(pickup_datetime);
CREATE INDEX idx_bookings_return ON bookings(return_datetime);
CREATE INDEX idx_bookings_pickup_branch ON bookings(pickup_branch_id);
CREATE INDEX idx_bookings_number ON bookings(booking_number);

-- ============================================================
-- RENTAL AGREEMENTS
-- ============================================================

CREATE TABLE rental_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  agreement_number TEXT UNIQUE NOT NULL,
  document_url TEXT,
  customer_signature_url TEXT,
  staff_signature_url TEXT,
  signed_at TIMESTAMPTZ,
  terms_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VEHICLE INSPECTIONS (pickup & return)
-- ============================================================

CREATE TABLE vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  inspection_type inspection_type NOT NULL,
  inspected_by UUID REFERENCES profiles(id),
  inspection_datetime TIMESTAMPTZ DEFAULT NOW(),
  odometer INTEGER NOT NULL,
  fuel_level fuel_level NOT NULL,
  condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
  -- Damage flags
  has_scratches BOOLEAN DEFAULT FALSE,
  has_dents BOOLEAN DEFAULT FALSE,
  has_broken_parts BOOLEAN DEFAULT FALSE,
  damage_description TEXT,
  -- Notes
  notes TEXT,
  customer_notes TEXT,
  -- Signatures
  customer_signature_url TEXT,
  staff_signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspections_booking ON vehicle_inspections(booking_id);
CREATE INDEX idx_inspections_vehicle ON vehicle_inspections(vehicle_id);

-- ============================================================
-- INSPECTION PHOTOS
-- ============================================================

CREATE TABLE inspection_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES vehicle_inspections(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  area TEXT, -- front, rear, left, right, interior, other
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VEHICLE DAMAGE
-- ============================================================

CREATE TABLE vehicle_damage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID REFERENCES customers(id),
  inspection_id UUID REFERENCES vehicle_inspections(id),
  damage_type TEXT NOT NULL,
  description TEXT NOT NULL,
  location_on_vehicle TEXT,
  is_customer_responsible BOOLEAN DEFAULT TRUE,
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),
  deducted_from_deposit DECIMAL(10,2) DEFAULT 0,
  status damage_status DEFAULT 'reported',
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE damage_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  damage_id UUID NOT NULL REFERENCES vehicle_damage(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VEHICLE MAINTENANCE
-- ============================================================

CREATE TABLE vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  maintenance_type maintenance_type NOT NULL,
  description TEXT,
  scheduled_date DATE,
  completed_date DATE,
  cost DECIMAL(10,2),
  odometer_at_service INTEGER,
  next_service_date DATE,
  next_service_odometer INTEGER,
  vendor_name TEXT,
  vendor_phone TEXT,
  invoice_url TEXT,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX idx_maintenance_date ON vehicle_maintenance(scheduled_date);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  -- Razorpay
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  -- Manual
  reference_number TEXT,
  payment_date TIMESTAMPTZ,
  -- Meta
  description TEXT,
  notes TEXT,
  processed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id);

-- ============================================================
-- SECURITY DEPOSITS
-- ============================================================

CREATE TABLE security_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  required_amount DECIMAL(12,2) NOT NULL,
  collected_amount DECIMAL(12,2) DEFAULT 0,
  payment_id UUID REFERENCES payments(id),
  -- Deductions
  damage_deduction DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  deduction_notes TEXT,
  -- Refund
  refund_amount DECIMAL(12,2),
  refund_date TIMESTAMPTZ,
  refund_payment_id UUID REFERENCES payments(id),
  status deposit_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REFUNDS
-- ============================================================

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  payment_id UUID NOT NULL REFERENCES payments(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT NOT NULL,
  status refund_status DEFAULT 'pending',
  -- Razorpay
  razorpay_refund_id TEXT,
  -- Manual
  reference_number TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVOICES
-- ============================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  invoice_type invoice_type NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  -- Amounts
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 18,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2) DEFAULT 0,
  -- PDF
  pdf_url TEXT,
  -- Status
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  user_email TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id UUID,
  record_type TEXT,
  previous_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- SETTINGS
-- ============================================================

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- can be read by frontend without auth
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COUPON USAGE TRACKING
-- ============================================================

CREATE TABLE coupon_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, booking_id)
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON branches;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON employees;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON customers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON kyc_documents;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON kyc_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON vehicles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON vehicle_documents;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON vehicle_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON pricing_plans;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON pricing_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON coupons;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON bookings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON vehicle_damage;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON vehicle_damage FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON vehicle_maintenance;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON vehicle_maintenance FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON payments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON security_deposits;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON security_deposits FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON refunds;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON invoices;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO CREATE PROFILE ON USER SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- BOOKING NUMBER GENERATOR
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS agreement_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := 'BK-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('booking_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_booking_number ON bookings;
CREATE TRIGGER set_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_number ON invoices;
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();
