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
  return NextResponse.json(data ?? [])
}
