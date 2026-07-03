-- ============================================================
-- add_driver_missions_tables.sql
-- Tables: driver_missions, driver_mission_progress,
--         delivery_requests
-- Columns: drivers (is_online, location, license_number),
--          orders (actual_delivery_time)
-- ============================================================

-- ── DRIVER MISSIONS (admin-defined gamification challenges) ──

CREATE TABLE IF NOT EXISTS public.driver_missions (
  id            UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  title         TEXT          NOT NULL,
  description   TEXT,
  mission_type  TEXT          NOT NULL DEFAULT 'deliveries_count'
                              CHECK (mission_type IN (
                                'deliveries_count',
                                'earnings_target',
                                'zone_coverage',
                                'rating_maintain'
                              )),
  target_count  INTEGER       NOT NULL DEFAULT 5,
  target_amount NUMERIC(12,2),       -- for earnings_target type
  reward_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  difficulty    TEXT          NOT NULL DEFAULT 'easy'
                              CHECK (difficulty IN ('easy', 'medium', 'hard')),
  zone          TEXT,                -- optional city/zone restriction
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  valid_from    TIMESTAMPTZ   DEFAULT NOW(),
  valid_until   TIMESTAMPTZ   NOT NULL,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.driver_missions ENABLE ROW LEVEL SECURITY;

-- All drivers can read active missions
DROP POLICY IF EXISTS "driver_missions_read" ON public.driver_missions
;
CREATE POLICY "driver_missions_read" ON public.driver_missions
  FOR SELECT USING (is_active = TRUE AND valid_until > NOW());

-- Only admins write missions
DROP POLICY IF EXISTS "driver_missions_admin_write" ON public.driver_missions
;
CREATE POLICY "driver_missions_admin_write" ON public.driver_missions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

DROP TRIGGER IF EXISTS trg_driver_missions_updated_at ON public.driver_missions;
CREATE TRIGGER trg_driver_missions_updated_at
  BEFORE UPDATE ON public.driver_missions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── DRIVER MISSION PROGRESS ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.driver_mission_progress (
  id            UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id     UUID        NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  mission_id    UUID        NOT NULL REFERENCES public.driver_missions(id) ON DELETE CASCADE,
  current_count INTEGER     NOT NULL DEFAULT 0,
  is_completed  BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  reward_paid   BOOLEAN     NOT NULL DEFAULT FALSE,
  reward_paid_at TIMESTAMPTZ,
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (driver_id, mission_id)
);

ALTER TABLE public.driver_mission_progress ENABLE ROW LEVEL SECURITY;

-- Drivers see their own progress
DROP POLICY IF EXISTS "mission_progress_owner_select" ON public.driver_mission_progress
;
CREATE POLICY "mission_progress_owner_select" ON public.driver_mission_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "mission_progress_owner_insert" ON public.driver_mission_progress
;
CREATE POLICY "mission_progress_owner_insert" ON public.driver_mission_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.user_id = auth.uid()
    )
  );

-- Admins see and update everything (for reward payout)
DROP POLICY IF EXISTS "mission_progress_admin_all" ON public.driver_mission_progress
;
CREATE POLICY "mission_progress_admin_all" ON public.driver_mission_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS mission_progress_driver_idx ON public.driver_mission_progress (driver_id);
CREATE INDEX IF NOT EXISTS mission_progress_completed_idx
  ON public.driver_mission_progress (mission_id, is_completed);

-- Auto-complete mission when count reaches target
CREATE OR REPLACE FUNCTION public.check_mission_completion()
RETURNS TRIGGER AS $$
DECLARE
  target INT;
BEGIN
  SELECT target_count INTO target
  FROM public.driver_missions WHERE id = NEW.mission_id;

  IF NEW.current_count >= target AND NOT NEW.is_completed THEN
    NEW.is_completed := TRUE;
    NEW.completed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_mission_completion ON public.driver_mission_progress;
CREATE TRIGGER trg_check_mission_completion
  BEFORE INSERT OR UPDATE OF current_count ON public.driver_mission_progress
  FOR EACH ROW EXECUTE FUNCTION public.check_mission_completion();

ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_mission_progress;

-- ── DELIVERY REQUESTS (express/on-demand deliveries) ─────────

CREATE TABLE IF NOT EXISTS public.delivery_requests (
  id           UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id     UUID          REFERENCES public.orders(id) ON DELETE SET NULL,
  driver_id    UUID          REFERENCES public.drivers(id) ON DELETE SET NULL,
  customer_id  UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  pickup_address   TEXT      NOT NULL,
  dropoff_address  TEXT      NOT NULL,
  pickup_lat       NUMERIC,
  pickup_lng       NUMERIC,
  dropoff_lat      NUMERIC,
  dropoff_lng      NUMERIC,
  distance_km      NUMERIC(6,2),
  price            NUMERIC(12,2) NOT NULL DEFAULT 0,
  status       TEXT          NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','accepted','rejected','picked_up','delivered','cancelled')),
  notes        TEXT,
  created_at   TIMESTAMPTZ   DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_req_owner_select" ON public.delivery_requests
;
CREATE POLICY "delivery_req_owner_select" ON public.delivery_requests
  FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "delivery_req_driver_select" ON public.delivery_requests
;
CREATE POLICY "delivery_req_driver_select" ON public.delivery_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = driver_id AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delivery_req_admin_all" ON public.delivery_requests
;
CREATE POLICY "delivery_req_admin_all" ON public.delivery_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS delivery_req_driver_idx   ON public.delivery_requests (driver_id, status);
CREATE INDEX IF NOT EXISTS delivery_req_customer_idx ON public.delivery_requests (customer_id);

DROP TRIGGER IF EXISTS trg_delivery_requests_updated_at ON public.delivery_requests;
CREATE TRIGGER trg_delivery_requests_updated_at
  BEFORE UPDATE ON public.delivery_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_requests;

-- ── PATCH drivers — missing columns ─────────────────────────

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS is_online           BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_latitude    NUMERIC,
  ADD COLUMN IF NOT EXISTS current_longitude   NUMERIC,
  ADD COLUMN IF NOT EXISTS license_number      TEXT;

-- Online drivers can be found by geo queries
CREATE INDEX IF NOT EXISTS drivers_online_idx ON public.drivers (is_online)
  WHERE is_online = TRUE;

-- ── PATCH orders — missing column ───────────────────────────

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMPTZ;

-- ── RPC: increment driver delivery count safely ──────────────

CREATE OR REPLACE FUNCTION public.increment_driver_deliveries(p_driver_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.drivers
  SET total_deliveries = total_deliveries + 1,
      updated_at       = NOW()
  WHERE id = p_driver_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: increment mission progress ─────────────────────────
-- Called after each successful delivery to auto-advance challenges

CREATE OR REPLACE FUNCTION public.advance_driver_missions(p_driver_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.driver_mission_progress dmp
  SET current_count = current_count + 1
  FROM public.driver_missions dm
  WHERE dmp.mission_id   = dm.id
    AND dmp.driver_id    = p_driver_id
    AND dmp.is_completed = FALSE
    AND dm.is_active     = TRUE
    AND dm.valid_until   > NOW()
    AND dm.mission_type  = 'deliveries_count';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
