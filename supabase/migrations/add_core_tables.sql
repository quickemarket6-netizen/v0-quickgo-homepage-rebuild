-- ============================================================
-- add_core_tables.sql
-- Missing tables: categories, cart_items, order_items
-- Missing columns on existing tables: profiles, vendors,
--   products, orders, notifications
-- ============================================================

-- ── CATEGORIES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       TEXT    NOT NULL,
  slug       TEXT    UNIQUE NOT NULL,
  icon       TEXT,
  color      TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_read_all" ON public.categories
  FOR SELECT USING (TRUE);

CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON public.categories (sort_order);

ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

-- ── CART ITEMS ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cart_items (
  id         UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_owner_select" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cart_owner_insert" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart_owner_update" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cart_owner_delete" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON public.cart_items (user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;

-- ── ORDER ITEMS ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.order_items (
  id           UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id     UUID          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id   UUID          REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT          NOT NULL,
  quantity     INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price   NUMERIC(12,2) NOT NULL,
  total_price  NUMERIC(12,2) NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Customer can read their own order items via the orders join
CREATE POLICY "order_items_customer_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND customer_id = auth.uid()
    )
  );

-- Vendor can read items of orders belonging to their shop
CREATE POLICY "order_items_vendor_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendors v ON v.id = o.vendor_id
      WHERE o.id = order_id AND v.owner_id = auth.uid()
    )
  );

-- Only server-side (service_role) inserts items during order creation
CREATE POLICY "order_items_service_insert" ON public.order_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items (order_id);

-- ── ORDERS — add missing columns ─────────────────────────────

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS service_fee            NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount           NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_latitude      NUMERIC,
  ADD COLUMN IF NOT EXISTS delivery_longitude     NUMERIC;

-- ── PRODUCTS — add missing columns ──────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id    UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS image_url      TEXT,
  ADD COLUMN IF NOT EXISTS is_featured    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products (category_id);

-- ── VENDORS — add missing columns ───────────────────────────

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status          TEXT NOT NULL DEFAULT 'active'
                                           CHECK (status IN ('active', 'inactive', 'suspended')),
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS delivery_fee    NUMERIC(10,2) NOT NULL DEFAULT 500;

CREATE INDEX IF NOT EXISTS vendors_category_id_idx ON public.vendors (category_id);

-- ── PROFILES — add missing columns ──────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email          TEXT,
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating         NUMERIC(3,2);

-- ── NOTIFICATIONS — alias body → message ────────────────────
-- The seed inserts `message`; the schema column is `body`.
-- We add `message` as an alias so both work without breaking
-- existing queries that use `body`.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS message TEXT;

-- Sync the two columns via a trigger so they stay in lockstep
CREATE OR REPLACE FUNCTION public.sync_notification_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.message IS NOT NULL AND NEW.body IS NULL THEN
    NEW.body := NEW.message;
  ELSIF NEW.body IS NOT NULL AND NEW.message IS NULL THEN
    NEW.message := NEW.body;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_notification_message ON public.notifications;
CREATE TRIGGER trg_sync_notification_message
  BEFORE INSERT OR UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.sync_notification_message();

-- ── VENDOR WALLETS (used by seed & delivery-wallet page) ─────

CREATE TABLE IF NOT EXISTS public.vendor_wallets (
  id                UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id         UUID          UNIQUE NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  available_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  pending_balance   NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_earned      NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_withdrawn   NUMERIC(14,2) NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.vendor_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_wallet_owner_select" ON public.vendor_wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE id = vendor_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "vendor_wallet_admin_all" ON public.vendor_wallets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
