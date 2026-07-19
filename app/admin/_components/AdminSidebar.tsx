"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useT } from "@/lib/i18n/context"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import {
  LayoutDashboard, DollarSign, Store, Truck, Package,
  Navigation, Wallet, CreditCard, FileText, Activity,
  ShieldCheck, MessageCircle, Bell, MapPin, Settings,
  Layers, Globe, Users, Lock, Plug, Database, Headphones, ChevronDown,
  Tag, Megaphone, Banknote, FolderTree, Menu, X, LogOut,
} from "lucide-react"

async function adminSignOut() {
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
  } finally {
    window.location.href = "/auth/login"
  }
}

const NAV = [
  { icon: LayoutDashboard, labelKey: "snav.dashboard",    href: "/admin"                       },
  { icon: DollarSign,      labelKey: "snav.finances",            href: "/admin/finances",     arrow: true },
  { icon: Store,           labelKey: "snav.vendors",            href: "/admin/vendors"               },
  { icon: Truck,           labelKey: "snav.drivers",          href: "/admin/drivers"               },
  { icon: Package,         labelKey: "snav.orders",           href: "/admin/orders"                },
  { icon: FolderTree,      labelKey: "snav.categories",          href: "/admin/categories"            },
  { icon: Navigation,      labelKey: "snav.deliveries",          href: "/admin/deliveries"            },
  { icon: Tag,             labelKey: "snav.deliveryRates",    href: "/admin/delivery-rates"        },
  { icon: Wallet,          labelKey: "snav.wallets",             href: "/admin/wallets"               },
  { icon: Banknote,        labelKey: "snav.driverWallet",     href: "/admin/delivery-wallet"       },
  { icon: CreditCard,      labelKey: "snav.payouts",             href: "/admin/payouts"               },
  { icon: FileText,        labelKey: "snav.transactions",        href: "/admin/transactions"  },
  { icon: Activity,        labelKey: "snav.analytics",        href: "/admin/analytics"     },
  { icon: ShieldCheck,     labelKey: "snav.security",            href: "/admin/security"      },
  { icon: MessageCircle,   labelKey: "snav.crmSupport",       href: "/admin/support"       },
  { icon: Bell,            labelKey: "snav.notifications",       href: "/admin/notifications"     },
  { icon: Megaphone,       labelKey: "snav.communication",       href: "/admin/communication"     },
  { icon: MapPin,          labelKey: "snav.zones",  href: "/admin/zones"             },
  { icon: Settings,        labelKey: "snav.settings",          href: "/admin/settings"      },
  { icon: Layers,          labelKey: "snav.cms",         href: "/admin/cms"           },
  { icon: Globe,           labelKey: "snav.seo",          href: "/admin/seo"           },
  { icon: Users,           labelKey: "snav.users",        href: "/admin/users"         },
  { icon: Lock,            labelKey: "snav.permissions", href: "/admin/permissions"   },
  { icon: FileText,        labelKey: "snav.logs",        href: "/admin/logs"          },
  { icon: Plug,            labelKey: "snav.api",  href: "/admin/api"           },
  { icon: Database,        labelKey: "snav.backups",         href: "/admin/backups"       },
  { icon: Headphones,      labelKey: "snav.techSupport",   href: "/admin/support-tech"  },
]

// Active only for an exact match or a real sub-path (href + "/…").  Prevents the
// old `startsWith` collision where /admin/support-tech also lit up /admin/support.
function isActiveHref(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname === href || pathname.startsWith(href + "/")
}

function Logo() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
        <span className="text-white font-black text-sm">Q</span>
      </div>
      <div>
        <span className="text-[15px] font-black text-white tracking-tight">QUICK</span>
        <span className="text-[15px] font-black text-lime-400 tracking-tight">GO</span>
        <p className="text-[9px] text-red-400 uppercase tracking-widest font-bold leading-none mt-0.5">Admin</p>
      </div>
    </Link>
  )
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { t } = useT()
  return (
    <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
      {NAV.map((item) => {
        const isActive = isActiveHref(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-[13px] font-medium group ${
              isActive
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-[#6b6b8a] hover:bg-[#16161f] hover:text-white"
            }`}
          >
            <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-[#6b6b8a] group-hover:text-white"}`} />
            <span className="flex-1 truncate">{t(item.labelKey)}</span>
            {"arrow" in item && item.arrow && (
              <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

interface AdminProfile { name: string; roleLabel: string; initials: string }

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Administrateur",
  admin: "Administrateur",
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
}

function ProfileFooter({ profile }: { profile: AdminProfile | null }) {
  const name = profile?.name ?? "Administrateur"
  const roleLabel = profile?.roleLabel ?? "Compte admin"
  const initials = profile?.initials ?? "AD"
  return (
    <div className="p-3 border-t border-[#1e1e2e]">
      <div className="flex items-center gap-2.5 px-2 py-2">
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">{initials}</span>
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0d0d14]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[13px] font-semibold truncate leading-none">{name}</p>
          <p className="text-[10px] text-[#6b6b8a] mt-0.5 leading-none truncate">{roleLabel}</p>
          <p className="text-[10px] text-green-400 mt-0.5 leading-none font-medium">● En ligne</p>
        </div>
        <button
          type="button"
          onClick={adminSignOut}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="shrink-0 p-2 rounded-lg text-[#6b6b8a] hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profile, setProfile] = useState<AdminProfile | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single()
        if (cancelled) return
        const name = data?.full_name || user.email?.split("@")[0] || "Administrateur"
        setProfile({
          name,
          roleLabel: ROLE_LABELS[data?.role ?? ""] ?? "Compte admin",
          initials: initialsFrom(name),
        })
      } catch {
        /* keep the neutral fallback */
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#1e1e2e] bg-[#0d0d14]">
        <div className="p-5 border-b border-[#1e1e2e]">
          <Logo />
        </div>
        <NavList pathname={pathname} />
        <div className="px-3 py-2 border-t border-[#1e1e2e]">
          <LanguageSwitcher className="w-full justify-start" />
        </div>
        <ProfileFooter profile={profile} />
      </aside>

      {/* ── Mobile trigger (hidden on desktop) ──────────────────────── */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Ouvrir le menu admin"
        className="lg:hidden fixed bottom-5 left-5 z-50 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile drawer ───────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-[60] flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-72 max-w-[85vw] h-full flex flex-col border-r border-[#1e1e2e] bg-[#0d0d14]"
            >
              <div className="p-5 border-b border-[#1e1e2e] flex items-center justify-between">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer le menu"
                  className="p-1.5 rounded-lg text-[#6b6b8a] hover:text-white hover:bg-[#16161f] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              <ProfileFooter profile={profile} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
