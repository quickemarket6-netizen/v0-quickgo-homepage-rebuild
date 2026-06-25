-- ============================================================
-- QuickGo — Seed SQL
-- Coller directement dans l'éditeur SQL de Supabase
-- ⚠️  Exécuter en une seule fois (tout sélectionner → Run)
-- ============================================================

-- ── 0. Nettoyage optionnel (décommenter si reset complet) ────────────────────
-- TRUNCATE notifications, reviews, order_items, orders, products, vendor_wallets,
--   drivers, addresses, favorites, cart_items, vendors, categories, profiles
--   RESTART IDENTITY CASCADE;
-- DELETE FROM auth.users WHERE email LIKE '%@quickgo-test.cm';

-- ── 1. Utilisateurs de test ──────────────────────────────────────────────────
-- Crée via auth.users + profile automatique

DO $$
DECLARE
  uid_client1  uuid := gen_random_uuid();
  uid_client2  uuid := gen_random_uuid();
  uid_client3  uuid := gen_random_uuid();
  uid_vendor1  uuid := gen_random_uuid();
  uid_vendor2  uuid := gen_random_uuid();
  uid_vendor3  uuid := gen_random_uuid();
  uid_vendor4  uuid := gen_random_uuid();
  uid_vendor5  uuid := gen_random_uuid();
  uid_vendor6  uuid := gen_random_uuid();
  uid_driver1  uuid := gen_random_uuid();
  uid_driver2  uuid := gen_random_uuid();
  uid_admin    uuid := gen_random_uuid();
  v_id1 uuid; v_id2 uuid; v_id3 uuid; v_id4 uuid; v_id5 uuid; v_id6 uuid;
BEGIN

-- ── auth.users ──────────────────────────────────────────────────────────────
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_user_meta_data, created_at, updated_at)
VALUES
  (uid_client1, 'client1@quickgo-test.cm', crypt('QuickGo2026!', gen_salt('bf')), now(), 'authenticated', '{"full_name":"Alain Mbarga","role":"client"}',     now(), now()),
  (uid_client2, 'client2@quickgo-test.cm', crypt('QuickGo2026!', gen_salt('bf')), now(), 'authenticated', '{"full_name":"Marie Ngo Bello","role":"client"}',   now(), now()),
  (uid_client3, 'client3@quickgo-test.cm', crypt('QuickGo2026!', gen_salt('bf')), now(), 'authenticated', '{"full_name":"Jean-Pierre Kamga","role":"client"}', now(), now()),
  (uid_vendor1, 'vendor1@quickgo-test.cm', crypt('QuickGo2026!', gen_salt('bf')), now(), 'authenticated', '{"full_name":"Ngando Mama","role":"vendor"}',        now(), now()),
  (uid_vendor2, 'vendor2@quickgo-test.cm', crypt('QuickGo2026!', gen_salt('bf')), now(), 'authenticated', '{"full_name":"Pharmacie Centrale","role":"vendor"}', now(), now()),
  (uid_vendor3, 'vendor3@quickgo-test.cm', crypt('QuickGo2026!', gen_salt('bf')), now(), 'authenticated', '{"full_name":"SuperMarchéPlus","role":"vendor"}',    now(), now()),
  (uid_vendor4, 'vendor4@quickgo-test.cm', crypt('QuickGo2026!', gen_salt('bf')), now(), 'authenticated', '{"full_name":"Wax Fashion","role":"vendor"}',        now(), now()),
  (uid_vendor5, 'vendor5@quickgo-test.cm', crypt('QuickGo2026!', gen_salt('bf')), now(), 'authenticated', '{"full_name":"TechCity Store","role":"vendor"}',     now(), now()),
  (uid_vendor6, 'vendor6@quickgo-test.cm', crypt('QuickGo2026!', gen_salt('bf')), now(), 'authenticated', '{"full_name":"BeautyQueen Shop","role":"vendor"}',   now(), now()),
  (uid_driver1, 'driver1@quickgo-test.cm', crypt('QuickGo2026!', gen_salt('bf')), now(), 'authenticated', '{"full_name":"Brice Ondoua","role":"driver"}',       now(), now()),
  (uid_driver2, 'driver2@quickgo-test.cm', crypt('QuickGo2026!', gen_salt('bf')), now(), 'authenticated', '{"full_name":"Stève Nkoulou","role":"driver"}',      now(), now()),
  (uid_admin,   'admin@quickgo-test.cm',   crypt('QuickGo2026!', gen_salt('bf')), now(), 'authenticated', '{"full_name":"Admin QuickGo","role":"admin"}',       now(), now())
