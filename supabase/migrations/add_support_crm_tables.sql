-- ============================================================
-- add_support_crm_tables.sql
-- Tables: support_tickets, ticket_messages, customer_notes
-- ============================================================

-- ── Ticket number sequence ────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.ticket_number_seq START 1100 INCREMENT 1;

-- ── SUPPORT TICKETS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_number   TEXT        UNIQUE NOT NULL DEFAULT 'TKT-' || nextval('ticket_number_seq'),
  subject         TEXT        NOT NULL,
  category        TEXT        NOT NULL DEFAULT 'general'
                              CHECK (category IN ('livraison','paiement','technique','commande','plainte','compte','general')),
  body            TEXT        NOT NULL,               -- initial message
  status          TEXT        NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open','in_progress','escalated','resolved','closed')),
  priority        TEXT        NOT NULL DEFAULT 'normal'
                              CHECK (priority IN ('low','normal','high','urgent')),

  -- Who submitted the ticket
  customer_id     UUID        REFERENCES auth.users(id)  ON DELETE SET NULL,
  vendor_id       UUID        REFERENCES public.vendors(id) ON DELETE SET NULL,
  customer_type   TEXT        NOT NULL DEFAULT 'client'
                              CHECK (customer_type IN ('client','vendor','driver')),
  customer_name   TEXT,                              -- denormalised snapshot

  -- Agent assignment
  assigned_to_id  UUID        REFERENCES auth.users(id)  ON DELETE SET NULL,
  assigned_to     TEXT,                              -- agent display name (denormalised)

  -- Lifecycle
  resolved_at     TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Customers / vendors / drivers see only their own tickets
CREATE POLICY "tickets_owner_select" ON public.support_tickets
  FOR SELECT USING (
    auth.uid() = customer_id
    OR EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = vendor_id AND v.owner_id = auth.uid()
    )
  );

CREATE POLICY "tickets_owner_insert" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = customer_id OR auth.uid() IS NOT NULL);

-- Admins see and update everything
CREATE POLICY "tickets_admin_all" ON public.support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS tickets_status_idx    ON public.support_tickets (status);
CREATE INDEX IF NOT EXISTS tickets_priority_idx  ON public.support_tickets (priority);
CREATE INDEX IF NOT EXISTS tickets_customer_idx  ON public.support_tickets (customer_id);
CREATE INDEX IF NOT EXISTS tickets_assigned_idx  ON public.support_tickets (assigned_to_id);
CREATE INDEX IF NOT EXISTS tickets_created_idx   ON public.support_tickets (created_at DESC);

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;

-- ── TICKET MESSAGES ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id   UUID        NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  is_internal BOOLEAN     NOT NULL DEFAULT FALSE,  -- TRUE = agent-only note
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Ticket owner can read non-internal messages
CREATE POLICY "tmsg_owner_select" ON public.ticket_messages
  FOR SELECT USING (
    is_internal = FALSE
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
        AND (
          t.customer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.vendors v WHERE v.id = t.vendor_id AND v.owner_id = auth.uid()
          )
        )
    )
  );

-- Ticket owner can insert non-internal messages
CREATE POLICY "tmsg_owner_insert" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    is_internal = FALSE
    AND auth.uid() = sender_id
  );

-- Admins see all (including internal notes) and can insert
CREATE POLICY "tmsg_admin_all" ON public.ticket_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS tmsg_ticket_id_idx ON public.ticket_messages (ticket_id, created_at);

-- Bump ticket.updated_at whenever a message is added
CREATE OR REPLACE FUNCTION public.touch_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.support_tickets
  SET updated_at = NOW()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_touch_ticket ON public.ticket_messages;
CREATE TRIGGER trg_touch_ticket
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_ticket_on_message();

ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- ── CUSTOMER NOTES (CRM) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_notes (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_name  TEXT        NOT NULL,
  note        TEXT        NOT NULL,
  tags        TEXT[]      DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cnotes_admin_all" ON public.customer_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS cnotes_customer_idx ON public.customer_notes (customer_id, created_at DESC);
