import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// GET  /api/admin/seo — keywords + page scores + KPI + performance trend
// POST /api/admin/seo — upsert keyword data (import from GSC)

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()

  const [{ data: keywords, error: kwErr }, { data: pages }] = await Promise.all([
    supabase.from("seo_keywords").select("*").order("position", { nullsFirst: false }),
    supabase
      .from("cms_pages")
      .select("slug, title, seo_score, status, seo_title, meta_description")
      .order("seo_score", { ascending: false }),
  ])

  if (kwErr) return NextResponse.json({ error: kwErr.message }, { status: 500 })

  const kw = keywords ?? []
  const totalClicks      = kw.reduce((s, k) => s + (k.clicks ?? 0), 0)
  const totalImpressions = kw.reduce((s, k) => s + (k.impressions ?? 0), 0)
  const positioned       = kw.filter(k => k.position != null)
  const avgPosition      = positioned.length
    ? Math.round(positioned.reduce((s, k) => s + k.position!, 0) / positioned.length * 10) / 10
    : 0
  const avgCtr           = kw.length
    ? Math.round(kw.reduce((s, k) => s + Number(k.ctr ?? 0), 0) / kw.length * 10) / 10
    : 0
  const improved         = kw.filter(k => k.position != null && k.prev_position != null && k.position < k.prev_position).length
  const publishedPages   = (pages ?? []).filter(p => p.status === "published")

  const kpi = {
    total_clicks:      totalClicks,
    total_impressions: totalImpressions,
    avg_position:      avgPosition,
    avg_ctr:           avgCtr,
    keywords_improved: improved,
    pages_indexed:     publishedPages.length,
    total_keywords:    kw.length,
  }

  // Pages with SEO audit data
  const pages_seo = (pages ?? []).map(p => ({
    url:             p.slug,
    title:           p.seo_title ?? p.title,
    score:           p.seo_score ?? 0,
    issues:          Math.max(0, Math.round((100 - (p.seo_score ?? 0)) / 15)),
    index_status:    p.status === "published" ? "indexed" : "not_indexed",
    organic_clicks:  0,  // would come from GSC integration
  }))

  // Monthly performance trend — aggregate from page_views + static fallback
  const now = new Date()
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const { data: viewRows } = await supabase
    .from("page_views")
    .select("viewed_at")
    .gte("viewed_at", sixMonthsAgo.toISOString())

  const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]
  const monthMap: Record<string, { label: string; clicks: number; impressions: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthMap[key] = { label: MONTHS_FR[d.getMonth()], clicks: 0, impressions: 0 }
  }
  ;(viewRows ?? []).forEach(r => {
    const key = (r.viewed_at as string).slice(0, 7)
    if (key in monthMap) {
      monthMap[key].clicks++
      monthMap[key].impressions += 12  // estimate ~12 impressions per click
    }
  })
  // Ensure current month reflects real GSC totals if available
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  if (currentKey in monthMap && totalClicks > 0) {
    monthMap[currentKey].clicks = totalClicks
    monthMap[currentKey].impressions = totalImpressions
  }

  const performance_trend = Object.values(monthMap).map(({ label, clicks, impressions }) => ({
    month: label, clicks, impressions,
  }))

  return NextResponse.json({ kpi, keywords: kw, pages: pages_seo, performance_trend })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const body = await req.json() as Array<{
    keyword: string
    position?: number
    prev_position?: number
    volume?: number
    difficulty?: number
    ctr?: number
    impressions?: number
    clicks?: number
    page_url?: string
  }>

  if (!Array.isArray(body) || body.length === 0) {
    return NextResponse.json({ error: "array de keywords requis" }, { status: 400 })
  }

  const { error } = await supabase
    .from("seo_keywords")
    .upsert(
      body.map(k => ({
        keyword:       k.keyword,
        position:      k.position ?? null,
        prev_position: k.prev_position ?? null,
        volume:        k.volume ?? 0,
        difficulty:    k.difficulty ?? 0,
        ctr:           k.ctr ?? 0,
        impressions:   k.impressions ?? 0,
        clicks:        k.clicks ?? 0,
        page_url:      k.page_url ?? null,
        updated_at:    new Date().toISOString(),
      })),
      { onConflict: "keyword" },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, count: body.length })
}
