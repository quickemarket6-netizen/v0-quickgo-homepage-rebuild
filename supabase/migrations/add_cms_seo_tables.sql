-- ============================================================
-- add_cms_seo_tables.sql
-- Tables: cms_pages, content_blocks, blog_posts,
--         faq_items, seo_keywords, page_views
-- ============================================================

-- ── CMS PAGES ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cms_pages (
  id               UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  title            TEXT        NOT NULL,
  slug             TEXT        UNIQUE NOT NULL,
  type             TEXT        NOT NULL DEFAULT 'static'
                               CHECK (type IN ('landing','static','legal','promo','faq','guide','blog','system')),
  status           TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('published','draft','archived')),
  content          JSONB       NOT NULL DEFAULT '{}',
  seo_title        TEXT,
  meta_description TEXT,
  og_image         TEXT,
  canonical_url    TEXT,
  views_today      INTEGER     NOT NULL DEFAULT 0,
  views_month      INTEGER     NOT NULL DEFAULT 0,
  seo_score        INTEGER     NOT NULL DEFAULT 0
                               CHECK (seo_score BETWEEN 0 AND 100),
  author_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cms_pages_public_read" ON public.cms_pages;
CREATE POLICY "cms_pages_public_read" ON public.cms_pages
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "cms_pages_admin_all" ON public.cms_pages;
CREATE POLICY "cms_pages_admin_all" ON public.cms_pages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP TRIGGER IF EXISTS trg_cms_pages_updated_at ON public.cms_pages;
CREATE TRIGGER trg_cms_pages_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS cms_pages_slug_idx   ON public.cms_pages (slug);
CREATE INDEX IF NOT EXISTS cms_pages_status_idx ON public.cms_pages (status, type);

-- Seed core pages
INSERT INTO public.cms_pages (title, slug, type, status, seo_title, meta_description, views_today, views_month, seo_score, author_name)
VALUES
  ('Page d''accueil',              '/',                  'landing', 'published', 'QuickGo — Livraison rapide au Cameroun',           'Marketplace locale, livraison express, paiements sécurisés.', 0, 0, 92, 'QuickGo'),
  ('À propos de QuickGo',          '/about',             'static',  'published', 'À propos de QuickGo',                              'Découvrez l''histoire et la mission de QuickGo.',              0, 0, 85, 'QuickGo'),
  ('Devenir vendeur',              '/become-vendor',     'landing', 'published', 'Vendre avec QuickGo — Rejoignez la marketplace',   'Ouvrez votre boutique en ligne sur QuickGo et touchez des milliers de clients.', 0, 0, 88, 'QuickGo'),
  ('Devenir livreur',              '/become-driver',     'landing', 'published', 'Devenir livreur QuickGo — Gagnez votre vie',        'Rejoignez l''équipe de livreurs QuickGo et gagnez en flexibilité.', 0, 0, 90, 'QuickGo'),
  ('FAQ Clients',                  '/faq',               'faq',     'published', 'Questions fréquentes — QuickGo',                    'Trouvez rapidement les réponses à vos questions sur QuickGo.', 0, 0, 78, 'QuickGo'),
  ('Conditions d''utilisation',    '/terms',             'legal',   'published', 'Conditions d''utilisation — QuickGo',               'Consultez les conditions générales d''utilisation de QuickGo.', 0, 0, 72, 'QuickGo'),
  ('Politique de confidentialité', '/privacy',           'legal',   'published', 'Politique de confidentialité — QuickGo',            'Comment QuickGo protège vos données personnelles.',            0, 0, 70, 'QuickGo'),
  ('Contactez-nous',               '/contact',           'static',  'published', 'Contactez QuickGo',                                'Nos équipes sont disponibles pour vous aider.',                0, 0, 76, 'QuickGo'),
  ('Blog QuickGo',                 '/blog',              'blog',    'published', 'Blog QuickGo — Actualités et Insights',             'Découvrez les dernières actualités de QuickGo.',              0, 0, 80, 'QuickGo')
ON CONFLICT (slug) DO NOTHING;

