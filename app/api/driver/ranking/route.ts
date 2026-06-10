import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/driver/ranking?scope=city|national&limit=20
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get("scope") ?? "city"
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50)

  // Current driver info
  const { data: me } = await supabase
    .from("drivers")
    .select("id, total_deliveries, total_earnings, rating, city")
    .eq("user_id", user.id)
    .single()

  // Leaderboard query
  let query = supabase
    .from("drivers")
    .select(`
      id, total_deliveries, total_earnings, rating, city,
      user:profiles(full_name, avatar_url)
    `)
    .order("total_earnings", { ascending: false })
    .limit(limit)

  if (scope === "city" && me?.city) {
    query = query.eq("city", me.city)
  }

  const { data: drivers } = await query

  const leaderboard = (drivers ?? []).map((d, idx) => {
    const profile = Array.isArray(d.user) ? d.user[0] : d.user
    return {
      rank:     idx + 1,
      id:       d.id,
      name:     (profile as { full_name: string | null } | null)?.full_name ?? "Livreur",
      earnings: Number(d.total_earnings ?? 0),
      trips:    d.total_deliveries ?? 0,
      rating:   Number(d.rating ?? 0),
      city:     d.city ?? "Yaoundé",
    }
  })

  const myRank = leaderboard.findIndex(d => d.id === me?.id) + 1

  // XP from missions + deliveries
  const { data: completedMissions } = await supabase
    .from("driver_mission_progress")
    .select("id", { count: "exact", head: true })
    .eq("driver_id", me?.id ?? "")
    .eq("is_completed", true)

  const missionCount = (completedMissions as unknown as { count: number } | null)?.count ?? 0
  const xp = missionCount * 50 + (me?.total_deliveries ?? 0) * 2
  const levelBrackets = [
    { name: "Diamant", min: 800 },
    { name: "Platine", min: 500 },
    { name: "Or",      min: 200 },
    { name: "Argent",  min: 50  },
    { name: "Bronze",  min: 0   },
  ]
  const level = levelBrackets.find(b => xp >= b.min)?.name ?? "Bronze"

  return NextResponse.json({
    leaderboard,
    my_rank:      myRank || leaderboard.length + 1,
    total_drivers: leaderboard.length,
    scope,
    me: me ? {
      id:       me.id,
      earnings: Number(me.total_earnings ?? 0),
      trips:    me.total_deliveries ?? 0,
      rating:   Number(me.rating ?? 0),
      xp,
      xp_max:   1000,
      level,
      streak:   0,
    } : null,
  })
}
