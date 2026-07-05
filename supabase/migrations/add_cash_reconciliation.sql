-- ============================================================
-- add_cash_reconciliation.sql
-- Réconciliation du cash livreur (paiement à la livraison) :
--   - drivers.cash_on_hand : espèces détenues par le livreur
--   - driver_cash_events   : journal (collectes, remises, ajustements)
--   - RPC adjust_driver_cash : mutation atomique du solde
-- ============================================================

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS cash_on_hand NUMERIC(12,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.driver_cash_events (
  id            UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id     UUID          NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  order_id      UUID          REFERENCES public.orders(id) ON DELETE SET NULL,
  type          TEXT          NOT NULL CHECK (type IN ('collection', 'remittance', 'adjustment')),
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  balance_after NUMERIC(12,2),
  -- collections : confirmées d'office ; remises : pending → confirmed/rejected par un admin
  status        TEXT          NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  method        TEXT          CHECK (method IN ('cash_deposit', 'orange_money', 'mtn_momo')),
  note          TEXT,
  created_by    UUID          REFERENCES auth.users(id),
  reviewed_by   UUID          REFERENCES auth.users(id),
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS driver_cash_events_driver_idx ON public.driver_cash_events (driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS driver_cash_events_status_idx ON public.driver_cash_events (status) WHERE status = 'pending';

ALTER TABLE public.driver_cash_events ENABLE ROW LEVEL SECURITY;

-- Le livreur voit son propre journal
DROP POLICY IF EXISTS "cash_events_driver_select" ON public.driver_cash_events;
CREATE POLICY "cash_events_driver_select" ON public.driver_cash_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND d.user_id = auth.uid())
  );

-- Le livreur peut déclarer une remise (pending uniquement, pour lui-même)
DROP POLICY IF EXISTS "cash_events_driver_insert" ON public.driver_cash_events;
CREATE POLICY "cash_events_driver_insert" ON public.driver_cash_events
  FOR INSERT WITH CHECK (
    type = 'remittance' AND status = 'pending'
    AND EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND d.user_id = auth.uid())
  );

-- Les admins gèrent tout
DROP POLICY IF EXISTS "cash_events_admin_all" ON public.driver_cash_events;
CREATE POLICY "cash_events_admin_all" ON public.driver_cash_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Mutation atomique du cash en main (verrou de ligne côté Postgres).
-- p_amount positif = collecte ; négatif = remise confirmée / ajustement.
CREATE OR REPLACE FUNCTION public.adjust_driver_cash(
  p_driver_id UUID,
  p_amount    NUMERIC
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new NUMERIC;
BEGIN
  UPDATE public.drivers
  SET cash_on_hand = cash_on_hand + p_amount
  WHERE id = p_driver_id
  RETURNING cash_on_hand INTO v_new;

  IF v_new IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Livreur introuvable');
  END IF;
  IF v_new < 0 THEN
    RAISE EXCEPTION 'cash_on_hand ne peut pas être négatif (%.2f)', v_new;
  END IF;

  RETURN jsonb_build_object('success', true, 'balance', v_new);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
