-- ============================================================
-- add_parcel_tracking.sql
-- Aligne delivery_requests sur le code applicatif (colonnes que
-- l'API écrit mais absentes du schéma migré), ajoute les policies
-- manquantes (création client, acceptation livreur) et le suivi
-- PUBLIC par numéro via une RPC sans données personnelles.
-- ============================================================

ALTER TABLE public.delivery_requests
  ADD COLUMN IF NOT EXISTS tracking_number     TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS package_type        TEXT,
  ADD COLUMN IF NOT EXISTS package_description TEXT,
  ADD COLUMN IF NOT EXISTS pickup_latitude     NUMERIC,
  ADD COLUMN IF NOT EXISTS pickup_longitude    NUMERIC,
  ADD COLUMN IF NOT EXISTS pickup_contact      TEXT,
  ADD COLUMN IF NOT EXISTS pickup_phone        TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address    TEXT,
  ADD COLUMN IF NOT EXISTS delivery_latitude   NUMERIC,
  ADD COLUMN IF NOT EXISTS delivery_longitude  NUMERIC,
  ADD COLUMN IF NOT EXISTS delivery_contact    TEXT,
  ADD COLUMN IF NOT EXISTS delivery_phone      TEXT,
  ADD COLUMN IF NOT EXISTS estimated_duration  INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_arrival   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method      TEXT;

CREATE INDEX IF NOT EXISTS delivery_req_tracking_idx
  ON public.delivery_requests (tracking_number) WHERE tracking_number IS NOT NULL;

-- L'API écrit delivery_address ; l'ancienne colonne dropoff_address NOT NULL
-- bloquerait toute création
ALTER TABLE public.delivery_requests ALTER COLUMN dropoff_address DROP NOT NULL;

-- Le client crée sa propre demande (l'API POST /api/delivery insère
-- sous la session du client — aucune policy INSERT n'existait)
DROP POLICY IF EXISTS "delivery_req_customer_insert" ON public.delivery_requests;
CREATE POLICY "delivery_req_customer_insert" ON public.delivery_requests
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Le client peut annuler tant que la demande est en attente
DROP POLICY IF EXISTS "delivery_req_customer_update" ON public.delivery_requests;
CREATE POLICY "delivery_req_customer_update" ON public.delivery_requests
  FOR UPDATE USING (auth.uid() = customer_id AND status = 'pending');

-- Un livreur accepte une demande en attente (PUT /api/delivery/[id])
-- puis met à jour SES courses
DROP POLICY IF EXISTS "delivery_req_driver_update" ON public.delivery_requests;
CREATE POLICY "delivery_req_driver_update" ON public.delivery_requests
  FOR UPDATE USING (
    (status = 'pending' AND EXISTS (SELECT 1 FROM public.drivers d WHERE d.user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND d.user_id = auth.uid())
  );

-- Les livreurs en ligne voient les demandes en attente (GET /api/delivery)
DROP POLICY IF EXISTS "delivery_req_pending_select" ON public.delivery_requests;
CREATE POLICY "delivery_req_pending_select" ON public.delivery_requests
  FOR SELECT USING (
    status = 'pending' AND EXISTS (SELECT 1 FROM public.drivers d WHERE d.user_id = auth.uid())
  );

-- ── Suivi public par numéro (sans compte) ────────────────────
-- Ne renvoie AUCUNE donnée personnelle : statut, adresses (déjà des
-- points de repère, pas des identités), estimation et date.
CREATE OR REPLACE FUNCTION public.track_parcel(p_tracking TEXT)
RETURNS TABLE (
  tracking_number   TEXT,
  status            TEXT,
  pickup_address    TEXT,
  delivery_address  TEXT,
  estimated_arrival TIMESTAMPTZ,
  created_at        TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT tracking_number, status, pickup_address,
         COALESCE(delivery_address, dropoff_address),
         estimated_arrival, created_at
  FROM public.delivery_requests
  WHERE tracking_number = UPPER(TRIM(p_tracking))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.track_parcel(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.track_parcel(TEXT) TO authenticated;
