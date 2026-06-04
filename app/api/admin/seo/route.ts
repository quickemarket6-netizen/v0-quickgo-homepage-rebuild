import { NextResponse } from "next/server"

const KEYWORDS = [
  { id:"KW-01", keyword:"livraison rapide Yaoundé",   position:2,  prev_position:5,  volume:1_820, difficulty:42, ctr:12.4, impressions:14_200, clicks:1_761  },
  { id:"KW-02", keyword:"commander repas Douala",      position:1,  prev_position:1,  volume:3_420, difficulty:38, ctr:18.7, impressions:24_800, clicks:4_638  },
  { id:"KW-03", keyword:"livraison Cameroun app",      position:4,  prev_position:7,  volume:980,   difficulty:55, ctr:7.2,  impressions:8_400,  clicks:605   },
  { id:"KW-04", keyword:"QuickGo Cameroun",            position:1,  prev_position:1,  volume:2_100, difficulty:15, ctr:32.1, impressions:12_600, clicks:4_045  },
  { id:"KW-05", keyword:"devenir livreur Cameroun",    position:3,  prev_position:4,  volume:640,   difficulty:48, ctr:9.8,  impressions:5_200,  clicks:510   },
  { id:"KW-06", keyword:"application livraison Afrique",position:8, prev_position:12, volume:2_840, difficulty:68, ctr:3.1,  impressions:18_400, clicks:570   },
  { id:"KW-07", keyword:"restaurant livraison Yaoundé",position:5,  prev_position:5,  volume:1_240, difficulty:52, ctr:6.4,  impressions:9_800,  clicks:627   },
  { id:"KW-08", keyword:"course express Douala",       position:6,  prev_position:9,  volume:820,   difficulty:45, ctr:5.2,  impressions:6_400,  clicks:333   },
  { id:"KW-09", keyword:"vendeur en ligne Cameroun",   position:11, prev_position:14, volume:1_680, difficulty:62, ctr:2.8,  impressions:12_200, clicks:342   },
  { id:"KW-10", keyword:"livreur Bafoussam",           position:7,  prev_position:8,  volume:420,   difficulty:31, ctr:4.9,  impressions:3_200,  clicks:157   },
  { id:"KW-11", keyword:"e-commerce Cameroun 2026",    position:14, prev_position:18, volume:1_920, difficulty:74, ctr:1.9,  impressions:14_800, clicks:281   },
  { id:"KW-12", keyword:"paiement mobile Afrique",     position:18, prev_position:22, volume:4_200, difficulty:82, ctr:1.2,  impressions:28_400, clicks:341   },
]

const PAGES_SEO = [
  { url:"/",              title:"QuickGo — Livraison rapide au Cameroun", score:92, issues:1,  index_status:"indexed",  backlinks:124, organic_clicks:2_841 },
  { url:"/become-driver", title:"Devenir livreur QuickGo",               score:90, issues:1,  index_status:"indexed",  backlinks:38,  organic_clicks:510   },
  { url:"/become-vendor", title:"Vendre avec QuickGo",                   score:88, issues:2,  index_status:"indexed",  backlinks:52,  organic_clicks:420   },
  { url:"/about",         title:"À propos de QuickGo",                   score:85, issues:2,  index_status:"indexed",  backlinks:29,  organic_clicks:198   },
  { url:"/promo/juin-2026",title:"Promotions Juin 2026 — QuickGo",      score:81, issues:3,  index_status:"indexed",  backlinks:8,   organic_clicks:312   },
  { url:"/faq",           title:"Questions fréquentes — QuickGo",        score:78, issues:4,  index_status:"indexed",  backlinks:14,  organic_clicks:145   },
  { url:"/contact",       title:"Contactez QuickGo",                     score:76, issues:3,  index_status:"indexed",  backlinks:11,  organic_clicks:87    },
  { url:"/terms",         title:"Conditions d'utilisation QuickGo",      score:72, issues:4,  index_status:"indexed",  backlinks:6,   organic_clicks:48    },
  { url:"/privacy",       title:"Politique de confidentialité",           score:70, issues:5,  index_status:"indexed",  backlinks:4,   organic_clicks:32    },
  { url:"/guide-vendor",  title:"Guide vendeur v2",                       score:55, issues:8,  index_status:"not_indexed",backlinks:0,  organic_clicks:0    },
]

const totalClicks = KEYWORDS.reduce((s, k) => s + k.clicks, 0)
const totalImpressions = KEYWORDS.reduce((s, k) => s + k.impressions, 0)
const avgPosition = Math.round(KEYWORDS.reduce((s, k) => s + k.position, 0) / KEYWORDS.length * 10) / 10
const avgCtr = Math.round(KEYWORDS.reduce((s, k) => s + k.ctr, 0) / KEYWORDS.length * 10) / 10

const improved = KEYWORDS.filter(k => k.position < k.prev_position).length
const declined  = KEYWORDS.filter(k => k.position > k.prev_position).length

export async function GET() {
  return NextResponse.json({
    kpi: {
      total_clicks:      totalClicks,
      total_impressions: totalImpressions,
      avg_position:      avgPosition,
      avg_ctr:           avgCtr,
      keywords_improved: improved,
      pages_indexed:     PAGES_SEO.filter(p => p.index_status === "indexed").length,
      total_keywords:    KEYWORDS.length,
    },
    keywords: KEYWORDS,
    pages: PAGES_SEO,
    performance_trend: [
      { month:"Jan", clicks:4_200,  impressions:68_000  },
      { month:"Fév", clicks:5_100,  impressions:82_000  },
      { month:"Mar", clicks:7_800,  impressions:112_000 },
      { month:"Avr", clicks:9_400,  impressions:138_000 },
      { month:"Mai", clicks:11_200, impressions:165_000 },
      { month:"Jun", clicks:totalClicks, impressions:totalImpressions },
    ],
  })
}
