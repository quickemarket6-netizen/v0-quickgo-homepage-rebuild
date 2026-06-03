import { NextResponse } from "next/server"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

const WALLETS = [
  // Vendors
  { id:"WAL-V001", owner_name:"Xavier Boutique",  owner_type:"vendor", balance:2_450_000, pending_withdrawal:450_000, total_earned:12_800_000, total_withdrawn:10_350_000, status:"active",  last_transaction:ts(-15),  transactions_count:342 },
  { id:"WAL-V002", owner_name:"Loïc Shop",         owner_type:"vendor", balance:1_850_000, pending_withdrawal:0,       total_earned:9_200_000,  total_withdrawn:7_350_000,  status:"active",  last_transaction:ts(-28),  transactions_count:218 },
  { id:"WAL-V003", owner_name:"Davy Store",        owner_type:"vendor", balance:1_250_000, pending_withdrawal:250_000, total_earned:7_500_000,  total_withdrawn:6_250_000,  status:"active",  last_transaction:ts(-42),  transactions_count:195 },
  { id:"WAL-V004", owner_name:"Grace Market",      owner_type:"vendor", balance:980_000,   pending_withdrawal:0,       total_earned:5_800_000,  total_withdrawn:4_820_000,  status:"active",  last_transaction:ts(-60),  transactions_count:167 },
  { id:"WAL-V005", owner_name:"AfriTech",          owner_type:"vendor", balance:750_000,   pending_withdrawal:150_000, total_earned:4_200_000,  total_withdrawn:3_450_000,  status:"active",  last_transaction:ts(-90),  transactions_count:142 },
  { id:"WAL-V006", owner_name:"La Belle Mode",     owner_type:"vendor", balance:540_000,   pending_withdrawal:0,       total_earned:3_100_000,  total_withdrawn:2_560_000,  status:"frozen",  last_transaction:ts(-1440),transactions_count:98  },
  { id:"WAL-V007", owner_name:"Pharma Plus",       owner_type:"vendor", balance:320_000,   pending_withdrawal:80_000,  total_earned:2_400_000,  total_withdrawn:2_080_000,  status:"active",  last_transaction:ts(-180), transactions_count:76  },
  // Drivers
  { id:"WAL-D001", owner_name:"Paul Tchamba",      owner_type:"driver", balance:185_000,   pending_withdrawal:50_000,  total_earned:1_850_000,  total_withdrawn:1_665_000,  status:"active",  last_transaction:ts(-5),   transactions_count:523 },
  { id:"WAL-D002", owner_name:"Eric Fouda",        owner_type:"driver", balance:162_000,   pending_withdrawal:0,       total_earned:1_620_000,  total_withdrawn:1_458_000,  status:"active",  last_transaction:ts(-8),   transactions_count:487 },
  { id:"WAL-D003", owner_name:"Rostand Kana",      owner_type:"driver", balance:145_000,   pending_withdrawal:35_000,  total_earned:1_450_000,  total_withdrawn:1_305_000,  status:"active",  last_transaction:ts(-12),  transactions_count:412 },
  { id:"WAL-D004", owner_name:"Claude Essama",     owner_type:"driver", balance:128_000,   pending_withdrawal:0,       total_earned:1_280_000,  total_withdrawn:1_152_000,  status:"idle",    last_transaction:ts(-65),  transactions_count:368 },
  { id:"WAL-D005", owner_name:"Bernard Eto'o",     owner_type:"driver", balance:115_000,   pending_withdrawal:20_000,  total_earned:1_150_000,  total_withdrawn:1_035_000,  status:"active",  last_transaction:ts(-22),  transactions_count:334 },
  { id:"WAL-D006", owner_name:"Didier Nkeng",      owner_type:"driver", balance:98_000,    pending_withdrawal:0,       total_earned:980_000,    total_withdrawn:882_000,    status:"active",  last_transaction:ts(-35),  transactions_count:289 },
  { id:"WAL-D007", owner_name:"Gustave Meke",      owner_type:"driver", balance:72_000,    pending_withdrawal:0,       total_earned:720_000,    total_withdrawn:648_000,    status:"pending", last_transaction:ts(-480), transactions_count:201 },
  // Clients
  { id:"WAL-C001", owner_name:"Marie Ngo",         owner_type:"client", balance:45_000,    pending_withdrawal:0,       total_earned:245_000,    total_withdrawn:200_000,    status:"active",  last_transaction:ts(-20),  transactions_count:45  },
  { id:"WAL-C002", owner_name:"Jean Mballa",       owner_type:"client", balance:32_000,    pending_withdrawal:0,       total_earned:182_000,    total_withdrawn:150_000,    status:"active",  last_transaction:ts(-45),  transactions_count:32  },
  { id:"WAL-C003", owner_name:"Sophie Ateba",      owner_type:"client", balance:28_000,    pending_withdrawal:0,       total_earned:128_000,    total_withdrawn:100_000,    status:"active",  last_transaction:ts(-72),  transactions_count:28  },
  { id:"WAL-C004", owner_name:"Alain Nguema",      owner_type:"client", balance:15_000,    pending_withdrawal:0,       total_earned:75_000,     total_withdrawn:60_000,     status:"frozen",  last_transaction:ts(-2880),transactions_count:12  },
]

