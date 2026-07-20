/**
 * QuickGo — Média (images réelles) des catégories, boutiques et produits.
 *
 * Source : Pexels (licence gratuite, sans attribution requise). L'hôte
 * `images.pexels.com` est autorisé dans next.config.mjs (remotePatterns) et
 * dans la CSP `img-src`. Le format d'URL du CDN est déterministe :
 *   https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg
 * donc chaque `id` ci-dessous provient d'une vraie page Pexels /photo/…-<id>.
 *
 * Ces maps sont consommées par :
 *   - scripts/seed.ts            (nouvelles bases : images posées à la création)
 *   - scripts/backfill-images.ts (bases existantes : UPDATE des lignes déjà là)
 *
 * ⚠️ Certaines photos sont des « meilleurs équivalents » thématiques : Pexels
 * n'a pas de cliché exact pour tous les plats camerounais (ndolé, koki, okok…)
 * ni pour quelques références locales (sucre, farine). Les correspondances
 * approximatives sont signalées par un commentaire « ~ ». Remplace librement
 * un `id` par un autre trouvé sur pexels.com si tu veux une photo plus fidèle.
 */

/** Construit une URL CDN Pexels à partir d'un id numérique. */
export const pexels = (id: number, w = 800): string =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`

// ── Catégories (slug → image) ────────────────────────────────────────────────
export const CATEGORY_IMAGES: Record<string, string> = {
  restaurants:  pexels(34686219), // salle de restaurant chaleureuse
  pharmacies:   pexels(13119976), // pharmacien en officine
  supermarcheS: pexels(16211537), // rayons de supermarché
  mode:         pexels(4940756),  // boutique de vêtements
  electronique: pexels(11297769), // téléphones exposés en magasin
  beaute:       pexels(3735622),  // produits de beauté en rayon
  sport:        pexels(4162451),  // haltères
  maison:       pexels(5179534),  // intérieur maison moderne
  livraison:    pexels(12203732), // livreur à moto
  services:     pexels(162553),   // jeu de clés / outils
}

// ── Boutiques (slug → {cover, logo}) ─────────────────────────────────────────
export const VENDOR_IMAGES: Record<string, { cover: string; logo: string }> = {
  "chez-mama-ngando":         { cover: pexels(30457533, 1200), logo: pexels(106343, 300) },   // resto / poulet grillé
  "pharmacie-centrale-bastos":{ cover: pexels(30312098, 1200), logo: pexels(3683048, 300) },  // devanture pharmacie / comprimés
  "supermarche-plus-akwa":    { cover: pexels(5380919, 1200),  logo: pexels(16211537, 300) }, // supermarché / rayons
  "wax-fashion-douala":       { cover: pexels(6044231, 1200),  logo: pexels(18330808, 300) }, // boutique mode / tissu wax
  "techcity-electronics":     { cover: pexels(25809255, 1200), logo: pexels(3721646, 300) },  // showroom / smartphone
  "beautyqueen-yaounde":      { cover: pexels(3735655, 1200),  logo: pexels(13794471, 300) }, // cosmétiques
}

// ── Produits (nom exact → image) ─────────────────────────────────────────────
// Les clés DOIVENT correspondre au champ `name` du seed (accents/parenthèses
// compris) : c'est la clé de jointure pour le backfill et le seed.
export const PRODUCT_IMAGES: Record<string, string> = {
  // Restaurant — Chez Mama Ngando
  "Ndolé au Poisson":            pexels(10050659), // ~ poisson & accompagnement
  "Poulet DG":                   pexels(6210764),  // poulet grillé & légumes
  "Eru & Waterleaf":             pexels(28618632), // ~ plat de légumes verts
  "Soya Grillé (5 brochettes)":  pexels(30788246), // brochettes grillées
  "Beignets Haricot (10 pcs)":   pexels(680242),   // beignets
  "Jus de Bissap":               pexels(8678927),  // boisson d'hibiscus
  "Koki & Plantain":             pexels(29283885), // ~ plat de légumineuses
  "Puff-Puff (12 pcs)":          pexels(35661532), // beignets sucrés
  "Okok aux Pistaches":          pexels(4869334),  // ~ plat de fruits de mer
  "Thiéboudienne":               pexels(723198),   // riz cuit

  // Pharmacie — Pharmacie Centrale Bastos
  "Paracétamol 500mg (16 cp)":   pexels(161688),   // comprimés
  "Coartem 6 comprimés":         pexels(3683048),  // comprimés
  "Vitamine C 1000mg (30 cp)":   pexels(17820735), // gélules & flacon
  "Amoxicilline 500mg (21 gél.)":pexels(8326553),  // gélules
  "Gel Hydroalcoolique 500ml":   pexels(4176918),  // flacon désinfectant
  "Doliprane Enfant Suspension": pexels(12955610), // flacon & médicament
  "Savon Antiseptique Dermovate":pexels(8102133),  // savon
  "Fer + Acide Folique (30 cp)": pexels(13787566), // comprimés en flacon

  // Supermarché — SuperMarchéPlus Akwa
  "Riz Long Grain 5kg":          pexels(235731),   // grains de riz
  "Huile de Palme Rousse 5L":    pexels(12284682), // bidons d'huile
  "Sucre Blanc 2kg":             pexels(6781594),  // ~ bocal de granulés
  "Lait en Poudre Nido 400g":    pexels(8064115),  // lait
  "Sardines Sauté de Thon 425g": pexels(13499754), // sardines en conserve
  "Farine de Maïs Mbappe 1kg":   pexels(235731),   // ~ grains/céréales
  "Café Soluble Nescafé Classic":pexels(6781594),  // bocal de café
  "Eau Minérale Supermont 6×1,5L":pexels(15524063),// pack d'eau
  "Lessive OMO Confort 1kg":     pexels(28576636), // produits d'entretien
  "Beurre de Cacao 200g":        pexels(4202326),  // ~ produit cosmétique

  // Mode — Wax & Fashion Douala
  "Wax Hollandais 6 Yards":      pexels(18330808), // tissu wax coloré
  "Dashiki Homme Brodé":         pexels(8470571),  // hommes en dashiki
  "Ensemble Wax Femme":          pexels(30247274), // robe en wax
  "Pagne Velours Doublé 5m":     pexels(18330808), // ~ tissu
  "Boubou Grand Complet":        pexels(8526759),  // boubou / agbada
  "Sandales Artisanales Cuir":   pexels(26925256), // sandales en cuir
  "Sac à Main Wax":              pexels(932401),   // sac à main
  "Ceinture Perles Traditionelle":pexels(3808249), // accessoires

  // Électronique — TechCity Electronics
  "Tecno Camon 30 Pro":          pexels(3721646),  // smartphone
  "Samsung Galaxy A55":          pexels(719399),   // smartphone Android
  "Itel P55+ 8Go/256Go":         pexels(5750001),  // smartphone
  "Écouteurs Bluetooth JBL":     pexels(33298188), // écouteurs sans fil
  "Chargeur Rapide 65W USB-C":   pexels(4219862),  // câble/chargeur USB
  "Batterie Externe 20000mAh":   pexels(17810098), // ~ boîtier de charge
  "Coque Renforcée iPhone 15":   pexels(374117),   // coques de téléphone
  "Câble HDMI 2.0 (2m)":         pexels(4219867),  // câble

  // Beauté — BeautyQueen Yaoundé
  "Beurre de Karité Pur 500g":   pexels(13794471), // produit de soin
  "Huile de Coco Vierge 250ml":  pexels(7953254),  // huile de coco
  "Savon Noir Beldi 200g":       pexels(8102133),  // savon noir
  "Crème Unifiante Carotène":    pexels(11010801), // crème cosmétique
  "Perruque Lace Front 18\"":    pexels(12618341), // perruque
  "Huile de Ricin Noire 200ml":  pexels(18680598), // flacon d'huile
  "Kit Manucure Professionnel":  pexels(3997377),  // manucure
  "Shampoing African Pride":     pexels(16973307), // flacon de shampoing
}
