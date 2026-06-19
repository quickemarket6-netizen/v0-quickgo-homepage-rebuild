import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/payments/security"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Require auth: prevents unauthenticated enumeration of promo codes
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  // Rate limit: 5 validations per minute per user
  const rl = checkRateLimit(`promo:${user.id}`, { maxRequests: 5, windowMs: 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez dans une minute" }, { status: 429 })
  }

  const { code, subtotal } = await request.json()
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code requis" }, { status: 400 })
  }
  // Coerce and validate subtotal — a string like "abc" must not bypass the minimum-order check
  const orderSubtotal = Number(subtotal)
  if (!Number.isFinite(orderSubtotal) || orderSubtotal < 0) {
    return NextResponse.json({ error: "Sous-total invalide" }, { status: 400 })
  }

  const { data: promo, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single()

  // Unified error message: don't leak whether code exists vs expired vs exhausted
  if (error || !promo) {
    return NextResponse.json({ error: "Code promo invalide ou expiré" }, { status: 400 })
  }

  if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
    return NextResponse.json({ error: "Code promo invalide ou expiré" }, { status: 400 })
  }

  if (promo.max_uses && promo.current_uses >= promo.max_uses) {
    return NextResponse.json({ error: "Code promo invalide ou expiré" }, { status: 400 })
  }

  if (orderSubtotal < promo.min_order_amount) {
    return NextResponse.json({
      error: `Commande minimum de ${promo.min_order_amount} FCFA requise`
    }, { status: 400 })
  }

  let discount = 0
  if (promo.discount_type === "percentage") {
    discount = Math.round((orderSubtotal * promo.discount_value) / 100)
  } else {
    discount = promo.discount_value
  }

  return NextResponse.json({
    valid: true,
    code: promo.code,
    discount,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    description: promo.description
  })
}
