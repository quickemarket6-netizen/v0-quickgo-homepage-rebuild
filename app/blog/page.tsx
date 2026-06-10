import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import BlogContent from "./_components/BlogContent"

export const metadata: Metadata = {
  title: "Blog QuickGo — Actualités et Insights",
  description: "Découvrez les dernières actualités de QuickGo, nos innovations et les histoires inspirantes de notre communauté camerounaise.",
  openGraph: {
    title: "Blog QuickGo — Actualités et Insights",
    description: "Les dernières nouvelles de QuickGo : expansions, produits, technologie et communauté.",
    type: "website",
    url: "https://quickgo.cm/blog",
  },
  alternates: { canonical: "https://quickgo.cm/blog" },
}

export const revalidate = 300  // ISR: refresh every 5 minutes

async function getPosts() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,author_name,category,image_url,read_time,published_at,views")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20)
    return data ?? []
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <BlogContent initialPosts={posts} />
      <Footer />
    </main>
  )
}
