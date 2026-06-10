import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/faq — active items grouped by category

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("faq_items")
    .select("id,category,question,answer,sort_order,views")
    .eq("is_active", true)
    .order("category")
    .order("sort_order")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const items = data ?? []

  // Group by category
  const grouped: Record<string, typeof items> = {}
  items.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  })

  const categories = Object.keys(grouped).map(id => ({
    id,
    label: id === "general" ? "Général"
      : id === "orders"   ? "Commandes"
      : id === "delivery" ? "Livraison"
      : id === "payment"  ? "Paiement"
      : id === "account"  ? "Compte"
      : id.charAt(0).toUpperCase() + id.slice(1),
    items: grouped[id],
  }))

  return NextResponse.json({ categories, total: items.length })
}
