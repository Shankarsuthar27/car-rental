-- Upsert JSD — Jalore Self Drive Car Rental business identity and default rental/fee rules
INSERT INTO settings (key, value, description, is_public)
VALUES (
  'company_profile',
  '{
    "name": "Jalore Self Drive Car Rental",
    "tagline": "Premium Fleet & Self-Drive Car Rental",
    "gstin": "08ABCDE1234F1Z5",
    "currency": "INR (₹)",
    "email": "Jalorecarrental@gmail.com",
    "phone": "+91-2973-222333",
    "address": "Near Bus Stand, Collectorate Road, Jalore, Rajasthan 343001"
  }'::jsonb,
  'Company details, brand identity, and GSTIN',
  true
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();

INSERT INTO settings (key, value, description, is_public)
VALUES (
  'rental_policy',
  '{
    "default_daily_rate": 2200,
    "default_hourly_rate": 180,
    "default_deposit": 10000,
    "late_fee_per_hour": 200,
    "extra_km_charge": 14,
    "return_grace_period_minutes": 30,
    "tax_rate": 18,
    "weekend_multiplier": 1.25,
    "partial_period_rule": "round_up_hour",
    "advance_payment_percentage": 30
  }'::jsonb,
  'Pricing calculation rules and default rental fees',
  true
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public,
  updated_at = NOW();
