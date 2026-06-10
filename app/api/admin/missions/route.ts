import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// GET  /api/admin/missions            — list all missions + completion stats
// POST /api/admin/missions            — create new mission

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()

  const { data: missions, error } = await supabase
    .from("driver_missions")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Completion stats per mission
  const missionIds = (missions ?? []).map((m) => m.id)
  const { data: progress } = missionIds.length
    ? await supabase
        .from("driver_mission_progress")
        .select("mission_id, is_completed, reward_paid")
        .in("mission_id", missionIds)
    : { data: [] }

  const statsMap: Record<string, { enrolled: number; completed: number; paid: number }> = {}
  for (const p of progress ?? []) {
    if (!statsMap[p.mission_id]) statsMap[p.mission_id] = { enrolled: 0, completed: 0, paid: 0 }
    statsMap[p.mission_id].enrolled++
    if (p.is_completed) statsMap[p.mission_id].completed++
    if (p.reward_paid)  statsMap[p.mission_id].paid++
  }

  const result = (missions ?? []).map((m) => ({
    ...m,
    stats: statsMap[m.id] ?? { enrolled: 0, completed: 0, paid: 0 },
  }))

  return NextResponse.json({ missions: result })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const body = await req.json() as {
    title?: string
    description?: string
    mission_type?: string
    target_count?: number
    target_amount?: number
    reward_amount?: number
    difficulty?: string
    zone?: string
    valid_until?: string
    valid_from?: string
  }

  if (!body.title?.trim()) return NextResponse.json({ error: "title requis" }, { status: 400 })
  if (!body.valid_until)   return NextResponse.json({ error: "valid_until requis" }, { status: 400 })
  if (!body.reward_amount) return NextResponse.json({ error: "reward_amount requis" }, { status: 400 })

  const { data, error } = await supabase
    .from("driver_missions")
    .insert({
      title:         body.title.trim(),
      description:   body.description ?? null,
      mission_type:  body.mission_type ?? "deliveries_count",
      target_count:  body.target_count ?? 5,
      target_amount: body.target_amount ?? null,
      reward_amount: body.reward_amount,
      difficulty:    body.difficulty ?? "easy",
      zone:          body.zone ?? null,
      valid_from:    body.valid_from ?? new Date().toISOString(),
      valid_until:   body.valid_until,
      is_active:     true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
