import { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/site-config"

export const revalidate = 3600  // refresh sitemap every hour

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

  const mainRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`,                 lastModified: new Date(), changeFrequency: "daily",   priority: 1   },
    { url: `${baseUrl}/marketplace`,     lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/delivery`,        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${baseUrl}/blog`,            lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${baseUrl}/faq`,             lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/about`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/driver`,          lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/vendors`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/ai-assistant`,    lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/auth/login`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/auth/register`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ]

  const localSeoRoutes: MetadataRoute.Sitemap = [
    // Major cities
    { url: `${baseUrl}/livraison/yaounde`,  lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/livraison/douala`,   lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/livraison/bafoussam`,lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/livraison/garoua`,   lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/livraison/bamenda`,  lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/livraison/maroua`,   lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    // Yaoundé neighbourhoods
    { url: `${baseUrl}/livraison/yaounde/bastos`,      lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/livraison/yaounde/mvog-mbi`,    lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    { url: `${baseUrl}/livraison/yaounde/mvan`,        lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    { url: `${baseUrl}/livraison/yaounde/elig-essono`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    { url: `${baseUrl}/livraison/yaounde/ngousso`,     lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    { url: `${baseUrl}/livraison/yaounde/nlongkak`,    lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    { url: `${baseUrl}/livraison/yaounde/messa`,       lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    { url: `${baseUrl}/livraison/yaounde/omnisport`,   lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    { url: `${baseUrl}/livraison/yaounde/essos`,       lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    { url: `${baseUrl}/livraison/yaounde/biyem-assi`,  lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    // Douala neighbourhoods
    { url: `${baseUrl}/livraison/douala/akwa`,         lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/livraison/douala/bonanjo`,      lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/livraison/douala/deido`,        lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    { url: `${baseUrl}/livraison/douala/bonapriso`,    lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    { url: `${baseUrl}/livraison/douala/makepe`,       lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    { url: `${baseUrl}/livraison/douala/ndokoti`,      lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
    { url: `${baseUrl}/livraison/douala/bali`,         lastModified: new Date(), changeFrequency: "weekly", priority: 0.8  },
  ]

  const serviceRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/services/restaurant`,   lastModified: new Date(), changeFrequency: "weekly",  priority: 0.85 },
    { url: `${baseUrl}/services/pharmacie`,    lastModified: new Date(), changeFrequency: "weekly",  priority: 0.85 },
    { url: `${baseUrl}/services/supermarche`,  lastModified: new Date(), changeFrequency: "weekly",  priority: 0.85 },
    { url: `${baseUrl}/services/courses`,      lastModified: new Date(), changeFrequency: "weekly",  priority: 0.85 },
    { url: `${baseUrl}/services/colis`,        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.85 },
    { url: `${baseUrl}/services/dl-solutions`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7  },
  ]

  const legalRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/legal/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal/terms`,   lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]

  return [
    ...mainRoutes,
    ...localSeoRoutes,
    ...serviceRoutes,
    ...legalRoutes,
    ...blogEntries,
  ]
}
