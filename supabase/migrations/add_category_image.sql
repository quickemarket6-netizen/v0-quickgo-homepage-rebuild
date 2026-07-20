-- Ajoute une colonne image à la table categories.
-- Les produits (products.image_url) et les boutiques (vendors.logo_url,
-- vendors.cover_url) ont déjà leurs colonnes ; seule categories manquait.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url TEXT;
