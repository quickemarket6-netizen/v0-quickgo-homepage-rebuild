-- ============================================================
-- add_security_tables.sql
-- Tables: security_logs, login_attempts, admin_action_logs,
--         blocked_ips
-- ============================================================

-- ── SECURITY LOGS — all detected threats ──────────────────────

CREATE TABLE IF NOT EXISTS public.security_logs (
  id               UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  type             TEXT        NOT NULL
                               CHECK (type IN (
                                 'brute_force','sql_injection','xss_attack','ddos',
                                 'bot_attack','session_hijack','api_abuse','fraud_attempt',
                                 'unauthorized_access','data_scraping','suspicious_login',
                                 'rate_limit_exceeded'
                               )),
  level            TEXT        NOT NULL DEFAULT 'low'
                               CHECK (level IN ('low','medium','high','critical')),
  ip_address       TEXT,
  country          TEXT,
  city             TEXT,
  user_agent       TEXT,
  device           TEXT,
  browser          TEXT,
  os               TEXT,
  fingerprint      TEXT,
  endpoint         TEXT,
  method           TEXT,
  payload_excerpt  TEXT,
  request_count    INTEGER,
  session_id       TEXT,
  user_id          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  blocked          BOOLEAN     NOT NULL DEFAULT FALSE,
  acknowledged     BOOLEAN     NOT NULL DEFAULT FALSE,
  acknowledged_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at  TIMESTAMPTZ,
  alert_sent       BOOLEAN     NOT NULL DEFAULT FALSE,
  metadata         JSONB       DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_logs_admin_select" ON public.security_logs
;
CREATE POLICY "security_logs_admin_select" ON public.security_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP POLICY IF EXISTS "security_logs_service_insert" ON public.security_logs
;
CREATE POLICY "security_logs_service_insert" ON public.security_logs
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "security_logs_admin_update" ON public.security_logs
;
CREATE POLICY "security_logs_admin_update" ON public.security_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE INDEX IF NOT EXISTS sec_logs_level_idx    ON public.security_logs (level, created_at DESC);
CREATE INDEX IF NOT EXISTS sec_logs_ip_idx       ON public.security_logs (ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS sec_logs_type_idx     ON public.security_logs (type, created_at DESC);
CREATE INDEX IF NOT EXISTS sec_logs_user_idx     ON public.security_logs (user_id);
CREATE INDEX IF NOT EXISTS sec_logs_time_idx     ON public.security_logs (created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.security_logs;

-- ── LOGIN ATTEMPTS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id             UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email          TEXT,
  phone          TEXT,
  ip_address     TEXT,
  user_agent     TEXT,
  fingerprint    TEXT,
  country        TEXT,
  city           TEXT,
  status         TEXT        NOT NULL DEFAULT 'failed'
                             CHECK (status IN ('success','failed','blocked','suspicious')),
  failure_reason TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "login_attempts_admin_select" ON public.login_attempts
;
CREATE POLICY "login_attempts_admin_select" ON public.login_attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP POLICY IF EXISTS "login_attempts_user_select" ON public.login_attempts
;
CREATE POLICY "login_attempts_user_select" ON public.login_attempts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "login_attempts_service_insert" ON public.login_attempts
;
CREATE POLICY "login_attempts_service_insert" ON public.login_attempts
  FOR INSERT WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS login_attempts_user_idx    ON public.login_attempts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS login_attempts_ip_idx      ON public.login_attempts (ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS login_attempts_status_idx  ON public.login_attempts (status, created_at DESC);

-- ── ADMIN ACTION LOGS — full audit trail ─────────────────────

CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action      TEXT        NOT NULL,  -- create | update | delete | approve | reject | block | export | view
  resource    TEXT        NOT NULL,  -- vendor | payout | order | user | cms_page | blog_post | faq_item...
  resource_id TEXT,
  before_data JSONB,
  after_data  JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  metadata    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_action_logs_admin_select" ON public.admin_action_logs
;
CREATE POLICY "admin_action_logs_admin_select" ON public.admin_action_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP POLICY IF EXISTS "admin_action_logs_service_insert" ON public.admin_action_logs
;
CREATE POLICY "admin_action_logs_service_insert" ON public.admin_action_logs
  FOR INSERT WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS admin_logs_admin_idx    ON public.admin_action_logs (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_logs_resource_idx ON public.admin_action_logs (resource, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_logs_time_idx     ON public.admin_action_logs (created_at DESC);

-- ── BLOCKED IPS — persistent block list ───────────────────────

CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id           UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  ip_address   TEXT        UNIQUE NOT NULL,
  reason       TEXT,
  blocked_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  blocked_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,          -- NULL = permanent
  auto_blocked BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  unblocked_at TIMESTAMPTZ,
  unblocked_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_ips_admin_all" ON public.blocked_ips
;
CREATE POLICY "blocked_ips_admin_all" ON public.blocked_ips
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP POLICY IF EXISTS "blocked_ips_service_insert" ON public.blocked_ips
;
CREATE POLICY "blocked_ips_service_insert" ON public.blocked_ips
  FOR INSERT WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS blocked_ips_ip_idx      ON public.blocked_ips (ip_address) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS blocked_ips_active_idx  ON public.blocked_ips (is_active, expires_at);

-- ── RPC: check if an IP is currently blocked ──────────────────

CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_ips
    WHERE ip_address = p_ip
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- ── RPC: log security event atomically ────────────────────────

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_type           TEXT,
  p_level          TEXT,
  p_ip             TEXT,
  p_endpoint       TEXT,
  p_blocked        BOOLEAN DEFAULT FALSE,
  p_payload_excerpt TEXT DEFAULT NULL,
  p_metadata       JSONB   DEFAULT '{}'
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.security_logs (type, level, ip_address, endpoint, blocked, payload_excerpt, metadata)
  VALUES (p_type, p_level, p_ip, p_endpoint, p_blocked, p_payload_excerpt, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;