ON CONFLICT (email) DO NOTHING;

-- ── profiles ─────────────────────────────────────────────────────────────────
INSERT INTO profiles (id, full_name, email, role, city, is_verified)
VALUES
  (uid_client1, 'Alain Mbarga',      'client1@quickgo-test.cm', 'client',     'Yaoundé', true),
  (uid_client2, 'Marie Ngo Bello',   'client2@quickgo-test.cm', 'client',     'Douala',  true),
  (uid_client3, 'Jean-Pierre Kamga', 'client3@quickgo-test.cm', 'client',     'Bafoussam', true),
  (uid_vendor1, 'Ngando Mama',       'vendor1@quickgo-test.cm', 'vendor',     'Yaoundé', true),
  (uid_vendor2, 'Pharmacie Centrale','vendor2@quickgo-test.cm', 'vendor',     'Yaoundé', true),
  (uid_vendor3, 'SuperMarchéPlus',   'vendor3@quickgo-test.cm', 'vendor',     'Douala',  true),
  (uid_vendor4, 'Wax Fashion',       'vendor4@quickgo-test.cm', 'vendor',     'Douala',  true),
  (uid_vendor5, 'TechCity Store',    'vendor5@quickgo-test.cm', 'vendor',     'Douala',  true),
  (uid_vendor6, 'BeautyQueen Shop',  'vendor6@quickgo-test.cm', 'vendor',     'Yaoundé', true),
  (uid_driver1, 'Brice Ondoua',      'driver1@quickgo-test.cm', 'driver',     'Yaoundé', true),
  (uid_driver2, 'Stève Nkoulou',     'driver2@quickgo-test.cm', 'driver',     'Yaoundé', true),
  (uid_admin,   'Admin QuickGo',     'admin@quickgo-test.cm',   'admin',      'Yaoundé', true)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, city = EXCLUDED.city;

-- ── categories ────────────────────────────────────────────────────────────────
INSERT INTO categories (name, slug, icon, color, is_active, sort_order)
VALUES
  ('Restaurants & Repas', 'restaurants',   '🍽️',  '#FF6B35', true, 1),
  ('Pharmacies',          'pharmacies',    '💊',  '#10B981', true, 2),
  ('Supermarchés',        'supermarcheS',  '🛒',  '#3B82F6', true, 3),
  ('Mode & Vêtements',    'mode',          '👗',  '#8B5CF6', true, 4),
  ('Électronique',        'electronique',  '📱',  '#0EA5E9', true, 5),
  ('Beauté & Soins',      'beaute',        '💄',  '#EC4899', true, 6),
  ('Sport & Fitness',     'sport',         '⚽',  '#F59E0B', true, 7),
  ('Maison & Décoration', 'maison',        '🏠',  '#14B8A6', true, 8),
  ('Livraison Express',   'livraison',     '🚀',  '#C8FF00', true, 9),
  ('Services',            'services',      '🔧',  '#6B7280', true, 10)
ON CONFLICT (slug) DO NOTHING;

-- ── vendors ───────────────────────────────────────────────────────────────────
INSERT INTO vendors (owner_id, name, slug, description, category, city, address, phone, email,
  rating, review_count, is_active, is_verified, delivery_time_min, delivery_time_max,
  min_order, commission_rate, delivery_fee, status)
