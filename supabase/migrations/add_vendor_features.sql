-- ============================================================
-- add_vendor_features.sql
-- Chantiers vendeur : variantes produit, statistiques de vues
-- (conversion), support variante dans panier/commandes.
-- ============================================================

-- ── VARIANTES PRODUIT ────────────────────────────────────────
-- Modèle simple à une dimension : chaque variante porte un libellé
-- (« 500 ml », « Rouge — M »), son propre prix et son propre stock.
CREATE TABLE IF NOT EXISTS public.product_variants (
  id             UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id     UUID          NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label          TEXT          NOT NULL,
  price          NUMERIC(12,2) NOT NULL CHECK (price > 0),
  stock_quantity INTEGER       CHECK (stock_quantity >= 0),
  is_available   BOOLEAN       NOT NULL DEFAULT TRUE,
  position       INTEGER       NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE (product_id, label)
);

CREATE INDEX IF NOT EXISTS product_variants_product_idx ON public.product_variants (product_id, position);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Lecture publique (affichées sur la fiche produit)
DROP POLICY IF EXISTS "variants_public_select" ON public.product_variants;
CREATE POLICY "variants_public_select" ON public.product_variants
  FOR SELECT USING (TRUE);

-- Gestion par le vendeur propriétaire du produit
DROP POLICY IF EXISTS "variants_vendor_all" ON public.product_variants;
CREATE POLICY "variants_vendor_all" ON public.product_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.vendors v ON v.id = p.vendor_id
      WHERE p.id = product_id AND v.user_id = auth.uid()
    )
  );

-- Variante choisie, tracée dans le panier et les lignes de commande.
-- Conditionné à l'existence des tables : toutes les migrations du dépôt n'ont
-- pas été appliquées en production, et une table absente ferait échouer le
-- script entier (l'éditeur SQL Supabase exécute tout dans une transaction).
DO $do$
BEGIN
  IF to_regclass('public.cart_items') IS NULL THEN
    RAISE NOTICE 'cart_items absente — variantes au panier ignorées';
  ELSE
    EXECUTE 'ALTER TABLE public.cart_items
               ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL';
    -- Un même produit peut être au panier en plusieurs variantes
    EXECUTE 'ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key';
    EXECUTE $p$CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_variant_idx
                 ON public.cart_items (user_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))$p$;
  END IF;

  IF to_regclass('public.order_items') IS NULL THEN
    RAISE NOTICE 'order_items absente — variantes en commande ignorées';
  ELSE
    EXECUTE 'ALTER TABLE public.order_items
               ADD COLUMN IF NOT EXISTS variant_id    UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
               ADD COLUMN IF NOT EXISTS variant_label TEXT';
  END IF;
END
$do$;

-- ── VUES PRODUIT (statistiques de conversion) ────────────────
-- Une ligne par affichage de fiche produit ; insertion anonyme
-- autorisée (les visiteurs non connectés comptent aussi), lecture
-- réservée au vendeur du produit et aux admins.
CREATE TABLE IF NOT EXISTS public.product_views (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id  UUID        REFERENCES public.vendors(id) ON DELETE CASCADE,
  viewer_id  UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_views_product_idx ON public.product_views (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS product_views_vendor_idx  ON public.product_views (vendor_id, created_at DESC);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "views_insert_all" ON public.product_views;
CREATE POLICY "views_insert_all" ON public.product_views
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "views_vendor_select" ON public.product_views;
CREATE POLICY "views_vendor_select" ON public.product_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );
