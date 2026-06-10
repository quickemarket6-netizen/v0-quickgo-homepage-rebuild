import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/blog — published posts, optional ?category=X&limit=N&offset=N

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const limit    = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50)
  const offset   = parseInt(searchParams.get("offset") ?? "0")

  let query = supabase
    .from("blog_posts")
    .select("id,title,slug,excerpt,author_name,category,image_url,read_time,published_at,views,seo_title,meta_description,og_image")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (category && category !== "all") {
    query = query.eq("category", category)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch categories with counts
  const { data: allPosts } = await supabase
    .from("blog_posts")
    .select("category")
    .eq("status", "published")

  const catCounts: Record<string, number> = {}
  ;(allPosts ?? []).forEach(p => {
    catCounts[p.category] = (catCounts[p.category] ?? 0) + 1
  })

  return NextResponse.json({
    posts: data ?? [],
    categories: Object.entries(catCounts).map(([name, count]) => ({ name, count })),
    total: (allPosts ?? []).length,
  })
}