VALUES
  (uid_vendor1, 'Chez Mama Ngando', 'chez-mama-ngando',
   'Cuisine camerounaise authentique : Ndolé, Poulet DG, Eru, Soya grillé et bien plus.',
   'restaurants', 'Yaoundé', 'Carrefour Obili, Yaoundé Centre', '+237 699 111 222',
   'mamangando@quickgo-test.cm', 4.8, 247, true, true, 20, 40, 2000, 0.08, 500, 'active'),

  (uid_vendor2, 'Pharmacie Centrale Bastos', 'pharmacie-centrale-bastos',
   'Médicaments, parapharmacie, cosmétiques et conseils santé. Ouverts 7j/7.',
   'pharmacies', 'Yaoundé', 'Avenue Charles de Gaulle, Bastos', '+237 677 333 444',
   'pharmacie.bastos@quickgo-test.cm', 4.6, 89, true, true, 15, 30, 1000, 0.05, 300, 'active'),

  (uid_vendor3, 'SuperMarchéPlus Akwa', 'supermarche-plus-akwa',
   'Grande surface avec produits locaux et importés. Épicerie, boissons, frais.',
   'supermarcheS', 'Douala', 'Rue Joss, Akwa, Douala', '+237 655 555 666',
   'superplus.akwa@quickgo-test.cm', 4.4, 312, true, true, 25, 50, 3000, 0.06, 700, 'active'),

  (uid_vendor4, 'Wax & Fashion Douala', 'wax-fashion-douala',
   'Wax hollandais, pagne, dashikis, tenues traditionnelles et modernes.',
   'mode', 'Douala', 'Marché Central, Deido, Douala', '+237 698 777 888',
   'waxfashion@quickgo-test.cm', 4.7, 156, true, true, 30, 60, 5000, 0.10, 1000, 'active'),

  (uid_vendor5, 'TechCity Electronics', 'techcity-electronics',
   'Smartphones, accessoires, ordinateurs. Samsung, Tecno, Itel, iPhone.',
   'electronique', 'Douala', 'Bonanjo Business Center, Douala', '+237 677 999 000',
   'techcity@quickgo-test.cm', 4.5, 203, true, true, 20, 45, 10000, 0.07, 500, 'active'),

  (uid_vendor6, 'BeautyQueen Yaoundé', 'beautyqueen-yaounde',
   'Cosmétiques naturels africains, karité, huiles essentielles, perruques.',
   'beaute', 'Yaoundé', 'Centre Commercial Nlongkak, Yaoundé', '+237 691 234 567',
   'beautyqueen@quickgo-test.cm', 4.9, 418, true, true, 15, 35, 2500, 0.09, 400, 'active')
ON CONFLICT (slug) DO NOTHING;

-- Récupérer les IDs des vendors fraichement insérés
SELECT id INTO v_id1 FROM vendors WHERE slug = 'chez-mama-ngando' LIMIT 1;
SELECT id INTO v_id2 FROM vendors WHERE slug = 'pharmacie-centrale-bastos' LIMIT 1;
SELECT id INTO v_id3 FROM vendors WHERE slug = 'supermarche-plus-akwa' LIMIT 1;
SELECT id INTO v_id4 FROM vendors WHERE slug = 'wax-fashion-douala' LIMIT 1;
SELECT id INTO v_id5 FROM vendors WHERE slug = 'techcity-electronics' LIMIT 1;
SELECT id INTO v_id6 FROM vendors WHERE slug = 'beautyqueen-yaounde' LIMIT 1;

-- ── vendor_wallets ────────────────────────────────────────────────────────────
INSERT INTO vendor_wallets (vendor_id, available_balance, pending_balance, total_earned, total_withdrawn)
VALUES
  (v_id1, 87500,  12000, 385000,  200000),
  (v_id2, 45000,  5500,  210000,  120000),
  (v_id3, 135000, 22000, 620000,  350000),
  (v_id4, 68000,  8000,  290000,  150000),
  (v_id5, 98000,  15000, 480000,  280000),
  (v_id6, 156000, 18000, 710000,  380000)
ON CONFLICT (vendor_id) DO UPDATE
  SET available_balance = EXCLUDED.available_balance,
      total_earned = EXCLUDED.total_earned;

-- ── drivers ───────────────────────────────────────────────────────────────────
INSERT INTO drivers (user_id, status, vehicle_type, vehicle_brand, vehicle_model,
  license_plate, license_number, rating, total_deliveries, total_earnings,
  city, is_verified, is_online, current_latitude, current_longitude)
VALUES
  (uid_driver1, 'online', 'moto',    'Honda',  'CBF 125',  'LT-1234-YA', 'LIC-2024-001', 4.7, 200, 430000, 'Yaoundé', true, true, 3.8480, 11.5021),
  (uid_driver2, 'online', 'voiture', 'Toyota', 'Corolla',  'CE-5678-DL', 'LIC-2024-002', 4.9, 350, 780000, 'Yaoundé', true, true, 3.8520, 11.5060)
ON CONFLICT (user_id) DO NOTHING;

