import { NextResponse } from "next/server"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

const TRANSACTIONS = [
  { id:"TRX-4421", order_id:"CMD-78821", customer_name:"Marie Ngo",         amount:12_500, method:"Orange Money", status:"success",  timestamp:ts(-5),   fee:250,   commission:625  },
  { id:"TRX-4420", order_id:"CMD-78820", customer_name:"Jean Mballa",        amount:8_200,  method:"MTN Money",   status:"success",  timestamp:ts(-12),  fee:164,   commission:410  },
  { id:"TRX-4419", order_id:"CMD-78819", customer_name:"Sophie Ateba",       amount:35_000, method:"Wave",        status:"failed",   timestamp:ts(-18),  fee:0,     commission:0    },
  { id:"TRX-4418", order_id:"CMD-78818", customer_name:"Alain Nguema",       amount:15_750, method:"Orange Money", status:"success", timestamp:ts(-25),  fee:315,   commission:788  },
  { id:"TRX-4417", order_id:"CMD-78817", customer_name:"Sandrine Mvouma",    amount:4_500,  method:"CinetPay",    status:"pending",  timestamp:ts(-31),  fee:90,    commission:225  },
  { id:"TRX-4416", order_id:"CMD-78816", customer_name:"Patrick Nzima",      amount:22_000, method:"MTN Money",   status:"success",  timestamp:ts(-40),  fee:440,   commission:1100 },
  { id:"TRX-4415", order_id:"CMD-78815", customer_name:"Roger Talla",        amount:9_800,  method:"Orange Money", status:"refunded",timestamp:ts(-55),  fee:0,     commission:0    },
  { id:"TRX-4414", order_id:"CMD-78814", customer_name:"Henriette Owona",    amount:47_500, method:"PayPal",      status:"success",  timestamp:ts(-68),  fee:1425,  commission:2375 },
  { id:"TRX-4413", order_id:"CMD-78813", customer_name:"Vanessa Abena",      amount:3_200,  method:"Wave",        status:"success",  timestamp:ts(-75),  fee:64,    commission:160  },
  { id:"TRX-4412", order_id:"CMD-78812", customer_name:"Gaston Mbog",        amount:18_000, method:"MTN Money",   status:"failed",   timestamp:ts(-82),  fee:0,     commission:0    },
  { id:"TRX-4411", order_id:"CMD-78811", customer_name:"Célestine Bikoe",    amount:6_500,  method:"CinetPay",    status:"success",  timestamp:ts(-90),  fee:130,   commission:325  },
  { id:"TRX-4410", order_id:"CMD-78810", customer_name:"Armand Essomba",     amount:29_000, method:"Orange Money", status:"success", timestamp:ts(-102), fee:580,   commission:1450 },
  { id:"TRX-4409", order_id:"CMD-78809", customer_name:"Diane Nkodo",        amount:11_200, method:"Wave",        status:"success",  timestamp:ts(-115), fee:224,   commission:560  },
  { id:"TRX-4408", order_id:"CMD-78808", customer_name:"Francis Belinga",    amount:85_000, method:"Virement",    status:"success",  timestamp:ts(-130), fee:850,   commission:4250 },
  { id:"TRX-4407", order_id:"CMD-78807", customer_name:"Yvette Zanga",       amount:5_000,  method:"MTN Money",   status:"pending",  timestamp:ts(-145), fee:100,   commission:250  },
  { id:"TRX-4406", order_id:"CMD-78806", customer_name:"Bruno Akono",        amount:14_300, method:"Orange Money", status:"success", timestamp:ts(-160), fee:286,   commission:715  },
  { id:"TRX-4405", order_id:"CMD-78805", customer_name:"Martine Fouda",      amount:2_800,  method:"Wave",        status:"failed",   timestamp:ts(-180), fee:0,     commission:0    },
  { id:"TRX-4404", order_id:"CMD-78804", customer_name:"Serge Ngono",        amount:38_500, method:"PayPal",      status:"success",  timestamp:ts(-220), fee:1155,  commission:1925 },
  { id:"TRX-4403", order_id:"CMD-78803", customer_name:"Laure Mbassi",       amount:7_600,  method:"CinetPay",    status:"refunded", timestamp:ts(-360), fee:0,     commission:0    },
  { id:"TRX-4402", order_id:"CMD-78802", customer_name:"Thierry Nkoulou",    amount:19_900, method:"Orange Money", status:"success", timestamp:ts(-720), fee:398,   commission:995  },
]

