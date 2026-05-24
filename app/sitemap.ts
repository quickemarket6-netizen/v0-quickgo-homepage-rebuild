import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.quickgo.cm'
  
  const routes = [
    '',
    '/marketplace',
    '/delivery',
    '/driver',
    '/vendors',
    '/wallet',
    '/ai',
    '/support',
    '/tracking',
    '/auth/login',
    '/auth/register',
    '/dashboard',
    '/admin',
    '/driver/dashboard',
    '/vendor/dashboard',
  ]
  
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route.includes('dashboard') ? 0.6 : 0.8,
  }))
}
