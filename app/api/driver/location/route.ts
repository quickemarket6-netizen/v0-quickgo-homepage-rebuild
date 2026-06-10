import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// PATCH /api/driver/location — periodic GPS flush from useDriverBroadcast
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await req.json() as { lat?: number; lng?: number }
  if (typeof body.lat !== "number" || typeof body.lng !== "number") {
    return NextResponse.json({ error: "lat et lng requis (number)" }, { status: 400 })
  }

  const { error } = await supabase
    .from("drivers")
    .update({
      current_latitude:     body.lat,
      current_longitude:    body.lng,
      last_location_update: new Date().toISOString(),
    })
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ updated: true })
}
