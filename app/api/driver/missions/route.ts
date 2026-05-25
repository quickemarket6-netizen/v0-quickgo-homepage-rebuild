import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Get available missions for driver
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  // Get driver
  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .single()
  
  if (!driver) {
    return NextResponse.json({ error: "Profil livreur non trouve" }, { status: 404 })
  }
  
  // Get active missions
  const { data: missions, error } = await supabase
    .from("driver_missions")
    .select("*")
    .eq("is_active", true)
    .gte("valid_until", new Date().toISOString())
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Get progress for each mission
  const { data: progress } = await supabase
    .from("driver_mission_progress")
    .select("*")
    .eq("driver_id", driver.id)
  
  const progressMap = new Map(progress?.map(p => [p.mission_id, p]) || [])
  
  const missionsWithProgress = missions?.map(mission => ({
    ...mission,
    progress: progressMap.get(mission.id) || { current_count: 0, is_completed: false }
  }))
  
  return NextResponse.json(missionsWithProgress)
}

// Join/Start a mission
export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { mission_id } = await request.json()
  
  // Get driver
  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .single()
  
  if (!driver) {
    return NextResponse.json({ error: "Profil livreur non trouve" }, { status: 404 })
  }
  
  // Check if already joined
  const { data: existing } = await supabase
    .from("driver_mission_progress")
    .select("id")
    .eq("driver_id", driver.id)
    .eq("mission_id", mission_id)
    .single()
  
  if (existing) {
    return NextResponse.json({ error: "Mission deja commencee" }, { status: 400 })
  }
  
  // Join mission
  const { data, error } = await supabase
    .from("driver_mission_progress")
    .insert({
      driver_id: driver.id,
      mission_id,
      current_count: 0
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
