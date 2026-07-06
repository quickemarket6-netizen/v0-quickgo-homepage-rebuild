import { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/site-config"

export const revalidate = 3600  // refresh sitemap every hour

// Doit rester aligné avec generateStaticParams des pages quartiers
const QUARTIERS_YAOUNDE = [
  "bastos", "mvog-mbi", "mvan", "elig-essono", "ngousso",
  "nlongkak", "messa", "omnisport", "essos", "biyem-assi",
]
const QUARTIERS_DOUALA = [
  "akwa", "bonanjo", "bonapriso", "deido", "makepe", "ndokoti",
  "bali", "new-bell", "bonaberi", "kotto", "logpom", "yassa",
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL

  // Fetch published blog posts for dynamic entries
  let blogEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })

    blogEntries = (data ?? []).map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at ?? post.published_at ?? new Date()),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  } catch {
    // silently skip blog entries if DB unavailable
  }

  // NOTE : uniquement des routes qui existent réellement (les URL 404 dans un
  // sitemap pénalisent le crawl). Pas de pages auth ni d'espaces privés.
  const mainRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`,                     lastModified: new Date(), changeFrequency: "daily",   priority: 1    },
    { url: `${baseUrl}/marketplace`,         lastModified: new Date(), changeFrequency: "daily",   priority: 0.9  },
    { url: `${baseUrl}/driver`,              lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8  },
    { url: `${baseUrl}/marketplace/products`,lastModified: new Date(), changeFrequency: "daily",   priority: 0.9  },
    { url: `${baseUrl}/marketplace/shops`,   lastModified: new Date(), changeFrequency: "daily",   priority: 0.9  },
    { url: `${baseUrl}/blog`,                lastModified: new Date(), changeFrequency: "daily",   priority: 0.8  },
    { url: `${baseUrl}/faq`,                 lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8  },
    { url: `${baseUrl}/about`,               lastModified: new Date(), changeFrequency: "monthly", priority: 0.7  },
    { url: `${baseUrl}/contact`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.7  },
    { url: `${baseUrl}/vendors`,             lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8  },
    { url: `${baseUrl}/affiliate`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.6  },
    { url: `${baseUrl}/support`,             lastModified: new Date(), changeFrequency: "weekly",  priority: 0.6  },
    { url: `${baseUrl}/careers`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.5  },
    { url: `${baseUrl}/press`,               lastModified: new Date(), changeFrequency: "monthly", priority: 0.4  },
    { url: `${baseUrl}/developers`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.4  },
  ]

  const localSeoRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/livraison/yaounde`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/livraison/douala`,  lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    ...QUARTIERS_YAOUNDE.map((q) => ({
      url: `${baseUrl}/livraison/yaounde/${q}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...QUARTIERS_DOUALA.map((q) => ({
      url: `${baseUrl}/livraison/douala/${q}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]

  const serviceRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/services/dl-solutions`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ]

  const legalRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/legal`,   lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`,   lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]

  return [
    ...mainRoutes,
    ...localSeoRoutes,
    ...serviceRoutes,
    ...legalRoutes,
    ...blogEntries,
  ]
}
