import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.quickgo.cm'
  
  // Pages principales
  const mainRoutes = [
    { url: '', priority: 1, changeFrequency: 'daily' as const },
    { url: '/marketplace', priority: 0.9, changeFrequency: 'daily' as const },
    { url: '/delivery', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/driver', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/vendors', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/wallet', priority: 0.7, changeFrequency: 'weekly' as const },
    { url: '/support', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/tracking', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/ai-assistant', priority: 0.7, changeFrequency: 'weekly' as const },
  ]

  // Pages d'authentification
  const authRoutes = [
    { url: '/auth/login', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/auth/register', priority: 0.6, changeFrequency: 'monthly' as const },
  ]

  // Pages SEO locales - TRES IMPORTANT pour le referencement local
  const localSeoRoutes = [
    // Grandes villes
    { url: '/livraison/yaounde', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/livraison/douala', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/livraison/bafoussam', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/garoua', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/bamenda', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/maroua', priority: 0.8, changeFrequency: 'weekly' as const },
    
    // Quartiers populaires Yaounde
    { url: '/livraison/yaounde/bastos', priority: 0.85, changeFrequency: 'weekly' as const },
    { url: '/livraison/yaounde/mvog-mbi', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/yaounde/mvan', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/yaounde/elig-essono', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/yaounde/ngousso', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/yaounde/nlongkak', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/yaounde/messa', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/yaounde/omnisport', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/yaounde/essos', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/yaounde/biyem-assi', priority: 0.8, changeFrequency: 'weekly' as const },
    
    // Quartiers populaires Douala
    { url: '/livraison/douala/akwa', priority: 0.85, changeFrequency: 'weekly' as const },
    { url: '/livraison/douala/bonanjo', priority: 0.85, changeFrequency: 'weekly' as const },
    { url: '/livraison/douala/deido', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/douala/bonapriso', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/douala/makepe', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/douala/ndokoti', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/livraison/douala/bali', priority: 0.8, changeFrequency: 'weekly' as const },
  ]

  // Pages services
  const serviceRoutes = [
    { url: '/services/restaurant', priority: 0.85, changeFrequency: 'weekly' as const },
    { url: '/services/pharmacie', priority: 0.85, changeFrequency: 'weekly' as const },
    { url: '/services/supermarche', priority: 0.85, changeFrequency: 'weekly' as const },
    { url: '/services/courses', priority: 0.85, changeFrequency: 'weekly' as const },
    { url: '/services/colis', priority: 0.85, changeFrequency: 'weekly' as const },
    { url: '/services/dl-solutions', priority: 0.7, changeFrequency: 'monthly' as const },
  ]

  // Pages legales
  const legalRoutes = [
    { url: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/legal/cookies', priority: 0.3, changeFrequency: 'yearly' as const },
  ]

  const allRoutes = [
    ...mainRoutes,
    ...authRoutes,
    ...localSeoRoutes,
    ...serviceRoutes,
    ...legalRoutes,
  ]

  return allRoutes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
