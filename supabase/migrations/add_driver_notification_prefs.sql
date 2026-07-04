-- ================================================================
-- Migration: add notification_prefs to drivers
-- Stores the driver's notification toggles (new missions, earnings,
-- app updates, promotions) as a JSON blob, mirroring vendors.notification_prefs.
-- Run in your Supabase SQL editor AFTER create_drivers_table.sql
-- ================================================================

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT
    '{"newMissions": true, "earnings": true, "appUpdates": false, "promotions": false}'::jsonb;
