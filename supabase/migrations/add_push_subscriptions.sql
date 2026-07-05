-- ============================================================
-- add_push_subscriptions.sql
-- Notifications push web (VAPID) :
--   - push_subscriptions : abonnements navigateur par utilisateur
--   - RPC get_push_subscriptions : lecture cross-utilisateur pour
--     l'envoi côté serveur (SECURITY DEFINER)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT        NOT NULL UNIQUE,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subs_owner_all" ON public.push_subscriptions;
CREATE POLICY "push_subs_owner_all" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lecture des abonnements d'un utilisateur cible pour l'envoi serveur
-- (ex. le livreur déclenche une notification au client à la livraison).
CREATE OR REPLACE FUNCTION public.get_push_subscriptions(p_user_id UUID)
RETURNS TABLE (endpoint TEXT, p256dh TEXT, auth TEXT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT endpoint, p256dh, auth
  FROM public.push_subscriptions
  WHERE user_id = p_user_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_push_subscriptions(UUID) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_push_subscriptions(UUID) TO authenticated;

-- Purge d'un abonnement expiré (endpoint HTTP 404/410 au moment de l'envoi)
CREATE OR REPLACE FUNCTION public.delete_push_subscription(p_endpoint TEXT)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM public.push_subscriptions WHERE endpoint = p_endpoint;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_push_subscription(TEXT) FROM anon;
GRANT  EXECUTE ON FUNCTION public.delete_push_subscription(TEXT) TO authenticated;
