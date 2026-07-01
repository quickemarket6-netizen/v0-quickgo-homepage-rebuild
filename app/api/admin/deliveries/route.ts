import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

const DELIVERIES = [
  { id:"LIV-0842", order_id:"CMD-78452", customer_name:"Marie Ngo",        driver_name:"Paul Tchamba",   driver_rating:4.8, city:"Yaoundé",    pickup:"Marché Central, Yaoundé",    destination:"Quartier Bastos",    status:"in_transit",  assigned_at:ts(-22), estimated_at:ts(8),    delivered_at:null,    distance_km:4.2, amount:3500 },
  { id:"LIV-0843", order_id:"CMD-78451", customer_name:"Jean Mballa",       driver_name:"Rostand Kana",   driver_rating:4.5, city:"Douala",     pickup:"Akwa, Douala",               destination:"Bonamoussadi",       status:"picking_up",  assigned_at:ts(-8),  estimated_at:ts(25),   delivered_at:null,    distance_km:7.1, amount:4200 },
  { id:"LIV-0841", order_id:"CMD-78449", customer_name:"Sophie Ateba",      driver_name:"Eric Fouda",     driver_rating:4.9, city:"Yaoundé",    pickup:"Boulangerie Centrale",       destination:"Nlongkak",           status:"delivered",   assigned_at:ts(-55), estimated_at:ts(-20),  delivered_at:ts(-18), distance_km:3.8, amount:2800 },
  { id:"LIV-0840", order_id:"CMD-78448", customer_name:"Alain Nguema",      driver_name:"Didier Nkeng",   driver_rating:4.3, city:"Bafoussam",  pickup:"Centre-ville Bafoussam",     destination:"Kamkop",             status:"delivered",   assigned_at:ts(-70), estimated_at:ts(-35),  delivered_at:ts(-32), distance_km:2.5, amount:1900 },
  { id:"LIV-0839", order_id:"CMD-78447", customer_name:"Sandrine Mvouma",   driver_name:"Claude Essama",  driver_rating:4.7, city:"Yaoundé",    pickup:"Supermarché Dovv",           destination:"Mvan",               status:"in_transit",  assigned_at:ts(-35), estimated_at:ts(5),    delivered_at:null,    distance_km:6.3, amount:5100 },
  { id:"LIV-0838", order_id:"CMD-78446", customer_name:"Patrick Nzima",     driver_name:"Paul Tchamba",   driver_rating:4.8, city:"Yaoundé",    pickup:"Pharmacie Centrale",         destination:"Omnisport",          status:"delivered",   assigned_at:ts(-90), estimated_at:ts(-50),  delivered_at:ts(-48), distance_km:5.0, amount:3200 },
  { id:"LIV-0837", order_id:"CMD-78445", customer_name:"Christiane Bah",    driver_name:"Rostand Kana",   driver_rating:4.5, city:"Douala",     pickup:"Deido, Douala",              destination:"Bonaberi",           status:"cancelled",   assigned_at:ts(-45), estimated_at:ts(-15),  delivered_at:null,    distance_km:8.9, amount:6300 },
  { id:"LIV-0836", order_id:"CMD-78444", customer_name:"Roger Talla",       driver_name:"Bernard Eto'o",  driver_rating:4.6, city:"Bamenda",    pickup:"Up Station, Bamenda",        destination:"Mile 4",             status:"in_transit",  assigned_at:ts(-18), estimated_at:ts(12),   delivered_at:null,    distance_km:3.1, amount:2100 },
  { id:"LIV-0835", order_id:"CMD-78443", customer_name:"Henriette Owona",   driver_name:"Gustave Meke",   driver_rating:4.4, city:"Douala",     pickup:"New Bell, Douala",           destination:"Logpom",             status:"pending",     assigned_at:ts(-5),  estimated_at:ts(30),   delivered_at:null,    distance_km:5.5, amount:3800 },
  { id:"LIV-0834", order_id:"CMD-78442", customer_name:"Arnaud Nkemeni",    driver_name:"Eric Fouda",     driver_rating:4.9, city:"Yaoundé",    pickup:"Mvog-Ada",                   destination:"Mendong",            status:"delivered",   assigned_at:ts(-110),estimated_at:ts(-70),  delivered_at:ts(-68), distance_km:7.2, amount:4800 },
  { id:"LIV-0833", order_id:"CMD-78441", customer_name:"Lucie Ndem",        driver_name:"Didier Nkeng",   driver_rating:4.3, city:"Garoua",     pickup:"Marché de Garoua",           destination:"Plateau, Garoua",    status:"delivered",   assigned_at:ts(-95), estimated_at:ts(-55),  delivered_at:ts(-52), distance_km:2.8, amount:2200 },
  { id:"LIV-0832", order_id:"CMD-78440", customer_name:"Thierry Ongla",     driver_name:"Claude Essama",  driver_rating:4.7, city:"Yaoundé",    pickup:"Essos, Yaoundé",             destination:"Kondengui",          status:"failed",      assigned_at:ts(-60), estimated_at:ts(-20),  delivered_at:null,    distance_km:4.8, amount:3600 },
  { id:"LIV-0831", order_id:"CMD-78439", customer_name:"Nadège Beyala",     driver_name:"Bernard Eto'o",  driver_rating:4.6, city:"Douala",     pickup:"Bali, Douala",               destination:"Ndokoti",            status:"in_transit",  assigned_at:ts(-28), estimated_at:ts(7),    delivered_at:null,    distance_km:3.9, amount:2900 },
  { id:"LIV-0830", order_id:"CMD-78438", customer_name:"Gaston Mbog",       driver_name:"Gustave Meke",   driver_rating:4.4, city:"Douala",     pickup:"Makepe, Douala",             destination:"Kotto",              status:"pending",     assigned_at:ts(-3),  estimated_at:ts(40),   delivered_at:null,    distance_km:6.0, amount:4100 },
  { id:"LIV-0829", order_id:"CMD-78437", customer_name:"Vanessa Abena",     driver_name:"Paul Tchamba",   driver_rating:4.8, city:"Yaoundé",    pickup:"Biyem-Assi",                 destination:"Elig-Edzoa",         status:"delivered",   assigned_at:ts(-130),estimated_at:ts(-90),  delivered_at:ts(-87), distance_km:5.5, amount:3900 },
  { id:"LIV-0828", order_id:"CMD-78436", customer_name:"Gérard Ewane",      driver_name:"Eric Fouda",     driver_rating:4.9, city:"Yaoundé",    pickup:"Mfoundi",                    destination:"Emana",              status:"picking_up",  assigned_at:ts(-12), estimated_at:ts(20),   delivered_at:null,    distance_km:8.1, amount:5600 },
  { id:"LIV-0827", order_id:"CMD-78435", customer_name:"Célestine Nga",     driver_name:"Rostand Kana",   driver_rating:4.5, city:"Douala",     pickup:"Bonapriso, Douala",          destination:"PK14",               status:"delivered",   assigned_at:ts(-155),estimated_at:ts(-115), delivered_at:ts(-112),distance_km:10.2,amount:7800 },
  { id:"LIV-0826", order_id:"CMD-78434", customer_name:"Bertrand Owona",    driver_name:"Gustave Meke",   driver_rating:4.4, city:"Douala",     pickup:"Cité des Palmiers",          destination:"Yassa",              status:"delivered",   assigned_at:ts(-140),estimated_at:ts(-100), delivered_at:ts(-97), distance_km:6.7, amount:4500 },
]

