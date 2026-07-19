"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, UserCog,
  BarChart3, Tag, Star, Settings, HelpCircle, Bell, Boxes, Truck, Ticket,
  MessageSquare,
} from "lucide-react"
import { useT } from "@/lib/i18n/context"
import { LanguageSwitcher } from "@/components/ui/language-switcher"

// Sidebar vendeur partagée — thème sombre unifié, item actif déduit de l'URL.
// Source de vérité unique de la navigation (les pages historiques recopiaient
// chacune leur propre liste, avec des liens divergents).
const NAV = [
  { icon: LayoutDashboard, key: "snav.dashboard",    href: "/vendor/dashboard" },
  { icon: ShoppingBag,     key: "snav.orders",       href: "/vendor/orders" },
  { icon: Package,         key: "snav.products",     href: "/vendor/products" },
  { icon: Boxes,           key: "snav.stocks",       href: "/vendor/stocks" },
  { icon: Truck,           key: "snav.deliveries",   href: "/vendor/deliveries" },
  { icon: TrendingUp,      key: "snav.revenue",      href: "/vendor/analytics" },
  { icon: Wallet,          key: "snav.wallet",       href: "/vendor/wallet" },
  { icon: BarChart3,       key: "snav.finances",     href: "/vendor/finances" },
  { icon: Users,           key: "snav.crm",          href: "/vendor/crm" },
  { icon: UserCog,         key: "snav.employees",    href: "/vendor/employees" },
  { icon: Tag,             key: "snav.promotions",   href: "/vendor/promotions" },
  { icon: Ticket,          key: "snav.coupons",      href: "/vendor/coupons" },
  { icon: Star,            key: "snav.reviews",      href: "/vendor/reviews" },
  { icon: MessageSquare,   key: "snav.messages",     href: "/vendor/messages" },
  { icon: Bell,            key: "snav.notifications", href: "/vendor/notifications" },
  { icon: Settings,        key: "snav.settings",     href: "/vendor/settings" },
  { icon: HelpCircle,      key: "snav.help",         href: "/vendor/help" },
]

export function VendorSidebar() {
  const pathname = usePathname()
  const { t } = useT()

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
              <span>{t(item.key)}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-[#1e1e2e]">
        <LanguageSwitcher className="w-full justify-start" />
      </div>
    </aside>
  )
}
