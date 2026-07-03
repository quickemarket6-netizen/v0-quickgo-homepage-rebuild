-- ================================================================
-- Migration: create drivers table
-- Run in your Supabase SQL editor AFTER schema.sql
-- ================================================================

CREATE TABLE IF NOT EXISTS public.drivers (
  id             UUID         DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID         REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  status         TEXT         NOT NULL DEFAULT 'offline'
                              CHECK (status IN ('online', 'delivering', 'offline', 'suspended')),
  vehicle_type   TEXT         CHECK (vehicle_type IN ('moto', 'voiture', 'velo', 'tricycle')),
  vehicle_brand  TEXT,
  vehicle_model  TEXT,
  license_plate  TEXT         UNIQUE,
  rating         NUMERIC(3,2) DEFAULT 0   CHECK (rating >= 0 AND rating <= 5),
  total_deliveries INTEGER    DEFAULT 0   CHECK (total_deliveries >= 0),
  total_earnings NUMERIC(14,2) DEFAULT 0  CHECK (total_earnings >= 0),
  city           TEXT,
  is_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_drivers_status   ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id  ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_city     ON public.drivers(city);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all drivers" ON public.drivers
;
CREATE POLICY "Admins manage all drivers" ON public.drivers
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Drivers see own record" ON public.drivers
;
CREATE POLICY "Drivers see own record" ON public.drivers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Drivers update own status" ON public.drivers
;
CREATE POLICY "Drivers update own status" ON public.drivers
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Auto-update timestamp ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_drivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS drivers_updated_at ON public.drivers;
CREATE TRIGGER drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_drivers_updated_at();

-- ── Realtime ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
