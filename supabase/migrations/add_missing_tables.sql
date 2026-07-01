-- ============================================================
-- add_missing_tables.sql
--
-- BACKFILL MIGRATION.
-- These tables are referenced by application code via `.from("X")`
-- but were NOT declared in any tracked supabase/*.sql file. They
-- almost certainly already exist in the production database (they
-- were created ad-hoc / outside version control). This migration
-- backfills their definitions so the schema is reproducible.
--
-- Every object uses CREATE TABLE IF NOT EXISTS / DROP POLICY IF EXISTS
-- + CREATE POLICY / CREATE INDEX IF NOT EXISTS so re-running it against
-- a database where the tables already exist is a safe no-op.
--
-- Tables declared here:
--   admin_settings   (key/value app settings, admin-managed)
--   user_roles       (per-user role + permissions overlay on profiles)
--   coupons          (vendor-scoped coupon codes)
--   promotions       (vendor-scoped promotion codes)
--   promo_codes      (global marketplace promo codes)
--   conversations    (vendor <-> customer message threads)
--   messages         (individual messages inside a conversation)
--   team_members     (vendor staff / employees)
--   product_reviews  (product reviews WITH vendor responses)
--
-- Columns for every table were derived from how the code actually
-- selects / inserts / updates / filters each one. Types are kept
-- conservative and nullable where the code does not guarantee a value.
--
-- ALIASES / NOT CREATED HERE (see notes at the bottom of this file):
--   * "payouts"         -> alias of existing public.vendor_payouts
--   * "product_reviews" -> superset of existing public.reviews
--                          (kept separate: it adds vendor_response /
--                           responded_at, which reviews lacks)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shared updated_at trigger helper (idempotent; already defined by
-- other migrations, redefined here so this file is self-contained).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── ADMIN SETTINGS ────────────────────────────────────────────
-- Source: app/admin/settings/page.tsx  (.select("key, value");
--   .upsert({ key, value, updated_at }, { onConflict: "key" }))
-- Source: app/api/settings/route.ts     (.select("key, value, category")
--   .in("category", [...]))
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT,
  category   TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon/public GET /api/settings) may read settings.
DROP POLICY IF EXISTS "admin_settings_read_all" ON public.admin_settings;
CREATE POLICY "admin_settings_read_all" ON public.admin_settings
  FOR SELECT USING (TRUE);

-- Only admins may write.
DROP POLICY IF EXISTS "admin_settings_admin_write" ON public.admin_settings;
CREATE POLICY "admin_settings_admin_write" ON public.admin_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- ── USER ROLES ────────────────────────────────────────────────
-- Source: app/admin/roles/page.tsx
--   .select("user_id, role, permissions")
--   .upsert({ user_id, role, permissions, updated_at }, { onConflict: "user_id" })
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id     UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT,
  permissions TEXT[]      DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_owner_select" ON public.user_roles;
CREATE POLICY "user_roles_owner_select" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
CREATE POLICY "user_roles_admin_all" ON public.user_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- ── COUPONS ───────────────────────────────────────────────────
-- Source: app/api/vendor/coupons/route.ts
--   .select("id, name, code, type, value, min_order_amount, max_uses,
--            current_uses, is_single_use, starts_at, ends_at,
--            is_active, created_at")
--   .eq("vendor_id", ...); insert({ vendor_id, name, code, type, value,
--            min_order_amount, max_uses, is_single_use, starts_at,
--            ends_at, is_active, current_uses }); update({ is_active })
CREATE TABLE IF NOT EXISTS public.coupons (
  id               UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id        UUID          NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name             TEXT,
  code             TEXT          NOT NULL,
  type             TEXT,
  value            NUMERIC(14,2),
  min_order_amount NUMERIC(14,2),
  max_uses         INTEGER,
  current_uses     INTEGER       NOT NULL DEFAULT 0,
  is_single_use    BOOLEAN       NOT NULL DEFAULT FALSE,
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE (vendor_id, code)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_owner_all" ON public.coupons;
CREATE POLICY "coupons_owner_all" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "coupons_admin_all" ON public.coupons;
CREATE POLICY "coupons_admin_all" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE INDEX IF NOT EXISTS coupons_vendor_idx ON public.coupons (vendor_id, created_at DESC);

-- ── PROMOTIONS ────────────────────────────────────────────────
-- Source: app/api/vendor/promotions/route.ts
--   .select("id, name, code, discount_type, discount_value,
--            min_order_amount, max_uses, current_uses, starts_at,
--            ends_at, is_active, created_at")
--   .eq("vendor_id", ...); insert({ vendor_id, name, code, discount_type,
--            discount_value, min_order_amount, max_uses, starts_at,
--            ends_at, is_active, current_uses }); update({ is_active })
CREATE TABLE IF NOT EXISTS public.promotions (
  id               UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id        UUID          NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name             TEXT,
  code             TEXT          NOT NULL,
  discount_type    TEXT,
  discount_value   NUMERIC(14,2),
  min_order_amount NUMERIC(14,2),
  max_uses         INTEGER,
  current_uses     INTEGER       NOT NULL DEFAULT 0,
  starts_at        TIMESTAMPTZ,
  ends_at          TIMESTAMPTZ,
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE (vendor_id, code)
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promotions_owner_all" ON public.promotions;
CREATE POLICY "promotions_owner_all" ON public.promotions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "promotions_admin_all" ON public.promotions;
CREATE POLICY "promotions_admin_all" ON public.promotions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE INDEX IF NOT EXISTS promotions_vendor_idx ON public.promotions (vendor_id, created_at DESC);

-- ── PROMO CODES (global marketplace) ──────────────────────────
-- Source: app/api/promo/validate/route.ts     (.select("*") .eq("code")
--            .eq("is_active"))
-- Source: app/api/orders/route.ts             (.select("*") .eq("code")
--            .eq("is_active"); reads min_order_amount, max_uses,
--            current_uses, discount_type, discount_value; atomic
--            update({ current_uses }))
-- Source: app/api/marketplace/offers/route.ts (.select("id, code, title,
--            description, discount_type, discount_value, valid_until,
--            min_order_amount, max_uses, current_uses"); .eq("is_active");
--            filters/orders on valid_until, created_at)
-- Source: app/api/admin/seed/route.ts         (insert { code, title,
--            description, discount_type, discount_value, min_order_amount,
--            is_active, valid_until })
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id               UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  code             TEXT          NOT NULL UNIQUE,
  title            TEXT,
  description      TEXT,
  discount_type    TEXT,
  discount_value   NUMERIC(14,2),
  min_order_amount NUMERIC(14,2) DEFAULT 0,
  max_uses         INTEGER,
  current_uses     INTEGER       NOT NULL DEFAULT 0,
  is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
  valid_until      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Active codes are readable by everyone (marketplace offers / validation).
DROP POLICY IF EXISTS "promo_codes_read_all" ON public.promo_codes;
CREATE POLICY "promo_codes_read_all" ON public.promo_codes
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "promo_codes_admin_all" ON public.promo_codes;
CREATE POLICY "promo_codes_admin_all" ON public.promo_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE INDEX IF NOT EXISTS promo_codes_code_idx ON public.promo_codes (code);

-- ── CONVERSATIONS ─────────────────────────────────────────────
-- Source: app/api/vendor/messages/route.ts
--   .select("id, customer_id, order_id, subject, status, created_at,
--            updated_at, profiles:customer_id(...)")
--   .eq("vendor_id", ...); update({ updated_at }); update({ status });
--   filters on status.
-- Source: app/api/vendor/dashboard/route.ts
--   .eq("vendor_id", ...).gt("unread_vendor", 0)
CREATE TABLE IF NOT EXISTS public.conversations (
  id            UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id     UUID        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  customer_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id      UUID        REFERENCES public.orders(id) ON DELETE SET NULL,
  subject       TEXT,
  status        TEXT        NOT NULL DEFAULT 'open',
  unread_vendor INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_vendor_all" ON public.conversations;
CREATE POLICY "conversations_vendor_all" ON public.conversations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "conversations_customer_select" ON public.conversations;
CREATE POLICY "conversations_customer_select" ON public.conversations
  FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "conversations_admin_all" ON public.conversations;
CREATE POLICY "conversations_admin_all" ON public.conversations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE INDEX IF NOT EXISTS conversations_vendor_idx ON public.conversations (vendor_id, updated_at DESC);

-- ── MESSAGES ──────────────────────────────────────────────────
-- Source: app/api/vendor/messages/route.ts
--   .select("id, conversation_id, sender_type, sender_id, content,
--            created_at, read_at")
--   .eq("conversation_id", ...); insert({ conversation_id, sender_type,
--            sender_id, content }); update({ read_at });
--   filters on sender_type, read_at.
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type     TEXT,
  sender_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  content         TEXT,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Access to a message follows access to its parent conversation.
DROP POLICY IF EXISTS "messages_conversation_participant" ON public.messages;
CREATE POLICY "messages_conversation_participant" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          c.customer_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = c.vendor_id AND v.owner_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "messages_admin_all" ON public.messages;
CREATE POLICY "messages_admin_all" ON public.messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages (conversation_id, created_at);

-- ── TEAM MEMBERS ──────────────────────────────────────────────
-- Source: app/api/vendor/employees/route.ts
--   .select("id, vendor_id, name, email, phone, role, status,
--            avatar_url, last_active, created_at")
--   .eq("vendor_id", ...); insert({ vendor_id, name, email, phone,
--            role, status }); update({ role, status });
--   filters on status, email.
CREATE TABLE IF NOT EXISTS public.team_members (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id   UUID        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name        TEXT,
  email       TEXT,
  phone       TEXT,
  role        TEXT,
  status      TEXT        NOT NULL DEFAULT 'invited',
  avatar_url  TEXT,
  last_active TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (vendor_id, email)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_members_owner_all" ON public.team_members;
CREATE POLICY "team_members_owner_all" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "team_members_admin_all" ON public.team_members;
CREATE POLICY "team_members_admin_all" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE INDEX IF NOT EXISTS team_members_vendor_idx ON public.team_members (vendor_id, created_at DESC);

-- ── PRODUCT REVIEWS ───────────────────────────────────────────
-- NOTE: This is a SUPERSET of the existing public.reviews table.
-- The code (app/api/vendor/reviews/route.ts) reads/writes
-- vendor_response and responded_at, which public.reviews does NOT
-- have -- so this is a genuinely different shape, not just a rename.
-- The parent may want to reconcile these two tables in the code.
--
-- Source: app/api/vendor/reviews/route.ts
--   .select("id, rating, comment, vendor_response, responded_at,
--            created_at, products(...), profiles!product_reviews_customer_id_fkey(...)")
--   .eq("vendor_id", ...); update({ vendor_response, responded_at }).
--   The FK hint "product_reviews_customer_id_fkey" implies a
--   customer_id FK to auth.users; products(...) implies product_id;
--   .eq("vendor_id") implies vendor_id.
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id       UUID        REFERENCES public.vendors(id) ON DELETE CASCADE,
  product_id      UUID        REFERENCES public.products(id) ON DELETE SET NULL,
  customer_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id        UUID        REFERENCES public.orders(id) ON DELETE SET NULL,
  rating          INTEGER     CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  vendor_response TEXT,
  responded_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- The customer_id FK must carry the exact name the PostgREST hint uses:
-- "product_reviews_customer_id_fkey". Postgres auto-names the FK created
-- inline above exactly that (table_column_fkey), so no extra work needed.

DROP POLICY IF EXISTS "product_reviews_read_all" ON public.product_reviews;
CREATE POLICY "product_reviews_read_all" ON public.product_reviews
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "product_reviews_customer_insert" ON public.product_reviews;
CREATE POLICY "product_reviews_customer_insert" ON public.product_reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "product_reviews_vendor_respond" ON public.product_reviews;
CREATE POLICY "product_reviews_vendor_respond" ON public.product_reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "product_reviews_admin_all" ON public.product_reviews;
CREATE POLICY "product_reviews_admin_all" ON public.product_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE INDEX IF NOT EXISTS product_reviews_vendor_idx ON public.product_reviews (vendor_id, created_at DESC);

-- ============================================================
-- ALIAS NOTES (intentionally NOT creating tables for these)
-- ============================================================
--
-- "payouts":
--   Referenced ONLY in app/api/admin/dashboard/route.ts:
--     .from("payouts").select("id, amount").eq("status", "pending")
--     .from("payouts").select("id, amount, payment_method, vendor_id,
--                              vendors(name, logo_url)").eq("status","pending")
--   Every other payout call site (25+, across lib/payments/* and
--   app/api/{admin,vendor}/payouts/*) uses "vendor_payouts", which
--   already declares id, amount, vendor_id, status. The only column
--   difference is "payment_method" here vs "payout_method" in
--   vendor_payouts. This is almost certainly an inconsistent table
--   name in the dashboard route. NOT creating a "payouts" table to
--   avoid a duplicate; the dashboard code should instead be pointed at
--   public.vendor_payouts (and "payment_method" -> "payout_method").
