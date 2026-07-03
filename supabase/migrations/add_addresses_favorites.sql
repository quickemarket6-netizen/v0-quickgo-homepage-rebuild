-- ============================================================
-- add_addresses_favorites.sql
-- New tables: addresses, favorites
-- ============================================================

-- ── ADDRESSES ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.addresses (
  id         UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      TEXT    NOT NULL DEFAULT 'Domicile',  -- "Maison", "Bureau", etc.
  street     TEXT,
  district   TEXT,
  city       TEXT    NOT NULL DEFAULT 'Yaoundé',
  lat        NUMERIC,
  lng        NUMERIC,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_owner_select" ON public.addresses;
CREATE POLICY "addresses_owner_select" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_owner_insert" ON public.addresses;
CREATE POLICY "addresses_owner_insert" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_owner_update" ON public.addresses;
CREATE POLICY "addresses_owner_update" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_owner_delete" ON public.addresses;
CREATE POLICY "addresses_owner_delete" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON public.addresses (user_id);

-- Ensure only one default address per user
CREATE UNIQUE INDEX IF NOT EXISTS addresses_single_default_idx
  ON public.addresses (user_id)
  WHERE is_default = TRUE;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_addresses_updated_at ON public.addresses;
CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── FAVORITES ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.favorites (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_owner_select" ON public.favorites;
CREATE POLICY "favorites_owner_select" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_owner_insert" ON public.favorites;
CREATE POLICY "favorites_owner_insert" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_owner_delete" ON public.favorites;
CREATE POLICY "favorites_owner_delete" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites (user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;