-- ── products — Restaurant Mama Ngando ─────────────────────────────────────────
INSERT INTO products (vendor_id, name, description, price, category, stock, is_available, rating, review_count, tags)
VALUES
  (v_id1, 'Ndolé au Poisson',           'Ndolé traditionnel aux crevettes et poisson fumé. Servi avec riz ou miondo.',          3500, 'restaurants', 50, true, 4.9, 89, ARRAY['ndolé','plat principal','camerounais']),
  (v_id1, 'Poulet DG',                  'Poulet braisé sauté aux légumes, tomates et épices. Le plat signature camerounais.',   4500, 'restaurants', 30, true, 4.8, 76, ARRAY['poulet','plat principal']),
  (v_id1, 'Eru & Waterleaf',            'Eru à la feuille de waterleaf, cru, palme, viande fumée. Spécialité de l''Ouest.',     3000, 'restaurants', 20, true, 4.7, 54, ARRAY['eru','plat principal']),
  (v_id1, 'Soya Grillé (5 brochettes)', 'Soya de bœuf mariné aux épices locales, grillé sur charbon. Sauce pimentée.',         2000, 'restaurants', 100, true, 4.9, 142, ARRAY['soya','brochette','street food']),
  (v_id1, 'Beignets Haricot (10 pcs)',  'Beignets de haricot frits croustillants. Snack typique camerounais.',                  800,  'restaurants', 200, true, 4.6, 67, ARRAY['beignet','snack']),
  (v_id1, 'Jus de Bissap',              'Jus d''hibiscus frais, sucré naturellement, servi froid. 50cl.',                       500,  'restaurants', 80, true, 4.5, 45, ARRAY['boisson','jus']),
  (v_id1, 'Koki & Plantain',            'Galette de haricot cuite à la vapeur avec banane plantain bouillie.',                  1500, 'restaurants', 40, true, 4.8, 58, ARRAY['koki','plat principal']),
  (v_id1, 'Puff-Puff (12 pcs)',         'Beignets moelleux sucrés, dorés à la perfection.',                                    600,  'restaurants', 150, true, 4.7, 103, ARRAY['puff-puff','snack']),
  (v_id1, 'Okok aux Pistaches',         'Feuilles d''okok cuites avec des pistaches et du crabe. Spécialité de l''Est.',       3200, 'restaurants', 25, true, 4.6, 38, ARRAY['okok','plat principal']),
  (v_id1, 'Thiéboudienne',              'Riz au poisson à la sénégalaise avec légumes variés.',                                 2800, 'restaurants', 35, true, 4.5, 29, ARRAY['riz','poisson'])
ON CONFLICT (vendor_id, name) DO NOTHING;

-- ── products — Pharmacie ──────────────────────────────────────────────────────
INSERT INTO products (vendor_id, name, description, price, category, stock, is_available, rating, review_count, tags)
VALUES
  (v_id2, 'Paracétamol 500mg (16 cp)',    'Antalgique et antipyrétique. Soulage fièvre et douleurs légères à modérées.',     300,  'pharmacies', 500, true, 4.8, 211, ARRAY['douleur','fièvre','générique']),
  (v_id2, 'Coartem 6 comprimés',          'Antipaludéen de référence. Traitement première ligne du paludisme.',              3500, 'pharmacies', 200, true, 4.9, 178, ARRAY['paludisme','antipaludéen']),
  (v_id2, 'Vitamine C 1000mg (30 cp)',    'Complément alimentaire. Renforce l''immunité et combat la fatigue.',              2200, 'pharmacies', 150, true, 4.7, 92,  ARRAY['vitamine','immunité']),
  (v_id2, 'Amoxicilline 500mg (21 gél.)', 'Antibiotique à spectre large. Sur ordonnance médicale uniquement.',              1800, 'pharmacies', 100, true, 4.6, 65,  ARRAY['antibiotique','infection']),
  (v_id2, 'Gel Hydroalcoolique 500ml',    'Désinfectant mains. Efficace contre 99,9% bactéries et virus.',                  1500, 'pharmacies', 300, true, 4.5, 134, ARRAY['hygiène','désinfectant']),
  (v_id2, 'Doliprane Enfant Suspension',  'Paracétamol pédiatrique 2,4%. Sirop antipyrétique pour enfants.',                1200, 'pharmacies', 80,  true, 4.9, 87,  ARRAY['enfant','fièvre','pédiatrique']),
  (v_id2, 'Fer + Acide Folique (30 cp)',  'Supplément fer et folate. Recommandé pendant grossesse et anémie.',              2800, 'pharmacies', 120, true, 4.8, 56,  ARRAY['grossesse','fer']),
  (v_id2, 'Savon Antiseptique 200g',      'Savon nettoyant antiseptique. Protège contre infections cutanées.',              900,  'pharmacies', 200, true, 4.4, 43,  ARRAY['hygiène','antiseptique'])
ON CONFLICT (vendor_id, name) DO NOTHING;

