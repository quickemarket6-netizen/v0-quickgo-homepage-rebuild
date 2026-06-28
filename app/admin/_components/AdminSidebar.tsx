"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, DollarSign, Store, Truck, Package,
  Navigation, Wallet, CreditCard, FileText, Activity,
  ShieldCheck, MessageCircle, Bell, MapPin, Settings,
  Layers, Globe, Users, Lock, Plug, Database, Headphones, ChevronDown,
  Tag, Megaphone, Banknote, FolderTree,
} from "lucide-react"

const NAV = [
  { icon: LayoutDashboard, label: "Tableau de bord",    href: "/admin"                       },
  { icon: DollarSign,      label: "Finances",            href: "/admin/finances",     arrow: true },
  { icon: Store,           label: "Vendeurs",            href: "/admin/vendors"               },
  { icon: Truck,           label: "Chauffeurs",          href: "/admin/drivers"               },
  { icon: Package,         label: "Commandes",           href: "/admin/orders"                },
  { icon: FolderTree,      label: "Catégories",          href: "/admin/categories"            },
  { icon: Navigation,      label: "Livraisons",          href: "/admin/deliveries"            },
  { icon: Tag,             label: "Tarifs livraison",    href: "/admin/delivery-rates"        },
  { icon: Wallet,          label: "Wallets",             href: "/admin/wallets"               },
  { icon: Banknote,        label: "Wallet livreurs",     href: "/admin/delivery-wallet"       },
  { icon: CreditCard,      label: "Payouts",             href: "/admin/payouts"               },
  { icon: FileText,        label: "Transactions",        href: "/admin/transactions"  },
  { icon: Activity,        label: "Analytics IA",        href: "/admin/analytics"     },
  { icon: ShieldCheck,     label: "Sécurité",            href: "/admin/security"      },
  { icon: MessageCircle,   label: "CRM & Support",       href: "/admin/support"       },
  { icon: Bell,            label: "Notifications",       href: "/admin/notifications"     },
  { icon: Megaphone,       label: "Communication",       href: "/admin/communication"     },
  { icon: MapPin,          label: "Gestion des villes",  href: "/admin/zones"             },
  { icon: Settings,        label: "Paramètres",          href: "/admin/settings"      },
  { icon: Layers,          label: "CMS & Pages",         href: "/admin/cms"           },
  { icon: Globe,           label: "SEO Center",          href: "/admin/seo"           },
  { icon: Users,           label: "Utilisateurs",        href: "/admin/users"         },
  { icon: Lock,            label: "Permissions & Rôles", href: "/admin/permissions"   },
  { icon: FileText,        label: "Logs système",        href: "/admin/logs"          },
  { icon: Plug,            label: "API & Intégrations",  href: "/admin/api"           },
  { icon: Database,        label: "Sauvegardes",         href: "/admin/backups"       },
  { icon: Headphones,      label: "Support technique",   href: "/admin/support-tech"  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-[#1e1e2e] bg-[#0d0d14]">
      {/* logo */}
      <div className="p-5 border-b border-[#1e1e2e]">
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
      </div>

      {/* nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-[13px] font-medium group ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-[#6b6b8a] hover:bg-[#16161f] hover:text-white"
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-[#6b6b8a] group-hover:text-white"}`} />
              <span className="flex-1 truncate">{item.label}</span>
              {"arrow" in item && item.arrow && (
                <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* profile footer */}
      <div className="p-3 border-t border-[#1e1e2e]">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">EA</span>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#0d0d14]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[13px] font-semibold truncate leading-none">Emmanuel Admin</p>
            <p className="text-[10px] text-[#6b6b8a] mt-0.5 leading-none">Super Administrateur</p>
            <p className="text-[10px] text-green-400 mt-0.5 leading-none font-medium">● En ligne</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
