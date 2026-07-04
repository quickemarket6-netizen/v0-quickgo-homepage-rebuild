import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("promo_codes")
    .select("id, code, title, description, discount_type, discount_value, valid_until, min_order_amount, max_uses, current_uses")
    .eq("is_active", true)
    .or(`valid_until.is.null,valid_until.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(12)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Les visiteurs voient les offres mais pas les codes : ça évite qu'un
  // scraper anonyme moissonne tous les codes actifs. Le code s'affiche
  // une fois connecté (l'application du code au checkout exige de toute
  // façon une session).
  const { data: { user } } = await supabase.auth.getUser()
  const offers = (data ?? []).map((o) => (user ? o : { ...o, code: null }))

  return NextResponse.json(offers)
}