-- ── products — Supermarché ────────────────────────────────────────────────────
INSERT INTO products (vendor_id, name, description, price, compare_price, category, stock, is_available, rating, review_count, tags)
VALUES
  (v_id3, 'Riz Long Grain 5kg',           'Riz parfumé qualité supérieure. Idéal toutes préparations.',                4500, 5000, 'supermarcheS', 200, true, 4.6, 156, ARRAY['riz','céréales']),
  (v_id3, 'Huile de Palme Rousse 5L',     'Huile de palme traditionnelle camerounaise. Indispensable cuisine locale.', 8000, 9000, 'supermarcheS', 80,  true, 4.8, 98,  ARRAY['huile','palme','cuisine']),
  (v_id3, 'Sucre Blanc 2kg',              'Sucre cristallisé de canne à sucre. Qualité standard.',                    2200, null, 'supermarcheS', 300, true, 4.4, 67,  ARRAY['sucre']),
  (v_id3, 'Lait en Poudre Nido 400g',     'Lait enrichi en vitamines A, C, D. Pour toute la famille.',                3800, 4200, 'supermarcheS', 120, true, 4.7, 112, ARRAY['lait','nido']),
  (v_id3, 'Sardines Sauce Tomate 425g',   'Conserve sardines sauce tomate. Protéines pratiques et économiques.',      1200, null, 'supermarcheS', 500, true, 4.3, 78,  ARRAY['conserve','protéine']),
  (v_id3, 'Farine de Maïs 1kg',           'Farine maïs jaune pour bouillie, couscous et bâton de manioc.',           800,  null, 'supermarcheS', 400, true, 4.6, 89,  ARRAY['maïs','farine','local']),
  (v_id3, 'Café Nescafé Classic 200g',    'Café soluble Nescafé. Le petit déjeuner des Camerounais.',                 4500, 5000, 'supermarcheS', 150, true, 4.7, 134, ARRAY['café','boisson']),
  (v_id3, 'Eau Minérale 6×1,5L',         'Pack 6 bouteilles eau minérale naturelle des monts camerounais.',          3600, null, 'supermarcheS', 200, true, 4.5, 201, ARRAY['eau','boisson']),
  (v_id3, 'Lessive OMO Confort 1kg',      'Lessive poudre linge blanc et coloré. Formule anti-taches.',              1800, 2200, 'supermarcheS', 250, true, 4.4, 76,  ARRAY['lessive','ménage']),
  (v_id3, 'Beurre de Cacao 200g',         'Beurre pur cacao camerounais non raffiné. Cuisine et soins.',             2500, null, 'supermarcheS', 90,  true, 4.9, 45,  ARRAY['cacao','local'])
ON CONFLICT (vendor_id, name) DO NOTHING;

-- ── products — Mode & Fashion ─────────────────────────────────────────────────
INSERT INTO products (vendor_id, name, description, price, compare_price, category, stock, is_available, rating, review_count, tags)
VALUES
  (v_id4, 'Wax Hollandais 6 Yards',        'Tissu wax 100% coton hollandais. Motifs traditionnels africains.',        18000, 22000, 'mode', 50, true, 4.8, 89, ARRAY['wax','tissu']),
  (v_id4, 'Dashiki Homme Brodé',           'Chemise dashiki africaine brodée main. Légère et confortable. S-XXL.',    8500,  null,  'mode', 30, true, 4.7, 65, ARRAY['dashiki','homme']),
  (v_id4, 'Ensemble Wax Femme',            'Ensemble deux pièces wax imprimé. Couture artisanale camerounaise.',      15000, 18000, 'mode', 25, true, 4.9, 112, ARRAY['wax','femme']),
  (v_id4, 'Pagne Velours Doublé 5m',       'Pagne velours qualité supérieure. Idéal tenues de cérémonie.',           12000, null,  'mode', 40, true, 4.6, 54, ARRAY['pagne','cérémonie']),
  (v_id4, 'Boubou Grand Complet',          'Boubou traditionnel bazin riche. Broderies dorées. Grandes occasions.',   35000, 45000, 'mode', 15, true, 4.9, 38, ARRAY['boubou','bazin']),
  (v_id4, 'Sandales Artisanales Cuir',     'Sandales tressées cuir véritable. Fabrication locale. Confort.',          9000,  11000, 'mode', 60, true, 4.7, 76, ARRAY['sandales','cuir']),
  (v_id4, 'Sac à Main Wax',               'Sac cabas tissu wax renforcé avec poignées cuir. Design africain.',       11000, null,  'mode', 35, true, 4.8, 67, ARRAY['sac','wax']),
  (v_id4, 'Ceinture Perles Traditionelle', 'Ceinture de perles colorées, artisanat Bamoun.',                         4500,  null,  'mode', 80, true, 4.5, 43, ARRAY['perles','artisanat'])
