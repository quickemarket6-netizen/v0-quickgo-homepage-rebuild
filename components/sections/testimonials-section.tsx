"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import { Star, Quote, ChevronLeft, ChevronRight, Verified, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

const testimonials = [
  {
    id: 1,
    name: "Marie Nguemo",
    role: "Cliente reguliere",
    location: "Yaounde, Bastos",
    avatar: "/avatars/marie.jpg",
    rating: 5,
    text: "QuickGo a revolutionne ma facon de faire mes courses. Livraison en 20 minutes, produits frais et livreurs tres professionnels. Je recommande a 100%!",
    date: "Il y a 2 jours",
    verified: true,
    orderCount: 47,
  },
  {
    id: 2,
    name: "Jean-Paul Mbarga",
    role: "Chef d'entreprise",
    location: "Douala, Akwa",
    avatar: "/avatars/jean.jpg",
    rating: 5,
    text: "En tant que professionnel, j'ai besoin de services rapides et fiables. QuickGo repond parfaitement a mes attentes. Le suivi en temps reel est un plus enorme.",
    date: "Il y a 5 jours",
    verified: true,
    orderCount: 124,
  },
  {
    id: 3,
    name: "Awa Diallo",
    role: "Etudiante",
    location: "Yaounde, Mvan",
    avatar: "/avatars/awa.jpg",
    rating: 5,
    text: "Les prix sont accessibles et la qualite est au rendez-vous. L'application est super intuitive. Mon app preferee pour commander!",
    date: "Il y a 1 semaine",
    verified: true,
    orderCount: 32,
  },
  {
    id: 4,
    name: "Emmanuel Fotso",
    role: "Restaurateur",
    location: "Bafoussam",
    avatar: "/avatars/emmanuel.jpg",
    rating: 5,
    text: "En tant que vendeur sur QuickGo, j'ai vu mes ventes augmenter de 300%. La plateforme est excellente et le support est toujours disponible.",
    date: "Il y a 3 jours",
    verified: true,
    orderCount: 89,
  },
  {
    id: 5,
    name: "Christelle Atangana",
    role: "Maman de famille",
    location: "Yaounde, Omnisports",
    avatar: "/avatars/christelle.jpg",
    rating: 5,
    text: "Avec 3 enfants, je n'ai plus le temps de faire les courses. QuickGo me sauve la vie! Tout arrive frais et bien emballe. Merci!",
    date: "Il y a 4 jours",
    verified: true,
    orderCount: 156,
  },
  {
    id: 6,
    name: "Samuel Ndongo",
    role: "Livreur QuickGo",
    location: "Douala, Bonaberi",
    avatar: "/avatars/samuel.jpg",
    rating: 5,
    text: "Travailler avec QuickGo m'a permis d'avoir un revenu stable. L'application livreur est top et le support nous accompagne vraiment bien.",
    date: "Il y a 1 semaine",
    verified: true,
    orderCount: 0,
  },
]

const stats = [
  { value: "4.9", label: "Note moyenne", suffix: "/5" },
  { value: "50K", label: "Avis clients", suffix: "+" },
  { value: "98", label: "Satisfaction", suffix: "%" },
  { value: "10K", label: "Clients fideles", suffix: "+" },
]

