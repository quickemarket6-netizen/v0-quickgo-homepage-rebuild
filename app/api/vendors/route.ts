import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const city = searchParams.get("city")
  const featured = searchParams.get("featured")
  
  const supabase = await createClient()
  
  let query = supabase
    .from("vendors")
    .select(`
      *,
      category:categories(id, name, slug, color)
    `)
    .eq("is_verified", true)
  
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
  
  if (city) {
    query = query.eq("city", city)
  }
  
  if (featured === "true") {
    query = query.gte("rating", 4.5)
  }
  
  const { data, error } = await query.order("rating", { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
