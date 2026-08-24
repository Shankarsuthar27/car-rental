-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_damage ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is admin or above
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('super_admin', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is staff (any employee role)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('super_admin', 'admin', 'branch_manager', 'booking_manager', 'accountant', 'vehicle_manager', 'staff');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get my customer id
CREATE OR REPLACE FUNCTION get_my_customer_id()
RETURNS UUID AS $$
  SELECT id FROM customers WHERE profile_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT WITH CHECK (is_admin());

-- ============================================================
-- BRANCHES (public read)
-- ============================================================

DROP POLICY IF EXISTS "branches_select_all" ON branches;
CREATE POLICY "branches_select_all" ON branches
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "branches_modify_admin" ON branches;
CREATE POLICY "branches_modify_admin" ON branches
  FOR ALL USING (is_admin());

-- ============================================================
-- VEHICLES (public read for active vehicles)
-- ============================================================

DROP POLICY IF EXISTS "vehicles_select_public" ON vehicles;
CREATE POLICY "vehicles_select_public" ON vehicles
  FOR SELECT USING (is_active = TRUE OR is_staff());

DROP POLICY IF EXISTS "vehicles_modify_staff" ON vehicles;
CREATE POLICY "vehicles_modify_staff" ON vehicles
  FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "vehicle_images_select_public" ON vehicle_images;
CREATE POLICY "vehicle_images_select_public" ON vehicle_images
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "vehicle_images_modify_staff" ON vehicle_images;
CREATE POLICY "vehicle_images_modify_staff" ON vehicle_images
  FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "vehicle_documents_staff" ON vehicle_documents;
CREATE POLICY "vehicle_documents_staff" ON vehicle_documents
  FOR ALL USING (is_staff());

-- ============================================================
-- PRICING & PROMOTIONS (public read)
-- ============================================================

DROP POLICY IF EXISTS "pricing_plans_select_public" ON pricing_plans;
CREATE POLICY "pricing_plans_select_public" ON pricing_plans
  FOR SELECT USING (is_active = TRUE OR is_staff());

DROP POLICY IF EXISTS "pricing_plans_modify_admin" ON pricing_plans;
CREATE POLICY "pricing_plans_modify_admin" ON pricing_plans
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "pricing_rules_select_public" ON pricing_rules;
CREATE POLICY "pricing_rules_select_public" ON pricing_rules
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "pricing_rules_modify_admin" ON pricing_rules;
CREATE POLICY "pricing_rules_modify_admin" ON pricing_rules
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "holidays_select_public" ON holidays;
CREATE POLICY "holidays_select_public" ON holidays
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "holidays_modify_admin" ON holidays;
CREATE POLICY "holidays_modify_admin" ON holidays
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "coupons_select_public" ON coupons;
CREATE POLICY "coupons_select_public" ON coupons
  FOR SELECT USING (is_active = TRUE OR is_staff());

DROP POLICY IF EXISTS "coupons_modify_staff" ON coupons;
CREATE POLICY "coupons_modify_staff" ON coupons
  FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "coupon_usages_select_own" ON coupon_usages;
CREATE POLICY "coupon_usages_select_own" ON coupon_usages
  FOR SELECT USING (customer_id = get_my_customer_id() OR is_staff());

DROP POLICY IF EXISTS "coupon_usages_insert_all" ON coupon_usages;
CREATE POLICY "coupon_usages_insert_all" ON coupon_usages
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- CUSTOMERS & KYC
-- ============================================================

DROP POLICY IF EXISTS "customers_select_own" ON customers;
CREATE POLICY "customers_select_own" ON customers
  FOR SELECT USING (profile_id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "customers_update_own" ON customers;
CREATE POLICY "customers_update_own" ON customers
  FOR UPDATE USING (profile_id = auth.uid() OR is_staff());

DROP POLICY IF EXISTS "customers_insert_all" ON customers;
CREATE POLICY "customers_insert_all" ON customers
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "kyc_documents_select_own" ON kyc_documents;
CREATE POLICY "kyc_documents_select_own" ON kyc_documents
  FOR SELECT USING (customer_id = get_my_customer_id() OR is_staff());

DROP POLICY IF EXISTS "kyc_documents_insert_own" ON kyc_documents;
CREATE POLICY "kyc_documents_insert_own" ON kyc_documents
  FOR INSERT WITH CHECK (customer_id = get_my_customer_id() OR is_staff());

DROP POLICY IF EXISTS "kyc_documents_modify_staff" ON kyc_documents;
CREATE POLICY "kyc_documents_modify_staff" ON kyc_documents
  FOR UPDATE USING (is_staff());

-- ============================================================
-- BOOKINGS
-- ============================================================

DROP POLICY IF EXISTS "bookings_select_own" ON bookings;
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT USING (customer_id = get_my_customer_id() OR is_staff());

DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;
CREATE POLICY "bookings_insert_own" ON bookings
  FOR INSERT WITH CHECK (customer_id = get_my_customer_id() OR is_staff());

DROP POLICY IF EXISTS "bookings_update_staff" ON bookings;
CREATE POLICY "bookings_update_staff" ON bookings
  FOR UPDATE USING (is_staff() OR (customer_id = get_my_customer_id() AND status IN ('pending', 'confirmed')));

-- ============================================================
-- RENTAL AGREEMENTS
-- ============================================================

DROP POLICY IF EXISTS "rental_agreements_select_own" ON rental_agreements;
CREATE POLICY "rental_agreements_select_own" ON rental_agreements
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE customer_id = get_my_customer_id()) OR is_staff()
  );

