import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero"
import { CategoriesSection, CitiesSection, PartnersSection, FeaturesSection, TestimonialsSection, VideoShowcaseSection } from "@/components/sections"
import { Footer } from "@/components/footer"
import JsonLd from "@/components/seo/json-ld"

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <main className="min-h-screen bg-background">
        <Navbar />
        <HeroSection />
        <CategoriesSection />
        <CitiesSection />
        <FeaturesSection />
        <VideoShowcaseSection />
        <TestimonialsSection />
        <PartnersSection />
        <Footer />
      </main>
    </>
  )
}
