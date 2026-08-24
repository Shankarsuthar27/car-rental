-- ============================================================
-- SEED DATA FOR CAR RENTAL SaaS
-- Demo data for immediate testing
-- ============================================================

-- ============================================================
-- BRANCHES
-- ============================================================

INSERT INTO branches (id, name, slug, address, city, state, pincode, phone, email, opening_time, closing_time, is_active) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Jaipur Main Branch', 'jaipur-main', 'C-Scheme, Ashok Marg', 'Jaipur', 'Rajasthan', '302001', '+91-141-2345678', 'jaipur@driveease.in', '08:00', '22:00', TRUE),
  ('11111111-0000-0000-0000-000000000002', 'Jodhpur Branch', 'jodhpur', 'Near Clock Tower, Sardar Market', 'Jodhpur', 'Rajasthan', '342001', '+91-291-3456789', 'jodhpur@driveease.in', '08:00', '21:00', TRUE),
  ('11111111-0000-0000-0000-000000000003', 'Udaipur Branch', 'udaipur', 'City Palace Road, Fateh Sagar', 'Udaipur', 'Rajasthan', '313001', '+91-294-4567890', 'udaipur@driveease.in', '09:00', '21:00', TRUE),
  ('11111111-0000-0000-0000-000000000004', 'Ahmedabad Branch', 'ahmedabad', 'SG Highway, Prahlad Nagar', 'Ahmedabad', 'Gujarat', '380051', '+91-79-5678901', 'ahmedabad@driveease.in', '08:00', '22:00', TRUE);

-- ============================================================
-- SETTINGS
-- ============================================================

INSERT INTO settings (key, value, description, is_public) VALUES
  ('company_name', '"DriveEase"', 'Company name', TRUE),
  ('company_tagline', '"Drive Your Way, Every Day"', 'Company tagline', TRUE),
  ('company_address', '"C-Scheme, Ashok Marg, Jaipur, Rajasthan 302001"', 'Registered address', FALSE),
  ('company_phone', '"+91-141-2345678"', 'Support phone', TRUE),
  ('company_email', '"support@driveease.in"', 'Support email', TRUE),
  ('company_gstin', '"08ABCDE1234F1Z5"', 'GST number', FALSE),
  ('currency', '"INR"', 'Default currency', TRUE),
  ('currency_symbol', '"₹"', 'Currency symbol', TRUE),
  ('tax_rate', '18', 'Default GST rate (%)', TRUE),
  ('tax_label', '"GST"', 'Tax label', TRUE),
  ('booking_advance_payment_percent', '30', 'Advance payment percentage required', FALSE),
  ('grace_period_minutes', '30', 'Grace period before late fees apply', FALSE),
  ('cancellation_policy', '{"48h_plus": 100, "24_to_48h": 75, "less_than_24h": 50}', 'Cancellation refund percentages', FALSE),
  ('razorpay_enabled', 'true', 'Razorpay payment gateway enabled', FALSE),
  ('support_whatsapp', '"+919876543210"', 'WhatsApp support number', TRUE);

-- ============================================================
-- PRICING PLANS
-- ============================================================

INSERT INTO pricing_plans (id, name, description, is_default, is_active, partial_period_rule, grace_period_minutes) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Standard Plan', 'Default pricing plan for all vehicles', TRUE, TRUE, 'round_up_hour', 30),
  ('22222222-0000-0000-0000-000000000002', 'Weekend Special', 'Special weekend pricing (Fri-Sun)', FALSE, TRUE, 'day_blocks', 60),
  ('22222222-0000-0000-0000-000000000003', 'Monthly Corporate', 'Discounted monthly rates for corporate clients', FALSE, TRUE, 'day_blocks', 120);

-- ============================================================
-- VEHICLES
-- ============================================================