-- ── CONTENT BLOCKS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_blocks (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id     UUID        NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  page_name   TEXT,
  name        TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'text'
                          CHECK (type IN ('hero','grid','cta','social','banner','form','text','media')),
  enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
  content     JSONB       NOT NULL DEFAULT '{}',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocks_public_read" ON public.content_blocks;
CREATE POLICY "blocks_public_read" ON public.content_blocks
  FOR SELECT USING (
    enabled = TRUE AND EXISTS (
      SELECT 1 FROM public.cms_pages p WHERE p.id = page_id AND p.status = 'published'
    )
  );

DROP POLICY IF EXISTS "blocks_admin_all" ON public.content_blocks;
CREATE POLICY "blocks_admin_all" ON public.content_blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP TRIGGER IF EXISTS trg_content_blocks_updated_at ON public.content_blocks;
CREATE TRIGGER trg_content_blocks_updated_at
  BEFORE UPDATE ON public.content_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS blocks_page_idx ON public.content_blocks (page_id, sort_order);

-- Seed homepage blocks
DO $$
DECLARE v_home_id UUID;
BEGIN
  SELECT id INTO v_home_id FROM public.cms_pages WHERE slug = '/';
  IF v_home_id IS NOT NULL THEN
    INSERT INTO public.content_blocks (page_id, page_name, name, type, enabled, sort_order) VALUES
      (v_home_id, 'Page d''accueil', 'Hero Banner',      'hero',   true,  1),
      (v_home_id, 'Page d''accueil', 'Features Section', 'grid',   true,  2),
      (v_home_id, 'Page d''accueil', 'App Download CTA', 'cta',    true,  3),
      (v_home_id, 'Page d''accueil', 'Testimonials',     'social', false, 4)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ── BLOG POSTS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id               UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  title            TEXT        NOT NULL,
  slug             TEXT        UNIQUE NOT NULL,
  excerpt          TEXT,
  content          TEXT,
  author_name      TEXT        NOT NULL DEFAULT 'QuickGo Team',
  author_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  category         TEXT        NOT NULL DEFAULT 'general',
  image_url        TEXT,
  read_time        TEXT        DEFAULT '5 min',
  status           TEXT        NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('published','draft','archived')),
  published_at     TIMESTAMPTZ,
  views            INTEGER     NOT NULL DEFAULT 0,
  seo_title        TEXT,
  meta_description TEXT,
  og_image         TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_posts_public_read" ON public.blog_posts;
CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "blog_posts_admin_all" ON public.blog_posts;
CREATE POLICY "blog_posts_admin_all" ON public.blog_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS blog_slug_idx     ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_status_idx   ON public.blog_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS blog_category_idx ON public.blog_posts (category, status);

ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_posts;

-- Seed initial blog posts
INSERT INTO public.blog_posts (title, slug, excerpt, author_name, category, read_time, status, published_at, seo_title, meta_description) VALUES
(
  'QuickGo lève 5 millions USD pour accélérer son expansion',
  'quickgo-levee-fonds-5-millions',
  'Notre dernière levée de fonds va nous permettre d''étendre nos services à 10 nouvelles villes africaines.',
  'Marc Essomba', 'Entreprise', '5 min', 'published', NOW() - INTERVAL '26 days',
  'QuickGo lève 5 millions USD — Expansion africaine | QuickGo',
  'QuickGo annonce une levée de fonds de 5 millions USD pour son expansion dans 10 nouvelles villes africaines.'
),
(
  'Comment QuickGo Pay révolutionne les paiements au Cameroun',
  'quickgo-pay-paiements-cameroun',
  'Découvrez comment notre portefeuille électronique simplifie les transactions quotidiennes.',
  'Sarah Ngo', 'Produit', '4 min', 'published', NOW() - INTERVAL '31 days',
  'QuickGo Pay — Paiements mobiles au Cameroun | QuickGo',
  'Comment QuickGo Pay révolutionne les paiements mobiles et les transactions quotidiennes au Cameroun.'
),
(
  'Nos livreurs : les héros du quotidien',
  'livreurs-heros-quotidien',
  'Rencontrez les hommes et femmes qui font de QuickGo une réalité chaque jour.',
  'Paul Kamga', 'Communauté', '6 min', 'published', NOW() - INTERVAL '36 days',
  'Les livreurs QuickGo — Héros du quotidien | QuickGo',
  'Découvrez les histoires inspirantes des livreurs QuickGo qui travaillent chaque jour pour vous servir.'
),
(
  'L''IA au service de la livraison : notre vision',
  'ia-livraison-vision',
  'Comment l''intelligence artificielle optimise nos opérations et améliore l''expérience client.',
  'Paul Kamga', 'Technologie', '7 min', 'published', NOW() - INTERVAL '43 days',
  'Intelligence Artificielle et Livraison — Vision QuickGo | QuickGo',
  'Comment l''intelligence artificielle optimise les opérations de livraison et améliore l''expérience client chez QuickGo.'
),
(
  'Partenariat avec les commerçants locaux',
  'partenariat-commercants-locaux',
  'Notre engagement pour soutenir l''économie locale et les entrepreneurs camerounais.',
  'Céline Mbarga', 'Partenaires', '4 min', 'published', NOW() - INTERVAL '51 days',
  'QuickGo et les Commerçants Locaux — Soutenir l''Économie | QuickGo',
  'QuickGo s''engage à soutenir les commerçants locaux et les entrepreneurs camerounais dans leur développement numérique.'
),
(
  'Lancement de QuickGo à Bafoussam',
  'lancement-quickgo-bafoussam',
  'QuickGo est désormais disponible dans la capitale de l''Ouest. Découvrez nos premières impressions.',
  'Marc Essomba', 'Expansion', '3 min', 'published', NOW() - INTERVAL '56 days',
  'QuickGo Lance à Bafoussam — Livraison dans l''Ouest Cameroun | QuickGo',
  'QuickGo est maintenant disponible à Bafoussam. Découvrez nos services de livraison dans la capitale de la région de l''Ouest.'
)
ON CONFLICT (slug) DO NOTHING;

