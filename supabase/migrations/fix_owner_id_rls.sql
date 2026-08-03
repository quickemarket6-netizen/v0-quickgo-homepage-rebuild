-- ================================================================
-- RLS : remplacer vendors.owner_id (colonne disparue) par vendors.user_id
--
-- Suite de fix_vendors_rls.sql, qui ne traitait que la table `vendors`. Le même
-- `owner_id` mort sert à identifier le vendeur dans les policies de plusieurs
-- autres tables : tant qu'elles ne sont pas reprises, le vendeur ne peut ni
-- créer un produit ("new row violates row-level security policy for table
-- products"), ni voir ses commandes.
--
-- Chaque bloc est conditionné à l'existence de la table (to_regclass) : toutes
-- les migrations du dépôt n'ont pas été appliquées en production, et une table
-- absente ferait échouer le script entier — l'éditeur SQL Supabase exécute tout
-- dans une transaction, donc une seule erreur annule l'ensemble.
--
-- Migration additive et idempotente : les policies permissives se cumulent
-- (OR), donc recréer celles-ci suffit même si d'anciennes subsistent sous
-- d'autres noms, et rejouer le script est sans effet de bord.
-- ================================================================

-- ─── PRODUITS ────────────────────────────────────────────────────────────────
DO $do$
BEGIN
  IF to_regclass('public.products') IS NULL THEN
    RAISE NOTICE 'products absente — ignorée';
  ELSE
    EXECUTE 'ALTER TABLE public.products ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "products_vendor_all" ON public.products';
    EXECUTE $p$
      CREATE POLICY "products_vendor_all" ON public.products
        FOR ALL
        USING      (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()))
        WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()))
    $p$;
    EXECUTE 'DROP POLICY IF EXISTS "Vendors manage own products" ON public.products';
  END IF;
END
$do$;

-- ─── COMMANDES ───────────────────────────────────────────────────────────────
DO $do$
BEGIN
  IF to_regclass('public.orders') IS NULL THEN
    RAISE NOTICE 'orders absente — ignorée';
  ELSE
    EXECUTE 'ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "orders_vendor_select" ON public.orders';
    EXECUTE $p$
      CREATE POLICY "orders_vendor_select" ON public.orders
        FOR SELECT USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()))
    $p$;

    -- Le vendeur fait avancer le statut (confirmée → en préparation → prête).
    EXECUTE 'DROP POLICY IF EXISTS "orders_vendor_update" ON public.orders';
    EXECUTE $p$
      CREATE POLICY "orders_vendor_update" ON public.orders
        FOR UPDATE USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()))
    $p$;

    EXECUTE 'DROP POLICY IF EXISTS "Vendors see their orders" ON public.orders';
  END IF;
END
$do$;

-- ─── LIGNES DE COMMANDE (substitutions d'articles en rupture) ────────────────
DO $do$
BEGIN
  IF to_regclass('public.order_items') IS NULL THEN
    RAISE NOTICE 'order_items absente — ignorée';
  ELSE
    EXECUTE 'ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "order_items_vendor_select" ON public.order_items';
    EXECUTE $p$
      CREATE POLICY "order_items_vendor_select" ON public.order_items
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM public.orders o
                  JOIN public.vendors v ON v.id = o.vendor_id
                  WHERE o.id = order_id AND v.user_id = auth.uid())
        )
    $p$;

    -- Substitution possible tant que la commande n'est pas partie en livraison.
    EXECUTE 'DROP POLICY IF EXISTS "order_items_vendor_update" ON public.order_items';
    EXECUTE $p$
      CREATE POLICY "order_items_vendor_update" ON public.order_items
        FOR UPDATE USING (
          EXISTS (SELECT 1 FROM public.orders o
                  JOIN public.vendors v ON v.id = o.vendor_id
                  WHERE o.id = order_id
                    AND o.status IN ('pending', 'confirmed', 'preparing')
                    AND v.user_id = auth.uid())
        )
    $p$;

    EXECUTE 'DROP POLICY IF EXISTS "order_items_vendor_delete" ON public.order_items';
    EXECUTE $p$
      CREATE POLICY "order_items_vendor_delete" ON public.order_items
        FOR DELETE USING (
          EXISTS (SELECT 1 FROM public.orders o
                  JOIN public.vendors v ON v.id = o.vendor_id
                  WHERE o.id = order_id
                    AND o.status IN ('pending', 'confirmed', 'preparing')
                    AND v.user_id = auth.uid())
        )
    $p$;
  END IF;
END
$do$;

-- ─── VARIANTES DE PRODUIT ────────────────────────────────────────────────────
-- Table créée par migrations/add_vendor_features.sql, qui peut ne pas avoir été
-- appliquée : le bloc est ignoré si elle n'existe pas.
DO $do$
BEGIN
  IF to_regclass('public.product_variants') IS NULL THEN
    RAISE NOTICE 'product_variants absente — ignorée';
  ELSE
    EXECUTE 'ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "variants_vendor_all" ON public.product_variants';
    EXECUTE $p$
      CREATE POLICY "variants_vendor_all" ON public.product_variants
        FOR ALL
        USING (
          EXISTS (SELECT 1 FROM public.products p
                  JOIN public.vendors v ON v.id = p.vendor_id
                  WHERE p.id = product_id AND v.user_id = auth.uid())
        )
        WITH CHECK (
          EXISTS (SELECT 1 FROM public.products p
                  JOIN public.vendors v ON v.id = p.vendor_id
                  WHERE p.id = product_id AND v.user_id = auth.uid())
        )
    $p$;
  END IF;
END
$do$;

-- ─── VUES PRODUIT (statistiques de conversion) ───────────────────────────────
DO $do$
BEGIN
  IF to_regclass('public.product_views') IS NULL THEN
    RAISE NOTICE 'product_views absente — ignorée';
  ELSE
    EXECUTE 'ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "views_vendor_select" ON public.product_views';
    EXECUTE $p$
      CREATE POLICY "views_vendor_select" ON public.product_views
        FOR SELECT USING (
          EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin'))
        )
    $p$;
  END IF;
END
$do$;

-- ─── FINANCES (portefeuille, retraits, commissions) ──────────────────────────
-- add_payout_tables.sql utilise déjà user_id ; financial_schema.sql, non. Selon
-- le fichier appliqué en production, ces policies peuvent être mortes — on les
-- recrée pour ne pas dépendre de cet historique.
DO $do$
BEGIN
  IF to_regclass('public.vendor_wallets') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "wallet_owner_select" ON public.vendor_wallets';
    EXECUTE $p$
      CREATE POLICY "wallet_owner_select" ON public.vendor_wallets
        FOR SELECT USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()))
    $p$;
  END IF;

  IF to_regclass('public.vendor_payout_accounts') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "payout_accounts_owner" ON public.vendor_payout_accounts';
    EXECUTE $p$
      CREATE POLICY "payout_accounts_owner" ON public.vendor_payout_accounts
        FOR ALL
        USING      (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()))
        WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()))
    $p$;
  END IF;

  IF to_regclass('public.commission_logs') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "commission_vendor_select" ON public.commission_logs';
    EXECUTE $p$
      CREATE POLICY "commission_vendor_select" ON public.commission_logs
        FOR SELECT USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.user_id = auth.uid()))
    $p$;
  END IF;
END
$do$;
