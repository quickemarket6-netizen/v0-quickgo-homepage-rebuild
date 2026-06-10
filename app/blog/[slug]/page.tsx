import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Calendar, Clock, User, ArrowLeft, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  author_name: string
  category: string
  image_url?: string | null
  read_time?: string | null
  published_at?: string | null
  views?: number
  seo_title?: string | null
  meta_description?: string | null
  og_image?: string | null
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single()
    return data
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return { title: "Article introuvable | QuickGo" }
  }

  const title       = post.seo_title ?? `${post.title} | QuickGo`
  const description = post.meta_description ?? post.excerpt ?? `Lisez cet article sur le blog de QuickGo.`
  const image       = post.og_image ?? post.image_url ?? "/og-image.jpg"
  const url         = `https://quickgo.cm/blog/${slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url,
      publishedTime: post.published_at ?? undefined,
      authors: [post.author_name],
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: { canonical: url },
  }
}

export async function generateStaticParams() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("status", "published")
    return (data ?? []).map(p => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export const revalidate = 300

function formatDate(iso?: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? "",
    author: { "@type": "Person", name: post.author_name },
    publisher: { "@type": "Organization", name: "QuickGo", logo: { "@type": "ImageObject", url: "https://quickgo.cm/icon-light-32x32.png" } },
    datePublished: post.published_at,
    url: `https://quickgo.cm/blog/${slug}`,
    image: post.og_image ?? post.image_url ?? "https://quickgo.cm/og-image.jpg",
  }

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <article className="pt-24 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Back */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Retour au blog
          </Link>

          {/* Category + Read time */}
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {post.category}
            </span>
            {post.read_time && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {post.read_time}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border/50">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />{post.author_name}
            </span>
            {post.published_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />{formatDate(post.published_at)}
              </span>
            )}
            {(post.views ?? 0) > 0 && (
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />{post.views?.toLocaleString("fr-FR")} vues
              </span>
            )}
          </div>

          {/* Cover image placeholder */}
          <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center mb-10">
            <span className="text-8xl">📰</span>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 font-medium">
              {post.excerpt}
            </p>
          )}

          {/* Body */}
          {post.content ? (
            <div
              className="text-foreground/90 leading-relaxed space-y-4 whitespace-pre-wrap"
              style={{ wordBreak: "break-word" }}
            >
              {post.content}
            </div>
          ) : (
            <p className="text-muted-foreground italic">
              Le contenu complet de cet article sera disponible prochainement.
            </p>
          )}

          {/* CTA */}
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 border border-primary/30 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Prêt à commander avec QuickGo ?
            </h2>
            <p className="text-muted-foreground mb-6">
              Livraison rapide partout au Cameroun
            </p>
            <Button asChild size="lg">
              <Link href="/marketplace">Explorer le marketplace</Link>
            </Button>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}
