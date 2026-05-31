import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

async function getVendorId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("vendors").select("id").eq("owner_id", userId).single()
  return data?.id ?? null
}

// PATCH — update own product
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const vendorId = await getVendorId(supabase, user.id)
  if (!vendorId) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await req.json()
  const {
    name, description, price, original_price,
    category_id, stock_quantity, is_featured, is_available, images,
  } = body as Partial<{
    name: string; description: string; price: number; original_price: number | null
    category_id: string; stock_quantity: number; is_featured: boolean; is_available: boolean; images: string[]
  }>

  const patch: Record<string, unknown> = {}
  if (name              !== undefined) patch.name           = name.trim()
  if (description       !== undefined) patch.description    = description?.trim() ?? null
  if (price             !== undefined) patch.price          = price
  if (original_price    !== undefined) patch.original_price = original_price
  if (category_id       !== undefined) patch.category_id   = category_id
  if (stock_quantity    !== undefined) {
    patch.stock_quantity = stock_quantity
    patch.is_available   = stock_quantity > 0
  }
  if (is_available !== undefined) patch.is_available = is_available
  if (is_featured       !== undefined) patch.is_featured    = is_featured
  if (images            !== undefined) patch.images         = images

  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .eq("vendor_id", vendorId)  // ownership check
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — remove own product
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const vendorId = await getVendorId(supabase, user.id)
  if (!vendorId) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("vendor_id", vendorId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
