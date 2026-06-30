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
  Moon,
  LogOut,
  LayoutDashboard,
  Store,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser, AuthChangeEvent, Session, AuthResponse } from "@supabase/supabase-js"

const navLinks = [
  { href: "/", label: "Accueil", active: true },
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
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; role: string | null } | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const loadProfile = async (uid: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role")
        .eq("id", uid)
        .single()
      setProfile(data as typeof profile)
    }

    supabase.auth.getUser().then((res: AuthResponse) => {
      const u = res.data.user
      setUser(u)
      if (u) {
        loadProfile(u.id)
        fetch("/api/cart").then((r) => r.ok ? r.json() : []).then((items: unknown[]) => setCartCount(Array.isArray(items) ? items.length : 0)).catch(() => {})
        fetch("/api/notifications").then((r) => r.ok ? r.json() : []).then((ns: { is_read?: boolean }[]) => setNotifCount(Array.isArray(ns) ? ns.filter((n) => !n.is_read).length : 0)).catch(() => {})
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
        // fetch counts on login
        fetch("/api/cart").then((r) => r.ok ? r.json() : []).then((items: unknown[]) => setCartCount(Array.isArray(items) ? items.length : 0)).catch(() => {})
        fetch("/api/notifications").then((r) => r.ok ? r.json() : []).then((ns: { is_read?: boolean }[]) => setNotifCount(Array.isArray(ns) ? ns.filter((n) => !n.is_read).length : 0)).catch(() => {})
      } else {
        setProfile(null)
        setCartCount(0)
        setNotifCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const dashboardHref =
    profile?.role === "vendor" ? "/vendor/dashboard" :
    profile?.role === "admin"  ? "/admin" :
    profile?.role === "driver" ? "/driver/dashboard" :
    "/dashboard"

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
              <Image
                src="/quickgo-logo.jpg"
                alt="QuickGo"
                width={140}
                height={40}
                className="h-8 lg:h-10 object-contain"
                style={{ width: 'auto' }}
                priority
              />
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
                    link.active
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
                <Link href="/marketplace/cart" className="relative">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href="/notifications" className="relative">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                    <Bell className="h-5 w-5" />
                    {notifCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {notifCount > 9 ? "9+" : notifCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>

              {/* Help & Support */}
              <Link
                href="/support"
                className="hidden lg:block px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Aide & Support
              </Link>

              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Moon className="h-5 w-5" />
              </Button>

              {/* Auth */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2 rounded-full hover:bg-muted/50">
                      {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt="avatar" width={32} height={32} className="rounded-full object-cover w-8 h-8" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                          {(profile?.full_name ?? user.email ?? "U")[0].toUpperCase()}
                        </div>
                      )}
                      <span className="hidden lg:block text-sm font-medium max-w-[120px] truncate">
                        {profile?.full_name ?? user.email}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem asChild>
                      <Link href={dashboardHref} className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" /> Mon tableau de bord
                      </Link>
                    </DropdownMenuItem>
                    {profile?.role === "vendor" && (
                      <DropdownMenuItem asChild>
                        <Link href="/vendor/dashboard" className="flex items-center gap-2">
                          <Store className="h-4 w-4" /> Espace vendeur
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center gap-2">
                        <User className="h-4 w-4" /> Mon profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive flex items-center gap-2">
                      <LogOut className="h-4 w-4" /> Se déconnecter
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
                  <Image
                    src="/quickgo-logo.jpg"
                    alt="QuickGo"
                    width={120}
                    height={36}
                    className="h-8"
                    style={{ width: 'auto' }}
                  />
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

                {/* Mobile Navigation Links */}
                <nav className="space-y-1 mb-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                        link.active
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

                {/* Mobile Auth */}
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-2">
                      {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt="avatar" width={40} height={40} className="rounded-full object-cover w-10 h-10" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                          {(profile?.full_name ?? user.email ?? "U")[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{profile?.full_name ?? "Mon compte"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link href={dashboardHref} onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full h-12 font-semibold justify-start gap-2">
                        <LayoutDashboard className="h-4 w-4" /> Tableau de bord
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full h-12 font-semibold justify-start gap-2 text-destructive hover:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" /> Se déconnecter
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href="/auth/login" className="block">
                      <Button className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
                        Se connecter
                      </Button>
                    </Link>
                    <Link href="/auth/register" className="block">
                      <Button variant="outline" className="w-full h-12 font-semibold">
                        Créer un compte
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
