-- ============================================================
-- DRIVEASE CAR RENTAL - SEED DATA
-- Run this in Supabase SQL Editor after 001, 002, and 003
-- ============================================================

-- 1. BRANCHES
INSERT INTO branches (id, name, slug, city, state, address, pincode, phone, email, opening_time, closing_time, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Jaipur Main Branch', 'jaipur-main', 'Jaipur', 'Rajasthan', 'C-Scheme, Ashok Marg, Jaipur', '302001', '+91-141-2345678', 'jaipur@driveease.in', '08:00', '22:00', true),
  ('22222222-2222-2222-2222-222222222222', 'Jodhpur Branch', 'jodhpur-branch', 'Jodhpur', 'Rajasthan', 'Paota Circle, High Court Road, Jodhpur', '342001', '+91-291-2345678', 'jodhpur@driveease.in', '08:00', '21:00', true),
  ('33333333-3333-3333-3333-333333333333', 'Udaipur City Center', 'udaipur-city', 'Udaipur', 'Rajasthan', 'Sukhadia Circle, Panchwati, Udaipur', '313001', '+91-294-2345678', 'udaipur@driveease.in', '08:00', '21:00', true),
  ('44444444-4444-4444-4444-444444444444', 'Ahmedabad SG Highway', 'ahmedabad-sg', 'Ahmedabad', 'Gujarat', 'SG Highway, Bodakdev, Ahmedabad', '380054', '+91-79-2345678', 'ahmedabad@driveease.in', '08:00', '22:00', true)
ON CONFLICT (id) DO NOTHING;

-- 2. VEHICLES
INSERT INTO vehicles (
  id, branch_id, brand, model, variant, year, registration_number,
  vehicle_type, fuel_type, transmission, seating_capacity, color,
  hourly_rate, daily_rate, weekly_rate, monthly_rate, security_deposit, extra_km_charge, included_km_per_day,
  status, is_active, description, features
) VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Hyundai', 'Creta', 'SX(O) Turbo', 2024, 'RJ14-CR-2024',
    'suv', 'petrol', 'automatic', 5, 'Abyss Black',
    180.00, 2200.00, 13800.00, 48000.00, 10000.00, 12.00, 200,
    'available', true,
    'Premium compact SUV with panoramic sunroof, ventilated seats, Bose audio, and smooth 7-speed DCT transmission.',
    '["Panoramic Sunroof", "Ventilated Seats", "Bose 8-Speaker Audio", "Wireless Apple CarPlay / Android Auto", "ADAS Level 2", "Automatic Climate Control", "Cruise Control"]'
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Mahindra', 'Thar ROXX', 'AX7L 4x4', 2024, 'RJ14-TR-2024',
    'suv', 'diesel', 'automatic', 5, 'Stealth Black',
    250.00, 3200.00, 19900.00, 68000.00, 15000.00, 15.00, 250,
    'available', true,
    'The iconic 5-door off-roader with 4x4 capability, dual sunroof, and Harman Kardon acoustics. Ideal for desert and mountain expeditions.',
    '["4x4 with Terrain Modes", "Panoramic Sunroof", "Harman Kardon Audio", "Level 2 ADAS", "Ventilated Leather Seats", "Electronic Locking Differential"]'
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'Toyota', 'Innova Crysta', '2.4 ZX 7-Str', 2023, 'RJ27-IC-2023',
    'muv', 'diesel', 'automatic', 7, 'Pearl White',
    220.00, 2800.00, 17500.00, 60000.00, 12000.00, 14.00, 250,
    'available', true,
    'Unmatched comfort and luxury for family road trips. Captain seats, plush leather interiors, and unmatched reliability.',
    '["Captain Seats with Ottoman", "Rear Automatic AC", "Plush Leather Upholstery", "7 Airbags", "Cruise Control", "Ambient Lighting"]'
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Tata', 'Nexon.ev', 'Empowered Plus LR', 2024, 'RJ14-EV-2024',
    'electric', 'electric', 'automatic', 5, 'Daytona Grey',
    160.00, 1900.00, 11800.00, 42000.00, 8000.00, 10.00, 300,
    'available', true,
    'Long-range electric SUV with 465 km ARAI range, ultra-quiet cabin, JBL cinematic sound, and rapid DC fast-charging.',
    '["45 kWh Long Range Battery", "V2L & V2V Charging", "360-Degree Camera", "Wireless Phone Charging", "Blind Spot View Monitor", "Electronic Parking Brake"]'
  ),
  (
    'a5555555-5555-5555-5555-555555555555',
    '44444444-4444-4444-4444-444444444444',
    'BMW', '3 Series Gran Limousine', '330Li M Sport', 2024, 'GJ01-BM-2024',
    'luxury', 'petrol', 'automatic', 5, 'Portimao Blue',
    500.00, 6500.00, 42000.00, 145000.00, 25000.00, 25.00, 200,
    'available', true,
    'Executive luxury sedan with extended wheelbase, panoramic glass roof, 258 hp turbocharged engine, and BMW curved display.',
    '["Extended Wheelbase Legroom", "BMW Curved Live Cockpit", "Harman Kardon Surround Sound", "Panoramic Glass Sunroof", "Adaptive LED Headlights", "Launch Control"]'
  ),
  (
    'a6666666-6666-6666-6666-666666666666',
    '22222222-2222-2222-2222-222222222222',
    'Maruti Suzuki', 'Swift', 'ZXi Plus AMT', 2024, 'RJ19-SW-2024',
    'hatchback', 'petrol', 'automatic', 5, 'Sizzling Red',
    100.00, 1200.00, 7500.00, 26000.00, 5000.00, 9.00, 200,
    'available', true,
    'Zippy, efficient, and effortless city hatchback with 24.8 km/l mileage, 9-inch SmartPlay Pro+ touchscreen, and 6 airbags standard.',
    '["6 Airbags Standard", "Wireless Android Auto / Apple CarPlay", "Keyless Push Button Start", "Cruise Control", "LED Projector Headlamps"]'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. VEHICLE IMAGES
INSERT INTO vehicle_images (id, vehicle_id, url, is_primary, sort_order)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80', true, 0),
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80', true, 0),
  ('b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80', true, 0),
  ('b4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80', true, 0),
  ('b5555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80', true, 0),
  ('b6666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80', true, 0)
ON CONFLICT (id) DO NOTHING;

-- 4. PRICING PLANS
INSERT INTO pricing_plans (id, name, description, is_default, is_active, partial_period_rule, grace_period_minutes)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Standard Tariff Plan', 'Default standard retail rates with weekend surge and partial hour round-up policy', true, true, 'round_up_hour', 30),
  ('c2222222-2222-2222-2222-222222222222', 'Weekend Festive Plan', 'Weekend multiplier tariff with 25% surge on luxury/SUV models', false, true, 'round_up_hour', 30)
ON CONFLICT (id) DO NOTHING;

-- 5. COUPONS
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_rental_amount, max_discount, usage_limit, is_active)
VALUES
  ('d1111111-1111-1111-1111-111111111111', 'WELCOME20', '20% off on your first rental reservation', 'percentage', 20.00, 500.00, 2000.00, 1000, true),
  ('d2222222-2222-2222-2222-222222222222', 'FLAT500', 'Flat ₹500 instant discount on bookings above ₹2,000', 'fixed', 500.00, 2000.00, 500.00, 500, true),
  ('d3333333-3333-3333-3333-333333333333', 'WEEKEND30', '30% off on weekend SUV rentals', 'percentage', 30.00, 1000.00, 3000.00, 200, true)
ON CONFLICT (id) DO NOTHING;

-- 6. SETTINGS
INSERT INTO settings (id, key, value, description, is_public)
VALUES
  ('e1111111-1111-1111-1111-111111111111', 'company_profile', '{"name": "DriveEase Mobility Solutions", "tagline": "Drive Your Way, Every Day", "gstin": "08ABCDE1234F1Z5", "email": "support@driveease.in", "phone": "+91-141-2345678", "address": "C-Scheme, Ashok Marg, Jaipur, Rajasthan 302001"}', 'Company details and GSTIN', true),
  ('e2222222-2222-2222-2222-222222222222', 'rental_policy', '{"partial_period_rule": "round_up_hour", "return_grace_period_minutes": 30, "advance_payment_percentage": 30, "tax_rate": 18, "weekend_multiplier": 1.25}', 'Pricing calculation rules', true)
ON CONFLICT (id) DO NOTHING;
