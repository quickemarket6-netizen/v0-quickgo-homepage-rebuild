-- ================================================================
-- Migration: real-time tracking
-- ================================================================

-- ── GPS columns on drivers ────────────────────────────────────────────────────
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS current_latitude    NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS current_longitude   NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_drivers_location
  ON public.drivers(current_latitude, current_longitude)
  WHERE current_latitude IS NOT NULL;

-- ── Tracking events ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tracking_events (
  id          UUID         DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id    UUID         NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id   UUID         REFERENCES public.drivers(id) ON DELETE SET NULL,
  event_type  TEXT         NOT NULL
                           CHECK (event_type IN (
                             'status_change', 'location_update',
                             'pickup', 'delivery_attempt', 'delivered', 'message'
                           )),
  status      TEXT,
  lat         NUMERIC(10,7),
  lng         NUMERIC(10,7),
  note        TEXT,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_order_id
  ON public.tracking_events(order_id, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracking_events_customer_read" ON public.tracking_events
;
CREATE POLICY "tracking_events_customer_read" ON public.tracking_events
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tracking_events_driver_insert" ON public.tracking_events
;
CREATE POLICY "tracking_events_driver_insert" ON public.tracking_events
  FOR INSERT WITH CHECK (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tracking_events_admin_all" ON public.tracking_events
;
CREATE POLICY "tracking_events_admin_all" ON public.tracking_events
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')
    )
  );

-- ── Auto-log trigger on order status change ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.tracking_events (order_id, driver_id, event_type, status)
    VALUES (NEW.id, NEW.driver_id, 'status_change', NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_status_tracking ON public.orders;
CREATE TRIGGER orders_status_tracking
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- ── Realtime ──────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- tracking_events to realtime (safe idempotent)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'tracking_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_events;
  END IF;
END $$;
