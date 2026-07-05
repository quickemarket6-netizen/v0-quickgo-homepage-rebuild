-- ============================================================
-- add_substitutions.sql
-- Substitution d'articles en rupture pendant la préparation :
--   - orders.substitution_preference : choix du client au checkout
--   - policies UPDATE/DELETE sur order_items pour le vendeur
--     (uniquement avant la remise au livreur)
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS substitution_preference TEXT DEFAULT 'refund'
    CHECK (substitution_preference IN ('substitute', 'refund', 'contact'));

-- Le vendeur peut modifier/supprimer les articles de SES commandes tant que
-- la préparation n'est pas terminée (pending/confirmed/preparing).
DROP POLICY IF EXISTS "order_items_vendor_update" ON public.order_items;
CREATE POLICY "order_items_vendor_update" ON public.order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendors v ON v.id = o.vendor_id
      WHERE o.id = order_id
        AND o.status IN ('pending', 'confirmed', 'preparing')
        AND v.owner_id = auth.uid()
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
        AND v.owner_id = auth.uid()
    )
  );
