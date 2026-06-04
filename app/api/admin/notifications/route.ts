import { NextResponse } from "next/server"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

const NOTIFICATIONS = [
  { id:"NTF-0201", type:"alert",   channel:"push",  title:"Paiement échoué",          body:"La transaction TRX-4419 de 35 000 FCFA a échoué pour Sophie Ateba.",    recipient:"admin",          read:false, sent_at:ts(-3),   priority:"urgent" },
  { id:"NTF-0200", type:"info",    channel:"email", title:"Nouveau vendeur inscrit",   body:"Pharma Plus vient de compléter son inscription. Vérification requise.",   recipient:"admin",          read:false, sent_at:ts(-8),   priority:"normal" },
  { id:"NTF-0199", type:"alert",   channel:"push",  title:"Compte suspect détecté",   body:"Activité inhabituelle détectée sur le compte client WAL-C004.",           recipient:"admin",          read:false, sent_at:ts(-15),  priority:"urgent" },
  { id:"NTF-0198", type:"success", channel:"push",  title:"Virement de 85 000 FCFA",  body:"La transaction TRX-4408 de Francis Belinga a été traitée avec succès.",   recipient:"admin",          read:true,  sent_at:ts(-22),  priority:"normal" },
  { id:"NTF-0197", type:"info",    channel:"sms",   title:"Rapport quotidien prêt",   body:"Le rapport du 02/06/2026 est disponible. 248 transactions, 87.5% succès.", recipient:"admin",          read:true,  sent_at:ts(-35),  priority:"normal" },
  { id:"NTF-0196", type:"warning", channel:"push",  title:"Wallet gelé — La Belle Mode","body":"Le wallet WAL-V006 a été gelé automatiquement suite à une anomalie.",  recipient:"admin",          read:false, sent_at:ts(-48),  priority:"high"   },
  { id:"NTF-0195", type:"success", channel:"email", title:"Payout traité — batch #023", body:"1 850 000 FCFA versés à Loïc Shop via Wave. Traitement réussi.",         recipient:"vendor_V002",    read:true,  sent_at:ts(-60),  priority:"normal" },
  { id:"NTF-0194", type:"info",    channel:"push",  title:"Nouvelle commande",        body:"CMD-78821 reçue de Marie Ngo — 12 500 FCFA. Livreur assigné.",            recipient:"vendor_V001",    read:true,  sent_at:ts(-75),  priority:"normal" },
  { id:"NTF-0193", type:"alert",   channel:"sms",   title:"Livreur hors zone",        body:"Paul Tchamba a quitté la zone de livraison CMD-78452.",                   recipient:"admin",          read:true,  sent_at:ts(-90),  priority:"high"   },
  { id:"NTF-0192", type:"success", channel:"push",  title:"Livraison confirmée",      body:"CMD-78820 livrée avec succès. Note client : 5/5.",                        recipient:"driver_D001",    read:true,  sent_at:ts(-105), priority:"normal" },
  { id:"NTF-0191", type:"warning", channel:"email", title:"Solde bas — AfriTech",     body:"Le wallet de AfriTech passe sous 800 000 FCFA.",                          recipient:"vendor_V005",    read:false, sent_at:ts(-120), priority:"normal" },
  { id:"NTF-0190", type:"info",    channel:"push",  title:"Mise à jour système",      body:"QuickGo v2.4.1 déployée avec succès. 3 nouvelles fonctionnalités.",       recipient:"admin",          read:true,  sent_at:ts(-180), priority:"normal" },
  { id:"NTF-0189", type:"alert",   channel:"sms",   title:"Ticket escaladé",          body:"TKT-1135 (Davy Store) escaladé. Intervention manager requise.",           recipient:"admin",          read:false, sent_at:ts(-240), priority:"urgent" },
  { id:"NTF-0188", type:"success", channel:"email", title:"Rapport hebdomadaire",     body:"Week 22: 1 742 commandes, 94.3% de satisfaction client.",                 recipient:"admin",          read:true,  sent_at:ts(-360), priority:"normal" },
  { id:"NTF-0187", type:"info",    channel:"push",  title:"Promotion activée",        body:"Promo JUIN2026 activée — 15% pour 3 nouvelles villes.",                   recipient:"all_clients",    read:true,  sent_at:ts(-480), priority:"normal" },
  { id:"NTF-0186", type:"warning", channel:"push",  title:"API rate limit atteint",   body:"L'endpoint /api/orders a atteint 95% de sa limite horaire.",              recipient:"admin",          read:true,  sent_at:ts(-720), priority:"high"   },
]

const CAMPAIGNS = [
  { id:"CMP-014", name:"Promo Ramadan 2026",   type:"email", status:"active",   recipients:3_420, opened:1_892, clicked:634, sent_at:ts(-2880),  open_rate:55.3 },
  { id:"CMP-013", name:"Bienvenue nouveaux",    type:"push",  status:"active",   recipients:1_250, opened:980,   clicked:412, sent_at:ts(-4320),  open_rate:78.4 },
  { id:"CMP-012", name:"Rappel panier oublié",  type:"sms",   status:"paused",   recipients:876,   opened:721,   clicked:198, sent_at:ts(-7200),  open_rate:82.3 },
  { id:"CMP-011", name:"Re-engagement inactifs",type:"email", status:"completed",recipients:2_100, opened:840,   clicked:189, sent_at:ts(-10080), open_rate:40.0 },
  { id:"CMP-010", name:"Flash sale weekend",    type:"push",  status:"completed",recipients:5_800, opened:4_234, clicked:1_872, sent_at:ts(-20160),open_rate:73.0 },
]

const unread   = NOTIFICATIONS.filter(n => !n.read)
const urgent   = NOTIFICATIONS.filter(n => n.priority === "urgent")
const alerts   = NOTIFICATIONS.filter(n => n.type === "alert")
const today    = NOTIFICATIONS.filter(n => (Date.now() - new Date(n.sent_at).getTime()) < 86_400_000)

const channelCount: Record<string, number> = {}
NOTIFICATIONS.forEach(n => { channelCount[n.channel] = (channelCount[n.channel] ?? 0) + 1 })

export async function GET() {
  return NextResponse.json({
    kpi: {
      unread_count:    unread.length,
      urgent_count:    urgent.length,
      sent_today:      today.length,
      campaigns_active: CAMPAIGNS.filter(c => c.status === "active").length,
      avg_open_rate:   Math.round(CAMPAIGNS.reduce((s,c) => s + c.open_rate, 0) / CAMPAIGNS.length * 10) / 10,
      delivery_rate:   98.7,
    },
    notifications: NOTIFICATIONS,
    campaigns: CAMPAIGNS,
    channel_distribution: Object.entries(channelCount).map(([channel, count]) => ({
      channel,
      count,
      pct: Math.round(count / NOTIFICATIONS.length * 100),
      color: channel === "push" ? "#3b82f6" : channel === "email" ? "#8b5cf6" : "#22c55e",
    })),
    volume_trend: [
      { day:"Lun", push:42, email:18, sms:8  },
      { day:"Mar", push:56, email:24, sms:12 },
      { day:"Mer", push:38, email:15, sms:6  },
      { day:"Jeu", push:71, email:31, sms:15 },
      { day:"Ven", push:85, email:38, sms:18 },
      { day:"Sam", push:94, email:42, sms:22 },
      { day:"Auj", push:today.filter(n=>n.channel==="push").length, email:today.filter(n=>n.channel==="email").length, sms:today.filter(n=>n.channel==="sms").length },
    ],
  })
}
