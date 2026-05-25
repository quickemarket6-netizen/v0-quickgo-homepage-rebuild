-- ================================================================
-- QuickGo Financial Architecture — Production Schema
-- Run AFTER schema.sql in your Supabase SQL editor
-- ================================================================

-- ================================================================
-- 1. VENDOR WALLETS — escrow ledger per vendor
-- ================================================================
CREATE TABLE IF NOT EXISTS public.vendor_wallets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE UNIQUE NOT NULL,
  pending_balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  available_balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  withdrawn_balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (withdrawn_balance >= 0),
  total_earned NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_sales INTEGER NOT NULL DEFAULT 0,
  frozen BOOLEAN NOT NULL DEFAULT FALSE,
  freeze_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_wallets_vendor_id ON public.vendor_wallets(vendor_id);

ALTER TABLE public.vendor_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors see own wallet" ON public.vendor_wallets
  FOR SELECT USING (
    auth.uid() IN (SELECT owner_id FROM public.vendors WHERE id = vendor_id)
  );

CREATE POLICY "Admins manage all wallets" ON public.vendor_wallets
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- Auto-create wallet when vendor is created
CREATE OR REPLACE FUNCTION public.create_vendor_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.vendor_wallets (vendor_id)
  VALUES (NEW.id)
  ON CONFLICT (vendor_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_vendor_created_wallet ON public.vendors;
CREATE TRIGGER on_vendor_created_wallet
  AFTER INSERT ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.create_vendor_wallet();

-- ================================================================
-- 2. VENDOR PAYOUT ACCOUNTS — registered mobile money accounts
-- ================================================================
CREATE TABLE IF NOT EXISTS public.vendor_payout_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  payout_method TEXT NOT NULL CHECK (payout_method IN ('orange_money', 'mtn_momo', 'bank_transfer')),
  account_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_accounts_vendor ON public.vendor_payout_accounts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payout_accounts_default ON public.vendor_payout_accounts(vendor_id, is_default);

ALTER TABLE public.vendor_payout_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors manage own payout accounts" ON public.vendor_payout_accounts
  FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM public.vendors WHERE id = vendor_id)
  );

CREATE POLICY "Admins view all payout accounts" ON public.vendor_payout_accounts
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- Ensure only one default per vendor
CREATE OR REPLACE FUNCTION public.enforce_single_default_payout()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.vendor_payout_accounts
    SET is_default = FALSE
    WHERE vendor_id = NEW.vendor_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_default_payout ON public.vendor_payout_accounts;
CREATE TRIGGER enforce_default_payout
  AFTER INSERT OR UPDATE ON public.vendor_payout_accounts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_default_payout();

-- ================================================================
-- 3. VENDOR PAYOUTS — payout requests and processing
-- ================================================================
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  payout_account_id UUID REFERENCES public.vendor_payout_accounts(id),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payout_method TEXT NOT NULL CHECK (payout_method IN ('orange_money', 'mtn_momo', 'bank_transfer')),
  payout_phone TEXT NOT NULL,
  cinetpay_transaction_id TEXT,
  cinetpay_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'failed')),
  rejection_reason TEXT,
  initiated_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_vendor ON public.vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.vendor_payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created ON public.vendor_payouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_idem ON public.vendor_payouts(idempotency_key);

ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors see own payouts" ON public.vendor_payouts
  FOR SELECT USING (
    auth.uid() IN (SELECT owner_id FROM public.vendors WHERE id = vendor_id)
  );

CREATE POLICY "Vendors create own payouts" ON public.vendor_payouts
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT owner_id FROM public.vendors WHERE id = vendor_id)
  );

