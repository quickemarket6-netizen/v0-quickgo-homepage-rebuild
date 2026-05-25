"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu,
  X,
  ChevronDown,
  MapPin,
  Search,
  Heart,
  ShoppingCart,
  Bell,
  User,
  LogOut,
  Package,
  LayoutDashboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCart } from "@/lib/store/cart"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/marketplace", label: "Explorer" },
  { href: "/marketplace/shops", label: "Magasins" },
  { href: "/marketplace/offers", label: "Offres", badge: "🔥" },
  { href: "/delivery", label: "Livraison Express" },
  { href: "/wallet", label: "QuickGo Pay" },
  { href: "/vendors", label: "Devenir Vendeur" },
  { href: "/ai", label: "AI Assistant", badge: "Nouveau" },
]

const cities = [
  "Yaoundé",
  "Douala",
  "Bafoussam",
  "Bamenda",
  "Garoua",
  "Maroua",
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState("Yaoundé")
  const [user, setUser] = useState<any>(null)
  const [currentPath, setCurrentPath] = useState("/")
  const totalItems = useCart((s) => s.getTotalItems())
  const router = useRouter()

  useEffect(() => {
    setCurrentPath(window.location.pathname)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
    router.refresh()
  }

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center">
                  <span className="text-white font-black text-sm">Q</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-xl font-black text-white">QUICK</span>
                  <span className="text-xl font-black text-quickgo-lime">GO</span>
                </div>
              </div>
            </Link>

            {/* City Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{selectedCity}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {cities.map((city) => (
                  <DropdownMenuItem
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={city === selectedCity ? "bg-primary/10 text-primary" : ""}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {city}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-xl mx-6">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un produit, magasin, restaurant..."
                  className="w-full h-11 pl-11 pr-4 rounded-full bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value) {
                      router.push(`/marketplace?search=${encodeURIComponent(e.currentTarget.value)}`)
                    }
                  }}
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-1">
              {navLinks.slice(0, 5).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                    currentPath === link.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-secondary text-secondary-foreground rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Icons - Desktop */}
              <div className="hidden md:flex items-center gap-1">
                <Link href="/marketplace/favorites">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Heart className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/marketplace/cart">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {totalItems > 99 ? "99+" : totalItems}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
                  </Button>
                </Link>
              </div>

              {/* Help */}
              <Link
                href="/support"
                className="hidden lg:block px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Aide
              </Link>

              {/* Auth */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center">
                        <User className="h-3 w-3 text-white" />
                      </div>
                      <span className="hidden sm:inline text-sm">
                        {user.user_metadata?.full_name?.split(" ")[0] || "Mon compte"}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Tableau de bord
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/marketplace/orders">
                        <Package className="h-4 w-4 mr-2" />
                        Mes commandes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth/login">
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-4 lg:px-6">
                    Se connecter
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden text-foreground"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-background border-l border-border z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center">
                      <span className="text-white font-black text-sm">Q</span>
                    </div>
                    <span className="text-xl font-black text-white">QUICK<span className="text-quickgo-lime">GO</span></span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                {/* Mobile Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Mobile City Selector */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 mb-6">
                  <MapPin className="h-5 w-5 text-primary" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="flex-1 bg-transparent text-foreground text-sm font-medium focus:outline-none"
                  >
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cart indicator */}
                {totalItems > 0 && (
                  <Link
                    href="/marketplace/cart"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between p-4 mb-4 rounded-xl bg-secondary/10 border border-secondary/30"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-secondary" />
                      <span className="text-foreground font-medium">Mon panier</span>
                    </div>
                    <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-full">
                      {totalItems}
                    </span>
                  </Link>
                )}

                {/* Mobile Navigation Links */}
                <nav className="space-y-1 mb-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                        currentPath === link.href
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.label}
                      {link.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground rounded-full">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </nav>

                {/* Mobile Auth Buttons */}
                <div className="space-y-3">
                  {user ? (
                    <>
                      <Link href="/dashboard" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full h-12 font-semibold">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Tableau de bord
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full h-12 font-semibold text-destructive hover:text-destructive"
                        onClick={() => { handleSignOut(); setIsMobileMenuOpen(false) }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Se déconnecter
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
                          Se connecter
                        </Button>
                      </Link>
                      <Link href="/auth/register" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full h-12 font-semibold">
                          Créer un compte
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
