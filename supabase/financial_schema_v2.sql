-- ================================================================
-- QuickGo Financial Schema v2 — Missing Tables
-- Run AFTER financial_schema.sql in your Supabase SQL editor
-- ================================================================

-- ================================================================
-- 1. PAYOUT CONFIG — configurable payout trigger mode
-- ================================================================
CREATE TABLE IF NOT EXISTS public.payout_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mode TEXT NOT NULL DEFAULT 'manual'
    CHECK (mode IN ('manual', 'auto_time', 'auto_threshold', 'hybrid')),
  auto_time TIME,                          -- ex: '23:00' pour auto_time
  threshold_amount NUMERIC(14, 2),         -- seuil FCFA pour auto_threshold
  commission_rate_default NUMERIC(5, 4) NOT NULL DEFAULT 0.05,
  require_confirmation_above NUMERIC(14, 2), -- montant au-delà duquel confirmation requise (hybride)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payout_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payout config" ON public.payout_config
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Service reads payout config" ON public.payout_config
  FOR SELECT USING (TRUE);

-- Seed default config
INSERT INTO public.payout_config (mode, commission_rate_default, is_active)
VALUES ('manual', 0.05, TRUE)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 2. PAYOUT BATCHES — group payout operations for 60+ vendors
-- ================================================================
CREATE TABLE IF NOT EXISTS public.payout_batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('manual', 'auto')),
  triggered_by_admin UUID REFERENCES auth.users(id),
  total_vendors INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  commission_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  net_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
  failure_reason TEXT,
  completed_vendors INTEGER NOT NULL DEFAULT 0,
  failed_vendors INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payout_batches_status ON public.payout_batches(status);
CREATE INDEX IF NOT EXISTS idx_payout_batches_created ON public.payout_batches(created_at DESC);

ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payout batches" ON public.payout_batches
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Service inserts payout batches" ON public.payout_batches
  FOR INSERT WITH CHECK (TRUE);

-- Lier vendor_payouts à un batch
ALTER TABLE public.vendor_payouts
  ADD COLUMN IF NOT EXISTS payout_batch_id UUID REFERENCES public.payout_batches(id),
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(14, 2);

CREATE INDEX IF NOT EXISTS idx_payouts_batch ON public.vendor_payouts(payout_batch_id);

-- ================================================================
-- 3. DELIVERY RATES — configurable pricing grid (1 000 → 10 000 FCFA)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.delivery_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  conditions JSONB NOT NULL DEFAULT '{}',
  -- conditions typiques : { "poids_max": 2, "zone": "centre", "type_colis": "leger", "express": false }
  priority INTEGER NOT NULL DEFAULT 0, -- ordre d'évaluation des règles
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_admin UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_rates_active ON public.delivery_rates(is_active, priority);

ALTER TABLE public.delivery_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Delivery rates visible to all" ON public.delivery_rates
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins manage delivery rates" ON public.delivery_rates
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

-- Seed grille tarifaire par défaut selon le document d'onboarding
INSERT INTO public.delivery_rates (name, amount, conditions, priority) VALUES
  ('Colis léger - Zone centrale',     1000,  '{"poids_max": 2, "zone": "centre", "express": false}', 10),
  ('Colis standard - Même ville',     2000,  '{"poids_max": 5, "zone": "ville", "express": false}',  20),
  ('Colis volumineux / Périphérie',   3000,  '{"poids_max": 15, "zone": "peripherie", "express": false}', 30),
  ('Inter-quartier éloigné',          5000,  '{"poids_max": 20, "zone": "inter_quartier", "express": false}', 40),
  ('Livraison express / Fragile',     7500,  '{"express": true}', 50),
  ('Inter-ville / Très lourd',        10000, '{"zone": "inter_ville"}', 60)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 4. DELIVERY WALLET — separate account for delivery fees
-- ================================================================
CREATE TABLE IF NOT EXISTS public.delivery_wallet (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  total_collected NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_collected >= 0),
  total_paid_to_drivers NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_paid_to_drivers >= 0),
  available_balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.delivery_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage delivery wallet" ON public.delivery_wallet
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Service updates delivery wallet" ON public.delivery_wallet
  FOR ALL WITH CHECK (TRUE);