CREATE POLICY "Admins manage all payouts" ON public.vendor_payouts
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- ================================================================
-- 4. COMMISSION LOGS — immutable financial ledger per order
-- ================================================================
CREATE TABLE IF NOT EXISTS public.commission_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE RESTRICT NOT NULL,
  gross_amount NUMERIC(14, 2) NOT NULL,
  quickgo_commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.07,
  quickgo_commission NUMERIC(14, 2) NOT NULL,
  payment_fees NUMERIC(14, 2) NOT NULL DEFAULT 0,
  delivery_fees NUMERIC(14, 2) NOT NULL DEFAULT 0,
  vendor_net_amount NUMERIC(14, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'held'
    CHECK (status IN ('held', 'released', 'refunded', 'disputed')),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_commission_order ON public.commission_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_commission_vendor ON public.commission_logs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commission_status ON public.commission_logs(status);

ALTER TABLE public.commission_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors see own commissions" ON public.commission_logs
  FOR SELECT USING (
    auth.uid() IN (SELECT owner_id FROM public.vendors WHERE id = vendor_id)
  );

CREATE POLICY "Admins manage commissions" ON public.commission_logs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- ================================================================
-- 5. PAYMENT TRANSACTIONS — CinetPay incoming payments
-- ================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  customer_id UUID REFERENCES auth.users(id),
  payment_provider TEXT NOT NULL DEFAULT 'cinetpay'
    CHECK (payment_provider IN ('cinetpay', 'orange_money', 'mtn_momo', 'wallet', 'cash')),
  transaction_id TEXT UNIQUE,
  provider_reference TEXT,
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XAF',
  status TEXT NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'pending', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_url TEXT,
  raw_response JSONB DEFAULT '{}',
  webhook_received_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_txn_order ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_txn_customer ON public.payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_txn_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_txn_id ON public.payment_transactions(transaction_id);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers see own payments" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Admins view all payments" ON public.payment_transactions
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- Service role insert only (via API route)
CREATE POLICY "Service role insert payments" ON public.payment_transactions
  FOR INSERT WITH CHECK (TRUE);

-- ================================================================
-- 6. PAYOUT AUDIT LOGS — immutable tamper-evident audit trail
-- ================================================================
CREATE TABLE IF NOT EXISTS public.payout_audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  payout_id UUID REFERENCES public.vendor_payouts(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  performed_by_role TEXT,
  amount_at_time NUMERIC(14, 2),
  previous_status TEXT,
  new_status TEXT,
  ip_address TEXT,
  device_info TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_payout ON public.payout_audit_logs(payout_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.payout_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.payout_audit_logs(performed_by);

ALTER TABLE public.payout_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit logs" ON public.payout_audit_logs
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Service inserts audit logs" ON public.payout_audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- ================================================================
-- 7. FINANCIAL NOTIFICATIONS — in-app alerts for financial events
-- ================================================================
CREATE TABLE IF NOT EXISTS public.financial_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'payout_approved', 'payout_rejected', 'payout_completed', 'payout_failed',
    'funds_available', 'funds_held', 'wallet_frozen', 'fraud_alert',
    'payment_received', 'commission_charged'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  amount NUMERIC(14, 2),
  reference_id UUID,
  reference_type TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_notif_user ON public.financial_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_fin_notif_created ON public.financial_notifications(created_at DESC);

ALTER TABLE public.financial_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own financial notifications" ON public.financial_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Mark notifications read" ON public.financial_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service inserts financial notifications" ON public.financial_notifications
  FOR INSERT WITH CHECK (TRUE);

-- ================================================================
-- ATOMIC WALLET UPDATE FUNCTION — prevents race conditions
-- ================================================================
CREATE OR REPLACE FUNCTION public.credit_vendor_pending(
  p_vendor_id UUID,
  p_amount NUMERIC,
  p_order_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_wallet public.vendor_wallets;
BEGIN
  -- Lock the wallet row
  SELECT * INTO v_wallet
  FROM public.vendor_wallets
  WHERE vendor_id = p_vendor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.vendor_wallets (vendor_id, pending_balance, total_earned, total_sales)
    VALUES (p_vendor_id, p_amount, p_amount, 1)
    RETURNING * INTO v_wallet;
  ELSE
    IF v_wallet.frozen THEN
      RETURN jsonb_build_object('success', false, 'error', 'Wallet frozen');
    END IF;

    UPDATE public.vendor_wallets
    SET
      pending_balance = pending_balance + p_amount,
      total_earned = total_earned + p_amount,
      total_sales = total_sales + 1,
      updated_at = NOW()
    WHERE vendor_id = p_vendor_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'pending_balance', v_wallet.pending_balance + p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- RELEASE FUNDS FUNCTION — pending → available after delivery
-- ================================================================
CREATE OR REPLACE FUNCTION public.release_vendor_funds(
  p_vendor_id UUID,
  p_amount NUMERIC,
  p_order_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_wallet public.vendor_wallets;
BEGIN
  SELECT * INTO v_wallet
  FROM public.vendor_wallets
  WHERE vendor_id = p_vendor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF v_wallet.frozen THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet frozen');
  END IF;

  IF v_wallet.pending_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient pending balance');
  END IF;

  UPDATE public.vendor_wallets
  SET
    pending_balance = pending_balance - p_amount,
    available_balance = available_balance + p_amount,
    updated_at = NOW()
  WHERE vendor_id = p_vendor_id;

  -- Update commission log
  UPDATE public.commission_logs
  SET status = 'released', released_at = NOW()
  WHERE order_id = p_order_id AND vendor_id = p_vendor_id;

  RETURN jsonb_build_object('success', true, 'available_balance', v_wallet.available_balance + p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- DEDUCT PAYOUT FUNCTION — atomic available → withdrawn
-- ================================================================
CREATE OR REPLACE FUNCTION public.deduct_vendor_payout(
  p_vendor_id UUID,
  p_amount NUMERIC,
  p_payout_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_wallet public.vendor_wallets;
BEGIN
  SELECT * INTO v_wallet
  FROM public.vendor_wallets
  WHERE vendor_id = p_vendor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF v_wallet.frozen THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet frozen');
  END IF;

  IF v_wallet.available_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient available balance');
  END IF;

  -- Check no duplicate payout already processing
  IF EXISTS (
    SELECT 1 FROM public.vendor_payouts
    WHERE vendor_id = p_vendor_id
      AND status IN ('approved', 'processing')
      AND id != p_payout_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Another payout is already in progress');
  END IF;

  UPDATE public.vendor_wallets
  SET
    available_balance = available_balance - p_amount,
    withdrawn_balance = withdrawn_balance + p_amount,
    updated_at = NOW()
  WHERE vendor_id = p_vendor_id;

  RETURN jsonb_build_object('success', true, 'withdrawn', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- ENABLE REALTIME on financial tables
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_payouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_transactions;

-- ================================================================
-- PROFILES: add wallet_balance column if missing
-- ================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- ================================================================
-- VENDORS: add delivery_fee column if missing
-- ================================================================
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) DEFAULT 500,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5, 4) DEFAULT 0.07;

-- ================================================================
-- REFUND PAYOUT TO AVAILABLE — restores funds if payout fails/rejected
-- ================================================================
CREATE OR REPLACE FUNCTION public.refund_payout_to_available(
  p_vendor_id UUID,
  p_amount NUMERIC
)
RETURNS JSONB AS $$
BEGIN
  UPDATE public.vendor_wallets
  SET
    available_balance = available_balance + p_amount,
    withdrawn_balance = GREATEST(0, withdrawn_balance - p_amount),
    updated_at = NOW()
  WHERE vendor_id = p_vendor_id;

  RETURN jsonb_build_object('success', true, 'refunded', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
