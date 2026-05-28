import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Clock, Phone, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar/navbar'
import { Footer } from '@/components/footer/footer'

const quartiersDouala: Record<string, { name: string; deliveryTime: string; description: string }> = {
  'akwa': { name: 'Akwa', deliveryTime: '15-25 min', description: 'Centre-ville, zone commerciale' },
  'bonanjo': { name: 'Bonanjo', deliveryTime: '15-25 min', description: 'Quartier administratif' },
  'bonapriso': { name: 'Bonapriso', deliveryTime: '20-30 min', description: 'Quartier residentiel huppé' },
  'deido': { name: 'Deido', deliveryTime: '20-30 min', description: 'Quartier historique' },
  'makepe': { name: 'Makepe', deliveryTime: '25-35 min', description: 'Zone residentielle moderne' },
  'ndokoti': { name: 'Ndokoti', deliveryTime: '30-40 min', description: 'Carrefour commercial' },
  'bali': { name: 'Bali', deliveryTime: '20-30 min', description: 'Proche du port' },
  'new-bell': { name: 'New Bell', deliveryTime: '25-35 min', description: 'Quartier populaire' },
  'bonaberi': { name: 'Bonaberi', deliveryTime: '35-45 min', description: 'Autre rive du Wouri' },
  'kotto': { name: 'Kotto', deliveryTime: '30-40 min', description: 'Zone industrielle' },
  'logpom': { name: 'Logpom', deliveryTime: '35-45 min', description: 'Quartier en expansion' },
  'yassa': { name: 'Yassa', deliveryTime: '40-50 min', description: 'Zone periurbaine' },
}

export async function generateStaticParams() {
  return Object.keys(quartiersDouala).map((slug) => ({ quartier: slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ quartier: string }> }): Promise<Metadata> {
  const { quartier } = await params
  const data = quartiersDouala[quartier]
  
  if (!data) return { title: 'Quartier non trouve' }
  
  return {
    title: `Livraison ${data.name} Douala - Express ${data.deliveryTime} | QuickGo`,
    description: `Service de livraison rapide a ${data.name}, Douala. Livraison en ${data.deliveryTime}. Restaurants, pharmacies, supermarches. Commandez!`,
    keywords: [`livraison ${data.name}`, `livraison ${data.name} Douala`, 'QuickGo', 'livraison express'],
    openGraph: {
      title: `Livraison ${data.name} | QuickGo Douala`,
      description: `Livraison express a ${data.name} en ${data.deliveryTime}. ${data.description}.`,
      url: `https://www.quickgo.cm/livraison/douala/${quartier}`,
    },
  }
}

export default async function QuartierDoualaPage({ params }: { params: Promise<{ quartier: string }> }) {
  const { quartier } = await params
  const data = quartiersDouala[quartier]
  
  if (!data) notFound()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="relative pt-24 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Link href="/livraison/douala" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Retour a Douala
          </Link>
          
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">{data.name}, Douala</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Livraison a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                {data.name}
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-6">{data.description}</p>
            
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border mb-8">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="text-lg font-semibold">Temps de livraison: {data.deliveryTime}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/marketplace">
                <Button size="lg" className="gap-2 bg-cyan-500 hover:bg-cyan-600 text-black">
                  Commander maintenant
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="tel:+237690773615">
                <Button size="lg" variant="outline" className="gap-2">
                  <Phone className="w-5 h-5" />
                  +237 690 773 615
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services disponibles */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Services disponibles a {data.name}
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: 'Restaurants', icon: '🍽️', desc: 'Cuisine locale et internationale' },
              { name: 'Pharmacies', icon: '💊', desc: 'Medicaments 24/7' },
              { name: 'Supermarches', icon: '🛒', desc: 'Santa Lucia, Mahima' },
              { name: 'Colis Express', icon: '📦', desc: 'Livraison meme jour' },
            ].map((service) => (
              <div key={service.name} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                <span className="text-3xl">{service.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
