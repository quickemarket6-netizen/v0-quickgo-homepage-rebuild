#!/usr/bin/env node
/**
 * Rapatrie les assets de marque hébergés sur le blob v0 éphémère
 * (hebbkx1anhila5yf.public.blob.vercel-storage.com) dans /public, puis
 * réécrit toutes les références du code source.
 *
 * Pourquoi : ce blob est un stockage temporaire généré par v0 — si le projet
 * v0 d'origine est purgé, le logo et tous les visuels marketing disparaissent
 * du site en production.
 *
 * Usage (une seule fois, depuis une machine avec accès internet normal) :
 *   node scripts/localize-brand-assets.mjs        # télécharge + réécrit
 *   node scripts/localize-brand-assets.mjs --dry  # montre ce qui serait fait
 *
 * Puis : vérifier `pnpm build`, et commiter public/ + les sources modifiées.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { execSync } from "node:child_process"
import { dirname, extname, join } from "node:path"

const ROOT = new URL("..", import.meta.url).pathname
const BLOB_HOST = "hebbkx1anhila5yf.public.blob.vercel-storage.com"
const DRY = process.argv.includes("--dry")

// Noms explicites pour les vidéos (réutilisées sur des dizaines de pages).
// Les images prennent un nom dérivé de leur nom d'origine.
const OVERRIDES = {
  "background%20videos%20E-market%20hero": "/videos/vendor-bg-hero.mp4",
  "video%20market%20place%20background%20hero": "/videos/marketplace-bg-hero.mp4",
  "mokup%20videos": "/videos/hero-phone-mockup.mp4",
  "livraison%20video": "/videos/delivery-hero.mp4",
}

function targetFor(url, taken) {
  const basename = url.split("/").pop()
  for (const [prefix, target] of Object.entries(OVERRIDES)) {
    if (basename.startsWith(prefix)) return target
  }
  // "ChatGPT%20Image%2024%20mai%202026%2C%2022_22_18-MJbF…oy.png"
  //   → /images/brand/chatgpt-image-24-mai-2026-22_22_18.png
  const decoded = decodeURIComponent(basename)
  const ext = extname(decoded)
  const suffix = decoded.match(/-([A-Za-z0-9]{20,})\.[a-z0-9]+$/)?.[1] ?? ""
  const stem = decoded
    .slice(0, -ext.length)
    .replace(/-[A-Za-z0-9]{20,}$/, "") // retire le suffixe aléatoire du blob
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "-")
    .replace(/^-+|-+$/g, "")
  let target = `/images/brand/${stem}${ext}`
  // Deux blobs distincts peuvent partager le même nom d'origine (ex. deux
  // WA0026 différents) : on désambiguïse avec un bout du suffixe aléatoire.
  if (taken.has(target)) {
    target = `/images/brand/${stem}-${suffix.slice(0, 6).toLowerCase()}${ext}`
  }
  return target
}

// 1. Collecte des URLs référencées dans les sources
const files = execSync(
  `grep -rl "${BLOB_HOST}" app components lib 2>/dev/null || true`,
  { cwd: ROOT, encoding: "utf8" },
).split("\n").filter(Boolean)

const urls = new Set()
for (const f of files) {
  const content = readFileSync(join(ROOT, f), "utf8")
  for (const m of content.matchAll(/https:\/\/hebbkx1anhila5yf\.public\.blob\.vercel-storage\.com\/[^"'`)\s]+/g)) {
    urls.add(m[0])
  }
}

if (urls.size === 0) {
  console.log("✅ Aucune référence au blob v0 — rien à faire.")
  process.exit(0)
}

console.log(`${urls.size} asset(s) à rapatrier, référencés dans ${files.length} fichier(s).\n`)

// 2. Téléchargement + 3. réécriture
let failures = 0
const taken = new Set()
for (const url of urls) {
  const target = targetFor(url, taken)
  taken.add(target)
  const dest = join(ROOT, "public", target)
  console.log(`${url.slice(0, 80)}…\n  → public${target}`)

  if (!DRY) {
    mkdirSync(dirname(dest), { recursive: true })
    if (!existsSync(dest)) {
      try {
        execSync(`curl -fsSL --retry 3 -o "${dest}" "${url}"`, { stdio: "pipe" })
      } catch {
        console.error(`  ❌ téléchargement échoué — références conservées telles quelles`)
        failures++
        continue
      }
    }
    for (const f of files) {
      const p = join(ROOT, f)
      const content = readFileSync(p, "utf8")
      if (content.includes(url)) writeFileSync(p, content.replaceAll(url, target))
    }
  }
}

console.log(
  DRY
    ? "\n(dry-run : rien n'a été modifié)"
    : failures
      ? `\n⚠️ Terminé avec ${failures} échec(s) — relancez plus tard pour les manquants.`
      : "\n✅ Terminé. Vérifiez \`pnpm build\` puis commitez public/ et les sources modifiées.",
)
