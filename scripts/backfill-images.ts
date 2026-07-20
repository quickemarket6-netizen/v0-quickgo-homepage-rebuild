/**
 * QuickGo — Backfill des images (catégories, boutiques, produits)
 * Usage : pnpm backfill:images
 * Prérequis : NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env.local
 *             + la migration supabase/migrations/add_category_image.sql appliquée.
 *
 * Met à jour les lignes DÉJÀ présentes en base (contrairement à `pnpm seed`
 * qui recrée tout). Idempotent : relançable sans effet de bord. Jointures :
 *   - categories : par `slug`
 *   - vendors    : par `slug`  → logo_url + cover_url
 *   - products   : par `name`  → image_url
 *
 * Les lignes sans correspondance dans les maps sont laissées telles quelles.
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as path from "path"
import { CATEGORY_IMAGES, VENDOR_IMAGES, PRODUCT_IMAGES } from "./media-assets"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("❌  Renseigne NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env.local")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log("\n🖼️   QuickGo — Backfill des images...\n")
  let ok = 0
  let miss = 0

  // ── Catégories ──────────────────────────────────────────────────────────
  console.log("🗂️   Catégories…")
  for (const [slug, image_url] of Object.entries(CATEGORY_IMAGES)) {
    const { error, count } = await supabase
      .from("categories")
      .update({ image_url }, { count: "exact" })
      .eq("slug", slug)
    if (error) { console.error(`   ❌ ${slug}: ${error.message}`); continue }
    if (count) { ok++ } else { miss++; console.warn(`   ⚠️  aucune catégorie « ${slug} »`) }
  }

  // ── Boutiques ───────────────────────────────────────────────────────────
  console.log("🏪  Boutiques…")
  for (const [slug, { cover, logo }] of Object.entries(VENDOR_IMAGES)) {
    const { error, count } = await supabase
      .from("vendors")
      .update({ cover_url: cover, logo_url: logo }, { count: "exact" })
      .eq("slug", slug)
    if (error) { console.error(`   ❌ ${slug}: ${error.message}`); continue }
    if (count) { ok++ } else { miss++; console.warn(`   ⚠️  aucune boutique « ${slug} »`) }
  }

  // ── Produits ────────────────────────────────────────────────────────────
  console.log("📦  Produits…")
  for (const [name, image_url] of Object.entries(PRODUCT_IMAGES)) {
    const { error, count } = await supabase
      .from("products")
      .update({ image_url }, { count: "exact" })
      .eq("name", name)
    if (error) { console.error(`   ❌ ${name}: ${error.message}`); continue }
    if (count) { ok++ } else { miss++; console.warn(`   ⚠️  aucun produit « ${name} »`) }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`✅  Backfill terminé — ${ok} entités mises à jour, ${miss} sans correspondance.`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
}

main().catch(e => {
  console.error("\n💥 Erreur backfill :", e)
  process.exit(1)
})
