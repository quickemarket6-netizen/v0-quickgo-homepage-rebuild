import { NextResponse } from "next/server"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

const TICKETS = [
  { id:"TKT-1142", subject:"Commande non livrée",         category:"livraison", priority:"urgent",  status:"open",       customer_name:"Marie Ngo",        customer_type:"client", assigned_to:"Sylvie K.",  created_at:ts(-12),  updated_at:ts(-5),   messages:5 },
  { id:"TKT-1141", subject:"Paiement débité deux fois",   category:"paiement",  priority:"urgent",  status:"open",       customer_name:"Xavier Boutique",  customer_type:"vendor", assigned_to:null,         created_at:ts(-28),  updated_at:ts(-28),  messages:2 },
  { id:"TKT-1140", subject:"Problème de connexion app",   category:"technique", priority:"normal",  status:"in_progress",customer_name:"Jean Mballa",      customer_type:"client", assigned_to:"Armand D.",  created_at:ts(-45),  updated_at:ts(-15),  messages:8 },
  { id:"TKT-1139", subject:"Livreur irrespectueux",        category:"plainte",   priority:"high",    status:"open",       customer_name:"Sophie Ateba",     customer_type:"client", assigned_to:null,         created_at:ts(-62),  updated_at:ts(-62),  messages:1 },
  { id:"TKT-1138", subject:"Retrait Orange Money bloqué", category:"paiement",  priority:"high",    status:"in_progress",customer_name:"Paul Tchamba",     customer_type:"driver", assigned_to:"Sylvie K.",  created_at:ts(-78),  updated_at:ts(-30),  messages:6 },
  { id:"TKT-1137", subject:"Article manquant dans colis", category:"commande",  priority:"normal",  status:"open",       customer_name:"Alain Nguema",     customer_type:"client", assigned_to:null,         created_at:ts(-95),  updated_at:ts(-95),  messages:3 },
  { id:"TKT-1136", subject:"Remboursement non reçu",      category:"paiement",  priority:"high",    status:"in_progress",customer_name:"Vanessa Abena",    customer_type:"client", assigned_to:"Armand D.",  created_at:ts(-120), updated_at:ts(-45),  messages:9 },
  { id:"TKT-1135", subject:"Compte suspendu injustement", category:"compte",    priority:"urgent",  status:"escalated",  customer_name:"Davy Store",       customer_type:"vendor", assigned_to:"Manager",    created_at:ts(-180), updated_at:ts(-60),  messages:14},
  { id:"TKT-1134", subject:"GPS livreur bloqué",          category:"technique", priority:"normal",  status:"resolved",   customer_name:"Eric Fouda",       customer_type:"driver", assigned_to:"Armand D.",  created_at:ts(-240), updated_at:ts(-120), messages:7 },
  { id:"TKT-1133", subject:"Mauvaise adresse facturée",   category:"commande",  priority:"low",     status:"resolved",   customer_name:"Sandrine Mvouma",  customer_type:"client", assigned_to:"Sylvie K.",  created_at:ts(-300), updated_at:ts(-200), messages:4 },
  { id:"TKT-1132", subject:"Produit endommagé livré",     category:"livraison", priority:"high",    status:"escalated",  customer_name:"Henriette Owona",  customer_type:"client", assigned_to:"Manager",    created_at:ts(-360), updated_at:ts(-180), messages:11},
  { id:"TKT-1131", subject:"Notification push désactivée",category:"technique", priority:"low",     status:"resolved",   customer_name:"Roger Talla",      customer_type:"client", assigned_to:"Armand D.",  created_at:ts(-420), updated_at:ts(-300), messages:3 },
  { id:"TKT-1130", subject:"Facture incorrecte",          category:"paiement",  priority:"normal",  status:"resolved",   customer_name:"Grace Market",     customer_type:"vendor", assigned_to:"Sylvie K.",  created_at:ts(-480), updated_at:ts(-360), messages:6 },
  { id:"TKT-1129", subject:"App plante sur Android 14",   category:"technique", priority:"high",    status:"resolved",   customer_name:"Bruno Akono",      customer_type:"client", assigned_to:"Armand D.",  created_at:ts(-600), updated_at:ts(-480), messages:8 },
  { id:"TKT-1128", subject:"Délai de livraison excessif", category:"livraison", priority:"normal",  status:"closed",     customer_name:"Laure Mbassi",     customer_type:"client", assigned_to:"Sylvie K.",  created_at:ts(-720), updated_at:ts(-600), messages:5 },
]

const AGENTS = [
  { id:"AGT-01", name:"Sylvie K.",  avatar:"SK", online:true,  tickets_open:4, tickets_resolved_today:8,  avg_response_min:4.2  },
  { id:"AGT-02", name:"Armand D.",  avatar:"AD", online:true,  tickets_open:3, tickets_resolved_today:11, avg_response_min:3.8  },
  { id:"AGT-03", name:"Manager",    avatar:"MG", online:true,  tickets_open:2, tickets_resolved_today:3,  avg_response_min:7.5  },
  { id:"AGT-04", name:"Céline N.",  avatar:"CN", online:false, tickets_open:0, tickets_resolved_today:6,  avg_response_min:5.1  },
]

const open      = TICKETS.filter(t => t.status === "open")
const inProg    = TICKETS.filter(t => t.status === "in_progress")
const escalated = TICKETS.filter(t => t.status === "escalated")
const resolved  = TICKETS.filter(t => ["resolved","closed"].includes(t.status))
const urgent    = TICKETS.filter(t => t.priority === "urgent")

const catCount: Record<string, number> = {}
TICKETS.forEach(t => { catCount[t.category] = (catCount[t.category] ?? 0) + 1 })

const catColors: Record<string, string> = {
  livraison: "#3b82f6", paiement: "#f97316", technique: "#8b5cf6",
  commande:  "#22c55e", plainte:  "#ef4444",  compte:    "#eab308",
}

export async function GET() {
  return NextResponse.json({
    kpi: {
      open_tickets:       open.length + inProg.length,
      urgent_count:       urgent.length,
      escalated_count:    escalated.length,
      resolved_today:     resolved.length,
      avg_response_min:   4.2,
      satisfaction_rate:  87,
      yesterday_open:     12,
    },
    tickets: TICKETS,
    agents: AGENTS,
    category_distribution: Object.entries(catCount).map(([cat, count]) => ({
      category: cat,
      count,
      pct: Math.round(count / TICKETS.length * 100),
      color: catColors[cat] ?? "#6b6b8a",
    })),
    status_distribution: [
      { status:"Ouverts",      count: open.length,      color:"#ef4444" },
      { status:"En cours",     count: inProg.length,    color:"#f59e0b" },
      { status:"Escaladés",    count: escalated.length, color:"#8b5cf6" },
      { status:"Résolus",      count: resolved.length,  color:"#22c55e" },
    ],
    volume_trend: [
      { day:"Lun", opened:8,  resolved:7  },
      { day:"Mar", opened:12, resolved:9  },
      { day:"Mer", opened:6,  resolved:11 },
      { day:"Jeu", opened:15, resolved:12 },
      { day:"Ven", opened:18, resolved:14 },
      { day:"Sam", opened:9,  resolved:8  },
      { day:"Auj", opened:open.length + inProg.length, resolved: resolved.length },
    ],
  })
}
