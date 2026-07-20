-- Corrige l'assistant d'inscription vendeur (/vendor/onboarding), cassé de
-- bout en bout :
--   1. vendors.owner_id n'avait aucune contrainte UNIQUE, alors que TOUTES
--      les routes vendeur font `.eq("owner_id", uid).single()` (une seule
--      boutique par utilisateur) — et l'upsert de l'onboarding avait besoin
--      de ON CONFLICT (owner_id) pour fonctionner.
--   2. vendors.tax_id était envoyé par le formulaire d'onboarding mais la
--      colonne n'existait pas du tout → l'upsert échouait systématiquement.
--
-- Résultat concret : un compte qui passait par /auth/choose-role (rôle
-- "vendor" posé sur profiles) sans compléter l'onboarding — ou qui essayait
-- de le compléter et tombait sur cette erreur silencieuse — n'avait JAMAIS
-- de ligne dans `vendors`. Toutes les routes vendeur répondaient alors
-- 403 "Vendeur introuvable" (upload d'image produit, tableau de bord, etc.).
--
-- ⚠️ Si cette contrainte échoue avec « duplicate key value violates unique
-- constraint », c'est qu'au moins deux lignes `vendors` partagent déjà le
-- même owner_id — une anomalie de données à corriger manuellement avant de
-- relancer cette migration (identifie les doublons avec :
--   SELECT owner_id, count(*) FROM public.vendors GROUP BY owner_id HAVING count(*) > 1;
-- ).

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS tax_id TEXT;

ALTER TABLE public.vendors
  DROP CONSTRAINT IF EXISTS vendors_owner_id_key;

ALTER TABLE public.vendors
  ADD CONSTRAINT vendors_owner_id_key UNIQUE (owner_id);
