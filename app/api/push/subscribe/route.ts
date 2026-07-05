import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST /api/push/subscribe — enregistre l'abonnement push du navigateur
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null
  const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : null
  const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : null

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Abonnement invalide (endpoint/keys requis)" }, { status: 400 })
  }

  // Upsert sur l'endpoint : un navigateur ré-abonné remplace son ancienne ligne
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
      { onConflict: "endpoint" },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/push/subscribe?endpoint= — désabonnement
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get("endpoint")
  if (!endpoint) return NextResponse.json({ error: "endpoint requis" }, { status: 400 })

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint)

  return NextResponse.json({ success: true })
}