ON CONFLICT (vendor_id, name) DO NOTHING;

-- ── products — Électronique ───────────────────────────────────────────────────
INSERT INTO products (vendor_id, name, description, price, compare_price, category, stock, is_available, rating, review_count, tags)
VALUES
  (v_id5, 'Tecno Camon 30 Pro',          '6.67" AMOLED, 256Go, 8Go RAM, 64Mp. Caméra IA. Garantie 12 mois.',       185000, 210000, 'electronique', 30,  true, 4.6, 78,  ARRAY['smartphone','tecno']),
  (v_id5, 'Samsung Galaxy A55',          'Écran 6.6" Super AMOLED, 128Go, 8Go RAM. 50Mp. Double SIM.',             220000, 250000, 'electronique', 20,  true, 4.7, 91,  ARRAY['samsung','smartphone']),
  (v_id5, 'Itel P55+ 8Go/256Go',         'Smartphone robuste. Grande batterie 5000mAh. Interface fluide.',          75000,  85000,  'electronique', 50,  true, 4.4, 56,  ARRAY['itel','économique']),
  (v_id5, 'Écouteurs Bluetooth JBL',     'JBL Tune 510BT. 40h autonomie. Son JBL pur et puissant.',                28000,  35000,  'electronique', 40,  true, 4.8, 134, ARRAY['jbl','audio']),
  (v_id5, 'Chargeur Rapide 65W USB-C',   'Chargeur GaN 65W. Compatible iPhone, Samsung, Tecno. 2 ports.',          12000,  null,   'electronique', 80,  true, 4.6, 87,  ARRAY['chargeur','USB-C']),
  (v_id5, 'Batterie Externe 20000mAh',   'Power bank 20000mAh, 2 USB + USB-C. Charge rapide. Voyage.',             18000,  22000,  'electronique', 60,  true, 4.7, 109, ARRAY['power bank','voyage']),
  (v_id5, 'Coque Renforcée iPhone 15',   'Coque antichoc grade militaire. Bords surélevés. Protège des chutes.',   8500,   12000,  'electronique', 100, true, 4.5, 65,  ARRAY['iphone','coque']),
  (v_id5, 'Câble HDMI 2.0 (2m)',         'Câble HDMI certifié 4K@60Hz. Idéal TV, projecteur, moniteur.',           4500,   null,   'electronique', 120, true, 4.4, 43,  ARRAY['HDMI','câble'])
ON CONFLICT (vendor_id, name) DO NOTHING;

-- ── products — Beauté ─────────────────────────────────────────────────────────
INSERT INTO products (vendor_id, name, description, price, compare_price, category, stock, is_available, rating, review_count, tags)
VALUES
  (v_id6, 'Beurre de Karité Pur 500g',   'Beurre karité non raffiné du Cameroun. Hydratation intense peau et cheveux.', 5500,  7000,  'beaute', 150, true, 4.9, 234, ARRAY['karité','hydratation','naturel']),
  (v_id6, 'Huile de Coco Vierge 250ml',  'Huile noix de coco pressée à froid. Multi-usages : peau, cheveux, cuisine.',  4000,  null,  'beaute', 100, true, 4.8, 178, ARRAY['coco','huile','naturel']),
  (v_id6, 'Savon Noir Beldi 200g',       'Savon noir naturel africain à l''huile d''olive. Exfoliant profond.',          2500,  3000,  'beaute', 200, true, 4.9, 312, ARRAY['savon noir','exfoliant']),
  (v_id6, 'Crème Unifiante Carotène',    'Crème teint unifiant carotte et vitamine E. Sans mercure, sans hydroquinone.', 6500,  8000,  'beaute', 80,  true, 4.6, 156, ARRAY['crème','unifiant']),
  (v_id6, 'Perruque Lace Front 18"',     'Perruque brésilienne lace front naturelle. Densité 150%.',                     45000, 55000, 'beaute', 30,  true, 4.7, 89,  ARRAY['perruque','cheveux']),
  (v_id6, 'Huile de Ricin Noire 200ml',  'Huile de ricin 100% pure. Stimule pousse cheveux et renforce les cils.',       3500,  null,  'beaute', 120, true, 4.8, 143, ARRAY['ricin','cheveux','pousse']),
  (v_id6, 'Kit Manucure Professionnel',  'Set 12 pièces : lime, coupe-ongles, repousse-cuticules, tampon brillant.',     7500,  10000, 'beaute', 60,  true, 4.5, 76,  ARRAY['manucure','ongles']),
  (v_id6, 'Shampoing African Pride',     'Shampoing nourrissant moringa et karité. Pour cheveux secs et crépus.',        4800,  5500,  'beaute', 90,  true, 4.7, 112, ARRAY['shampoing','cheveux','naturel'])
