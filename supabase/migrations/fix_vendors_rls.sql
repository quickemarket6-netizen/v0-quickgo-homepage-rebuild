-- ================================================================
-- RLS de public.vendors — réparation
--
-- Les policies d'origine (supabase/schema.sql) référencent des colonnes qui
-- n'existent pas dans la base réelle :
--   FOR SELECT USING (is_active = TRUE)      -- la colonne est `status`
--   FOR ALL    USING (auth.uid() = owner_id) -- la colonne est `user_id`
--
-- Conséquence : un vendeur ne peut pas lire sa propre boutique, donc les ~26
-- routes /api/vendor/* qui font `.eq("user_id", user.id).single()` renvoient
-- toutes 403 "Vendeur introuvable", et le dashboard renvoie sans fin vers
-- l'onboarding. L'admin, lui, ne voit aucune boutique "inactive" à approuver.
--
-- Les policies permissives se cumulent (OR) : recréer celles-ci suffit, même si
-- d'anciennes policies subsistent sous d'autres noms.
-- ================================================================

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Vitrine publique : seules les boutiques actives sont visibles de tous.
DROP POLICY IF EXISTS "vendors_public_select" ON public.vendors;
CREATE POLICY "vendors_public_select" ON public.vendors
  FOR SELECT USING (status = 'active');

-- Le propriétaire gère sa propre boutique, quel que soit son statut — c'est ce
-- qui manquait : une boutique "inactive" en attente d'approbation doit rester
-- lisible par son vendeur.
DROP POLICY IF EXISTS "vendors_owner_all" ON public.vendors;
CREATE POLICY "vendors_owner_all" ON public.vendors
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Les admins voient et modifient tout (approbation, suspension, commission).
DROP POLICY IF EXISTS "vendors_admin_all" ON public.vendors;
CREATE POLICY "vendors_admin_all" ON public.vendors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- Retire les policies périmées si elles existent encore sous leur nom d'origine
-- (elles ne bloquent rien, mais elles entretiennent la confusion).
DROP POLICY IF EXISTS "Vendors visible to all" ON public.vendors;
DROP POLICY IF EXISTS "Owners manage own vendor" ON public.vendors;
