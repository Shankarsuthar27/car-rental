-- ============================================================
-- DATABASE FUNCTIONS
-- ============================================================

-- Check if a vehicle is available for a given date range
CREATE OR REPLACE FUNCTION check_vehicle_availability(
  p_vehicle_id UUID,
  p_pickup_datetime TIMESTAMPTZ,
  p_return_datetime TIMESTAMPTZ,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_vehicle_status vehicle_status;
  overlap_count INTEGER;
BEGIN
  -- Check vehicle base status
  SELECT status INTO v_vehicle_status FROM vehicles WHERE id = p_vehicle_id;

  IF v_vehicle_status = 'inactive' OR v_vehicle_status = 'maintenance' THEN
    RETURN FALSE;
  END IF;

  -- Check for overlapping active bookings
  SELECT COUNT(*) INTO overlap_count
  FROM bookings
  WHERE vehicle_id = p_vehicle_id
    AND status NOT IN ('cancelled', 'rejected', 'no_show', 'completed')
    AND tstzrange(pickup_datetime, return_datetime, '[)') &&
        tstzrange(p_pickup_datetime, p_return_datetime, '[)')
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id);

  RETURN overlap_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get available vehicles for a date range
CREATE OR REPLACE FUNCTION get_available_vehicles(
  p_pickup_datetime TIMESTAMPTZ,
  p_return_datetime TIMESTAMPTZ,
  p_branch_id UUID DEFAULT NULL
)
RETURNS SETOF vehicles AS $$
BEGIN
  RETURN QUERY
  SELECT v.* FROM vehicles v
  WHERE v.is_active = TRUE
    AND v.status NOT IN ('inactive', 'maintenance')
    AND (p_branch_id IS NULL OR v.branch_id = p_branch_id)
    AND check_vehicle_availability(v.id, p_pickup_datetime, p_return_datetime);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Calculate booking totals from pricing
CREATE OR REPLACE FUNCTION calculate_booking_total(p_booking_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_total DECIMAL;
  b bookings%ROWTYPE;
BEGIN
  SELECT * INTO b FROM bookings WHERE id = p_booking_id;

  v_total := b.base_rental
    + COALESCE(b.extra_km_charge, 0)
    + COALESCE(b.late_fee, 0)
    + COALESCE(b.driver_charge, 0)
    + COALESCE(b.insurance_charge, 0)
    + COALESCE(b.fuel_charge, 0)
    - COALESCE(b.discount_amount, 0)
    - COALESCE(b.coupon_discount, 0)
    + COALESCE(b.tax_amount, 0);

  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get dashboard KPIs for a given date range
CREATE OR REPLACE FUNCTION get_dashboard_kpis(
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_branch_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_vehicles', (SELECT COUNT(*) FROM vehicles WHERE is_active = TRUE AND (p_branch_id IS NULL OR branch_id = p_branch_id)),
    'available_vehicles', (SELECT COUNT(*) FROM vehicles WHERE status = 'available' AND is_active = TRUE AND (p_branch_id IS NULL OR branch_id = p_branch_id)),
    'reserved_vehicles', (SELECT COUNT(*) FROM vehicles WHERE status = 'reserved' AND is_active = TRUE AND (p_branch_id IS NULL OR branch_id = p_branch_id)),
    'rented_vehicles', (SELECT COUNT(*) FROM vehicles WHERE status = 'rented' AND is_active = TRUE AND (p_branch_id IS NULL OR branch_id = p_branch_id)),
    'maintenance_vehicles', (SELECT COUNT(*) FROM vehicles WHERE status = 'maintenance' AND (p_branch_id IS NULL OR branch_id = p_branch_id)),
    'today_bookings', (
      SELECT COUNT(*) FROM bookings
      WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
      AND (p_branch_id IS NULL OR pickup_branch_id = p_branch_id)
    ),
    'today_revenue', (
      SELECT COALESCE(SUM(amount), 0) FROM payments
      WHERE status = 'paid'
      AND DATE(payment_date) BETWEEN p_start_date AND p_end_date
    ),
    'pending_payments', (
      SELECT COUNT(*) FROM bookings
      WHERE payment_status IN ('pending', 'partially_paid')
      AND status NOT IN ('cancelled', 'rejected')
      AND (p_branch_id IS NULL OR pickup_branch_id = p_branch_id)
    ),
    'pending_returns', (
      SELECT COUNT(*) FROM bookings
      WHERE status = 'active'
      AND DATE(return_datetime) <= CURRENT_DATE
      AND (p_branch_id IS NULL OR pickup_branch_id = p_branch_id)
    ),
    'outstanding_amount', (
      SELECT COALESCE(SUM(outstanding_amount), 0) FROM bookings
      WHERE outstanding_amount > 0
      AND status NOT IN ('cancelled', 'rejected')
      AND (p_branch_id IS NULL OR pickup_branch_id = p_branch_id)
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get revenue by day for a date range
CREATE OR REPLACE FUNCTION get_revenue_by_day(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(date DATE, revenue DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(p.payment_date) as date,
    COALESCE(SUM(p.amount), 0) as revenue
  FROM payments p
  WHERE p.status = 'paid'
    AND DATE(p.payment_date) BETWEEN p_start_date AND p_end_date
  GROUP BY DATE(p.payment_date)
  ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Increment coupon usage
CREATE OR REPLACE FUNCTION use_coupon(
  p_coupon_id UUID,
  p_customer_id UUID,
  p_booking_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_usage_count INTEGER;
BEGIN
  SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id FOR UPDATE;

  IF NOT FOUND OR NOT v_coupon.is_active THEN
    RETURN FALSE;
  END IF;

  -- Check expiry
  IF v_coupon.expiry_date IS NOT NULL AND v_coupon.expiry_date < NOW() THEN
    RETURN FALSE;
  END IF;

  -- Check global usage limit
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.times_used >= v_coupon.usage_limit THEN
    RETURN FALSE;
  END IF;

  -- Check per customer limit
  IF v_coupon.per_customer_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_usage_count
    FROM coupon_usages
    WHERE coupon_id = p_coupon_id AND customer_id = p_customer_id;

    IF v_usage_count >= v_coupon.per_customer_limit THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Record usage
  INSERT INTO coupon_usages (coupon_id, customer_id, booking_id)
  VALUES (p_coupon_id, p_customer_id, p_booking_id);

  -- Increment counter
  UPDATE coupons SET times_used = times_used + 1 WHERE id = p_coupon_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update booking payment status based on payments
CREATE OR REPLACE FUNCTION sync_booking_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL;
  v_booking bookings%ROWTYPE;
BEGIN
  -- Get the booking
  SELECT * INTO v_booking FROM bookings WHERE id = NEW.booking_id;

  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments
  WHERE booking_id = NEW.booking_id AND status = 'paid';

  -- Update booking
  UPDATE bookings SET
    amount_paid = v_total_paid,
    outstanding_amount = GREATEST(0, grand_total - v_total_paid),
    payment_status = CASE
      WHEN v_total_paid >= grand_total THEN 'paid'::payment_status
      WHEN v_total_paid > 0 THEN 'partially_paid'::payment_status
      ELSE 'pending'::payment_status
    END,
    updated_at = NOW()
  WHERE id = NEW.booking_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_payment_status
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION sync_booking_payment_status();

-- Auto-update customer stats after booking completion
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE customers SET
      total_rentals = total_rentals + 1,
      total_spent = total_spent + NEW.grand_total,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_customer_on_booking_complete
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();