DROP POLICY IF EXISTS "rental_agreements_modify_staff" ON rental_agreements;
CREATE POLICY "rental_agreements_modify_staff" ON rental_agreements
  FOR ALL USING (is_staff());

-- ============================================================
-- INSPECTIONS & DAMAGE
-- ============================================================

DROP POLICY IF EXISTS "inspections_select_own" ON vehicle_inspections;
CREATE POLICY "inspections_select_own" ON vehicle_inspections
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE customer_id = get_my_customer_id()) OR is_staff()
  );

DROP POLICY IF EXISTS "inspections_modify_staff" ON vehicle_inspections;
CREATE POLICY "inspections_modify_staff" ON vehicle_inspections
  FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "inspection_photos_select_own" ON inspection_photos;
CREATE POLICY "inspection_photos_select_own" ON inspection_photos
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "inspection_photos_modify_staff" ON inspection_photos;
CREATE POLICY "inspection_photos_modify_staff" ON inspection_photos
  FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "vehicle_damage_select_own" ON vehicle_damage;
CREATE POLICY "vehicle_damage_select_own" ON vehicle_damage
  FOR SELECT USING (customer_id = get_my_customer_id() OR is_staff());

DROP POLICY IF EXISTS "vehicle_damage_modify_staff" ON vehicle_damage;
CREATE POLICY "vehicle_damage_modify_staff" ON vehicle_damage
  FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "damage_photos_select_own" ON damage_photos;
CREATE POLICY "damage_photos_select_own" ON damage_photos
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "damage_photos_modify_staff" ON damage_photos;
CREATE POLICY "damage_photos_modify_staff" ON damage_photos
  FOR ALL USING (is_staff());

-- ============================================================
-- MAINTENANCE
-- ============================================================

DROP POLICY IF EXISTS "maintenance_staff" ON vehicle_maintenance;
CREATE POLICY "maintenance_staff" ON vehicle_maintenance
  FOR ALL USING (is_staff());

-- ============================================================
-- PAYMENTS & INVOICES
-- ============================================================

DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (customer_id = get_my_customer_id() OR is_staff());

DROP POLICY IF EXISTS "payments_modify_staff" ON payments;
CREATE POLICY "payments_modify_staff" ON payments
  FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "deposits_select_own" ON security_deposits;
CREATE POLICY "deposits_select_own" ON security_deposits
  FOR SELECT USING (customer_id = get_my_customer_id() OR is_staff());

DROP POLICY IF EXISTS "deposits_modify_staff" ON security_deposits;
CREATE POLICY "deposits_modify_staff" ON security_deposits
  FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "refunds_select_own" ON refunds;
CREATE POLICY "refunds_select_own" ON refunds
  FOR SELECT USING (customer_id = get_my_customer_id() OR is_staff());

DROP POLICY IF EXISTS "refunds_modify_staff" ON refunds;
CREATE POLICY "refunds_modify_staff" ON refunds
  FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "invoices_select_own" ON invoices;
CREATE POLICY "invoices_select_own" ON invoices
  FOR SELECT USING (customer_id = get_my_customer_id() OR is_staff());

DROP POLICY IF EXISTS "invoices_modify_staff" ON invoices;
CREATE POLICY "invoices_modify_staff" ON invoices
  FOR ALL USING (is_staff());

DROP POLICY IF EXISTS "invoice_items_select_own" ON invoice_items;
CREATE POLICY "invoice_items_select_own" ON invoice_items
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "invoice_items_modify_staff" ON invoice_items;
CREATE POLICY "invoice_items_modify_staff" ON invoice_items
  FOR ALL USING (is_staff());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert_all" ON notifications;
CREATE POLICY "notifications_insert_all" ON notifications
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- EMPLOYEES & ADMIN
-- ============================================================

DROP POLICY IF EXISTS "employees_staff" ON employees;
CREATE POLICY "employees_staff" ON employees
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "audit_logs_admin" ON audit_logs;
CREATE POLICY "audit_logs_admin" ON audit_logs
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "settings_admin" ON settings;
CREATE POLICY "settings_admin" ON settings
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "settings_select_public" ON settings;
CREATE POLICY "settings_select_public" ON settings
  FOR SELECT USING (is_public = TRUE);
