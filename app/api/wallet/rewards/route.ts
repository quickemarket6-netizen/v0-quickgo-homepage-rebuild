import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Catalogue défini côté serveur (aucune table "rewards" n'existe en base).
// Les points de l'utilisateur et l'échange sont, eux, bien réels.
const REWARDS_CATALOG = [
  {
    id: "free_delivery",
    icon: "🛵",
    title: "Livraison gratuite",
    description: "1 livraison offerte, valable 7 jours",
    points_cost: 500,
    type: "delivery",
  },
  {
    id: "discount_10",
    icon: "💰",
    title: "Remise 10%",
    description: "10% de réduction sur votre prochain achat",
    points_cost: 1000,
    type: "discount",
  },
  {
    id: "voucher_5000",
    icon: "🎁",
    title: "Bon d'achat 5 000 CFA",
    description: "Utilisable sur toute la marketplace",
    points_cost: 2500,
    type: "voucher",
  },
  {
    id: "gold_status",
    icon: "⭐",
    title: "Statut Gold",
    description: "Livraisons prioritaires + 8% cashback",
    points_cost: 5000,
    type: "status",
  },
] as const

const REDEMPTION_PREFIX = "Échange récompense:"

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", user.id)
    .single()

  if (profileError) {
    return NextResponse.json({ error: "Impossible de charger votre profil" }, { status: 500 })
  }

  // Historique réel des échanges de récompenses
  const { data: history } = await supabase
    .from("wallet_transactions")
    .select("id, description, created_at, metadata")
    .eq("user_id", user.id)
    .ilike("description", `${REDEMPTION_PREFIX}%`)
    .order("created_at", { ascending: false })
    .limit(10)

  return NextResponse.json({
    points: profile?.points ?? 0,
    rewards: REWARDS_CATALOG,
    history: history ?? [],
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }

  let body: { reward_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }

  const reward = REWARDS_CATALOG.find((r) => r.id === body?.reward_id)
  if (!reward) {
    return NextResponse.json({ error: "Récompense introuvable" }, { status: 404 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("points, wallet_balance")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Impossible de charger votre profil" }, { status: 500 })
  }

  const currentPoints = profile.points ?? 0
  if (currentPoints < reward.points_cost) {
    return NextResponse.json(
      { error: "Points insuffisants pour cette récompense" },
      { status: 400 },
    )
  }

  const newPoints = currentPoints - reward.points_cost

  // Décrément conditionnel (.gte) pour éviter un solde négatif en cas
  // de double clic / requêtes concurrentes.
  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ points: newPoints })
    .eq("id", user.id)
    .gte("points", reward.points_cost)
    .select("points")

  if (updateError) {
    return NextResponse.json({ error: "Erreur lors de l'échange, veuillez réessayer" }, { status: 500 })
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: "Points insuffisants pour cette récompense" },
      { status: 400 },
    )
  }

  // Trace de l'échange dans le grand livre (montant FCFA nul : seul le
  // solde de points est impacté).
  const { error: txError } = await supabase.from("wallet_transactions").insert({
    user_id: user.id,
    type: "debit",
    amount: 0,
    balance_after: profile.wallet_balance ?? 0,
    description: `${REDEMPTION_PREFIX} ${reward.title}`,
    metadata: {
      kind: "reward_redemption",
      reward_id: reward.id,
      reward_type: reward.type,
      points_cost: reward.points_cost,
    },
  })

  if (txError) {
    // Rollback du décrément de points si la trace n'a pas pu être écrite
    await supabase.from("profiles").update({ points: currentPoints }).eq("id", user.id)
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de l'échange, veuillez réessayer" },
      { status: 500 },
    )
  }

  // Notification (non bloquante)
  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "reward",
    title: "Récompense échangée",
    message: `Vous avez échangé ${reward.points_cost} points contre « ${reward.title} ».`,
    data: { reward_id: reward.id, points_cost: reward.points_cost },
  })

  return NextResponse.json({
    success: true,
    points: newPoints,
    reward: { id: reward.id, title: reward.title },
    message: `Récompense « ${reward.title} » échangée avec succès`,
  })
}
