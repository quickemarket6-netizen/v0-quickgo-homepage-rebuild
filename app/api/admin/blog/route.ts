import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// GET  /api/admin/blog — list all posts (any status)
// POST /api/admin/blog — create post

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get("status")

  let query = supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const body = await req.json() as {
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    author_name?: string
    category?: string
    image_url?: string
    read_time?: string
    status?: string
    published_at?: string
    seo_title?: string
    meta_description?: string
    og_image?: string
  }

  if (!body.title?.trim()) return NextResponse.json({ error: "title requis" }, { status: 400 })
  if (!body.slug?.trim())  return NextResponse.json({ error: "slug requis" }, { status: 400 })

  const status = body.status ?? "draft"
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title:            body.title.trim(),
      slug:             body.slug.trim().toLowerCase().replace(/[^a-z0-9\-]/g, "-"),
      excerpt:          body.excerpt ?? null,
      content:          body.content ?? null,
      author_name:      body.author_name ?? "QuickGo Team",
      author_id:        admin.adminId,
      category:         body.category ?? "general",
      image_url:        body.image_url ?? null,
      read_time:        body.read_time ?? "5 min",
      status,
      published_at:     status === "published" ? (body.published_at ?? new Date().toISOString()) : null,
      seo_title:        body.seo_title ?? null,
      meta_description: body.meta_description ?? null,
      og_image:         body.og_image ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