const success  = TRANSACTIONS.filter(t => t.status === "success")
const failed   = TRANSACTIONS.filter(t => t.status === "failed")
const refunded = TRANSACTIONS.filter(t => t.status === "refunded")
const pending  = TRANSACTIONS.filter(t => t.status === "pending")

const totalVolume = success.reduce((s, t) => s + t.amount, 0)
const totalCommission = TRANSACTIONS.reduce((s, t) => s + t.commission, 0)
const avgAmount = Math.round(TRANSACTIONS.reduce((s, t) => s + t.amount, 0) / TRANSACTIONS.length)

// count today (within last 24h = last 1440 min)
const countToday = TRANSACTIONS.filter(t => {
  const minAgo = (Date.now() - new Date(t.timestamp).getTime()) / 60_000
  return minAgo <= 1440
}).length

const yesterdayCount = 14

const successRate = Math.round((success.length / TRANSACTIONS.length) * 100 * 10) / 10
const commissionRate = Math.round((totalCommission / totalVolume) * 100 * 10) / 10

// Method distribution
const methodColors: Record<string, string> = {
  "Orange Money": "#f97316",
  "MTN Money":    "#eab308",
  "Wave":         "#3b82f6",
  "CinetPay":     "#22c55e",
  "PayPal":       "#8b5cf6",
  "Virement":     "#ec4899",
}

const methodCount: Record<string, number> = {}
TRANSACTIONS.forEach(t => { methodCount[t.method] = (methodCount[t.method] ?? 0) + 1 })

const methodDistribution = Object.entries(methodCount).map(([method, count]) => ({
  method,
  count,
  pct: Math.round((count / TRANSACTIONS.length) * 100),
  color: methodColors[method] ?? "#6b6b8a",
}))

// 24h hourly trend — realistic peaks at lunch (12h) and dinner (19h)
const hourlyTrend = Array.from({ length: 24 }, (_, h) => {
  const hour = String(h).padStart(2, "0") + "h"
  let baseVolume = 80_000
  let baseCount  = 2

  if (h >= 7 && h <= 9)   { baseVolume = 280_000; baseCount = 6 }
  if (h >= 11 && h <= 13) { baseVolume = 620_000; baseCount = 14 }
  if (h === 12)            { baseVolume = 840_000; baseCount = 18 }
  if (h >= 14 && h <= 16) { baseVolume = 350_000; baseCount = 8 }
  if (h >= 18 && h <= 20) { baseVolume = 720_000; baseCount = 16 }
  if (h === 19)            { baseVolume = 920_000; baseCount = 21 }
  if (h >= 21 && h <= 22) { baseVolume = 480_000; baseCount = 11 }
  if (h >= 0 && h <= 5)   { baseVolume = 40_000;  baseCount = 1  }

  const jitter = 0.85 + Math.random() * 0.3
  return {
    hour,
    volume: Math.round(baseVolume * jitter),
    count:  Math.max(1, Math.round(baseCount * jitter)),
  }
})

// Status distribution
const statusDistribution = [
  { status:"Succès",      count: success.length,  color:"#22c55e" },
  { status:"Échouées",    count: failed.length,   color:"#ef4444" },
  { status:"Remboursées", count: refunded.length, color:"#3b82f6" },
  { status:"En cours",    count: pending.length,  color:"#f59e0b" },
]

export async function GET() {
  return NextResponse.json({
    kpi: {
      volume_total:      totalVolume,
      count_today:       countToday,
      success_rate:      successRate,
      avg_amount:        avgAmount,
      failed_count:      failed.length,
      commission_quickgo:commissionRate,
      yesterday_count:   yesterdayCount,
    },
    transactions:        TRANSACTIONS,
    method_distribution: methodDistribution,
    hourly_trend:        hourlyTrend,
    status_distribution: statusDistribution,
  })
}
