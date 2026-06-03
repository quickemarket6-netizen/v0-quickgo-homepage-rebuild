import { NextResponse } from "next/server"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

const PAYOUTS = [
  { id:"PAY-0091", owner_id:"V001", owner_name:"Xavier Boutique",  owner_type:"vendor", amount:2_450_000, method:"Orange Money", requested_at:ts(-45),  processed_at:null,        status:"pending",   note:null },
  { id:"PAY-0090", owner_id:"D001", owner_name:"Paul Tchamba",     owner_type:"driver", amount:185_000,   method:"MTN Money",   requested_at:ts(-62),  processed_at:null,        status:"pending",   note:null },
  { id:"PAY-0089", owner_id:"V003", owner_name:"Davy Store",       owner_type:"vendor", amount:1_250_000, method:"Orange Money", requested_at:ts(-78),  processed_at:null,        status:"pending",   note:null },
  { id:"PAY-0088", owner_id:"D003", owner_name:"Rostand Kana",     owner_type:"driver", amount:145_000,   method:"Wave",        requested_at:ts(-95),  processed_at:null,        status:"pending",   note:null },
  { id:"PAY-0087", owner_id:"V005", owner_name:"AfriTech",         owner_type:"vendor", amount:750_000,   method:"CinetPay",    requested_at:ts(-110), processed_at:null,        status:"pending",   note:null },
  { id:"PAY-0086", owner_id:"V007", owner_name:"Pharma Plus",      owner_type:"vendor", amount:320_000,   method:"Orange Money", requested_at:ts(-130), processed_at:null,        status:"pending",   note:null },
  { id:"PAY-0085", owner_id:"D005", owner_name:"Bernard Eto'o",    owner_type:"driver", amount:115_000,   method:"MTN Money",   requested_at:ts(-155), processed_at:null,        status:"pending",   note:null },
  { id:"PAY-0084", owner_id:"V002", owner_name:"Loïc Shop",        owner_type:"vendor", amount:1_850_000, method:"Wave",        requested_at:ts(-240), processed_at:ts(-180),    status:"processed", note:"Traité via batch #023" },
  { id:"PAY-0083", owner_id:"D002", owner_name:"Eric Fouda",       owner_type:"driver", amount:162_000,   method:"MTN Money",   requested_at:ts(-300), processed_at:ts(-250),    status:"processed", note:"Traité via batch #022" },
  { id:"PAY-0082", owner_id:"V004", owner_name:"Grace Market",     owner_type:"vendor", amount:980_000,   method:"Orange Money", requested_at:ts(-360), processed_at:ts(-310),    status:"processed", note:"Traité via batch #022" },
  { id:"PAY-0081", owner_id:"D004", owner_name:"Claude Essama",    owner_type:"driver", amount:128_000,   method:"Wave",        requested_at:ts(-420), processed_at:ts(-370),    status:"processed", note:"Traité via batch #021" },
  { id:"PAY-0080", owner_id:"D006", owner_name:"Didier Nkeng",     owner_type:"driver", amount:98_000,    method:"MTN Money",   requested_at:ts(-480), processed_at:ts(-430),    status:"processed", note:"Traité via batch #021" },
  { id:"PAY-0079", owner_id:"V006", owner_name:"La Belle Mode",    owner_type:"vendor", amount:540_000,   method:"Orange Money", requested_at:ts(-600), processed_at:null,        status:"rejected",  note:"Wallet gelé - vérification en cours" },
  { id:"PAY-0078", owner_id:"D007", owner_name:"Gustave Meke",     owner_type:"driver", amount:72_000,    method:"MTN Money",   requested_at:ts(-720), processed_at:null,        status:"rejected",  note:"Informations bancaires incorrectes" },
  { id:"PAY-0077", owner_id:"V001", owner_name:"Xavier Boutique",  owner_type:"vendor", amount:1_800_000, method:"Orange Money", requested_at:ts(-900), processed_at:ts(-850),    status:"processed", note:"Traité via batch #020" },
]

const pending   = PAYOUTS.filter(p => p.status === "pending")
const processed = PAYOUTS.filter(p => p.status === "processed")
const rejected  = PAYOUTS.filter(p => p.status === "rejected")

const methodCount: Record<string, number> = {}
pending.forEach(p => { methodCount[p.method] = (methodCount[p.method] ?? 0) + 1 })

export async function GET() {
  return NextResponse.json({
    kpi: {
      pending_count:   pending.length,
      pending_amount:  pending.reduce((s, p) => s + p.amount, 0),
      processed_today: processed.length,
      rejected_today:  rejected.length,
      avg_amount:      Math.round(PAYOUTS.reduce((s, p) => s + p.amount, 0) / PAYOUTS.length),
      commission_rate: 3.5,
    },
    payouts: PAYOUTS,
    method_distribution: Object.entries(methodCount).map(([method, count]) => ({
      method, count, pct: Math.round(count / pending.length * 100),
      color: method === "Orange Money" ? "#f97316" : method === "MTN Money" ? "#eab308" : method === "Wave" ? "#3b82f6" : "#22c55e",
    })),
    type_breakdown: [
      { type:"vendor", label:"Vendeurs", count: pending.filter(p=>p.owner_type==="vendor").length, amount: pending.filter(p=>p.owner_type==="vendor").reduce((s,p)=>s+p.amount,0) },
      { type:"driver", label:"Livreurs", count: pending.filter(p=>p.owner_type==="driver").length, amount: pending.filter(p=>p.owner_type==="driver").reduce((s,p)=>s+p.amount,0) },
    ],
    volume_trend: [
      { day:"Lun", amount:3_850_000 }, { day:"Mar", amount:4_200_000 },
      { day:"Mer", amount:2_900_000 }, { day:"Jeu", amount:5_100_000 },
      { day:"Ven", amount:6_400_000 }, { day:"Sam", amount:7_200_000 },
      { day:"Auj", amount:5_120_000 },
    ],
  })
}
