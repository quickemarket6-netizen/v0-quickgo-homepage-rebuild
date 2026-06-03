import { NextResponse } from "next/server"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

const PAGES = [
  { id:"PG-001", title:"Page d'accueil",        slug:"/",                 type:"landing",  status:"published", views_today:1_842, views_month:52_400, last_edited:ts(-120),  author:"Emmanuel Admin", seo_score:92 },
  { id:"PG-002", title:"À propos de QuickGo",   slug:"/about",            type:"static",   status:"published", views_today:312,   views_month:8_920,  last_edited:ts(-2880), author:"Marie N.",       seo_score:85 },
  { id:"PG-003", title:"Devenir vendeur",        slug:"/become-vendor",   type:"landing",  status:"published", views_today:584,   views_month:16_200, last_edited:ts(-1440), author:"Emmanuel Admin", seo_score:88 },
  { id:"PG-004", title:"Devenir livreur",        slug:"/become-driver",   type:"landing",  status:"published", views_today:421,   views_month:12_800, last_edited:ts(-720),  author:"Jean M.",        seo_score:90 },
  { id:"PG-005", title:"FAQ Clients",            slug:"/faq",              type:"faq",      status:"published", views_today:198,   views_month:5_620,  last_edited:ts(-4320), author:"Marie N.",       seo_score:78 },
  { id:"PG-006", title:"Conditions d'utilisation",slug:"/terms",          type:"legal",    status:"published", views_today:87,    views_month:2_450,  last_edited:ts(-8760), author:"Emmanuel Admin", seo_score:72 },
  { id:"PG-007", title:"Politique de confidentialité",slug:"/privacy",    type:"legal",    status:"published", views_today:65,    views_month:1_890,  last_edited:ts(-8760), author:"Emmanuel Admin", seo_score:70 },
  { id:"PG-008", title:"Promotions Juin 2026",   slug:"/promo/juin-2026", type:"promo",    status:"published", views_today:932,   views_month:4_200,  last_edited:ts(-48),   author:"Jean M.",        seo_score:81 },
  { id:"PG-009", title:"Contactez-nous",         slug:"/contact",          type:"static",   status:"published", views_today:143,   views_month:4_100,  last_edited:ts(-5040), author:"Marie N.",       seo_score:76 },
  { id:"PG-010", title:"Guide vendeur v2",       slug:"/guide-vendor",    type:"guide",    status:"draft",     views_today:0,     views_month:0,      last_edited:ts(-60),   author:"Emmanuel Admin", seo_score:55 },
  { id:"PG-011", title:"Blog — Livraison rapide",slug:"/blog/fast-delivery",type:"blog",  status:"draft",     views_today:0,     views_month:0,      last_edited:ts(-180),  author:"Jean M.",        seo_score:42 },
  { id:"PG-012", title:"Page maintenance",       slug:"/maintenance",      type:"system",   status:"archived",  views_today:0,     views_month:12,     last_edited:ts(-17520),author:"Emmanuel Admin", seo_score:0  },
]

const BLOCKS = [
  { id:"BLK-01", name:"Hero Banner",         page:"Page d'accueil",   type:"hero",    enabled:true,  last_edited:ts(-48)   },
  { id:"BLK-02", name:"Features Section",    page:"Page d'accueil",   type:"grid",    enabled:true,  last_edited:ts(-96)   },
  { id:"BLK-03", name:"App Download CTA",    page:"Page d'accueil",   type:"cta",     enabled:true,  last_edited:ts(-240)  },
  { id:"BLK-04", name:"Testimonials",        page:"Page d'accueil",   type:"social",  enabled:false, last_edited:ts(-720)  },
  { id:"BLK-05", name:"Promo Banner Juin",   page:"Promotions Juin",  type:"banner",  enabled:true,  last_edited:ts(-12)   },
  { id:"BLK-06", name:"Vendor Sign-up Form", page:"Devenir vendeur",  type:"form",    enabled:true,  last_edited:ts(-1440) },
]

const published = PAGES.filter(p => p.status === "published")
const draft     = PAGES.filter(p => p.status === "draft")
const archived  = PAGES.filter(p => p.status === "archived")

const totalViews  = PAGES.reduce((s, p) => s + p.views_today, 0)
const avgSeoScore = Math.round(published.reduce((s, p) => s + p.seo_score, 0) / published.length)

const typeCount: Record<string, number> = {}
PAGES.forEach(p => { typeCount[p.type] = (typeCount[p.type] ?? 0) + 1 })

const typeColors: Record<string, string> = {
  landing:"#3b82f6", static:"#22c55e", legal:"#6b6b8a", promo:"#f97316",
  faq:"#8b5cf6", guide:"#eab308", blog:"#ec4899", system:"#6b6b8a",
}

export async function GET() {
  return NextResponse.json({
    kpi: {
      published_count: published.length,
      draft_count:     draft.length,
      archived_count:  archived.length,
      total_views_today: totalViews,
      avg_seo_score:   avgSeoScore,
      blocks_active:   BLOCKS.filter(b => b.enabled).length,
    },
    pages: PAGES,
    blocks: BLOCKS,
    type_distribution: Object.entries(typeCount).map(([type, count]) => ({
      type, count, pct: Math.round(count / PAGES.length * 100),
      color: typeColors[type] ?? "#6b6b8a",
    })),
    top_pages: [...PAGES].sort((a, b) => b.views_today - a.views_today).slice(0, 6).map(p => ({
      title: p.title.length > 22 ? p.title.slice(0, 22) + "…" : p.title,
      views: p.views_today,
      seo:   p.seo_score,
    })),
    views_trend: [
      { day:"Lun", views:3_200 }, { day:"Mar", views:3_850 }, { day:"Mer", views:2_900 },
      { day:"Jeu", views:4_100 }, { day:"Ven", views:5_200 }, { day:"Sam", views:6_400 },
      { day:"Auj", views:totalViews },
    ],
  })
}
