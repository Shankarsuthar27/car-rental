-- ============================================================
-- Migration: 006_update_24h_km_limit_300.sql
-- Set default 24-hour rate kilometer limit to 300 km
-- ============================================================

ALTER TABLE vehicles 
ALTER COLUMN included_km_per_day SET DEFAULT 300;

UPDATE vehicles 
SET included_km_per_day = 300 
WHERE included_km_per_day IS NULL OR included_km_per_day = 200;

COMMENT ON COLUMN vehicles.included_km_per_day IS 'Kilometers included per 24-hour rate / day (standard 300 km limit). Extra km billed at extra_km_charge.';
