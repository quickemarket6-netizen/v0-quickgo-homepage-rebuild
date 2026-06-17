import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const vendor = searchParams.get("vendor")
  const featured = searchParams.get("featured")
  const search = searchParams.get("search")
  const rawLimit = parseInt(searchParams.get("limit") || "20")
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), 100) : 20
  const rawOffset = parseInt(searchParams.get("offset") || "0")
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0
  
  const supabase = await createClient()
  
  let query = supabase
    .from("products")
    .select(`
      *,
      vendor:vendors(id, name, slug, rating, delivery_fee),
      category:categories(id, name, slug, color)
    `)
    .eq("is_available", true)
  
  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single()
    
    if (cat) {
      query = query.eq("category_id", cat.id)
    }
  }
  
  if (vendor) {
    const { data: v } = await supabase
      .from("vendors")
      .select("id")
      .eq("slug", vendor)
      .single()
    
    if (v) {
      query = query.eq("vendor_id", v.id)
    }
  }
  
  if (featured === "true") {
    query = query.eq("is_featured", true)
  }
  
  if (search) {
    query = query.ilike("name", `%${search}%`)
  }
  
  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data, count })
}
