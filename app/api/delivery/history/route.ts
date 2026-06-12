import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/delivery/history — current user's delivery requests (express deliveries)
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("delivery_requests")
    .select(`
      *,
      driver:drivers(
        id,
        rating,
        vehicle_type,
        user:profiles(full_name, phone)
      )
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
