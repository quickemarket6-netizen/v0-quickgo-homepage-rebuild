import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", user.id)
    .single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const filter = req.nextUrl.searchParams.get("filter") ?? "all"

  const { data: allReviews } = await supabase
    .from("product_reviews")
    .select(`
      id, rating, comment, vendor_response, responded_at, created_at,
      products (id, name),
      profiles!product_reviews_customer_id_fkey (full_name, avatar_url)
    `)
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  const reviews = (allReviews ?? []) as unknown as Array<{
    id: string; rating: number; comment: string | null
    vendor_response: string | null; responded_at: string | null; created_at: string
    products: { id: string; name: string } | null
    profiles: { full_name: string; avatar_url: string | null } | null
  }>

  const filtered = reviews.filter(r => {
    if (filter === "positive")   return r.rating >= 4
    if (filter === "negative")   return r.rating <= 2
    if (filter === "unanswered") return !r.vendor_response
    return true
  })

  const totalCount  = reviews.length
  const avgRating   = totalCount > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / totalCount : 0
  const responded   = reviews.filter(r => r.vendor_response).length
  const responseRate = totalCount > 0 ? Math.round((responded / totalCount) * 100) : 0
  const monthStart  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of reviews) distribution[r.rating] = (distribution[r.rating] ?? 0) + 1

  return NextResponse.json({
    reviews: filtered,
    kpi: {
      avg_rating:      Math.round(avgRating * 10) / 10,
      total_count:     totalCount,
      response_rate:   responseRate,
      this_month:      reviews.filter(r => r.created_at >= monthStart).length,
      positive_count:  reviews.filter(r => r.rating >= 4).length,
      negative_count:  reviews.filter(r => r.rating <= 2).length,
      unanswered_count: reviews.filter(r => !r.vendor_response).length,
    },
    distribution,
    counts: {
      all:        totalCount,
      positive:   reviews.filter(r => r.rating >= 4).length,
      negative:   reviews.filter(r => r.rating <= 2).length,
      unanswered: reviews.filter(r => !r.vendor_response).length,
    },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { review_id, response } = await req.json() as { review_id?: string; response?: string }
  if (!review_id || !response?.trim()) {
    return NextResponse.json({ error: "review_id et réponse requis" }, { status: 400 })
  }

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { data: review } = await supabase
    .from("product_reviews")
    .select("id")
    .eq("id", review_id)
    .eq("vendor_id", vendor.id)
    .single()
  if (!review) return NextResponse.json({ error: "Avis introuvable" }, { status: 404 })

  const { error } = await supabase
    .from("product_reviews")
    .update({ vendor_response: response.trim(), responded_at: new Date().toISOString() })
    .eq("id", review_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
