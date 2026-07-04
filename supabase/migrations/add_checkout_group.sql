-- Panier multi-vendeurs : une commande par vendeur, reliées par un
-- identifiant de groupe de checkout. Le paiement (CinetPay / wallet)
-- couvre l'ensemble du groupe.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS checkout_group_id UUID;

CREATE INDEX IF NOT EXISTS orders_checkout_group_idx
  ON public.orders (checkout_group_id)
  WHERE checkout_group_id IS NOT NULL;
