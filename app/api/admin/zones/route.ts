import { NextResponse } from "next/server"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

const CITIES = [
  {
    id:"CTY-01", name:"Yaoundé",       region:"Centre",   status:"active",   lat:3.848,  lng:11.502,
    drivers_active:42, vendors_active:128, orders_today:892, revenue_today:4_250_000,
    coverage_pct:94, avg_delivery_min:28, population:3_800_000,
    zones:[
      { id:"Z-001", name:"Centre-ville",  status:"active",  drivers:12, orders_today:312 },
      { id:"Z-002", name:"Bastos",        status:"active",  drivers:8,  orders_today:187 },
      { id:"Z-003", name:"Nlongkak",      status:"active",  drivers:6,  orders_today:143 },
      { id:"Z-004", name:"Mvan",          status:"active",  drivers:5,  orders_today:98  },
      { id:"Z-005", name:"Biyem-Assi",    status:"active",  drivers:11, orders_today:152 },
    ],
    added_at:ts(-87600),
  },
  {
    id:"CTY-02", name:"Douala",        region:"Littoral", status:"active",   lat:4.051,  lng:9.704,
    drivers_active:38, vendors_active:112, orders_today:1_024, revenue_today:5_120_000,
    coverage_pct:91, avg_delivery_min:31, population:3_200_000,
    zones:[
      { id:"Z-010", name:"Akwa",          status:"active",  drivers:14, orders_today:389 },
      { id:"Z-011", name:"Bonanjo",       status:"active",  drivers:9,  orders_today:201 },
      { id:"Z-012", name:"Bonabéri",      status:"active",  drivers:7,  orders_today:178 },
      { id:"Z-013", name:"Deïdo",         status:"active",  drivers:8,  orders_today:256 },
    ],
    added_at:ts(-87600),
  },
  {
    id:"CTY-03", name:"Bafoussam",     region:"Ouest",    status:"active",   lat:5.478,  lng:10.417,
    drivers_active:18, vendors_active:45, orders_today:312, revenue_today:1_560_000,
    coverage_pct:78, avg_delivery_min:35, population:540_000,
    zones:[
      { id:"Z-020", name:"Centre",        status:"active",  drivers:10, orders_today:198 },
      { id:"Z-021", name:"Kamkop",        status:"active",  drivers:8,  orders_today:114 },
    ],
    added_at:ts(-43800),
  },
  {
    id:"CTY-04", name:"Garoua",        region:"Nord",     status:"active",   lat:9.301,  lng:13.397,
    drivers_active:14, vendors_active:32, orders_today:198, revenue_today:990_000,
    coverage_pct:65, avg_delivery_min:42, population:437_000,
    zones:[
      { id:"Z-030", name:"Marché Central",status:"active",  drivers:9,  orders_today:134 },
      { id:"Z-031", name:"Plateau",       status:"limited", drivers:5,  orders_today:64  },
    ],
    added_at:ts(-21900),
  },
  {
    id:"CTY-05", name:"Maroua",        region:"Extrême-Nord",status:"active",lat:10.591, lng:14.316,
    drivers_active:11, vendors_active:24, orders_today:142, revenue_today:710_000,
    coverage_pct:58, avg_delivery_min:48, population:382_000,
    zones:[
      { id:"Z-040", name:"Centre",        status:"active",  drivers:11, orders_today:142 },
    ],
    added_at:ts(-17520),
  },
  {
    id:"CTY-06", name:"Bamenda",       region:"Nord-Ouest",status:"active",  lat:5.959,  lng:10.146,
    drivers_active:9,  vendors_active:21, orders_today:98,  revenue_today:490_000,
    coverage_pct:52, avg_delivery_min:51, population:410_000,
    zones:[
      { id:"Z-050", name:"Commercial Ave",status:"active",  drivers:9,  orders_today:98  },
    ],
    added_at:ts(-13140),
  },
  {
    id:"CTY-07", name:"Ngaoundéré",   region:"Adamaoua", status:"limited",  lat:7.326,  lng:13.584,
    drivers_active:4,  vendors_active:12, orders_today:48,  revenue_today:240_000,
    coverage_pct:35, avg_delivery_min:62, population:231_000,
    zones:[
      { id:"Z-060", name:"Centre",        status:"limited", drivers:4,  orders_today:48  },
    ],
    added_at:ts(-8760),
  },
  {
    id:"CTY-08", name:"Bertoua",       region:"Est",      status:"pending",  lat:4.578,  lng:13.686,
    drivers_active:0,  vendors_active:0,  orders_today:0,   revenue_today:0,
    coverage_pct:0,  avg_delivery_min:0,  population:184_000,
    zones:[],
    added_at:ts(-720),
  },
]

const active   = CITIES.filter(c => c.status === "active")
const limited  = CITIES.filter(c => c.status === "limited")
const pending  = CITIES.filter(c => c.status === "pending")

const totalOrders  = CITIES.reduce((s, c) => s + c.orders_today, 0)
const totalRevenue = CITIES.reduce((s, c) => s + c.revenue_today, 0)
const totalDrivers = CITIES.reduce((s, c) => s + c.drivers_active, 0)

export async function GET() {
  return NextResponse.json({
    kpi: {
      cities_active:   active.length,
      cities_limited:  limited.length,
      cities_pending:  pending.length,
      total_drivers:   totalDrivers,
      orders_today:    totalOrders,
      revenue_today:   totalRevenue,
      coverage_cities: CITIES.length,
    },
    cities: CITIES,
    revenue_by_city: CITIES.filter(c => c.revenue_today > 0).map(c => ({
      name: c.name.length > 8 ? c.name.slice(0, 8) : c.name,
      full_name: c.name,
      revenue: c.revenue_today,
      orders:  c.orders_today,
    })).sort((a, b) => b.revenue - a.revenue),
    growth_trend: [
      { month:"Jan", cities:2, drivers:28, orders:820  },
      { month:"Fév", cities:2, drivers:35, orders:1120 },
      { month:"Mar", cities:3, drivers:42, orders:1580 },
      { month:"Avr", cities:4, drivers:58, orders:2100 },
      { month:"Mai", cities:5, drivers:86, orders:2750 },
      { month:"Jun", cities:CITIES.length, drivers:totalDrivers, orders:totalOrders },
    ],
  })
}
