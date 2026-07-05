-- ============================================================
-- add_referrals.sql
-- Programme de parrainage branché au wallet :
--   - profiles.referral_code / referred_by
--   - table referrals (un filleul = une ligne, pending → rewarded)
--   - RPC claim_referral  : rattache un filleul à son parrain
--   - RPC reward_referral : crédite le parrain à la 1re commande
--     livrée du filleul (appelée par la confirmation de livraison)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   UUID REFERENCES auth.users(id);

CREATE TABLE IF NOT EXISTS public.referrals (
  id            UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id   UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id   UUID          NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rewarded')),
  reward_amount NUMERIC(10,2) NOT NULL DEFAULT 1000,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  rewarded_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals (referrer_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_referrer_select" ON public.referrals;
CREATE POLICY "referrals_referrer_select" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- ── Rattachement filleul → parrain ───────────────────────────
-- Appelée par le filleul lui-même juste après son inscription.
-- Garde-fous : code valide, pas d'auto-parrainage, une seule fois,
-- compte de moins de 30 jours (évite le rattachement opportuniste
-- de vieux comptes), et aucune commande déjà passée.
CREATE OR REPLACE FUNCTION public.claim_referral(p_code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_referrer UUID;
  v_me       UUID := auth.uid();
  v_created  TIMESTAMPTZ;
BEGIN
  IF v_me IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  SELECT id INTO v_referrer FROM public.profiles
  WHERE referral_code = UPPER(TRIM(p_code));
  IF v_referrer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code de parrainage invalide');
  END IF;
  IF v_referrer = v_me THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous ne pouvez pas utiliser votre propre code');
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_me AND referred_by IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Un parrain est déjà associé à votre compte');
  END IF;

  SELECT created_at INTO v_created FROM public.profiles WHERE id = v_me;
  IF v_created IS NOT NULL AND v_created < NOW() - INTERVAL '30 days' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le parrainage est réservé aux nouveaux comptes');
  END IF;
  IF EXISTS (SELECT 1 FROM public.orders WHERE customer_id = v_me) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Le parrainage doit être activé avant votre première commande');
  END IF;

  UPDATE public.profiles SET referred_by = v_referrer WHERE id = v_me;
  INSERT INTO public.referrals (referrer_id, referred_id)
  VALUES (v_referrer, v_me)
  ON CONFLICT (referred_id) DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_referral(TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.claim_referral(TEXT) TO authenticated;

-- ── Récompense à la première commande livrée ─────────────────
-- Idempotente : le verrou FOR UPDATE + le statut 'pending' garantissent
-- un seul versement par filleul.
CREATE OR REPLACE FUNCTION public.reward_referral(p_referred_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r         RECORD;
  v_balance NUMERIC;
BEGIN
  SELECT * INTO r FROM public.referrals
  WHERE referred_id = p_referred_id AND status = 'pending'
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_pending_referral');
  END IF;

  -- Le filleul doit avoir au moins une commande livrée
  IF NOT EXISTS (
    SELECT 1 FROM public.orders
    WHERE customer_id = p_referred_id AND status = 'delivered'
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_delivered_order');
  END IF;

  UPDATE public.referrals
  SET status = 'rewarded', rewarded_at = NOW()
  WHERE id = r.id;

  UPDATE public.profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + r.reward_amount
  WHERE id = r.referrer_id
  RETURNING wallet_balance INTO v_balance;

  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, description)
  VALUES (r.referrer_id, 'credit', r.reward_amount, v_balance, 'Bonus de parrainage — première commande de votre filleul');

  RETURN jsonb_build_object('success', true, 'referrer_id', r.referrer_id, 'amount', r.reward_amount);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reward_referral(UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.reward_referral(UUID) TO authenticated;