const cityMap: Record<string, number> = {}
DELIVERIES.forEach(d => { cityMap[d.city] = (cityMap[d.city] ?? 0) + 1 })
const cityTotal = DELIVERIES.length
const city_distribution = Object.entries(cityMap)
  .map(([city, count]) => ({ city, count, pct: Math.round((count / cityTotal) * 100) }))
  .sort((a, b) => b.count - a.count)

const hourly_trend = [
  { hour:"00h", total:3,  delivered:2  }, { hour:"01h", total:2,  delivered:2  },
  { hour:"02h", total:1,  delivered:1  }, { hour:"03h", total:0,  delivered:0  },
  { hour:"04h", total:2,  delivered:1  }, { hour:"05h", total:5,  delivered:4  },
  { hour:"06h", total:9,  delivered:7  }, { hour:"07h", total:14, delivered:11 },
  { hour:"08h", total:19, delivered:15 }, { hour:"09h", total:23, delivered:18 },
  { hour:"10h", total:21, delivered:17 }, { hour:"11h", total:29, delivered:23 },
  { hour:"12h", total:36, delivered:29 }, { hour:"13h", total:33, delivered:26 },
  { hour:"14h", total:26, delivered:21 }, { hour:"15h", total:20, delivered:16 },
  { hour:"16h", total:17, delivered:13 }, { hour:"17h", total:24, delivered:19 },
  { hour:"18h", total:39, delivered:31 }, { hour:"19h", total:44, delivered:35 },
  { hour:"20h", total:37, delivered:29 }, { hour:"21h", total:29, delivered:23 },
  { hour:"22h", total:16, delivered:13 }, { hour:"23h", total:9,  delivered:7  },
]

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error ?? "Accès refusé" }, { status: 403 })

  const in_progress = DELIVERIES.filter(d => ["in_transit","picking_up"].includes(d.status)).length

  return NextResponse.json({
    kpi: {
      total_today:         248,
      in_progress,
      delivered:           183,
      cancelled:           12,
      avg_time_minutes:    34,
      on_time_rate:        87.5,
      yesterday_total:     231,
    },
    deliveries: DELIVERIES,
    top_drivers: [
      { id:"DRV-001", name:"Paul Tchamba",   deliveries_today:18, rating:4.8, on_time_rate:94, status:"active",  city:"Yaoundé"   },
      { id:"DRV-002", name:"Eric Fouda",     deliveries_today:15, rating:4.9, on_time_rate:97, status:"active",  city:"Yaoundé"   },
      { id:"DRV-003", name:"Rostand Kana",   deliveries_today:14, rating:4.5, on_time_rate:89, status:"active",  city:"Douala"    },
      { id:"DRV-004", name:"Claude Essama",  deliveries_today:12, rating:4.7, on_time_rate:91, status:"idle",    city:"Yaoundé"   },
      { id:"DRV-005", name:"Bernard Eto'o",  deliveries_today:11, rating:4.6, on_time_rate:88, status:"active",  city:"Douala"    },
      { id:"DRV-006", name:"Didier Nkeng",   deliveries_today:9,  rating:4.3, on_time_rate:82, status:"idle",    city:"Bafoussam" },
      { id:"DRV-007", name:"Gustave Meke",   deliveries_today:8,  rating:4.4, on_time_rate:85, status:"offline", city:"Douala"    },
    ],
    city_distribution,
    hourly_trend,
  })
}
