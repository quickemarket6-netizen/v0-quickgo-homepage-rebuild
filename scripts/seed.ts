/**
 * QuickGo — Seed Script
 * Usage: pnpm seed
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Creates: users (clients, vendors, drivers, admin) → categories → vendors
 *          → products → orders → reviews → wallets → notifications
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("❌  Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── helpers ──────────────────────────────────────────────────────────────────

const log = (msg: string) => console.log(`  ${msg}`)
const ok  = (msg: string) => console.log(`  ✅ ${msg}`)
const err = (msg: string, e: unknown) => console.error(`  ❌ ${msg}`, e)

async function createUser(email: string, password: string, meta: Record<string, string>) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  })
  if (error && !error.message.includes("already been registered")) {
    throw new Error(`createUser ${email}: ${error.message}`)
  }
  if (data?.user) return data.user
  // user already exists — fetch by email
  const { data: list } = await supabase.auth.admin.listUsers()
  return list.users.find(u => u.email === email)!
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const PASSWORD = "QuickGo2026!"

// ── 1. CATEGORIES ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Restaurants & Repas",  slug: "restaurants",    icon: "🍽️",  color: "#FF6B35", sort_order: 1 },
  { name: "Pharmacies",           slug: "pharmacies",     icon: "💊",  color: "#10B981", sort_order: 2 },
  { name: "Supermarchés",         slug: "supermarcheS",   icon: "🛒",  color: "#3B82F6", sort_order: 3 },
  { name: "Mode & Vêtements",     slug: "mode",           icon: "👗",  color: "#8B5CF6", sort_order: 4 },
  { name: "Électronique",         slug: "electronique",   icon: "📱",  color: "#0EA5E9", sort_order: 5 },
  { name: "Beauté & Soins",       slug: "beaute",         icon: "💄",  color: "#EC4899", sort_order: 6 },
  { name: "Sport & Fitness",      slug: "sport",          icon: "⚽",  color: "#F59E0B", sort_order: 7 },
  { name: "Maison & Décoration",  slug: "maison",         icon: "🏠",  color: "#14B8A6", sort_order: 8 },
  { name: "Livraison Express",    slug: "livraison",      icon: "🚀",  color: "#C8FF00", sort_order: 9 },
  { name: "Services",             slug: "services",       icon: "🔧",  color: "#6B7280", sort_order: 10 },
]

// ── 2. VENDORS (defined after users are created) ───────────────────────────────

function makeVendors(ownerIds: string[]) {
  return [
    {
      owner_id: ownerIds[0],
      name: "Chez Mama Ngando",
      slug: "chez-mama-ngando",
      description: "Cuisine camerounaise authentique : Ndolé, Poulet DG, Eru, Soya grillé et bien plus. Le goût de chez soi.",
      category: "restaurants",
      city: "Yaoundé",
      address: "Carrefour Obili, Yaoundé Centre",
      phone: "+237 699 111 222",
      email: "mamangando@quickgo.cm",
      rating: 4.8,
      review_count: 247,
      is_active: true,
      is_verified: true,
      delivery_time_min: 20,
      delivery_time_max: 40,
      min_order: 2000,
      commission_rate: 0.08,
      delivery_fee: 500,
      status: "active",
    },
    {
      owner_id: ownerIds[1],
      name: "Pharmacie Centrale Bastos",
      slug: "pharmacie-centrale-bastos",
      description: "Médicaments, parapharmacie, cosmétiques et conseils santé. Ouverts 7j/7 de 7h à 22h.",
      category: "pharmacies",
      city: "Yaoundé",
      address: "Avenue Charles de Gaulle, Bastos, Yaoundé",
      phone: "+237 677 333 444",
      email: "pharmacie.bastos@quickgo.cm",
      rating: 4.6,
      review_count: 89,
      is_active: true,
      is_verified: true,
      delivery_time_min: 15,
      delivery_time_max: 30,
      min_order: 1000,
      commission_rate: 0.05,
      delivery_fee: 300,
      status: "active",
    },
    {
      owner_id: ownerIds[2],
      name: "SuperMarchéPlus Akwa",
      slug: "supermarche-plus-akwa",
      description: "Grande surface avec produits locaux et importés. Épicerie, boissons, produits ménagers, frais.",
      category: "supermarcheS",
      city: "Douala",
      address: "Rue Joss, Akwa, Douala",
      phone: "+237 655 555 666",
      email: "superplus.akwa@quickgo.cm",
      rating: 4.4,
      review_count: 312,
      is_active: true,
      is_verified: true,
      delivery_time_min: 25,
      delivery_time_max: 50,
      min_order: 3000,
      commission_rate: 0.06,
      delivery_fee: 700,
      status: "active",
    },
    {
      owner_id: ownerIds[3],
      name: "Wax & Fashion Douala",
      slug: "wax-fashion-douala",
      description: "Wax hollandais, pagne, dashikis, tenues traditionnelles et modernes. Créateurs locaux.",
      category: "mode",
      city: "Douala",
      address: "Marché Central, Deido, Douala",
      phone: "+237 698 777 888",
      email: "waxfashion@quickgo.cm",
      rating: 4.7,
      review_count: 156,
      is_active: true,
      is_verified: true,
      delivery_time_min: 30,
      delivery_time_max: 60,
      min_order: 5000,
      commission_rate: 0.10,
      delivery_fee: 1000,
      status: "active",
    },
    {
      owner_id: ownerIds[4],
      name: "TechCity Electronics",
      slug: "techcity-electronics",
      description: "Smartphones, accessoires, ordinateurs, tablettes et garanties officielles. Samsung, Tecno, Itel, iPhone.",
      category: "electronique",
      city: "Douala",
      address: "Bonanjo Business Center, Douala",
      phone: "+237 677 999 000",
      email: "techcity@quickgo.cm",
      rating: 4.5,
      review_count: 203,
      is_active: true,
      is_verified: true,
      delivery_time_min: 20,
      delivery_time_max: 45,
      min_order: 10000,
      commission_rate: 0.07,
      delivery_fee: 500,
      status: "active",
    },
    {
      owner_id: ownerIds[5],
      name: "BeautyQueen Yaoundé",
      slug: "beautyqueen-yaounde",
      description: "Cosmétiques naturels africains, beurre de karité, huiles essentielles, perruques et soins capillaires.",
      category: "beaute",
      city: "Yaoundé",
      address: "Centre Commercial Nlongkak, Yaoundé",
      phone: "+237 691 234 567",
      email: "beautyqueen@quickgo.cm",
      rating: 4.9,
      review_count: 418,
      is_active: true,
      is_verified: true,
      delivery_time_min: 15,
      delivery_time_max: 35,
      min_order: 2500,
      commission_rate: 0.09,
      delivery_fee: 400,
      status: "active",
    },
  ]
}

// ── 3. PRODUCTS ────────────────────────────────────────────────────────────────
// Called after vendors are inserted to get their IDs

function makeProducts(vendorIds: string[]) {
  const [resto, pharma, super_, fashion, tech, beauty] = vendorIds

  return [
    // ── Restaurant (Mama Ngando) ──────────────────────────────────────────────
    { vendor_id: resto, name: "Ndolé au Poisson",            description: "Ndolé traditionnel aux crevettes et poisson fumé. Servi avec du riz ou du miondo.",  price: 3500,  compare_price: null,  category: "restaurants", stock: 50, is_available: true, rating: 4.9, tags: ["ndolé","plat principal","camerounais"] },
    { vendor_id: resto, name: "Poulet DG",                   description: "Poulet braisé sauté aux légumes, tomates et épices. Le plat signature camerounais.",     price: 4500,  compare_price: null,  category: "restaurants", stock: 30, is_available: true, rating: 4.8, tags: ["poulet","plat principal"] },
    { vendor_id: resto, name: "Eru & Waterleaf",             description: "Eru à la feuille de waterleaf, cru, palme, et viande fumée. Spécialité de l'Ouest.",     price: 3000,  compare_price: null,  category: "restaurants", stock: 20, is_available: true, rating: 4.7, tags: ["eru","plat principal"] },
    { vendor_id: resto, name: "Soya Grillé (5 brochettes)",  description: "Soya de bœuf mariné aux épices locales, grillé sur charbon de bois. Sauce pimentée.",   price: 2000,  compare_price: null,  category: "restaurants", stock: 100, is_available: true, rating: 4.9, tags: ["soya","brochette","street food"] },
    { vendor_id: resto, name: "Beignets Haricot (10 pcs)",   description: "Beignets de haricot frits croustillants. Snack typique camerounais.",                     price: 800,   compare_price: null,  category: "restaurants", stock: 200, is_available: true, rating: 4.6, tags: ["beignet","snack"] },
    { vendor_id: resto, name: "Jus de Bissap",               description: "Jus d'hibiscus frais, sucré naturellement, servi froid. 50cl.",                           price: 500,   compare_price: null,  category: "restaurants", stock: 80,  is_available: true, rating: 4.5, tags: ["boisson","jus"] },
    { vendor_id: resto, name: "Koki & Plantain",             description: "Galette de haricot aux épices cuite à la vapeur avec banane plantain bouillie.",           price: 1500,  compare_price: null,  category: "restaurants", stock: 40,  is_available: true, rating: 4.8, tags: ["koki","plat principal"] },
    { vendor_id: resto, name: "Puff-Puff (12 pcs)",          description: "Beignets moelleux sucrés, dorés à la perfection. La gourmandise camerounaise.",            price: 600,   compare_price: null,  category: "restaurants", stock: 150, is_available: true, rating: 4.7, tags: ["puff-puff","beignet","snack"] },
    { vendor_id: resto, name: "Okok aux Pistaches",          description: "Feuilles d'okok cuites avec des pistaches et du crabe. Plat de l'Est Cameroun.",           price: 3200,  compare_price: null,  category: "restaurants", stock: 25,  is_available: true, rating: 4.6, tags: ["okok","plat principal"] },
    { vendor_id: resto, name: "Thiéboudienne",               description: "Riz au poisson à la sénégalaise avec légumes variés. Plat complet.",                       price: 2800,  compare_price: null,  category: "restaurants", stock: 35,  is_available: true, rating: 4.5, tags: ["thiéboudienne","riz","poisson"] },

    // ── Pharmacie ─────────────────────────────────────────────────────────────
    { vendor_id: pharma, name: "Paracétamol 500mg (16 cp)",    description: "Antalgique et antipyrétique. Soulage la fièvre et les douleurs légères à modérées.",      price: 300,   compare_price: null,  category: "pharmacies", stock: 500, is_available: true, rating: 4.8, tags: ["douleur","fièvre","générique"] },
    { vendor_id: pharma, name: "Coartem 6 comprimés",           description: "Antipaludéen de référence. Traitement de première ligne du paludisme non compliqué.",      price: 3500,  compare_price: null,  category: "pharmacies", stock: 200, is_available: true, rating: 4.9, tags: ["paludisme","antipaludéen"] },
    { vendor_id: pharma, name: "Vitamine C 1000mg (30 cp)",     description: "Complément alimentaire. Renforce le système immunitaire et combat la fatigue.",            price: 2200,  compare_price: null,  category: "pharmacies", stock: 150, is_available: true, rating: 4.7, tags: ["vitamine","immunité","supplément"] },
    { vendor_id: pharma, name: "Amoxicilline 500mg (21 gél.)",  description: "Antibiotique à spectre large. Sur ordonnance médicale uniquement.",                        price: 1800,  compare_price: null,  category: "pharmacies", stock: 100, is_available: true, rating: 4.6, tags: ["antibiotique","infection"] },
    { vendor_id: pharma, name: "Gel Hydroalcoolique 500ml",     description: "Désinfectant pour les mains. Efficace contre 99,9% des bactéries et virus.",               price: 1500,  compare_price: 2000,  category: "pharmacies", stock: 300, is_available: true, rating: 4.5, tags: ["hygiène","désinfectant"] },
    { vendor_id: pharma, name: "Doliprane Enfant Suspension",   description: "Paracétamol pédiatrique 2,4%. Sirop antalgique et antipyrétique pour enfants.",           price: 1200,  compare_price: null,  category: "pharmacies", stock: 80,  is_available: true, rating: 4.9, tags: ["enfant","fièvre","pédiatrique"] },
    { vendor_id: pharma, name: "Savon Antiseptique Dermovate",  description: "Savon nettoyant antiseptique. Protège contre les infections cutanées.",                   price: 900,   compare_price: 1100,  category: "pharmacies", stock: 200, is_available: true, rating: 4.4, tags: ["hygiène","antiseptique","savon"] },
    { vendor_id: pharma, name: "Fer + Acide Folique (30 cp)",   description: "Supplément en fer et folate. Recommandé pendant la grossesse et en cas d'anémie.",        price: 2800,  compare_price: null,  category: "pharmacies", stock: 120, is_available: true, rating: 4.8, tags: ["grossesse","fer","supplément"] },

    // ── Supermarché ───────────────────────────────────────────────────────────
    { vendor_id: super_, name: "Riz Long Grain 5kg",             description: "Riz parfumé de qualité supérieure. Idéal pour toutes les préparations.",                  price: 4500,  compare_price: 5000,  category: "supermarcheS", stock: 200, is_available: true, rating: 4.6, tags: ["riz","épicerie","céréales"] },
    { vendor_id: super_, name: "Huile de Palme Rousse 5L",       description: "Huile de palme traditionnelle camerounaise. Indispensable pour les plats locaux.",        price: 8000,  compare_price: 9000,  category: "supermarcheS", stock: 80,  is_available: true, rating: 4.8, tags: ["huile","palme","cuisine"] },
    { vendor_id: super_, name: "Sucre Blanc 2kg",                description: "Sucre cristallisé de canne à sucre. Qualité standard.",                                   price: 2200,  compare_price: null,  category: "supermarcheS", stock: 300, is_available: true, rating: 4.4, tags: ["sucre","épicerie"] },
    { vendor_id: super_, name: "Lait en Poudre Nido 400g",       description: "Lait enrichi en vitamines A, C, D. Pour toute la famille.",                               price: 3800,  compare_price: 4200,  category: "supermarcheS", stock: 120, is_available: true, rating: 4.7, tags: ["lait","nido","petit déjeuner"] },
    { vendor_id: super_, name: "Sardines Sauté de Thon 425g",    description: "Conserve de sardines à la sauce tomate. Protéines pratiques et économiques.",             price: 1200,  compare_price: null,  category: "supermarcheS", stock: 500, is_available: true, rating: 4.3, tags: ["conserve","thon","protéine"] },
    { vendor_id: super_, name: "Farine de Maïs Mbappe 1kg",      description: "Farine de maïs jaune pour préparer bouillie, couscous et bâton de manioc.",              price: 800,   compare_price: null,  category: "supermarcheS", stock: 400, is_available: true, rating: 4.6, tags: ["maïs","farine","local"] },
    { vendor_id: super_, name: "Café Soluble Nescafé Classic",   description: "Café soluble Nescafé. 200g — le petit déjeuner des Camerounais.",                         price: 4500,  compare_price: 5000,  category: "supermarcheS", stock: 150, is_available: true, rating: 4.7, tags: ["café","boisson","petit déjeuner"] },
    { vendor_id: super_, name: "Eau Minérale Supermont 6×1,5L",  description: "Pack de 6 bouteilles d'eau minérale naturelle des monts camerounais.",                    price: 3600,  compare_price: null,  category: "supermarcheS", stock: 200, is_available: true, rating: 4.5, tags: ["eau","boisson","pack"] },
    { vendor_id: super_, name: "Lessive OMO Confort 1kg",        description: "Lessive en poudre pour linge blanc et coloré. Formule anti-taches.",                      price: 1800,  compare_price: 2200,  category: "supermarcheS", stock: 250, is_available: true, rating: 4.4, tags: ["lessive","ménage","propreté"] },
    { vendor_id: super_, name: "Beurre de Cacao 200g",           description: "Beurre pur cacao camerounais non raffiné. Idéal cuisine et soins.",                       price: 2500,  compare_price: null,  category: "supermarcheS", stock: 90,  is_available: true, rating: 4.9, tags: ["cacao","beurre","local"] },

    // ── Mode & Fashion ────────────────────────────────────────────────────────
    { vendor_id: fashion, name: "Wax Hollandais 6 Yards",     description: "Tissu wax 100% coton hollandais. Motifs traditionnels africains. Couleurs vives garanties.", price: 18000, compare_price: 22000, category: "mode", stock: 50, is_available: true, rating: 4.8, tags: ["wax","tissu","hollandais"] },
    { vendor_id: fashion, name: "Dashiki Homme Brodé",        description: "Chemise dashiki africaine brodée à la main. Légère et confortable. Tailles S-XXL.",         price: 8500,  compare_price: null,  category: "mode", stock: 30, is_available: true, rating: 4.7, tags: ["dashiki","homme","africain"] },
    { vendor_id: fashion, name: "Ensemble Wax Femme",         description: "Ensemble deux pièces (jupe + haut) en wax imprimé. Couture artisanale camerounaise.",        price: 15000, compare_price: 18000, category: "mode", stock: 25, is_available: true, rating: 4.9, tags: ["wax","femme","ensemble"] },
    { vendor_id: fashion, name: "Pagne Velours Doublé 5m",   description: "Pagne velours de qualité supérieure. Idéal pour tenues de cérémonie et mariages.",           price: 12000, compare_price: null,  category: "mode", stock: 40, is_available: true, rating: 4.6, tags: ["pagne","velours","cérémonie"] },
    { vendor_id: fashion, name: "Boubou Grand Complet",       description: "Boubou traditionnel en bazin riche. Broderies dorées. Pour grandes occasions.",              price: 35000, compare_price: 45000, category: "mode", stock: 15, is_available: true, rating: 4.9, tags: ["boubou","bazin","cérémonie"] },
    { vendor_id: fashion, name: "Sandales Artisanales Cuir",  description: "Sandales tressées en cuir véritable. Fabrication locale. Confort toute la journée.",        price: 9000,  compare_price: 11000, category: "mode", stock: 60, is_available: true, rating: 4.7, tags: ["sandales","cuir","artisanat"] },
    { vendor_id: fashion, name: "Sac à Main Wax",             description: "Sac cabas en tissu wax renforcé avec poignées en cuir. Design moderne africain.",            price: 11000, compare_price: null,  category: "mode", stock: 35, is_available: true, rating: 4.8, tags: ["sac","wax","accessoire"] },
    { vendor_id: fashion, name: "Ceinture Perles Traditionelle", description: "Ceinture de perles colorées, artisanat Bamoun. Portée en tenue traditionnelle.",         price: 4500,  compare_price: null,  category: "mode", stock: 80, is_available: true, rating: 4.5, tags: ["perles","artisanat","accessoire"] },

    // ── Électronique (TechCity) ───────────────────────────────────────────────
    { vendor_id: tech, name: "Tecno Camon 30 Pro",         description: "Smartphone 6.67\" AMOLED, 256Go, 8Go RAM, 64Mp. Caméra IA. Garantie 12 mois.",              price: 185000, compare_price: 210000, category: "electronique", stock: 30, is_available: true, rating: 4.6, tags: ["smartphone","tecno","4G"] },
    { vendor_id: tech, name: "Samsung Galaxy A55",         description: "Écran 6.6\" Super AMOLED, 128Go, 8Go RAM. 50Mp. Double SIM. Garantie officielle.",           price: 220000, compare_price: 250000, category: "electronique", stock: 20, is_available: true, rating: 4.7, tags: ["samsung","smartphone","5G"] },
    { vendor_id: tech, name: "Itel P55+ 8Go/256Go",        description: "Smartphone entrée de gamme robuste. Grande batterie 5000mAh. Interface fluide.",             price: 75000,  compare_price: 85000,  category: "electronique", stock: 50, is_available: true, rating: 4.4, tags: ["itel","smartphone","économique"] },
    { vendor_id: tech, name: "Écouteurs Bluetooth JBL",   description: "Casque sans fil JBL Tune 510BT. 40h d'autonomie. Son JBL pur et puissant.",                  price: 28000,  compare_price: 35000,  category: "electronique", stock: 40, is_available: true, rating: 4.8, tags: ["jbl","bluetooth","audio"] },
    { vendor_id: tech, name: "Chargeur Rapide 65W USB-C", description: "Chargeur rapide universel GaN 65W. Compatible iPhone, Samsung, Tecno. 2 ports.",            price: 12000,  compare_price: null,   category: "electronique", stock: 80, is_available: true, rating: 4.6, tags: ["chargeur","USB-C","rapide"] },
    { vendor_id: tech, name: "Batterie Externe 20000mAh", description: "Power bank solide 20000mAh, 2 USB + USB-C. Charge rapide intégrée. Idéal voyage.",           price: 18000,  compare_price: 22000,  category: "electronique", stock: 60, is_available: true, rating: 4.7, tags: ["power bank","batterie","voyage"] },
    { vendor_id: tech, name: "Coque Renforcée iPhone 15", description: "Coque MagSafe antichoc grade militaire. Bords surélevés. Protège contre les chutes.",        price: 8500,   compare_price: 12000,  category: "electronique", stock: 100, is_available: true, rating: 4.5, tags: ["iphone","coque","protection"] },
    { vendor_id: tech, name: "Câble HDMI 2.0 (2m)",       description: "Câble HDMI certifié 4K@60Hz. Idéal TV, projecteur, moniteur. Blindage double couche.",       price: 4500,   compare_price: null,   category: "electronique", stock: 120, is_available: true, rating: 4.4, tags: ["HDMI","câble","4K"] },

    // ── Beauté (BeautyQueen) ──────────────────────────────────────────────────
    { vendor_id: beauty, name: "Beurre de Karité Pur 500g",   description: "Beurre de karité non raffiné du Cameroun. Hydratation intense peau et cheveux.",          price: 5500,  compare_price: 7000,  category: "beaute", stock: 150, is_available: true, rating: 4.9, tags: ["karité","hydratation","naturel"] },
    { vendor_id: beauty, name: "Huile de Coco Vierge 250ml",  description: "Huile de noix de coco pressée à froid. Multi-usages : peau, cheveux, cuisine.",           price: 4000,  compare_price: null,  category: "beaute", stock: 100, is_available: true, rating: 4.8, tags: ["coco","huile","naturel"] },
    { vendor_id: beauty, name: "Savon Noir Beldi 200g",       description: "Savon noir naturel africain à l'huile d'olive. Exfoliant et nettoyant profond.",           price: 2500,  compare_price: 3000,  category: "beaute", stock: 200, is_available: true, rating: 4.9, tags: ["savon noir","exfoliant","traditionnel"] },
    { vendor_id: beauty, name: "Crème Unifiante Carotène",    description: "Crème teint unifiant à la carotte et à la vitamine E. Sans mercure, sans hydroquinone.",  price: 6500,  compare_price: 8000,  category: "beaute", stock: 80,  is_available: true, rating: 4.6, tags: ["crème","unifiant","soin"] },
    { vendor_id: beauty, name: "Perruque Lace Front 18\"",    description: "Perruque brésilienne lace front naturelle. Densité 150%. Tons naturels et ombrés.",        price: 45000, compare_price: 55000, category: "beaute", stock: 30,  is_available: true, rating: 4.7, tags: ["perruque","cheveux","lace"] },
    { vendor_id: beauty, name: "Huile de Ricin Noire 200ml",  description: "Huile de ricin 100% pure. Stimule la pousse des cheveux et renforce les cils.",           price: 3500,  compare_price: null,  category: "beaute", stock: 120, is_available: true, rating: 4.8, tags: ["ricin","cheveux","pousse"] },
    { vendor_id: beauty, name: "Kit Manucure Professionnel",  description: "Set 12 pièces : lime, coupe-ongles, repousse-cuticules, tampon brillant. Pochette.",       price: 7500,  compare_price: 10000, category: "beaute", stock: 60,  is_available: true, rating: 4.5, tags: ["manucure","ongles","kit"] },
    { vendor_id: beauty, name: "Shampoing African Pride",     description: "Shampoing nourrissant à l'huile de moringa et karité. Pour cheveux secs et crépus.",      price: 4800,  compare_price: 5500,  category: "beaute", stock: 90,  is_available: true, rating: 4.7, tags: ["shampoing","cheveux","naturel"] },
  ]
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀  QuickGo — Seed en cours...\n")

  // ── Step 1: Create Auth users ─────────────────────────────────────────────
  console.log("👤 Création des utilisateurs...")
  const clients = await Promise.all([
    createUser("client1@quickgo.cm", PASSWORD, { full_name: "Alain Mbarga", role: "client" }),
    createUser("client2@quickgo.cm", PASSWORD, { full_name: "Marie Ngo Bello", role: "client" }),
    createUser("client3@quickgo.cm", PASSWORD, { full_name: "Jean-Pierre Kamga", role: "client" }),
  ])
  const vendorOwners = await Promise.all([
    createUser("vendor1@quickgo.cm", PASSWORD, { full_name: "Ngando Mama", role: "vendor" }),
    createUser("vendor2@quickgo.cm", PASSWORD, { full_name: "Pharmacie Centrale", role: "vendor" }),
    createUser("vendor3@quickgo.cm", PASSWORD, { full_name: "SuperMarchéPlus", role: "vendor" }),
    createUser("vendor4@quickgo.cm", PASSWORD, { full_name: "Wax Fashion", role: "vendor" }),
    createUser("vendor5@quickgo.cm", PASSWORD, { full_name: "TechCity Store", role: "vendor" }),
    createUser("vendor6@quickgo.cm", PASSWORD, { full_name: "BeautyQueen Shop", role: "vendor" }),
  ])
  const drivers = await Promise.all([
    createUser("driver1@quickgo.cm", PASSWORD, { full_name: "Brice Ondoua", role: "driver" }),
    createUser("driver2@quickgo.cm", PASSWORD, { full_name: "Stève Nkoulou", role: "driver" }),
  ])
  const admin = await createUser("admin@quickgo.cm", PASSWORD, { full_name: "Admin QuickGo", role: "admin" })

  ok(`${clients.length + vendorOwners.length + drivers.length + 1} utilisateurs créés`)

  // ── Step 2: Upsert profiles ───────────────────────────────────────────────
  console.log("📋 Mise à jour des profils...")
  const profileRows = [
    ...clients.map((u, i) => ({
      id: u.id, role: "client", city: ["Yaoundé","Douala","Bafoussam"][i],
      full_name: u.user_metadata?.full_name, email: u.email,
    })),
    ...vendorOwners.map((u, i) => ({
      id: u.id, role: "vendor", city: i < 2 ? "Yaoundé" : "Douala",
      full_name: u.user_metadata?.full_name, email: u.email,
    })),
    ...drivers.map(u => ({
      id: u.id, role: "driver", city: "Yaoundé",
      full_name: u.user_metadata?.full_name, email: u.email,
    })),
    { id: admin.id, role: "admin", city: "Yaoundé", full_name: "Admin QuickGo", email: admin.email },
  ]
  const { error: profErr } = await supabase.from("profiles").upsert(profileRows)
  if (profErr) err("profiles", profErr)
  else ok("profils mis à jour")

  // ── Step 3: Categories ────────────────────────────────────────────────────
  console.log("🗂️  Création des catégories...")
  const { data: cats, error: catErr } = await supabase
    .from("categories")
    .upsert(CATEGORIES, { onConflict: "slug" })
    .select("id,slug")
  if (catErr) err("categories", catErr)
  else ok(`${cats?.length ?? 0} catégories insérées`)

  // ── Step 4: Vendors ───────────────────────────────────────────────────────
  console.log("🏪 Création des vendeurs...")
  const vendorRows = makeVendors(vendorOwners.map(u => u.id))
  const { data: insertedVendors, error: vendErr } = await supabase
    .from("vendors")
    .upsert(vendorRows, { onConflict: "slug" })
    .select("id,slug,name")
  if (vendErr) err("vendors", vendErr)
  else ok(`${insertedVendors?.length ?? 0} vendeurs créés`)

  if (!insertedVendors?.length) {
    console.error("  ⛔ Aucun vendeur créé — impossible de continuer")
    return
  }

  // Sort vendors by slug to match makeProducts order
  const sortedVendors = ["chez-mama-ngando","pharmacie-centrale-bastos","supermarche-plus-akwa","wax-fashion-douala","techcity-electronics","beautyqueen-yaounde"]
    .map(slug => insertedVendors.find(v => v.slug === slug)!)
    .filter(Boolean)

  const vendorIds = sortedVendors.map(v => v.id)

  // ── Step 5: Vendor wallets ────────────────────────────────────────────────
  console.log("💰 Création des wallets vendeurs...")
  const walletRows = vendorIds.map(vendor_id => ({
    vendor_id,
    available_balance: Math.floor(Math.random() * 150000) + 10000,
    pending_balance: Math.floor(Math.random() * 50000),
    total_earned: Math.floor(Math.random() * 500000) + 50000,
    total_withdrawn: Math.floor(Math.random() * 200000),
  }))
  const { error: walErr } = await supabase
    .from("vendor_wallets")
    .upsert(walletRows, { onConflict: "vendor_id" })
  if (walErr) err("vendor_wallets", walErr)
  else ok("wallets créés")

  // ── Step 6: Drivers ───────────────────────────────────────────────────────
  console.log("🏍️  Création des livreurs...")
  const driverRows = drivers.map((u, i) => ({
    user_id: u.id,
    status: "online",
    vehicle_type: i === 0 ? "moto" : "voiture",
    vehicle_brand: i === 0 ? "Honda" : "Toyota",
    vehicle_model: i === 0 ? "CBF 125" : "Corolla",
    license_plate: i === 0 ? "LT-1234-YA" : "CE-5678-DL",
    license_number: `LIC-2024-00${i + 1}`,
    rating: 4.5 + i * 0.2,
    total_deliveries: 120 + i * 80,
    total_earnings: 280000 + i * 150000,
    city: "Yaoundé",
    is_verified: true,
    is_online: true,
    current_latitude: 3.848 + (Math.random() - 0.5) * 0.05,
    current_longitude: 11.502 + (Math.random() - 0.5) * 0.05,
  }))
  const { error: drvErr } = await supabase
    .from("drivers")
    .upsert(driverRows, { onConflict: "user_id" })
  if (drvErr) err("drivers", drvErr)
  else ok("livreurs créés")

  // ── Step 7: Products ──────────────────────────────────────────────────────
  console.log("📦 Création des produits (60+)...")
  const productRows = makeProducts(vendorIds)
  const { data: insertedProducts, error: prodErr } = await supabase
    .from("products")
    .upsert(productRows, { onConflict: "vendor_id,name" })
    .select("id,name,vendor_id,price")
  if (prodErr) err("products", prodErr)
  else ok(`${insertedProducts?.length ?? 0} produits créés`)

  // ── Step 8: Client addresses ──────────────────────────────────────────────
  console.log("📍 Création des adresses...")
  const addrRows = clients.flatMap((u, i) => [
    {
      user_id: u.id, label: "Domicile",
      street: ["Rue Mballa II, Bastos","Avenue Kennedy","Carrefour Melen"][i],
      district: ["Bastos","Akwa","Ngousso"][i],
      city: ["Yaoundé","Douala","Yaoundé"][i],
      lat: 3.848 + i * 0.01, lng: 11.502 + i * 0.01,
      is_default: true,
    },
    {
      user_id: u.id, label: "Bureau",
      street: ["Centre Administratif","Zone Industrielle","Quartier GPX"][i],
      district: ["Centre-ville","Bonabéri","Omnisport"][i],
      city: ["Yaoundé","Douala","Yaoundé"][i],
      lat: 3.852 + i * 0.01, lng: 11.506 + i * 0.01,
      is_default: false,
    },
  ])
  const { error: addrErr } = await supabase.from("addresses").insert(addrRows)
  if (addrErr && !addrErr.message.includes("duplicate")) err("addresses", addrErr)
  else ok("adresses créées")

  // ── Step 9: Orders + Items ────────────────────────────────────────────────
  console.log("🛒 Création des commandes...")
  if (insertedProducts && insertedProducts.length > 0) {
    const statuses = ["delivered","delivered","delivered","delivered","delivering","preparing","confirmed","cancelled"]
    const payMethods = ["orange_money","mtn_momo","wave","cash"]

    const orders = clients.flatMap(client =>
      Array.from({ length: 3 }, (_, i) => {
        const vendor = sortedVendors[i % sortedVendors.length]
        const vProducts = insertedProducts.filter(p => p.vendor_id === vendor.id)
        const qty1 = Math.ceil(Math.random() * 3)
        const qty2 = Math.ceil(Math.random() * 2)
        const p1 = vProducts[0]
        const p2 = vProducts[1] ?? p1
        const subtotal = p1.price * qty1 + p2.price * qty2
        const fee = 500 + (i * 200)
        return {
          order_number: `QG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          customer_id: client.id,
          vendor_id: vendor.id,
          driver_id: i < 2 ? drivers[i % drivers.length].id : null,
          status: statuses[i % statuses.length],
          items: JSON.stringify([
            { product_id: p1.id, name: p1.name, qty: qty1, unit_price: p1.price },
            { product_id: p2.id, name: p2.name, qty: qty2, unit_price: p2.price },
          ]),
          subtotal,
          delivery_fee: fee,
          discount: 0,
          total: subtotal + fee,
          delivery_address: JSON.stringify({ street: "Rue Mballa II", district: "Bastos", city: "Yaoundé" }),
          payment_method: payMethods[i % payMethods.length],
          payment_status: i < 6 ? "paid" : "pending",
          estimated_delivery_at: new Date(Date.now() + 1800000).toISOString(),
        }
      })
    )

    const { data: insertedOrders, error: ordErr } = await supabase
      .from("orders")
      .insert(orders)
      .select("id,vendor_id,customer_id,status,total")
    if (ordErr) err("orders", ordErr)
    else ok(`${insertedOrders?.length ?? 0} commandes créées`)

    // ── Step 10: Reviews ───────────────────────────────────────────────────
    if (insertedOrders?.length) {
      console.log("⭐ Création des avis...")
      const deliveredOrders = insertedOrders.filter(o => o.status === "delivered")
      const reviewComments = [
        "Excellent service, livraison rapide et produit conforme !",
        "Très satisfait de ma commande, je recommande vivement.",
        "Qualité au rendez-vous. Le vendeur est très professionnel.",
        "Livraison dans les délais. Produit bien emballé.",
        "Super expérience ! Je commanderai de nouveau.",
      ]
      const reviews = deliveredOrders.slice(0, 8).map((o, i) => ({
        order_id: o.id,
        customer_id: o.customer_id,
        vendor_id: o.vendor_id,
        rating: 4 + Math.round(Math.random()),
        comment: reviewComments[i % reviewComments.length],
      }))
      const { error: revErr } = await supabase.from("reviews").insert(reviews)
      if (revErr && !revErr.message.includes("duplicate")) err("reviews", revErr)
      else ok(`${reviews.length} avis créés`)
    }
  }

  // ── Step 11: Notifications ────────────────────────────────────────────────
  console.log("🔔 Création des notifications...")
  const notifRows = clients.flatMap(u => [
    { user_id: u.id, type: "order_update", title: "Commande confirmée", body: "Votre commande QG-001 a été confirmée par le vendeur.", is_read: false },
    { user_id: u.id, type: "delivery",     title: "Livreur en route",  body: "Brice est en chemin avec votre commande. Arrivée estimée : 15 min.", is_read: false },
    { user_id: u.id, type: "promo",        title: "Offre spéciale 🎉", body: "Profitez de -20% sur votre prochaine commande avec le code QUICKGO20.", is_read: true },
  ])
  const { error: notifErr } = await supabase.from("notifications").insert(notifRows)
  if (notifErr) err("notifications", notifErr)
  else ok(`${notifRows.length} notifications créées`)

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("✅  SEED TERMINÉ — Comptes de test :\n")
  console.log("  👤 Clients")
  console.log("     client1@quickgo.cm  /  client2@quickgo.cm  /  client3@quickgo.cm")
  console.log("  🏪 Vendeurs")
  console.log("     vendor1@quickgo.cm … vendor6@quickgo.cm")
  console.log("  🏍️  Livreurs")
  console.log("     driver1@quickgo.cm  /  driver2@quickgo.cm")
  console.log("  🔐 Admin")
  console.log("     admin@quickgo.cm")
  console.log(`\n  Mot de passe universel : ${PASSWORD}`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
}

main().catch(e => {
  console.error("\n💥 Erreur seed :", e)
  process.exit(1)
})
