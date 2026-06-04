import { NextResponse } from "next/server"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

const ROLES = [
  {
    id:"ROLE-01", name:"Super Administrateur", slug:"super_admin", color:"#ef4444",
    users_count:1, description:"Accès complet à toutes les fonctionnalités",
    permissions:["*"],
    created_at:ts(-87600),
  },
  {
    id:"ROLE-02", name:"Administrateur",       slug:"admin",       color:"#f97316",
    users_count:3, description:"Gestion des opérations quotidiennes",
    permissions:["dashboard.view","orders.manage","deliveries.manage","vendors.manage","drivers.manage","support.manage","notifications.send"],
    created_at:ts(-43800),
  },
  {
    id:"ROLE-03", name:"Responsable Finance",  slug:"finance",     color:"#22c55e",
    users_count:2, description:"Accès aux wallets, payouts et transactions",
    permissions:["dashboard.view","transactions.view","wallets.manage","payouts.manage","reports.view"],
    created_at:ts(-21900),
  },
  {
    id:"ROLE-04", name:"Support Agent",        slug:"support",     color:"#3b82f6",
    users_count:4, description:"Gestion des tickets et CRM client",
    permissions:["dashboard.view","support.manage","notifications.view","orders.view","customers.view"],
    created_at:ts(-17520),
  },
  {
    id:"ROLE-05", name:"Marketing",            slug:"marketing",   color:"#8b5cf6",
    users_count:2, description:"CMS, SEO et campagnes de notifications",
    permissions:["dashboard.view","cms.manage","seo.manage","notifications.send","analytics.view"],
    created_at:ts(-13140),
  },
  {
    id:"ROLE-06", name:"Lecture seule",        slug:"readonly",    color:"#6b6b8a",
    users_count:2, description:"Accès lecture uniquement aux rapports",
    permissions:["dashboard.view","reports.view","analytics.view"],
    created_at:ts(-8760),
  },
]

const USERS = [
  { id:"USR-01", name:"Emmanuel Admin",  email:"emmanuel@quickgo.cm",  role:"super_admin", status:"active",  last_active:ts(-5),   avatar:"EA", two_fa:true  },
  { id:"USR-02", name:"Sylvie Kengne",   email:"sylvie@quickgo.cm",    role:"support",     status:"active",  last_active:ts(-12),  avatar:"SK", two_fa:true  },
  { id:"USR-03", name:"Armand Defang",   email:"armand@quickgo.cm",    role:"support",     status:"active",  last_active:ts(-30),  avatar:"AD", two_fa:false },
  { id:"USR-04", name:"Marie Fotso",     email:"marie@quickgo.cm",     role:"admin",       status:"active",  last_active:ts(-45),  avatar:"MF", two_fa:true  },
  { id:"USR-05", name:"Jean Mvondo",     email:"jean@quickgo.cm",      role:"finance",     status:"active",  last_active:ts(-120), avatar:"JM", two_fa:true  },
  { id:"USR-06", name:"Laure Banga",     email:"laure@quickgo.cm",     role:"marketing",   status:"active",  last_active:ts(-180), avatar:"LB", two_fa:false },
  { id:"USR-07", name:"Roger Mbida",     email:"roger@quickgo.cm",     role:"admin",       status:"active",  last_active:ts(-240), avatar:"RM", two_fa:true  },
  { id:"USR-08", name:"Cédric Eto",      email:"cedric@quickgo.cm",    role:"finance",     status:"inactive",last_active:ts(-4320),avatar:"CE", two_fa:true  },
  { id:"USR-09", name:"Pauline Ngo",     email:"pauline@quickgo.cm",   role:"support",     status:"active",  last_active:ts(-60),  avatar:"PN", two_fa:false },
  { id:"USR-10", name:"Boris Yembele",   email:"boris@quickgo.cm",     role:"marketing",   status:"active",  last_active:ts(-360), avatar:"BY", two_fa:true  },
  { id:"USR-11", name:"Clarisse Mbome",  email:"clarisse@quickgo.cm",  role:"readonly",    status:"active",  last_active:ts(-720), avatar:"CM", two_fa:false },
  { id:"USR-12", name:"Alain Tsanga",    email:"alain@quickgo.cm",     role:"readonly",    status:"active",  last_active:ts(-1440),avatar:"AT", two_fa:false },
  { id:"USR-13", name:"Gaëlle Onana",    email:"gaelle@quickgo.cm",    role:"admin",       status:"inactive",last_active:ts(-8760),avatar:"GO", two_fa:false },
  { id:"USR-14", name:"Thierry Bekono",  email:"thierry@quickgo.cm",   role:"support",     status:"active",  last_active:ts(-15),  avatar:"TB", two_fa:true  },
]

const ALL_PERMISSIONS = [
  { key:"dashboard.view",      label:"Voir dashboard",         module:"Dashboard"   },
  { key:"orders.view",         label:"Voir commandes",         module:"Commandes"   },
  { key:"orders.manage",       label:"Gérer commandes",        module:"Commandes"   },
  { key:"deliveries.manage",   label:"Gérer livraisons",       module:"Livraisons"  },
  { key:"vendors.manage",      label:"Gérer vendeurs",         module:"Vendeurs"    },
  { key:"drivers.manage",      label:"Gérer livreurs",         module:"Livreurs"    },
  { key:"transactions.view",   label:"Voir transactions",      module:"Finance"     },
  { key:"wallets.manage",      label:"Gérer wallets",          module:"Finance"     },
  { key:"payouts.manage",      label:"Gérer payouts",          module:"Finance"     },
  { key:"support.manage",      label:"Gérer support",          module:"CRM"         },
  { key:"notifications.view",  label:"Voir notifications",     module:"Marketing"   },
  { key:"notifications.send",  label:"Envoyer notifications",  module:"Marketing"   },
  { key:"cms.manage",          label:"Gérer CMS",              module:"Marketing"   },
  { key:"seo.manage",          label:"Gérer SEO",              module:"Marketing"   },
  { key:"analytics.view",      label:"Voir analytics",         module:"Analytics"   },
  { key:"reports.view",        label:"Voir rapports",          module:"Analytics"   },
  { key:"customers.view",      label:"Voir clients",           module:"Clients"     },
  { key:"users.manage",        label:"Gérer utilisateurs",     module:"Admin"       },
  { key:"roles.manage",        label:"Gérer rôles",            module:"Admin"       },
  { key:"logs.view",           label:"Voir logs système",      module:"Système"     },
  { key:"api.manage",          label:"Gérer API",              module:"Système"     },
  { key:"backups.manage",      label:"Gérer sauvegardes",      module:"Système"     },
]

const activeUsers = USERS.filter(u => u.status === "active")
const with2fa     = USERS.filter(u => u.two_fa)

export async function GET() {
  return NextResponse.json({
    kpi: {
      total_users:    USERS.length,
      active_users:   activeUsers.length,
      total_roles:    ROLES.length,
      two_fa_enabled: with2fa.length,
      two_fa_rate:    Math.round(with2fa.length / USERS.length * 100),
      admin_count:    USERS.filter(u => u.role === "super_admin" || u.role === "admin").length,
    },
    roles: ROLES,
    users: USERS,
    permissions: ALL_PERMISSIONS,
  })
}