ON CONFLICT (vendor_id, name) DO NOTHING;

-- ── addresses ─────────────────────────────────────────────────────────────────
INSERT INTO addresses (user_id, label, street, district, city, lat, lng, is_default)
VALUES
  (uid_client1, 'Domicile', 'Rue Mballa II',        'Bastos',    'Yaoundé', 3.8780, 11.5221, true),
  (uid_client1, 'Bureau',   'Immeuble BEAC',         'Centre-Ville', 'Yaoundé', 3.8620, 11.5080, false),
  (uid_client2, 'Domicile', 'Rue Kitchener',         'Akwa',      'Douala',  4.0511, 9.7085,  true),
  (uid_client2, 'Bureau',   'Zone Portuaire',        'Bonabéri',  'Douala',  4.0622, 9.6920,  false),
  (uid_client3, 'Domicile', 'Carrefour Commercial',  'Bafoussam', 'Bafoussam', 5.4758, 10.4175, true)
ON CONFLICT DO NOTHING;

-- ── orders ────────────────────────────────────────────────────────────────────
WITH order_data AS (
  INSERT INTO orders (
    order_number, customer_id, vendor_id, driver_id, status,
    items, subtotal, delivery_fee, discount, total,
    delivery_address, payment_method, payment_status, estimated_delivery_at, delivered_at
  )
  VALUES
    (
      'QG-2026-A001', uid_client1, v_id1, uid_driver1, 'delivered',
      '[{"product":"Ndolé au Poisson","qty":1,"price":3500},{"product":"Poulet DG","qty":1,"price":4500}]',
      8000, 500, 0, 8500,
      '{"street":"Rue Mballa II","district":"Bastos","city":"Yaoundé"}',
      'orange_money', 'paid',
      now() - interval '2 days', now() - interval '2 days' + interval '35 minutes'
    ),
    (
      'QG-2026-A002', uid_client1, v_id6, uid_driver2, 'delivered',
      '[{"product":"Beurre de Karité Pur 500g","qty":2,"price":5500},{"product":"Savon Noir Beldi 200g","qty":3,"price":2500}]',
      18500, 400, 0, 18900,
      '{"street":"Rue Mballa II","district":"Bastos","city":"Yaoundé"}',
      'mtn_momo', 'paid',
      now() - interval '5 days', now() - interval '5 days' + interval '28 minutes'
    ),
    (
      'QG-2026-B001', uid_client2, v_id3, uid_driver1, 'delivered',
      '[{"product":"Riz Long Grain 5kg","qty":2,"price":4500},{"product":"Huile de Palme Rousse 5L","qty":1,"price":8000}]',
      17000, 700, 0, 17700,
      '{"street":"Rue Kitchener","district":"Akwa","city":"Douala"}',
      'wave', 'paid',
      now() - interval '3 days', now() - interval '3 days' + interval '45 minutes'
    ),
    (
      'QG-2026-B002', uid_client2, v_id5, uid_driver2, 'delivered',
      '[{"product":"Écouteurs Bluetooth JBL","qty":1,"price":28000}]',
      28000, 500, 0, 28500,
      '{"street":"Rue Kitchener","district":"Akwa","city":"Douala"}',
      'orange_money', 'paid',
      now() - interval '7 days', now() - interval '7 days' + interval '32 minutes'
    ),
    (
      'QG-2026-C001', uid_client3, v_id2, null, 'preparing',
      '[{"product":"Paracétamol 500mg (16 cp)","qty":3,"price":300},{"product":"Vitamine C 1000mg (30 cp)","qty":1,"price":2200}]',
      3100, 300, 0, 3400,
      '{"street":"Carrefour Commercial","district":"Bafoussam","city":"Bafoussam"}',
      'cash', 'pending',
      now() + interval '25 minutes', null
    ),
    (
      'QG-2026-C002', uid_client1, v_id4, null, 'confirmed',
      '[{"product":"Wax Hollandais 6 Yards","qty":1,"price":18000}]',
      18000, 1000, 0, 19000,
      '{"street":"Rue Mballa II","district":"Bastos","city":"Yaoundé"}',
      'mtn_momo', 'paid',
      now() + interval '50 minutes', null
    )
  RETURNING id, customer_id, vendor_id, status
)
SELECT id FROM order_data;

