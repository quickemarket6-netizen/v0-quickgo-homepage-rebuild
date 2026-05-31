import { NextRequest, NextResponse } from "next/server"
import { rejectPayout } from "@/lib/payments/wallet-engine"
import { verifyAdmin, getClientIP } from "@/lib/payments/security"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: payoutId } = await params

  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const { reason } = await req.json()
  if (!reason?.trim()) {
    return NextResponse.json({ error: "Une raison de refus est requise" }, { status: 400 })
  }

  const ip = getClientIP(req)
  const result = await rejectPayout(payoutId, admin.adminId!, reason, ip)

  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })

  return NextResponse.json({ success: true, message: "Paiement refusé" })
}
