-- ================================================================
-- RLS : remplacer vendors.owner_id (colonne disparue) par vendors.user_id
--
-- Suite de fix_vendors_rls.sql, qui ne traitait que la table `vendors`. Le même
-- `owner_id` mort sert à identifier le vendeur dans les policies de plusieurs
-- autres tables : tant qu'elles ne sont pas reprises, le vendeur ne peut ni
-- créer un produit ("new row violates row-level security policy for table
-- products"), ni voir ses commandes, ni gérer ses variantes.
--
-- Migration additive et idempotente : les policies permissives se cumulent (OR),
-- donc recréer celles-ci suffit même si d'anciennes subsistent sous d'autres
-- noms, et rejouer le script est sans effet de bord.
-- ================================================================

-- ─── PRODUITS ────────────────────────────────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_vendor_all" ON public.products;
CREATE POLICY "products_vendor_all" ON public.products
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Vendors manage own products" ON public.products;

-- ─── COMMANDES ───────────────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_vendor_select" ON public.orders;
CREATE POLICY "orders_vendor_select" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

-- Le vendeur fait avancer le statut (confirmée → en préparation → prête).
DROP POLICY IF EXISTS "orders_vendor_update" ON public.orders;
CREATE POLICY "orders_vendor_update" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Vendors see their orders" ON public.orders;

-- ─── LIGNES DE COMMANDE (substitutions d'articles en rupture) ────────────────
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_vendor_select" ON public.order_items;
CREATE POLICY "order_items_vendor_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendors v ON v.id = o.vendor_id
      WHERE o.id = order_id AND v.user_id = auth.uid()
    )
  );

-- Substitution possible tant que la commande n'est pas partie en livraison.
DROP POLICY IF EXISTS "order_items_vendor_update" ON public.order_items;
CREATE POLICY "order_items_vendor_update" ON public.order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendors v ON v.id = o.vendor_id
      WHERE o.id = order_id
        AND o.status IN ('pending', 'confirmed', 'preparing')
        AND v.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_vendor_delete" ON public.order_items;
CREATE POLICY "order_items_vendor_delete" ON public.order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendors v ON v.id = o.vendor_id
      WHERE o.id = order_id
        AND o.status IN ('pending', 'confirmed', 'preparing')
        AND v.user_id = auth.uid()
    )
  );

-- ─── VARIANTES DE PRODUIT ────────────────────────────────────────────────────
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "variants_vendor_all" ON public.product_variants;
CREATE POLICY "variants_vendor_all" ON public.product_variants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.vendors v ON v.id = p.vendor_id
      WHERE p.id = product_id AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.vendors v ON v.id = p.vendor_id
      WHERE p.id = product_id AND v.user_id = auth.uid()
    )
  );

-- ─── VUES PRODUIT (statistiques de conversion) ───────────────────────────────
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "views_vendor_select" ON public.product_views;
CREATE POLICY "views_vendor_select" ON public.product_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
  );

-- ─── FINANCES (portefeuille, retraits, commissions) ──────────────────────────
-- add_payout_tables.sql utilise déjà user_id ; financial_schema.sql, non. Selon
-- le fichier appliqué en production, ces policies peuvent être mortes — on les
-- recrée pour ne pas dépendre de cet historique.
DROP POLICY IF EXISTS "wallet_owner_select" ON public.vendor_wallets;
CREATE POLICY "wallet_owner_select" ON public.vendor_wallets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "payout_accounts_owner" ON public.vendor_payout_accounts;
CREATE POLICY "payout_accounts_owner" ON public.vendor_payout_accounts
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "commission_vendor_select" ON public.commission_logs;
CREATE POLICY "commission_vendor_select" ON public.commission_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
  );
