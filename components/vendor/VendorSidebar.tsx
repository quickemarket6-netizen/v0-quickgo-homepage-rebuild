"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, UserCog,
  BarChart3, Tag, Star, Settings, HelpCircle, Bell, Boxes, Truck, Ticket,
  MessageSquare,
} from "lucide-react"

// Sidebar vendeur partagée — thème sombre unifié, item actif déduit de l'URL.
// Source de vérité unique de la navigation (les pages historiques recopiaient
// chacune leur propre liste, avec des liens divergents).
const NAV = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  { icon: ShoppingBag,     label: "Commandes",       href: "/vendor/orders" },
  { icon: Package,         label: "Produits",        href: "/vendor/products" },
  { icon: Boxes,           label: "Stocks",          href: "/vendor/stocks" },
  { icon: Truck,           label: "Livraisons",      href: "/vendor/deliveries" },
  { icon: TrendingUp,      label: "Revenus",         href: "/vendor/analytics" },
  { icon: Wallet,          label: "Portefeuille",    href: "/vendor/wallet" },
  { icon: BarChart3,       label: "Finances",        href: "/vendor/finances" },
  { icon: Users,           label: "Clients CRM",     href: "/vendor/crm" },
  { icon: UserCog,         label: "Employés",        href: "/vendor/employees" },
  { icon: Tag,             label: "Promotions",      href: "/vendor/promotions" },
  { icon: Ticket,          label: "Coupons",         href: "/vendor/coupons" },
  { icon: Star,            label: "Avis",            href: "/vendor/reviews" },
  { icon: MessageSquare,   label: "Messages",        href: "/vendor/messages" },
  { icon: Bell,            label: "Notifications",   href: "/vendor/notifications" },
  { icon: Settings,        label: "Paramètres",      href: "/vendor/settings" },
  { icon: HelpCircle,      label: "Aide",            href: "/vendor/help" },
]

export function VendorSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== "/vendor/dashboard" && pathname.startsWith(href + "/")) || pathname.startsWith(href + "?")

  return (
    <aside className="hidden lg:flex w-60 flex-col bg-[#111118] border-r border-[#1e1e2e] fixed h-full z-20">
      <div className="p-5 border-b border-[#1e1e2e]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center shrink-0">
            <span className="text-white font-black text-base">Q</span>
          </div>
          <div>
            <p className="text-white font-black text-base leading-none">QUICK<span className="text-[#a3e635]">GO</span></p>
            <p className="text-[9px] text-white/30 leading-none mt-0.5">Espace Vendeur</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-[#a3e635]/10 border-l-2 border-[#a3e635] text-[#a3e635] rounded-r-xl pl-[10px]"
                  : "rounded-xl text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