const RECENT_TRANSACTIONS = [
  { id:"TXN-001", wallet_id:"WAL-D001", owner_name:"Paul Tchamba",    owner_type:"driver", type:"credit",     amount:8_500,   description:"Livraison CMD-78452",     timestamp:ts(-15),  balance_after:185_000   },
  { id:"TXN-002", wallet_id:"WAL-V001", owner_name:"Xavier Boutique", owner_type:"vendor", type:"credit",     amount:45_000,  description:"Payout commandes #23",    timestamp:ts(-20),  balance_after:2_450_000 },
  { id:"TXN-003", wallet_id:"WAL-D002", owner_name:"Eric Fouda",      owner_type:"driver", type:"credit",     amount:7_200,   description:"Livraison CMD-78449",     timestamp:ts(-28),  balance_after:162_000   },
  { id:"TXN-004", wallet_id:"WAL-V002", owner_name:"Loïc Shop",       owner_type:"vendor", type:"withdrawal", amount:200_000, description:"Retrait Orange Money",    timestamp:ts(-35),  balance_after:1_850_000 },
  { id:"TXN-005", wallet_id:"WAL-D003", owner_name:"Rostand Kana",    owner_type:"driver", type:"credit",     amount:9_100,   description:"Livraison CMD-78448",     timestamp:ts(-42),  balance_after:145_000   },
  { id:"TXN-006", wallet_id:"WAL-C001", owner_name:"Marie Ngo",       owner_type:"client", type:"debit",      amount:12_500,  description:"Commande CMD-78447",      timestamp:ts(-50),  balance_after:45_000    },
  { id:"TXN-007", wallet_id:"WAL-V003", owner_name:"Davy Store",      owner_type:"vendor", type:"credit",     amount:38_000,  description:"Payout commandes #18",    timestamp:ts(-60),  balance_after:1_250_000 },
  { id:"TXN-008", wallet_id:"WAL-D004", owner_name:"Claude Essama",   owner_type:"driver", type:"withdrawal", amount:50_000,  description:"Retrait MTN Money",       timestamp:ts(-75),  balance_after:128_000   },
  { id:"TXN-009", wallet_id:"WAL-V004", owner_name:"Grace Market",    owner_type:"vendor", type:"credit",     amount:27_500,  description:"Payout commandes #15",    timestamp:ts(-85),  balance_after:980_000   },
  { id:"TXN-010", wallet_id:"WAL-C002", owner_name:"Jean Mballa",     owner_type:"client", type:"refund",     amount:5_000,   description:"Remboursement CMD-78440", timestamp:ts(-100), balance_after:32_000    },
  { id:"TXN-011", wallet_id:"WAL-V001", owner_name:"Xavier Boutique", owner_type:"vendor", type:"withdrawal", amount:500_000, description:"Retrait Orange Money",    timestamp:ts(-120), balance_after:2_400_000 },
  { id:"TXN-012", wallet_id:"WAL-D005", owner_name:"Bernard Eto'o",   owner_type:"driver", type:"credit",     amount:6_800,   description:"Livraison CMD-78444",     timestamp:ts(-135), balance_after:115_000   },
]

const vendorBal  = WALLETS.filter(w => w.owner_type === "vendor").reduce((s, w) => s + w.balance, 0)
const driverBal  = WALLETS.filter(w => w.owner_type === "driver").reduce((s, w) => s + w.balance, 0)
const clientBal  = WALLETS.filter(w => w.owner_type === "client").reduce((s, w) => s + w.balance, 0)
const totalBal   = vendorBal + driverBal + clientBal
const pendingAmt = WALLETS.reduce((s, w) => s + w.pending_withdrawal, 0)
const frozen     = WALLETS.filter(w => w.status === "frozen").length

export async function GET() {
  return NextResponse.json({
    kpi: {
      total_balance:          totalBal,
      active_wallets:         WALLETS.filter(w => ["active","idle"].includes(w.status)).length,
      transactions_today:     248,
      volume_withdrawn_month: 18_500_000,
      pending_withdrawal:     pendingAmt,
      frozen_wallets:         frozen,
      yesterday_transactions: 231,
    },
    wallets: WALLETS,
    recent_transactions: RECENT_TRANSACTIONS,
    type_distribution: [
      { type:"vendor", label:"Vendeurs", count:WALLETS.filter(w=>w.owner_type==="vendor").length, balance:vendorBal, pct:Math.round(vendorBal/totalBal*100) },
      { type:"driver", label:"Livreurs", count:WALLETS.filter(w=>w.owner_type==="driver").length, balance:driverBal, pct:Math.round(driverBal/totalBal*100) },
      { type:"client", label:"Clients",  count:WALLETS.filter(w=>w.owner_type==="client").length, balance:clientBal, pct:Math.round(clientBal/totalBal*100) },
    ],
    volume_trend: [
      { day:"Lun", credits:2_850_000, debits:1_200_000, withdrawals:800_000  },
      { day:"Mar", credits:3_100_000, debits:1_350_000, withdrawals:650_000  },
      { day:"Mer", credits:2_650_000, debits:980_000,   withdrawals:1_100_000},
      { day:"Jeu", credits:3_400_000, debits:1_500_000, withdrawals:750_000  },
      { day:"Ven", credits:4_200_000, debits:1_800_000, withdrawals:1_200_000},
      { day:"Sam", credits:5_100_000, debits:2_200_000, withdrawals:1_500_000},
      { day:"Auj", credits:3_750_000, debits:1_600_000, withdrawals:950_000  },
    ],
  })
}
