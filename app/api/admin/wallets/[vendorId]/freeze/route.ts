import { NextRequest, NextResponse } from "next/server"
import { setWalletFrozen } from "@/lib/payments/wallet-engine"
import { verifyAdmin, getClientIP } from "@/lib/payments/security"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params

  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const { frozen, reason } = await req.json()
  if (frozen && !reason?.trim()) {
    return NextResponse.json({ error: "Une raison de gel est requise" }, { status: 400 })
  }

  const result = await setWalletFrozen(vendorId, frozen, reason ?? "", admin.adminId!)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })

  // Audit
  const supabase = await createClient()
  await supabase.from("payout_audit_logs").insert({
    payout_id: null,
    action: frozen ? "wallet_frozen" : "wallet_unfrozen",
    performed_by: admin.adminId,
    ip_address: getClientIP(req),
    metadata: { vendor_id: vendorId, reason },
  })

  return NextResponse.json({ success: true, message: frozen ? "Portefeuille gelé" : "Portefeuille réactivé" })
}