-- ── reviews (sur les commandes livrées) ──────────────────────────────────────
INSERT INTO reviews (order_id, customer_id, vendor_id, rating, comment)
SELECT
  o.id, o.customer_id, o.vendor_id,
  CASE WHEN o.order_number = 'QG-2026-A001' THEN 5
       WHEN o.order_number = 'QG-2026-A002' THEN 5
       WHEN o.order_number = 'QG-2026-B001' THEN 4
       WHEN o.order_number = 'QG-2026-B002' THEN 5
       ELSE 4
  END,
  CASE WHEN o.order_number = 'QG-2026-A001' THEN 'Ndolé excellent, livraison ultra-rapide ! Je recommande vivement Mama Ngando.'
       WHEN o.order_number = 'QG-2026-A002' THEN 'Beurre de karité de qualité supérieure. Emballage soigné, livré en 25 min.'
       WHEN o.order_number = 'QG-2026-B001' THEN 'Très bons produits, conformes à la description. Le livreur était ponctuel.'
       WHEN o.order_number = 'QG-2026-B002' THEN 'JBL parfait, son exceptionnel. Livraison rapide et emballage protecteur.'
       ELSE 'Bonne expérience globale. Je commanderai de nouveau sur QuickGo.'
  END
FROM orders o
WHERE o.order_number IN ('QG-2026-A001','QG-2026-A002','QG-2026-B001','QG-2026-B002')
ON CONFLICT DO NOTHING;

-- ── notifications ──────────────────────────────────────────────────────────────
INSERT INTO notifications (user_id, type, title, body, is_read)
VALUES
  (uid_client1, 'order_update', 'Commande confirmée ✅',    'Votre commande QG-2026-A001 a été confirmée. Préparation en cours.', true),
  (uid_client1, 'delivery',     'Livreur en route 🏍️',    'Brice est en chemin avec votre commande. Arrivée estimée : 15 min.', true),
  (uid_client1, 'promo',        'Offre spéciale -20% 🎉',   'Profitez de -20% sur votre prochaine commande avec le code QUICKGO20.', false),
  (uid_client2, 'order_update', 'Commande livrée 🎁',       'Votre commande QG-2026-B001 a bien été livrée. Donnez votre avis !', true),
  (uid_client2, 'cashback',     'Cashback crédité 💰',      'Vous avez reçu 850 FCFA de cashback sur votre dernière commande.', false),
  (uid_client3, 'order_update', 'Commande en préparation 🍳','Votre commande QG-2026-C001 est en cours de préparation.', false),
  (uid_driver1, 'mission',      'Nouvelle mission disponible','Livrez 10 commandes ce week-end et gagnez 5 000 FCFA en bonus.', false),
  (uid_vendor1, 'payout',       'Paiement effectué 💸',     'Un virement de 50 000 FCFA a été effectué sur votre Orange Money.', true);

END $$;

-- ── Résultat ──────────────────────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM auth.users   WHERE email LIKE '%@quickgo-test.cm') AS users,
  (SELECT COUNT(*) FROM categories)  AS categories,
  (SELECT COUNT(*) FROM vendors)     AS vendors,
  (SELECT COUNT(*) FROM products)    AS products,
  (SELECT COUNT(*) FROM orders)      AS orders,
  (SELECT COUNT(*) FROM reviews)     AS reviews,
  (SELECT COUNT(*) FROM drivers)     AS drivers,
  (SELECT COUNT(*) FROM notifications WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@quickgo-test.cm'
  )) AS notifications;

-- ── Comptes de test ───────────────────────────────────────────────────────────
-- 👤 Clients   : client1@quickgo-test.cm / client2@quickgo-test.cm / client3@quickgo-test.cm
-- 🏪 Vendeurs  : vendor1@quickgo-test.cm … vendor6@quickgo-test.cm
-- 🏍️  Livreurs  : driver1@quickgo-test.cm / driver2@quickgo-test.cm
-- 🔐 Admin     : admin@quickgo-test.cm
-- 🔑 Mot de passe universel : QuickGo2026!
