-- ============================================================
-- add_newsletter.sql
-- Capture d'emails newsletter (visiteurs non connectés inclus).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id            UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  source        TEXT        DEFAULT 'footer',
  confirmed     BOOLEAN     NOT NULL DEFAULT FALSE,
  unsubscribed  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Aucune policy SELECT publique : la liste d'emails ne doit jamais être
-- lisible côté client. Les inscriptions passent par une RPC SECURITY DEFINER
-- (l'INSERT direct anonyme est fermé), la lecture reste réservée aux admins.
DROP POLICY IF EXISTS "newsletter_admin_select" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_select" ON public.newsletter_subscribers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- Inscription : upsert idempotent (réabonne un email désabonné), ne révèle
-- jamais si l'email existait déjà.
CREATE OR REPLACE FUNCTION public.subscribe_newsletter(p_email TEXT, p_source TEXT DEFAULT 'footer')
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.newsletter_subscribers (email, source)
  VALUES (LOWER(TRIM(p_email)), COALESCE(NULLIF(TRIM(p_source), ''), 'footer'))
  ON CONFLICT (email) DO UPDATE SET unsubscribed = FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.subscribe_newsletter(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscribe_newsletter(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.subscribe_newsletter(TEXT, TEXT) TO authenticated;