-- ── FAQ ITEMS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.faq_items (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  category    TEXT        NOT NULL DEFAULT 'general',
  question    TEXT        NOT NULL,
  answer      TEXT        NOT NULL,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  views       INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faq_public_read" ON public.faq_items;
CREATE POLICY "faq_public_read" ON public.faq_items
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "faq_admin_all" ON public.faq_items;
CREATE POLICY "faq_admin_all" ON public.faq_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP TRIGGER IF EXISTS trg_faq_items_updated_at ON public.faq_items;
CREATE TRIGGER trg_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS faq_category_idx ON public.faq_items (category, sort_order);

-- Seed FAQ items
INSERT INTO public.faq_items (category, question, answer, sort_order) VALUES
('general', 'Qu''est-ce que QuickGo ?', 'QuickGo est une super application camerounaise qui vous permet de commander des produits de restaurants, supermarchés, pharmacies et boutiques, et de vous les faire livrer rapidement. Nous proposons également des services de paiement mobile et d''assistant IA.', 1),
('general', 'Dans quelles villes QuickGo est-il disponible ?', 'QuickGo est actuellement disponible à Yaoundé, Douala, Bafoussam, Bamenda, Garoua et Maroua. Nous étendons continuellement notre couverture à de nouvelles villes.', 2),
('orders', 'Comment passer une commande ?', 'Téléchargez l''application QuickGo, créez un compte, sélectionnez votre ville, parcourez les commerçants, ajoutez des produits à votre panier et validez votre commande. Vous pouvez suivre votre livraison en temps réel.', 1),
('orders', 'Puis-je annuler ma commande ?', 'Vous pouvez annuler votre commande gratuitement tant qu''elle n''a pas encore été récupérée par le livreur. Une fois en cours de livraison, des frais d''annulation peuvent s''appliquer.', 2),
('orders', 'Y a-t-il un minimum de commande ?', 'Le minimum de commande varie selon les commerçants. Il est généralement de 2 000 FCFA pour les restaurants et peut être plus élevé pour d''autres catégories.', 3),
('delivery', 'Combien coûte la livraison ?', 'Les frais de livraison dépendent de la distance entre le commerçant et votre adresse. Ils sont calculés automatiquement et affichés avant la validation de votre commande. En moyenne, comptez entre 500 et 2 000 FCFA.', 1),
('delivery', 'Quel est le délai de livraison ?', 'Nous visons une livraison en moins de 30 minutes pour les zones urbaines. Le délai exact dépend du type de commande et de la distance, et est affiché lors de la commande.', 2),
('delivery', 'Puis-je suivre ma livraison en temps réel ?', 'Oui ! Une fois votre commande confirmée, vous pouvez suivre en temps réel la position de votre livreur sur une carte interactive dans l''application.', 3),
('payment', 'Quels modes de paiement acceptez-vous ?', 'Nous acceptons Mobile Money (MTN, Orange Money), les cartes bancaires (Visa, Mastercard), le portefeuille QuickGo Pay et le paiement à la livraison (cash).', 1),
('payment', 'Qu''est-ce que QuickGo Pay ?', 'QuickGo Pay est notre portefeuille électronique intégré. Il vous permet de payer vos commandes plus rapidement, de recevoir du cashback et de transférer de l''argent à vos proches.', 2),
('payment', 'Mes paiements sont-ils sécurisés ?', 'Absolument. Nous utilisons des technologies de chiffrement de pointe pour sécuriser toutes vos transactions. Vos informations de paiement sont protégées et ne sont jamais partagées.', 3),
('account', 'Comment créer un compte ?', 'Téléchargez l''application ou visitez notre site web, cliquez sur ''Créer un compte'', entrez votre numéro de téléphone et suivez les instructions pour vérifier votre compte.', 1),
('account', 'Comment modifier mes informations personnelles ?', 'Connectez-vous à votre compte, allez dans ''Paramètres'' puis ''Mon profil''. Vous pouvez y modifier votre nom, adresse email, numéro de téléphone et adresses de livraison.', 2),
('account', 'J''ai oublié mon mot de passe, que faire ?', 'Sur la page de connexion, cliquez sur ''Mot de passe oublié''. Entrez votre numéro de téléphone ou email et suivez les instructions pour réinitialiser votre mot de passe.', 3);

-- ── SEO KEYWORDS ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.seo_keywords (
  id             UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  keyword        TEXT          UNIQUE NOT NULL,
  position       INTEGER,
  prev_position  INTEGER,
  volume         INTEGER       NOT NULL DEFAULT 0,
  difficulty     INTEGER       NOT NULL DEFAULT 0
                               CHECK (difficulty BETWEEN 0 AND 100),
  ctr            NUMERIC(5,2)  NOT NULL DEFAULT 0,
  impressions    INTEGER       NOT NULL DEFAULT 0,
  clicks         INTEGER       NOT NULL DEFAULT 0,
  page_url       TEXT,
  updated_at     TIMESTAMPTZ   DEFAULT NOW(),
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seo_keywords_admin_all" ON public.seo_keywords;
CREATE POLICY "seo_keywords_admin_all" ON public.seo_keywords
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

DROP TRIGGER IF EXISTS trg_seo_keywords_updated_at ON public.seo_keywords;
CREATE TRIGGER trg_seo_keywords_updated_at
  BEFORE UPDATE ON public.seo_keywords
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS seo_keywords_position_idx ON public.seo_keywords (position);

-- Seed keywords
INSERT INTO public.seo_keywords (keyword, position, prev_position, volume, difficulty, ctr, impressions, clicks, page_url) VALUES
('livraison rapide Yaoundé',    2,  5,  1820, 42, 12.4, 14200, 1761, '/'),
('commander repas Douala',      1,  1,  3420, 38, 18.7, 24800, 4638, '/marketplace'),
('livraison Cameroun app',      4,  7,  980,  55, 7.2,  8400,  605,  '/'),
('QuickGo Cameroun',            1,  1,  2100, 15, 32.1, 12600, 4045, '/'),
('devenir livreur Cameroun',    3,  4,  640,  48, 9.8,  5200,  510,  '/become-driver'),
('application livraison Afrique',8, 12, 2840, 68, 3.1,  18400, 570,  '/'),
('restaurant livraison Yaoundé',5,  5,  1240, 52, 6.4,  9800,  627,  '/marketplace'),
('course express Douala',       6,  9,  820,  45, 5.2,  6400,  333,  '/delivery'),
('vendeur en ligne Cameroun',   11, 14, 1680, 62, 2.8,  12200, 342,  '/become-vendor'),
('livreur Bafoussam',           7,  8,  420,  31, 4.9,  3200,  157,  '/livraison/bafoussam'),
('e-commerce Cameroun 2026',    14, 18, 1920, 74, 1.9,  14800, 281,  '/about'),
('paiement mobile Afrique',     18, 22, 4200, 82, 1.2,  28400, 341,  '/')
ON CONFLICT (keyword) DO NOTHING;

-- ── PAGE VIEWS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.page_views (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_url    TEXT        NOT NULL,
  session_id  TEXT,
  referrer    TEXT,
  viewed_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_views_insert" ON public.page_views;
CREATE POLICY "page_views_insert" ON public.page_views
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "page_views_admin_select" ON public.page_views;
CREATE POLICY "page_views_admin_select" ON public.page_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE INDEX IF NOT EXISTS page_views_url_idx  ON public.page_views (page_url, viewed_at DESC);
CREATE INDEX IF NOT EXISTS page_views_time_idx ON public.page_views (viewed_at DESC);
