/**
 * Route de seed — réservée aux admins authentifiés.
 * GET /api/admin/seed
 */

import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString()
}
function orderNum() {
  return "QG" + String(rand(10000, 99999))
}

export async function GET(_req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY manquant dans les variables Vercel" }, { status: 500 })
  }

  // Mot de passe des comptes de test : jamais en dur dans le code ni dans
  // la réponse — il vient des variables d'environnement.
  const seedPassword = process.env.SEED_PASSWORD
  if (!seedPassword) {
    return NextResponse.json(
      { error: "SEED_PASSWORD doit être défini dans les variables d'environnement." },
      { status: 500 },
    )
  }

  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const log: string[] = []
  const errors: string[] = []

  function ok(msg: string) { log.push("✓ " + msg) }
  function fail(msg: string, e: unknown) { errors.push("✗ " + msg + ": " + String(e)) }

  async function createUser(email: string, password: string, meta: Record<string, string>) {
    const { data: existing } = await sb.auth.admin.listUsers()
    const found = existing?.users.find((u) => u.email === email)
    if (found) await sb.auth.admin.deleteUser(found.id)
    const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta })
    if (error || !data?.user) throw new Error(error?.message ?? "data null")
    return data.user.id
  }

  try {
    // ── 1. Utilisateurs ────────────────────────────────────────────────────
    const PASSWORD = seedPassword
    const adminId   = await createUser("admin@quickgo.cm",  PASSWORD, { full_name: "Admin QuickGo",  role: "admin" })
    const client1Id = await createUser("marie@quickgo.cm",  PASSWORD, { full_name: "Marie Mballa",   role: "customer" })
    const client2Id = await createUser("paul@quickgo.cm",   PASSWORD, { full_name: "Paul Nkeng",     role: "customer" })
    const vendor1Id = await createUser("samuel@quickgo.cm", PASSWORD, { full_name: "Samuel Bello",   role: "vendor" })
    const vendor2Id = await createUser("fatima@quickgo.cm", PASSWORD, { full_name: "Fatima Oumarou", role: "vendor" })
    const driverId  = await createUser("jean@quickgo.cm",   PASSWORD, { full_name: "Jean Mbarga",    role: "driver" })
    ok("6 utilisateurs")

    // ── 2. Profils ─────────────────────────────────────────────────────────
    const { error: profErr } = await sb.from("profiles").upsert([
      { id: adminId,   full_name: "Admin QuickGo",  email: "admin@quickgo.cm",  role: "admin",    phone: "+237 690 000 001", wallet_balance: 0,     points: 0,   rating: null },
      { id: client1Id, full_name: "Marie Mballa",   email: "marie@quickgo.cm",  role: "customer", phone: "+237 691 234 567", wallet_balance: 15000, points: 850, rating: 4.8  },
      { id: client2Id, full_name: "Paul Nkeng",     email: "paul@quickgo.cm",   role: "customer", phone: "+237 677 890 123", wallet_balance: 8500,  points: 420, rating: 4.5  },
      { id: vendor1Id, full_name: "Samuel Bello",   email: "samuel@quickgo.cm", role: "vendor",   phone: "+237 699 111 222", wallet_balance: 0,     points: 0,   rating: 4.7  },
      { id: vendor2Id, full_name: "Fatima Oumarou", email: "fatima@quickgo.cm", role: "vendor",   phone: "+237 655 333 444", wallet_balance: 0,     points: 0,   rating: 4.9  },
      { id: driverId,  full_name: "Jean Mbarga",    email: "jean@quickgo.cm",   role: "driver",   phone: "+237 674 555 666", wallet_balance: 35000, points: 0,   rating: 4.6  },
    ], { onConflict: "id" })
    if (profErr) fail("profiles", profErr.message); else ok("6 profils")

    // ── 3. Catégories ──────────────────────────────────────────────────────
    await sb.from("categories").delete().in("slug", ["electronique","restaurant","supermarche","pharmacie","mode","cafe","cadeau"])
    const { data: cats, error: catErr } = await sb.from("categories").insert([
      { name: "Électronique", slug: "electronique", icon: "📱", color: "#3b82f6", is_active: true, sort_order: 1 },
      { name: "Restaurant",   slug: "restaurant",   icon: "🍽️", color: "#f97316", is_active: true, sort_order: 2 },
      { name: "Supermarché",  slug: "supermarche",  icon: "🛒", color: "#22c55e", is_active: true, sort_order: 3 },
      { name: "Pharmacie",    slug: "pharmacie",    icon: "💊", color: "#ec4899", is_active: true, sort_order: 4 },
      { name: "Mode",         slug: "mode",         icon: "👗", color: "#8b5cf6", is_active: true, sort_order: 5 },
      { name: "Café",         slug: "cafe",         icon: "☕", color: "#eab308", is_active: true, sort_order: 6 },
      { name: "Cadeaux",      slug: "cadeau",       icon: "🎁", color: "#ef4444", is_active: true, sort_order: 7 },
    ]).select()
    if (catErr || !cats) throw new Error(`Échec catégories: ${catErr?.message}`)
    ok(`${cats.length} catégories`)
    const catMap: Record<string, string> = Object.fromEntries(cats.map((c) => [c.slug, c.id]))

    // ── 4. Vendeurs ────────────────────────────────────────────────────────
    await sb.from("vendors").delete().in("owner_id", [vendor1Id, vendor2Id])
    const { data: vendors, error: vendErr } = await sb.from("vendors").insert([
      { owner_id: vendor1Id, name: "TechShop Douala",   description: "Smartphones, laptops, accessoires high-tech importés.", category_id: catMap["electronique"], city: "Douala",  status: "active", is_verified: true, rating: 4.7, commission_rate: 5, delivery_fee: 1500 },
      { owner_id: vendor2Id, name: "Chez Fatima Resto", description: "Cuisine camerounaise authentique. Ndolé, poulet DG.",   category_id: catMap["restaurant"],   city: "Yaoundé", status: "active", is_verified: true, rating: 4.9, commission_rate: 5, delivery_fee: 500  },
    ]).select()
    if (vendErr || !vendors) throw new Error(`Échec vendeurs: ${vendErr?.message ?? "data null"}`)
    ok(`${vendors.length} vendeurs`)
    const v1 = vendors[0].id
    const v2 = vendors[1].id

    // ── 5. Wallets vendeurs ────────────────────────────────────────────────
    await sb.from("vendor_wallets").delete().in("vendor_id", [v1, v2])
    const { error: wErr } = await sb.from("vendor_wallets").insert([
      { vendor_id: v1, available_balance: 285000, pending_balance: 45000, total_earned: 1250000, total_withdrawn: 920000 },
      { vendor_id: v2, available_balance: 178500, pending_balance: 22000, total_earned: 680000,  total_withdrawn: 480000 },
    ])
    if (wErr) fail("vendor_wallets", wErr.message); else ok("2 wallets")

    // ── 6. Produits ────────────────────────────────────────────────────────
    await sb.from("products").delete().in("vendor_id", [v1, v2])
    const { data: products, error: prodErr } = await sb.from("products").insert([
      { vendor_id: v1, category_id: catMap["electronique"], name: "iPhone 15 Pro 256Go",  description: "Apple iPhone 15 Pro, titane naturel, garantie 1 an.",   price: 650000, original_price: 720000, rating: 4.8, is_available: true, is_featured: true,  stock_quantity: 12 },
      { vendor_id: v1, category_id: catMap["electronique"], name: "Samsung Galaxy S24",   description: "Samsung S24 128Go, Phantom Black, AMOLED 6.2\".",        price: 450000, original_price: 500000, rating: 4.6, is_available: true, is_featured: true,  stock_quantity: 8  },
      { vendor_id: v1, category_id: catMap["electronique"], name: "AirPods Pro 2",        description: "Écouteurs Apple avec réduction active du bruit.",        price: 120000, original_price: 135000, rating: 4.9, is_available: true, is_featured: false, stock_quantity: 3  },
      { vendor_id: v1, category_id: catMap["electronique"], name: "MacBook Air M2 256Go", description: "Apple M2, 8 Go RAM, 256 Go SSD, ultra-fin.",            price: 850000, original_price: 950000, rating: 4.9, is_available: true, is_featured: true,  stock_quantity: 4  },
      { vendor_id: v1, category_id: catMap["electronique"], name: "Chargeur USB-C 65W",   description: "Chargeur rapide universel.",                            price: 8500,   original_price: null,    rating: 4.3, is_available: true, is_featured: false, stock_quantity: 2  },
      { vendor_id: v1, category_id: catMap["electronique"], name: "Coque iPhone 15 Pro",  description: "Coque transparente renforcée, protection 360°.",        price: 5000,   original_price: null,    rating: 4.1, is_available: true, is_featured: false, stock_quantity: 25 },
      { vendor_id: v2, category_id: catMap["restaurant"],   name: "Ndolé complet",        description: "Ndolé aux crevettes, miondo et plantain.",              price: 3500,   original_price: null,    rating: 5.0, is_available: true, is_featured: true,  stock_quantity: 50 },
      { vendor_id: v2, category_id: catMap["restaurant"],   name: "Poulet DG",            description: "Poulet braisé sauce DG, plantains mûrs.",               price: 4500,   original_price: null,    rating: 4.9, is_available: true, is_featured: true,  stock_quantity: 30 },
      { vendor_id: v2, category_id: catMap["restaurant"],   name: "Eru & Waterleaf",      description: "Légumes traditionnels au palmier, crevettes.",          price: 3000,   original_price: null,    rating: 4.8, is_available: true, is_featured: false, stock_quantity: 20 },
      { vendor_id: v2, category_id: catMap["restaurant"],   name: "Beignets haricots x10",description: "Beignets de haricots dorés, piment.",                  price: 1200,   original_price: null,    rating: 4.7, is_available: true, is_featured: false, stock_quantity: 100},
      { vendor_id: v2, category_id: catMap["restaurant"],   name: "Jus de bissap 1L",     description: "Jus d'hibiscus artisanal, sans conservateurs.",         price: 1500,   original_price: null,    rating: 4.6, is_available: true, is_featured: false, stock_quantity: 40 },
      { vendor_id: v2, category_id: catMap["restaurant"],   name: "Koki de maïs",         description: "Gâteau de maïs vapeur aux feuilles de bananier.",      price: 1000,   original_price: null,    rating: 4.5, is_available: true, is_featured: false, stock_quantity: 5  },
    ]).select()
    if (prodErr || !products) throw new Error(`Échec produits: ${prodErr?.message ?? "data null"}`)
    ok(`${products.length} produits`)
    const pm: Record<string, { id: string; price: number; name: string }> = Object.fromEntries(products.map((p) => [p.name, p]))

    // ── 7. Livreur ─────────────────────────────────────────────────────────
    await sb.from("drivers").delete().eq("user_id", driverId)
    const { data: dr, error: drErr } = await sb.from("drivers").insert({
      user_id: driverId, status: "online", vehicle_type: "moto", is_verified: true,
      rating: 4.6, total_deliveries: 342, total_earnings: 512000,
    }).select().single()
    if (drErr) fail("drivers", drErr.message); else ok("1 livreur")
    const drId: string | null = dr?.id ?? null

    // ── 8. Commandes ───────────────────────────────────────────────────────
    await sb.from("orders").delete().in("vendor_id", [v1, v2])
    const a1 = JSON.stringify({ street: "Rue Joss, Akwa", city: "Douala" })
    const a2 = JSON.stringify({ street: "Carrefour Bastos", city: "Yaoundé" })
    const { data: orders, error: ordErr } = await sb.from("orders").insert([
      { order_number: orderNum(), customer_id: client1Id, vendor_id: v1, driver_id: drId,  status: "delivered",  subtotal: 650000, delivery_fee: 1500, discount: 0,     total: 651500, total_amount: 651500, delivery_address: a1, created_at: daysAgo(10), payment_method: "orange_money", payment_status: "paid"    },
      { order_number: orderNum(), customer_id: client1Id, vendor_id: v1, driver_id: drId,  status: "delivered",  subtotal: 120000, delivery_fee: 1500, discount: 0,     total: 121500, total_amount: 121500, delivery_address: a1, created_at: daysAgo(5),  payment_method: "mtn_money",    payment_status: "paid"    },
      { order_number: orderNum(), customer_id: client1Id, vendor_id: v1, driver_id: null,  status: "delivering", subtotal: 450000, delivery_fee: 1500, discount: 22500, total: 429000, total_amount: 429000, delivery_address: a1, created_at: daysAgo(0),  payment_method: "orange_money", payment_status: "paid"    },
      { order_number: orderNum(), customer_id: client2Id, vendor_id: v1, driver_id: drId,  status: "delivered",  subtotal: 850000, delivery_fee: 1500, discount: 0,     total: 851500, total_amount: 851500, delivery_address: a2, created_at: daysAgo(7),  payment_method: "mtn_money",    payment_status: "paid"    },
      { order_number: orderNum(), customer_id: client2Id, vendor_id: v1, driver_id: null,  status: "confirmed",  subtotal: 5000,   delivery_fee: 1500, discount: 0,     total: 6500,   total_amount: 6500,   delivery_address: a2, created_at: daysAgo(0),  payment_method: "cash",         payment_status: "pending" },
      { order_number: orderNum(), customer_id: client1Id, vendor_id: v2, driver_id: drId,  status: "delivered",  subtotal: 9200,   delivery_fee: 500,  discount: 0,     total: 9700,   total_amount: 9700,   delivery_address: a1, created_at: daysAgo(3),  payment_method: "orange_money", payment_status: "paid"    },
      { order_number: orderNum(), customer_id: client1Id, vendor_id: v2, driver_id: null,  status: "preparing",  subtotal: 4500,   delivery_fee: 500,  discount: 0,     total: 5000,   total_amount: 5000,   delivery_address: a1, created_at: daysAgo(0),  payment_method: "mtn_money",    payment_status: "paid"    },
      { order_number: orderNum(), customer_id: client2Id, vendor_id: v2, driver_id: drId,  status: "delivered",  subtotal: 12500,  delivery_fee: 500,  discount: 0,     total: 13000,  total_amount: 13000,  delivery_address: a2, created_at: daysAgo(2),  payment_method: "cash",         payment_status: "paid"    },
      { order_number: orderNum(), customer_id: client2Id, vendor_id: v2, driver_id: null,  status: "pending",    subtotal: 3500,   delivery_fee: 500,  discount: 0,     total: 4000,   total_amount: 4000,   delivery_address: a2, created_at: daysAgo(0),  payment_method: "orange_money", payment_status: "pending" },
    ]).select()
    if (ordErr || !orders) throw new Error(`Échec commandes: ${ordErr?.message ?? "data null"}`)
    ok(`${orders.length} commandes`)

    // ── 9. Articles ────────────────────────────────────────────────────────
    function item(o: { id: string }, name: string, qty: number) {
      const p = pm[name]; if (!p) return null
      return { order_id: o.id, product_id: p.id, product_name: p.name, quantity: qty, unit_price: p.price, total_price: p.price * qty }
    }
    const itemsRaw = [
      item(orders[0], "iPhone 15 Pro 256Go",  1), item(orders[1], "AirPods Pro 2",         1),
      item(orders[2], "Samsung Galaxy S24",   1), item(orders[3], "MacBook Air M2 256Go",  1),
      item(orders[4], "Coque iPhone 15 Pro",  1), item(orders[5], "Ndolé complet",          2),
      item(orders[5], "Jus de bissap 1L",     1), item(orders[6], "Poulet DG",              1),
      item(orders[7], "Ndolé complet",        2), item(orders[7], "Beignets haricots x10",  2),
      item(orders[7], "Jus de bissap 1L",     1), item(orders[8], "Eru & Waterleaf",        1),
    ].filter((x): x is NonNullable<typeof x> => x !== null)
    const { error: itemErr } = await sb.from("order_items").insert(itemsRaw)
    if (itemErr) fail("order_items", itemErr.message); else ok(`${itemsRaw.length} articles`)

    // ── 10. Codes promo ────────────────────────────────────────────────────
    await sb.from("promo_codes").delete().in("code", ["BIENVENUE","ETE2024","LIVRAISON0","TECH15","FATIMA20"])
    const { error: promoErr } = await sb.from("promo_codes").insert([
      { code: "BIENVENUE",  title: "Offre de bienvenue", description: "-10% sur votre première commande",  discount_type: "percentage", discount_value: 10,   min_order_amount: 5000,  is_active: true, valid_until: new Date(Date.now() + 30 * 86400000).toISOString() },
      { code: "ETE2024",    title: "Offre Été 2024",      description: "-15% sur tous les produits",        discount_type: "percentage", discount_value: 15,   min_order_amount: 10000, is_active: true, valid_until: new Date(Date.now() + 14 * 86400000).toISOString() },
      { code: "LIVRAISON0", title: "Livraison gratuite",  description: "Livraison offerte dès 3 000 F",     discount_type: "delivery",   discount_value: 0,    min_order_amount: 3000,  is_active: true, valid_until: new Date(Date.now() + 7  * 86400000).toISOString() },
      { code: "TECH15",     title: "Tech Week",           description: "-15% sur l'électronique",           discount_type: "percentage", discount_value: 15,   min_order_amount: 50000, is_active: true, valid_until: new Date(Date.now() + 5  * 86400000).toISOString() },
      { code: "FATIMA20",   title: "Spécial Fatima",      description: "-2000 F chez Chez Fatima Resto",    discount_type: "fixed",      discount_value: 2000, min_order_amount: 5000,  is_active: true, valid_until: null },
    ])
    if (promoErr) fail("promo_codes", promoErr.message); else ok("5 codes promo")

    // ── 11. Commission logs ────────────────────────────────────────────────
    await sb.from("commission_logs").delete().in("vendor_id", [v1, v2])
    const commLogs = [
      ...[6,5,4,3,2,1,0].map((d) => { const g = rand(80000,250000); const c = Math.round(g*0.05); return { vendor_id: v1, gross_amount: g, commission_rate: 5, quickgo_commission: c, vendor_net_amount: g-c, created_at: new Date(new Date().setHours(23,59,0,0) - d*86400000).toISOString() } }),
      ...[6,5,4,3,2,1,0].map((d) => { const g = rand(12000,45000);  const c = Math.round(g*0.05); return { vendor_id: v2, gross_amount: g, commission_rate: 5, quickgo_commission: c, vendor_net_amount: g-c, created_at: new Date(new Date().setHours(23,59,0,0) - d*86400000).toISOString() } }),
    ]
    const { error: commErr } = await sb.from("commission_logs").insert(commLogs)
    if (commErr) fail("commission_logs", commErr.message); else ok(`${commLogs.length} logs commission`)

    // ── 12. Notifications ──────────────────────────────────────────────────
    await sb.from("notifications").delete().in("user_id", [client1Id, client2Id, vendor1Id])
    const { error: notifErr } = await sb.from("notifications").insert([
      { user_id: client1Id, title: "Commande livrée 🎉",      message: "Votre iPhone 15 Pro a été livré. Notez votre livreur !",        is_read: false, created_at: daysAgo(0) },
      { user_id: client1Id, title: "Offre spéciale",           message: "Utilisez TECH15 pour -15% sur l'électronique.",                 is_read: false, created_at: daysAgo(1) },
      { user_id: client1Id, title: "En livraison 🛵",          message: "Jean Mbarga est en route avec votre Samsung Galaxy S24.",       is_read: true,  created_at: daysAgo(0) },
      { user_id: client2Id, title: "Commande confirmée ✓",     message: "Votre MacBook Air M2 est confirmé par TechShop.",               is_read: false, created_at: daysAgo(0) },
      { user_id: client2Id, title: "Bienvenue sur QuickGo !",  message: "Utilisez BIENVENUE pour -10% sur votre 1ère commande.",        is_read: true,  created_at: daysAgo(5) },
      { user_id: vendor1Id, title: "Nouvelle commande 📦",     message: "Commande reçue — Samsung Galaxy S24 — 450 000 F.",             is_read: false, created_at: daysAgo(0) },
      { user_id: vendor1Id, title: "Stock faible ⚠️",          message: "AirPods Pro 2 : plus que 3 en stock.",                         is_read: false, created_at: daysAgo(1) },
      { user_id: vendor1Id, title: "Commission déduite",       message: "Commission DL Solutions : 12 575 F déduits.",                  is_read: true,  created_at: daysAgo(1) },
    ])
    if (notifErr) fail("notifications", notifErr.message); else ok("8 notifications")

  } catch (e) {
    fail("FATAL", e)
    return NextResponse.json({ success: false, errors, log }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: "✅ Seed terminé !",
    comptes: [
      { role: "client",  email: "marie@quickgo.cm" },
      { role: "client",  email: "paul@quickgo.cm" },
      { role: "vendeur", email: "samuel@quickgo.cm" },
      { role: "vendeur", email: "fatima@quickgo.cm" },
      { role: "livreur", email: "jean@quickgo.cm" },
      { role: "admin",   email: "admin@quickgo.cm" },
    ],
    note: "Mot de passe : valeur de la variable d'environnement SEED_PASSWORD.",
    log,
    errors,
  })
}
