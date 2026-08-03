import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Clock, Truck, Phone, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar/navbar'
import { Footer } from '@/components/footer/footer'

export const metadata: Metadata = {
  title: 'Livraison Yaounde - Service Express 30min | QuickGo',
  description: 'Service de livraison rapide a Yaounde. Livraison en 30 minutes dans tous les quartiers: Bastos, Mvog-Mbi, Mvan, Elig-Essono, Ngousso. Commandez maintenant!',
  keywords: ['livraison Yaounde', 'livraison express Yaounde', 'livraison Bastos', 'livraison rapide Cameroun', 'QuickGo Yaounde'],
  openGraph: {
    title: 'Livraison Express Yaounde | QuickGo',
    description: 'Livraison en 30 minutes dans tous les quartiers de Yaounde. Restaurants, pharmacies, supermarches.',
    url: 'https://www.quickgo.cm/livraison/yaounde',
  },
}

const quartiers = [
  { name: 'Bastos', slug: 'bastos', deliveryTime: '20-30 min', popular: true },
  { name: 'Mvog-Mbi', slug: 'mvog-mbi', deliveryTime: '25-35 min', popular: true },
  { name: 'Mvan', slug: 'mvan', deliveryTime: '20-30 min', popular: true },
  { name: 'Elig-Essono', slug: 'elig-essono', deliveryTime: '25-35 min', popular: true },
  { name: 'Ngousso', slug: 'ngousso', deliveryTime: '30-40 min', popular: false },
  { name: 'Nlongkak', slug: 'nlongkak', deliveryTime: '25-35 min', popular: false },
  { name: 'Messa', slug: 'messa', deliveryTime: '30-40 min', popular: false },
  { name: 'Omnisport', slug: 'omnisport', deliveryTime: '25-35 min', popular: false },
  { name: 'Essos', slug: 'essos', deliveryTime: '30-40 min', popular: false },
  { name: 'Biyem-Assi', slug: 'biyem-assi', deliveryTime: '35-45 min', popular: false },
  { name: 'Nkolbisson', slug: 'nkolbisson', deliveryTime: '40-50 min', popular: false },
  { name: 'Mendong', slug: 'mendong', deliveryTime: '35-45 min', popular: false },
]

const stats = [
  { value: '50,000+', label: 'Livraisons a Yaounde' },
  { value: '30 min', label: 'Temps moyen' },
  { value: '4.8/5', label: 'Note clients' },
  { value: '500+', label: 'Commercants partenaires' },
]

const services = [
  { name: 'Restaurants', icon: '🍽️', description: 'Vos plats preferes livres chauds' },
  { name: 'Pharmacies', icon: '💊', description: 'Medicaments livres en urgence' },
  { name: 'Supermarches', icon: '🛒', description: 'Courses du quotidien' },
  { name: 'Colis', icon: '📦', description: 'Envoi et reception de colis' },
]

export default function LivraisonYaoundePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-lime-500/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-500/10 border border-lime-500/20 mb-6">
              <MapPin className="w-4 h-4 text-lime-400" />
              <span className="text-sm text-lime-400 font-medium">Yaounde, Cameroun</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Livraison Express a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500">
                Yaounde
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              QuickGo livre dans tous les quartiers de Yaounde en 30 minutes. 
              Restaurants, pharmacies, supermarches et bien plus encore.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/marketplace">
                <Button size="lg" className="gap-2 bg-lime-500 hover:bg-lime-600 text-black">
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

      {/* Stats */}
      <section className="py-12 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-lime-400 mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quartiers */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4 text-center">
            Quartiers desservis a Yaounde
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            QuickGo couvre tous les quartiers de Yaounde avec des temps de livraison optimises.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quartiers.map((quartier) => (
              <Link 
                key={quartier.slug}
                href={`/livraison/yaounde/${quartier.slug}`}
                className="group p-4 rounded-xl bg-card border border-border hover:border-lime-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground group-hover:text-lime-400 transition-colors">
                    {quartier.name}
                  </h3>
                  {quartier.popular && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-lime-500/10 text-lime-400">
                      Populaire
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{quartier.deliveryTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
            Nos services a Yaounde
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div key={service.name} className="p-6 rounded-xl bg-card border border-border text-center">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="font-semibold text-foreground mb-2">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Pourquoi choisir QuickGo a Yaounde?
              </h2>
              <div className="space-y-4">
                {[
                  'Livraison en 30 minutes garantie',
                  'Suivi GPS en temps reel',
                  'Paiement Mobile Money (Orange, MTN)',
                  'Service client 24/7',
                  'Livreurs professionnels et verifies',
                  'Application mobile intuitive',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-lime-400 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-8 rounded-2xl bg-gradient-to-br from-lime-500/10 to-green-500/10 border border-lime-500/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-lime-500/20 flex items-center justify-center">
                  <Truck className="w-8 h-8 text-lime-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Commencez maintenant</h3>
                  <p className="text-muted-foreground">Premiere livraison gratuite!</p>
                </div>
              </div>
              <Link href="/auth/register">
                <Button className="w-full bg-lime-500 hover:bg-lime-600 text-black">
                  Creer mon compte gratuit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