INSERT INTO vehicles (id, branch_id, brand, model, variant, year, registration_number, vehicle_type, fuel_type, transmission, seating_capacity, color, mileage, current_odometer, hourly_rate, daily_rate, weekly_rate, monthly_rate, security_deposit, extra_km_charge, included_km_per_day, status, description, features, insurance_expiry, registration_expiry, pollution_cert_expiry) VALUES
  (
    '33333333-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'Hyundai', 'Creta', 'SX(O) Turbo', 2024,
    'RJ14-CR-2024', 'suv', 'petrol', 'automatic', 5,
    'Typhoon Silver', 16.8, 15200,
    150.00, 1800.00, 10500.00, 32000.00, 10000.00, 12.00, 200,
    'available',
    'Premium SUV with panoramic sunroof, Bose sound system, and ventilated seats. Perfect for long drives.',
    '["Panoramic Sunroof", "Bose Sound System", "Ventilated Seats", "360° Camera", "Level 2 ADAS", "Wireless Charging", "Ambient Lighting", "Connected Car Tech"]',
    '2025-12-31', '2025-08-20', '2025-02-28'
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000001',
    'Maruti Suzuki', 'Swift', 'ZXi+', 2024,
    'RJ14-SW-2024', 'hatchback', 'petrol', 'automatic', 5,
    'Magma Grey', 22.0, 8500,
    80.00, 900.00, 5500.00, 18000.00, 5000.00, 8.00, 150,
    'available',
    'Sporty and fuel-efficient hatchback. Ideal for city commutes and short trips.',
    '["Sunroof", "360° Camera", "Wireless Charging", "9-inch Infotainment", "Auto AC", "Push Start"]',
    '2026-03-31', '2026-01-15', '2025-11-30'
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000002',
    'Toyota', 'Innova Crysta', 'GX 2.4 MT', 2023,
    'RJ20-IC-2023', 'muv', 'diesel', 'manual', 7,
    'White Pearl', 15.1, 32000,
    200.00, 2500.00, 14000.00, 45000.00, 15000.00, 15.00, 250,
    'available',
    'The most trusted MPV for family and group travel. Spacious, comfortable, and reliable.',
    '["Captain Seats", "7-Seater", "Touchscreen Infotainment", "Rear AC Vents", "Power Windows", "ABS+EBD"]',
    '2025-09-30', '2025-06-30', '2025-04-30'
  ),
  (
    '33333333-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000002',
    'Mahindra', 'Scorpio N', 'Z8 L 4WD', 2023,
    'RJ20-SN-2023', 'suv', 'diesel', 'manual', 7,
    'Deep Forest', 15.5, 22000,
    180.00, 2200.00, 12500.00, 38000.00, 12000.00, 14.00, 200,
    'available',
    'The legendary Scorpio N with 4WD capability. Perfect for adventure and offroad trips.',
    '["4WD", "Sunroof", "Sony Sound System", "Terrain Modes", "AdrenoX", "7 Airbags", "Wireless Charging"]',
    '2025-11-30', '2025-09-30', '2025-07-31'
  ),
  (
    '33333333-0000-0000-0000-000000000005',
    '11111111-0000-0000-0000-000000000003',
    'Kia', 'Seltos', 'GTX+ Turbo', 2024,
    'RJ27-KS-2024', 'suv', 'petrol', 'automatic', 5,
    'Glacial White Pearl', 16.5, 18000,
    160.00, 2000.00, 11500.00, 35000.00, 10000.00, 12.00, 200,
    'available',
    'Feature-packed modern SUV with panoramic sunroof and segment-leading connectivity.',
    '["Panoramic Sunroof", "Bose 8 Speaker", "Meridian Audio", "Level 2 ADAS", "Ventilated Seats", "HUD", "360° Camera"]',
    '2026-01-31', '2025-12-31', '2025-10-31'
  ),
  (
    '33333333-0000-0000-0000-000000000006',
    '11111111-0000-0000-0000-000000000004',
    'Toyota', 'Fortuner', 'Legender 4x4 AT', 2024,
    'GJ01-TF-2024', 'suv', 'diesel', 'automatic', 7,
    'Sparkling Black Pearl Crystal Shine', 14.0, 28000,
    350.00, 4000.00, 22000.00, 70000.00, 25000.00, 20.00, 300,
    'available',
    'India''s most premium SUV. Commanding presence with 4WD and luxurious cabin.',
    '["4WD", "Panoramic Sunroof", "JBL Premium Audio", "Ventilated Seats", "Semi-Aniline Leather", "9 Airbags", "Downhill Assist"]',
    '2026-06-30', '2026-03-31', '2026-01-31'
  ),
  (
    '33333333-0000-0000-0000-000000000007',
    '11111111-0000-0000-0000-000000000001',
    'Maruti Suzuki', 'Baleno', 'Alpha Turbo', 2024,
    'RJ14-BL-2024', 'hatchback', 'petrol', 'automatic', 5,
    'Splendid Silver', 22.9, 5000,
    85.00, 950.00, 5800.00, 19000.00, 5000.00, 8.00, 150,
    'available',
    'Premium hatchback with Head-Up Display and connected car tech.',
    '["HUD", "360° Camera", "Wireless Android Auto/CarPlay", "Sunroof", "Auto Headlamps", "9-inch SmartPlay Pro+"]',
    '2026-08-31', '2026-05-31', '2026-02-28'
  ),
  (
    '33333333-0000-0000-0000-000000000008',
    '11111111-0000-0000-0000-000000000003',
    'Mahindra', 'Thar ROXX', '4WD AX7 L', 2024,
    'RJ27-TR-2024', 'suv', 'diesel', 'automatic', 5,
    'Stealth Black', 16.2, 3500,
    220.00, 2800.00, 16000.00, 50000.00, 15000.00, 18.00, 150,
    'available',
    'The iconic Thar ROXX - 5 door version. Built for adventure with premium features.',
    '["4WD", "Terrain Modes", "Sunroof", "Level 2 ADAS", "Sony 8 Speaker", "Wireless Charging", "Ventilated Seats", "Ambient Lighting"]',
    '2026-12-31', '2026-08-31', '2026-04-30'
  );

-- ============================================================
-- COUPONS
-- ============================================================

INSERT INTO coupons (code, description, discount_type, discount_value, min_rental_amount, max_discount, start_date, expiry_date, usage_limit, per_customer_limit, is_active) VALUES
  ('WELCOME20', '20% off on your first rental', 'percentage', 20, 500, 2000, NOW(), NOW() + INTERVAL '1 year', 1000, 1, TRUE),
  ('FLAT500', 'Flat ₹500 off on rentals above ₹2000', 'fixed', 500, 2000, NULL, NOW(), NOW() + INTERVAL '6 months', 500, 2, TRUE),
  ('WEEKEND30', '30% off on weekend rentals', 'percentage', 30, 1000, 3000, NOW(), NOW() + INTERVAL '3 months', 200, 3, TRUE),
  ('MONSOON15', '15% monsoon season discount', 'percentage', 15, 800, 1500, NOW(), NOW() + INTERVAL '2 months', 300, 2, TRUE);

-- ============================================================
-- HOLIDAYS / SEASONAL PRICING
-- ============================================================

INSERT INTO holidays (name, start_date, end_date, multiplier) VALUES
  ('Diwali Season', '2026-10-15', '2026-10-25', 1.3),
  ('New Year', '2026-12-29', '2027-01-02', 1.5),
  ('Holi', '2026-03-13', '2026-03-16', 1.2),
  ('Summer Vacation', '2026-05-01', '2026-06-15', 1.15);
