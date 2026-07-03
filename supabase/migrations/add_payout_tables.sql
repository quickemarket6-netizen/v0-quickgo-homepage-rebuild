-- ============================================================
-- add_payout_tables.sql
-- Tables: vendor_wallets, vendor_payouts, vendor_payout_accounts,
--         commission_logs, financial_notifications, payout_audit_logs
-- RPCs:   credit_vendor_pending, release_vendor_funds,
--         deduct_vendor_payout, refund_payout_to_available
-- ============================================================

-- ── VENDOR WALLETS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vendor_wallets (
  id                UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id         UUID          UNIQUE NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  available_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  pending_balance   NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_earned      NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_withdrawn   NUMERIC(14,2) NOT NULL DEFAULT 0,
  frozen            BOOLEAN       NOT NULL DEFAULT FALSE,
  freeze_reason     TEXT,
  next_payout_date  TIMESTAMPTZ,
  next_payout_amount NUMERIC(14,2),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.vendor_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_owner_select" ON public.vendor_wallets
;
CREATE POLICY "wallet_owner_select" ON public.vendor_wallets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "wallet_admin_all" ON public.vendor_wallets
;
CREATE POLICY "wallet_admin_all" ON public.vendor_wallets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP TRIGGER IF EXISTS trg_vendor_wallets_updated_at ON public.vendor_wallets;
CREATE TRIGGER trg_vendor_wallets_updated_at
  BEFORE UPDATE ON public.vendor_wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── VENDOR PAYOUT ACCOUNTS ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vendor_payout_accounts (
  id         UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id  UUID    NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  method     TEXT    NOT NULL CHECK (method IN ('orange_money','mtn_momo','wave','bank')),
  phone      TEXT,
  account_number TEXT,
  account_name   TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vendor_payout_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payout_accounts_owner" ON public.vendor_payout_accounts
;
CREATE POLICY "payout_accounts_owner" ON public.vendor_payout_accounts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "payout_accounts_admin" ON public.vendor_payout_accounts
;
CREATE POLICY "payout_accounts_admin" ON public.vendor_payout_accounts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- ── VENDOR PAYOUTS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id                      UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- Owner: vendor OR driver (mutually exclusive)
  vendor_id               UUID          REFERENCES public.vendors(id) ON DELETE SET NULL,
  driver_id               UUID          REFERENCES public.drivers(id) ON DELETE SET NULL,
  owner_type              TEXT          NOT NULL DEFAULT 'vendor'
                                        CHECK (owner_type IN ('vendor','driver')),
  owner_name              TEXT,          -- denormalised for display
  amount                  NUMERIC(14,2) NOT NULL,
  payout_method           TEXT          NOT NULL
                                        CHECK (payout_method IN ('orange_money','mtn_momo','wave','cinetpay','bank')),
  payout_phone            TEXT          NOT NULL,
  payout_account_id       UUID          REFERENCES public.vendor_payout_accounts(id) ON DELETE SET NULL,
  -- Status lifecycle: pending → approved → processing → completed | failed | rejected
  status                  TEXT          NOT NULL DEFAULT 'pending'
                                        CHECK (status IN ('pending','approved','processing','completed','failed','rejected')),
  initiated_by_admin      BOOLEAN       NOT NULL DEFAULT FALSE,
  idempotency_key         TEXT          UNIQUE,
  -- Admin approval
  approved_by             UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at             TIMESTAMPTZ,
  -- CinetPay transfer tracking
  cinetpay_transaction_id TEXT,
  cinetpay_reference      TEXT,
  -- Failure / rejection
  failure_reason          TEXT,
  rejection_reason        TEXT,
  -- Timing
  processed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ   DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payouts_owner_select" ON public.vendor_payouts
;
CREATE POLICY "payouts_owner_select" ON public.vendor_payouts
  FOR SELECT USING (
    (owner_type = 'vendor' AND EXISTS (
      SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()
    ))
    OR
    (owner_type = 'driver' AND EXISTS (
      SELECT 1 FROM public.drivers d WHERE d.id = driver_id AND d.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "payouts_owner_insert" ON public.vendor_payouts
;
CREATE POLICY "payouts_owner_insert" ON public.vendor_payouts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "payouts_admin_all" ON public.vendor_payouts
;
CREATE POLICY "payouts_admin_all" ON public.vendor_payouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE INDEX IF NOT EXISTS payouts_status_idx    ON public.vendor_payouts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS payouts_vendor_idx    ON public.vendor_payouts (vendor_id);
CREATE INDEX IF NOT EXISTS payouts_driver_idx    ON public.vendor_payouts (driver_id);
CREATE INDEX IF NOT EXISTS payouts_cinetpay_idx  ON public.vendor_payouts (cinetpay_transaction_id);

DROP TRIGGER IF EXISTS trg_vendor_payouts_updated_at ON public.vendor_payouts;
CREATE TRIGGER trg_vendor_payouts_updated_at
  BEFORE UPDATE ON public.vendor_payouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_payouts;

-- ── COMMISSION LOGS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.commission_logs (
  id                     UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id               UUID          REFERENCES public.orders(id) ON DELETE SET NULL,
  vendor_id              UUID          NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  gross_amount           NUMERIC(14,2) NOT NULL,
  quickgo_commission_rate NUMERIC(6,4) NOT NULL,
  quickgo_commission     NUMERIC(14,2) NOT NULL,
  payment_fees           NUMERIC(14,2) NOT NULL DEFAULT 0,
  delivery_fees          NUMERIC(14,2) NOT NULL DEFAULT 0,
  vendor_net_amount      NUMERIC(14,2) NOT NULL,
  status                 TEXT          NOT NULL DEFAULT 'held'
                                       CHECK (status IN ('held','released','cancelled')),
  released_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.commission_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "commission_admin_all" ON public.commission_logs
;
CREATE POLICY "commission_admin_all" ON public.commission_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP POLICY IF EXISTS "commission_vendor_select" ON public.commission_logs
;
CREATE POLICY "commission_vendor_select" ON public.commission_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS commission_vendor_idx ON public.commission_logs (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS commission_order_idx  ON public.commission_logs (order_id);

-- ── FINANCIAL NOTIFICATIONS ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.financial_notifications (
  id             UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           TEXT        NOT NULL,
  title          TEXT        NOT NULL,
  message        TEXT,
  amount         NUMERIC(14,2),
  reference_id   TEXT,
  reference_type TEXT,
  is_read        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financial_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fin_notif_owner_select" ON public.financial_notifications
;
CREATE POLICY "fin_notif_owner_select" ON public.financial_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "fin_notif_owner_update" ON public.financial_notifications
;
CREATE POLICY "fin_notif_owner_update" ON public.financial_notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "fin_notif_service_insert" ON public.financial_notifications
;
CREATE POLICY "fin_notif_service_insert" ON public.financial_notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "fin_notif_admin_all" ON public.financial_notifications
;
CREATE POLICY "fin_notif_admin_all" ON public.financial_notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE INDEX IF NOT EXISTS fin_notif_user_idx ON public.financial_notifications (user_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_notifications;

-- ── PAYOUT AUDIT LOGS ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payout_audit_logs (
  id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  payout_id       UUID        NOT NULL REFERENCES public.vendor_payouts(id) ON DELETE CASCADE,
  action          TEXT        NOT NULL,
  performed_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_at_time  NUMERIC(14,2),
  previous_status TEXT,
  new_status      TEXT,
  ip_address      TEXT,
  metadata        JSONB       DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payout_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.payout_audit_logs
;
CREATE POLICY "audit_logs_admin_select" ON public.payout_audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP POLICY IF EXISTS "audit_logs_service_insert" ON public.payout_audit_logs
;
CREATE POLICY "audit_logs_service_insert" ON public.payout_audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS audit_payout_idx ON public.payout_audit_logs (payout_id, created_at DESC);

-- ════════════════════════════════════════════════════════════════
-- ATOMIC RPCs  (SECURITY DEFINER = bypass RLS, run as DB owner)
-- ════════════════════════════════════════════════════════════════

-- 1. Credit pending balance when an order is paid
CREATE OR REPLACE FUNCTION public.credit_vendor_pending(
  p_vendor_id UUID,
  p_amount    NUMERIC,
  p_order_id  UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.vendor_wallets (vendor_id, pending_balance, total_earned)
  VALUES (p_vendor_id, p_amount, p_amount)
  ON CONFLICT (vendor_id) DO UPDATE
    SET pending_balance = vendor_wallets.pending_balance + p_amount,
        total_earned    = vendor_wallets.total_earned + p_amount,
        updated_at      = NOW();

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. Release pending → available after delivery confirmation
CREATE OR REPLACE FUNCTION public.release_vendor_funds(
  p_vendor_id         UUID,
  p_amount            NUMERIC,
  p_commission_log_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.vendor_wallets
  SET pending_balance   = GREATEST(0, pending_balance - p_amount),
      available_balance = available_balance + p_amount,
      updated_at        = NOW()
  WHERE vendor_id = p_vendor_id;

  UPDATE public.commission_logs
  SET status = 'released', released_at = NOW()
  WHERE id = p_commission_log_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. Deduct available balance when payout is approved
CREATE OR REPLACE FUNCTION public.deduct_vendor_payout(
  p_vendor_id UUID,
  p_amount    NUMERIC
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT available_balance INTO v_balance
  FROM public.vendor_wallets
  WHERE vendor_id = p_vendor_id
  FOR UPDATE;           -- row lock prevents concurrent deductions

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Solde insuffisant: %.0f FCFA disponible, %.0f FCFA demandé', v_balance, p_amount));
  END IF;

  UPDATE public.vendor_wallets
  SET available_balance = available_balance - p_amount,
      total_withdrawn   = total_withdrawn + p_amount,
      updated_at        = NOW()
  WHERE vendor_id = p_vendor_id;

  RETURN jsonb_build_object('success', true, 'new_balance', v_balance - p_amount);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. Refund to available when CinetPay transfer fails
CREATE OR REPLACE FUNCTION public.refund_payout_to_available(
  p_vendor_id UUID,
  p_amount    NUMERIC,
  p_payout_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.vendor_wallets
  SET available_balance = available_balance + p_amount,
      total_withdrawn   = GREATEST(0, total_withdrawn - p_amount),
      updated_at        = NOW()
  WHERE vendor_id = p_vendor_id;
END;
$$;

-- ── Auto-create vendor_wallet on vendor creation ──────────────

CREATE OR REPLACE FUNCTION public.create_vendor_wallet()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.vendor_wallets (vendor_id)
  VALUES (NEW.id)
  ON CONFLICT (vendor_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_vendor_wallet ON public.vendors;
CREATE TRIGGER trg_create_vendor_wallet
  AFTER INSERT ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.create_vendor_wallet();
