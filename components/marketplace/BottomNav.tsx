"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Package, Heart, User } from "lucide-react"
import { useT } from "@/lib/i18n/context"

// Mobile bottom tab bar for the marketplace (Jumia/Glovo pattern). The desktop
// sidebar is hidden below lg and left no navigation at all on mobile — this
// restores access to the core destinations.
const TABS = [
  { icon: Home,    labelKey: "app.tabs.home",      href: "/marketplace",           exact: true  },
  { icon: Compass, labelKey: "app.tabs.explore",   href: "/marketplace/products",  exact: false },
  { icon: Package, labelKey: "app.tabs.orders",    href: "/marketplace/orders",    exact: false },
  { icon: Heart,   labelKey: "app.tabs.favorites", href: "/marketplace/favorites", exact: false },
  { icon: User,    labelKey: "app.tabs.account",   href: "/dashboard",             exact: false },
]

// Routes with their own fixed bottom CTA (sticky checkout bar) — the tab bar
// would stack under it and eat vertical space at the exact moment the user
// must confirm payment.
const HIDDEN_ON = ["/marketplace/cart", "/marketplace/checkout"]

export function MarketplaceBottomNav() {
  const pathname = usePathname()
  const { t } = useT()

  if (HIDDEN_ON.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return null
  }

  return (
    <>
      {/* Spacer so page content never hides behind the fixed bar */}
      <div className="h-16 lg:hidden" aria-hidden="true" />

      <nav
        aria-label="Navigation principale"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111118]/95 backdrop-blur-xl border-t border-[#1e1e2e] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-16">
          {TABS.map(tab => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(tab.href + "/")
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-1"
              >
                <tab.icon
                  className={`w-5 h-5 transition-colors ${
                    active ? "text-quickgo-lime" : "text-[#6b6b8a]"
                  }`}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span
                  className={`text-[10px] leading-none transition-colors ${
                    active ? "text-quickgo-lime font-semibold" : "text-[#6b6b8a]"
                  }`}
                >
                  {t(tab.labelKey)}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
