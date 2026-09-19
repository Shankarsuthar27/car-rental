-- ============================================================
-- Migration: 005_add_late_charge_24h.sql
-- Add late_charge_24h to vehicles table
-- ============================================================

ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS late_charge_24h DECIMAL(10,2) DEFAULT 1000;

COMMENT ON COLUMN vehicles.late_charge_24h IS 'Flat charge or daily rate applicable when vehicle is returned 24 hours late';
