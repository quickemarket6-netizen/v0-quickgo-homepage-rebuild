import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// GET  /api/admin/cms — pages + blocks + KPI + views trend
// POST /api/admin/cms — create page

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()

  const [{ data: pages, error: pagesErr }, { data: blocks }] = await Promise.all([
    supabase.from("cms_pages").select("*").order("updated_at", { ascending: false }),
    supabase.from("content_blocks").select("id,name,page_id,page_name,type,enabled,updated_at").order("sort_order"),
  ])

  if (pagesErr) return NextResponse.json({ error: pagesErr.message }, { status: 500 })

  // 7-day views trend from page_views
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: viewRows } = await supabase
    .from("page_views")
    .select("viewed_at")
    .gte("viewed_at", sevenDaysAgo.toISOString())

  const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
  const trendMap: Record<string, { label: string; views: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    trendMap[key] = { label: i === 0 ? "Auj" : DAYS_FR[d.getDay()], views: 0 }
  }
  ;(viewRows ?? []).forEach(r => {
    const key = (r.viewed_at as string).slice(0, 10)
    if (key in trendMap) trendMap[key].views++
  })
  const views_trend = Object.values(trendMap).map(({ label, views }) => ({ day: label, views }))

  // KPI
  const allPages = pages ?? []
  const published = allPages.filter(p => p.status === "published")
  const draft     = allPages.filter(p => p.status === "draft")
  const archived  = allPages.filter(p => p.status === "archived")
  const scored    = published.filter(p => p.seo_score > 0)

  const kpi = {
    published_count:   published.length,
    draft_count:       draft.length,
    archived_count:    archived.length,
    total_views_today: allPages.reduce((s, p) => s + (p.views_today ?? 0), 0),
    avg_seo_score:     scored.length
      ? Math.round(scored.reduce((s, p) => s + p.seo_score, 0) / scored.length)
      : 0,
    blocks_active:     (blocks ?? []).filter(b => b.enabled).length,
  }

  // Type distribution
  const TYPE_COLORS: Record<string, string> = {
    landing: "#3b82f6", static: "#22c55e", legal: "#6b6b8a", promo: "#f97316",
    faq: "#8b5cf6", guide: "#eab308", blog: "#ec4899", system: "#6b6b8a",
  }
  const typeCount: Record<string, number> = {}
  allPages.forEach(p => { typeCount[p.type] = (typeCount[p.type] ?? 0) + 1 })
  const type_distribution = Object.entries(typeCount).map(([type, count]) => ({
    type, count, pct: Math.round(count / Math.max(allPages.length, 1) * 100),
    color: TYPE_COLORS[type] ?? "#6b6b8a",
  }))

  // Top pages by today's views
  const top_pages = [...allPages]
    .sort((a, b) => (b.views_today ?? 0) - (a.views_today ?? 0))
    .slice(0, 6)
    .map(p => ({
      title: p.title.length > 22 ? p.title.slice(0, 22) + "…" : p.title,
      views: p.views_today ?? 0,
      seo:   p.seo_score ?? 0,
    }))

  return NextResponse.json({ kpi, pages: allPages, blocks: blocks ?? [], type_distribution, top_pages, views_trend })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const body = await req.json() as {
    title?: string
    slug?: string
    type?: string
    status?: string
    seo_title?: string
    meta_description?: string
    og_image?: string
    content?: Record<string, unknown>
  }

  if (!body.title?.trim()) return NextResponse.json({ error: "title requis" }, { status: 400 })
  if (!body.slug?.trim())  return NextResponse.json({ error: "slug requis" }, { status: 400 })

  const { data, error } = await supabase
    .from("cms_pages")
    .insert({
      title:            body.title.trim(),
      slug:             body.slug.trim().toLowerCase().replace(/[^a-z0-9\-\/]/g, "-"),
      type:             body.type ?? "static",
      status:           body.status ?? "draft",
      seo_title:        body.seo_title ?? null,
      meta_description: body.meta_description ?? null,
      og_image:         body.og_image ?? null,
      content:          body.content ?? {},
      author_id:        admin.adminId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