export function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextTestimonial = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section ref={ref} className="relative py-24 lg:py-32 overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-quickgo-blue/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-quickgo-cyan/5 rounded-full blur-[120px]" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-quickgo-lime/10 border border-quickgo-lime/20 mb-6"
          >
            <Star className="h-4 w-4 text-quickgo-lime fill-quickgo-lime" />
            <span className="text-sm font-medium text-quickgo-lime">AVIS CLIENTS</span>
          </motion.div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance">
            Ce que nos clients{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-quickgo-lime to-quickgo-cyan">
              disent de nous
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Des milliers de clients nous font confiance chaque jour. Decouvrez leurs experiences.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-card/50 backdrop-blur-xl border border-border/30 rounded-2xl p-6 text-center group hover:border-quickgo-blue/30 transition-all"
            >
              <div className="text-3xl lg:text-4xl font-bold text-white mb-1">
                {stat.value}
                <span className="text-quickgo-lime">{stat.suffix}</span>
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Testimonial Carousel */}
        <div className="relative">
          {/* Featured Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 }}
            className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/30 rounded-3xl p-8 lg:p-12 mb-8 overflow-hidden"
          >
            {/* Quote Icon */}
            <div className="absolute top-8 right-8 opacity-10">
              <Quote className="w-24 h-24 text-quickgo-lime" />
            </div>

            {/* Animated Border */}
            <div className="absolute inset-0 rounded-3xl opacity-50">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-quickgo-blue via-quickgo-cyan to-quickgo-lime opacity-20 blur-sm" />
            </div>

            <div className="relative z-10 grid lg:grid-cols-[1fr_2fr] gap-8 items-center">
              {/* Avatar Section */}
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center lg:items-start"
              >
                <div className="relative mb-4">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan p-1">
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-3xl lg:text-4xl font-bold text-white">
                      {testimonials[currentIndex].name.charAt(0)}
                    </div>
                  </div>
                  {testimonials[currentIndex].verified && (
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-quickgo-lime rounded-full flex items-center justify-center shadow-lg">
                      <Verified className="w-5 h-5 text-background" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white">{testimonials[currentIndex].name}</h3>
                <p className="text-sm text-quickgo-cyan">{testimonials[currentIndex].role}</p>
                <div className="flex items-center gap-1 mt-2 text-muted-foreground text-xs">
                  <MapPin className="w-3 h-3" />
                  {testimonials[currentIndex].location}
                </div>
                {testimonials[currentIndex].orderCount > 0 && (
                  <div className="mt-3 px-3 py-1 rounded-full bg-quickgo-blue/20 text-quickgo-blue text-xs font-medium">
                    {testimonials[currentIndex].orderCount} commandes
                  </div>
                )}
              </motion.div>

              {/* Content Section */}
              <motion.div
                key={`content-${currentIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Rating */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < testimonials[currentIndex].rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {testimonials[currentIndex].date}
                  </span>
                </div>

                {/* Quote */}
                <blockquote className="text-xl lg:text-2xl text-white font-medium leading-relaxed mb-6">
                  {`"${testimonials[currentIndex].text}"`}
                </blockquote>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setIsAutoPlaying(false)
                          setCurrentIndex(index)
                        }}
                        className={`h-2 rounded-full transition-all ${
                          index === currentIndex
                            ? "w-8 bg-quickgo-lime"
                            : "w-2 bg-white/20 hover:bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevTestimonial}
                      className="rounded-full border-white/20 bg-white/5 hover:bg-white/10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextTestimonial}
                      className="rounded-full border-white/20 bg-white/5 hover:bg-white/10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Mini Testimonial Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {testimonials
              .filter((_, i) => i !== currentIndex)
              .slice(0, 3)
              .map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  onClick={() => {
                    setIsAutoPlaying(false)
                    setCurrentIndex(testimonials.findIndex(t => t.id === testimonial.id))
                  }}
                  className="bg-card/50 backdrop-blur-xl border border-border/30 rounded-2xl p-6 cursor-pointer hover:border-quickgo-blue/30 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center text-sm font-bold text-white">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                    </div>
                    {testimonial.verified && (
                      <Verified className="w-4 h-4 text-quickgo-lime ml-auto" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < testimonial.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 group-hover:text-white/80 transition-colors">
                    {`"${testimonial.text}"`}
                  </p>
                </motion.div>
              ))}
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-6">
            Rejoignez des milliers de clients satisfaits
          </p>
          <Button
            size="lg"
            className="h-14 px-8 bg-quickgo-lime text-background hover:bg-quickgo-lime/90 font-semibold shadow-[0_0_30px_rgba(191,255,0,0.3)]"
          >
            Commencer maintenant
            <Star className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