-- Seed un enregistrement unique (singleton)
INSERT INTO public.delivery_wallet (total_collected, total_paid_to_drivers, available_balance)
VALUES (0, 0, 0)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 5. ORDER DELIVERY — delivery fee per order + driver status
-- ================================================================
CREATE TABLE IF NOT EXISTS public.order_delivery (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  delivery_rate_id UUID REFERENCES public.delivery_rates(id),
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (delivery_type IN ('standard', 'express', 'pickup')),
  driver_id UUID REFERENCES auth.users(id),
  driver_status TEXT DEFAULT 'unassigned'
    CHECK (driver_status IN ('unassigned', 'assigned', 'picked_up', 'delivered', 'failed')),
  driver_paid BOOLEAN NOT NULL DEFAULT FALSE,
  driver_paid_at TIMESTAMPTZ,
  driver_payment_method TEXT CHECK (driver_payment_method IN ('orange_money', 'mtn_momo', 'cash')),
  driver_payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_delivery_order ON public.order_delivery(order_id);
CREATE INDEX IF NOT EXISTS idx_order_delivery_driver ON public.order_delivery(driver_id);

ALTER TABLE public.order_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage order delivery" ON public.order_delivery
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Drivers see own deliveries" ON public.order_delivery
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Vendors see their order delivery" ON public.order_delivery
  FOR SELECT USING (
    auth.uid() IN (
      SELECT v.owner_id FROM public.vendors v
      JOIN public.orders o ON o.vendor_id = v.id
      WHERE o.id = order_id
    )
  );

CREATE POLICY "Customers see own order delivery" ON public.order_delivery
  FOR SELECT USING (
    auth.uid() IN (
      SELECT customer_id FROM public.orders WHERE id = order_id
    )
  );

-- ================================================================
-- 6. ATOMIC FUNCTION — credit delivery wallet on order payment
-- ================================================================
CREATE OR REPLACE FUNCTION public.credit_delivery_wallet(
  p_delivery_fee NUMERIC
)
RETURNS JSONB AS $$
BEGIN
  UPDATE public.delivery_wallet
  SET
    total_collected = total_collected + p_delivery_fee,
    available_balance = available_balance + p_delivery_fee,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'credited', p_delivery_fee);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 7. ATOMIC FUNCTION — pay driver from delivery wallet
-- ================================================================
CREATE OR REPLACE FUNCTION public.pay_driver_from_delivery_wallet(
  p_driver_id UUID,
  p_amount NUMERIC,
  p_order_delivery_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_wallet public.delivery_wallet;
BEGIN
  SELECT * INTO v_wallet FROM public.delivery_wallet FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Delivery wallet not found');
  END IF;

  IF v_wallet.available_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient delivery wallet balance');
  END IF;

  UPDATE public.delivery_wallet
  SET
    total_paid_to_drivers = total_paid_to_drivers + p_amount,
    available_balance = available_balance - p_amount,
    updated_at = NOW();

  UPDATE public.order_delivery
  SET
    driver_paid = TRUE,
    driver_paid_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_delivery_id;

  RETURN jsonb_build_object('success', true, 'paid_to_driver', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 8. FUNCTION — calculate delivery rate for an order
-- ================================================================
CREATE OR REPLACE FUNCTION public.calculate_delivery_rate(
  p_weight_kg NUMERIC DEFAULT 0,
  p_zone TEXT DEFAULT 'ville',
  p_is_express BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_rate public.delivery_rates;
BEGIN
  -- Express override
  IF p_is_express THEN
    SELECT * INTO v_rate
    FROM public.delivery_rates
    WHERE is_active = TRUE
      AND (conditions->>'express')::boolean = TRUE
    ORDER BY priority ASC
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object('rate_id', v_rate.id, 'amount', v_rate.amount, 'name', v_rate.name);
    END IF;
  END IF;

  -- Match by zone and weight
  IF p_zone = 'inter_ville' THEN
    SELECT * INTO v_rate FROM public.delivery_rates
    WHERE is_active = TRUE AND conditions->>'zone' = 'inter_ville'
    ORDER BY priority ASC LIMIT 1;

  ELSIF p_zone = 'inter_quartier' THEN
    SELECT * INTO v_rate FROM public.delivery_rates
    WHERE is_active = TRUE AND conditions->>'zone' = 'inter_quartier'
    ORDER BY priority ASC LIMIT 1;

  ELSIF p_zone = 'peripherie' THEN
    SELECT * INTO v_rate FROM public.delivery_rates
    WHERE is_active = TRUE AND conditions->>'zone' = 'peripherie'
    ORDER BY priority ASC LIMIT 1;

  ELSIF p_weight_kg <= 2 AND p_zone = 'centre' THEN
    SELECT * INTO v_rate FROM public.delivery_rates
    WHERE is_active = TRUE AND conditions->>'zone' = 'centre'
    ORDER BY priority ASC LIMIT 1;

  ELSE
    SELECT * INTO v_rate FROM public.delivery_rates
    WHERE is_active = TRUE AND conditions->>'zone' = 'ville'
    ORDER BY priority ASC LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No matching delivery rate');
  END IF;

  RETURN jsonb_build_object('rate_id', v_rate.id, 'amount', v_rate.amount, 'name', v_rate.name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 9. ENABLE REALTIME on new tables
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.payout_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_wallet;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_delivery;
