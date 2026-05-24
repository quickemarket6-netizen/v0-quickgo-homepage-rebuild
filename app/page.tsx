import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero"
import { CategoriesSection, CitiesSection, PartnersSection, FeaturesSection } from "@/components/sections"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <CategoriesSection />
      <CitiesSection />
      <FeaturesSection />
      <PartnersSection />
      <Footer />
    </main>
  )
}
