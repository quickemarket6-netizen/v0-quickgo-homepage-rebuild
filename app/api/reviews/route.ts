import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET  /api/reviews?vendor_id=… | ?product_id=…  → liste publique + stats
// POST /api/reviews { order_id, rating, comment } → dépôt d'avis
//      (commande livrée appartenant au client, un avis par commande)

export async function GET(req: NextRequest) {
  const vendorId = req.nextUrl.searchParams.get("vendor_id")
  const productId = req.nextUrl.searchParams.get("product_id")
  if (!vendorId && !productId) {
    return NextResponse.json({ error: "vendor_id ou product_id requis" }, { status: 400 })
  }

  const supabase = await createClient()
  let query = supabase
    .from("reviews")
    .select("id, rating, comment, created_at, customer_id")
    .order("created_at", { ascending: false })
    .limit(30)
  if (vendorId) query = query.eq("vendor_id", vendorId)
  if (productId) query = query.eq("product_id", productId)

  const { data: reviews, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // reviews.customer_id référence auth.users : pas de FK vers profiles,
  // donc jointure manuelle pour récupérer nom + avatar.
  const customerIds = [...new Set((reviews ?? []).map((r) => r.customer_id).filter(Boolean))]
  const { data: profiles } = customerIds.length
    ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", customerIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  const items = (reviews ?? []).map((r) => {
    const p = profileMap.get(r.customer_id)
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      customer_name: p?.full_name ?? "Client QuickGo",
      customer_avatar: p?.avatar_url ?? null,
    }
  })

  const count = items.length
  const average = count ? items.reduce((s, r) => s + (r.rating ?? 0), 0) / count : 0

  return NextResponse.json({
    reviews: items,
    stats: { count, average: Math.round(average * 10) / 10 },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { order_id, rating, comment } = await req.json() as {
    order_id?: string; rating?: number; comment?: string
  }

  if (!order_id) return NextResponse.json({ error: "order_id requis" }, { status: 400 })
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Note invalide (1 à 5)" }, { status: 400 })
  }
  if (comment != null && (typeof comment !== "string" || comment.length > 1000)) {
    return NextResponse.json({ error: "Commentaire invalide (1000 caractères max)" }, { status: 400 })
  }

  // La commande doit appartenir au client et être livrée
  const { data: order } = await supabase
    .from("orders")
    .select("id, vendor_id, status")
    .eq("id", order_id)
    .eq("customer_id", user.id)
    .single()

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  if (order.status !== "delivered") {
    return NextResponse.json({ error: "Vous pourrez noter cette commande une fois livrée." }, { status: 400 })
  }

  // Un seul avis par commande
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("order_id", order_id)
    .eq("customer_id", user.id)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: "Vous avez déjà noté cette commande." }, { status: 409 })
  }

  const { data: review, error: insertErr } = await supabase
    .from("reviews")
    .insert({
      order_id,
      customer_id: user.id,
      vendor_id: order.vendor_id,
      rating,
      comment: comment?.trim() || null,
    })
    .select()
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  // Recalculer la note agrégée du vendeur (moyenne + nombre d'avis)
  if (order.vendor_id) {
    const { data: agg } = await supabase
      .from("reviews")
      .select("rating")
      .eq("vendor_id", order.vendor_id)
    if (agg && agg.length > 0) {
      const avg = agg.reduce((s, r) => s + (r.rating ?? 0), 0) / agg.length
      await supabase
        .from("vendors")
        .update({ rating: Math.round(avg * 100) / 100, review_count: agg.length })
        .eq("id", order.vendor_id)
    }
  }

  return NextResponse.json(review, { status: 201 })
}
