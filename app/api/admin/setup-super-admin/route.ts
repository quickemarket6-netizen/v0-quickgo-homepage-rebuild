/**
 * Route de création du compte super admin — usage unique.
 * POST /api/admin/setup-super-admin
 *
 * Prérequis : être connecté en tant qu'admin ou super_admin.
 * Avoir exécuté supabase/migrations/add_super_admin_role.sql
 * dans l'éditeur SQL Supabase avant d'appeler cette route.
 */

import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

const SUPER_EMAIL    = process.env.SUPER_ADMIN_EMAIL    ?? "fomoujunior2@gmail.com"
const SUPER_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? "QuickGo@2024!"
const SUPER_NAME     = process.env.SUPER_ADMIN_NAME     ?? "Emmanuel Admin"

export async function POST(_req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const admin = await verifyAdmin()
  if (!admin.valid) {
    return NextResponse.json({ error: admin.error }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY absent des variables d'environnement Vercel." },
      { status: 500 },
    )
  }

  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  // ── 1. Créer ou récupérer le compte auth ──────────────────────────────────
  let userId: string

  const { data: existing } = await sb.auth.admin.listUsers()
  const found = existing?.users.find(u => u.email === SUPER_EMAIL)

  if (found) {
    // Compte existe déjà → mettre à jour le mot de passe
    const { error: updateErr } = await sb.auth.admin.updateUserById(found.id, {
      password: SUPER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: SUPER_NAME, role: "super_admin" },
    })
    if (updateErr) {
      return NextResponse.json({ error: "Erreur update auth: " + updateErr.message }, { status: 500 })
    }
    userId = found.id
  } else {
    // Nouveau compte
    const { data, error: createErr } = await sb.auth.admin.createUser({
      email: SUPER_EMAIL,
      password: SUPER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: SUPER_NAME, role: "super_admin" },
    })
    if (createErr || !data?.user) {
      return NextResponse.json({ error: "Erreur création auth: " + createErr?.message }, { status: 500 })
    }
    userId = data.user.id
  }

  // ── 2. Upsert profil avec role super_admin ────────────────────────────────
  const { error: profErr } = await sb.from("profiles").upsert(
    {
      id: userId,
      full_name: SUPER_NAME,
      role: "super_admin",
      is_verified: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )

  if (profErr) {
    return NextResponse.json(
      {
        error: "Auth OK mais profil échoué: " + profErr.message,
        hint: "Exécutez d'abord supabase/migrations/add_super_admin_role.sql dans l'éditeur SQL Supabase.",
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    message: "✅ Compte super admin créé avec succès.",
    compte: {
      email:  SUPER_EMAIL,
      role:   "super_admin",
      userId,
    },
  })
}
