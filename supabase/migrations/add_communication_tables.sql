-- ============================================================
-- add_communication_tables.sql
-- Fix communication_logs + add broadcasts, push_notifications,
-- payment_validations, email_verifications, password_resets
-- ============================================================

-- ── FIX communication_logs ───────────────────────────────────
-- Original schema has (channel, type, recipient, subject, content, status, provider_id)
-- API inserts (type, channel, subject, content, recipient, results_json, status)

ALTER TABLE public.communication_logs
  ADD COLUMN IF NOT EXISTS results_json JSONB DEFAULT '{}';

-- ── BROADCASTS ───────────────────────────────────────────────
-- Used by POST /api/communication action=schedule_broadcast

CREATE TABLE IF NOT EXISTS public.broadcasts (
  id           UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  title        TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  channels     TEXT[]      NOT NULL DEFAULT '{}',
  segment      TEXT        NOT NULL DEFAULT 'all',
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  status       TEXT        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broadcasts_admin_all" ON public.broadcasts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

DROP TRIGGER IF EXISTS trg_broadcasts_updated_at ON public.broadcasts;
CREATE TRIGGER trg_broadcasts_updated_at
  BEFORE UPDATE ON public.broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── PUSH NOTIFICATIONS ───────────────────────────────────────
-- Used by POST /api/communication action=send_push

CREATE TABLE IF NOT EXISTS public.push_notifications (
  id       UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id  UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  title    TEXT        NOT NULL,
  body     TEXT        NOT NULL,
  data     JSONB       DEFAULT '{}',
  sent_at  TIMESTAMPTZ DEFAULT NOW(),
  read     BOOLEAN     NOT NULL DEFAULT FALSE
);

ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_owner_select" ON public.push_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "push_owner_update" ON public.push_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "push_service_insert" ON public.push_notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── PAYMENT VALIDATIONS ──────────────────────────────────────
-- Used by POST /api/email type=payment_alert

CREATE TABLE IF NOT EXISTS public.payment_validations (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id   TEXT        NOT NULL,
  code       TEXT        NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_validations ENABLE ROW LEVEL SECURITY;

-- Only service_role writes; no row-level access for anon/authenticated
-- (validated server-side via service_role key)
CREATE POLICY "payment_validations_service_only" ON public.payment_validations
  FOR ALL USING (FALSE);  -- blocks client access; service_role bypasses RLS

CREATE UNIQUE INDEX IF NOT EXISTS payment_validations_order_id_idx
  ON public.payment_validations (order_id);

-- ── EMAIL VERIFICATIONS ──────────────────────────────────────
-- Used by POST /api/email type=email_verification

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  email      TEXT        NOT NULL,
  code       TEXT        NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_verifications_service_only" ON public.email_verifications
  FOR ALL USING (FALSE);

CREATE UNIQUE INDEX IF NOT EXISTS email_verifications_email_idx
  ON public.email_verifications (email);

-- ── PASSWORD RESETS ──────────────────────────────────────────
-- Used by POST /api/email type=password_reset

CREATE TABLE IF NOT EXISTS public.password_resets (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  email      TEXT        NOT NULL,
  code       TEXT        NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "password_resets_service_only" ON public.password_resets
  FOR ALL USING (FALSE);

CREATE UNIQUE INDEX IF NOT EXISTS password_resets_email_idx
  ON public.password_resets (email);
