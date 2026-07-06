/**
 * QuickGo Wallet Engine — Escrow-based multi-vendor payout system
 * All financial mutations go through this module.
 * Uses Supabase RPC functions for atomic operations.
 */

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SupabaseClient } from "@supabase/supabase-js"

// commission_logs n'est accessible qu'aux admins/vendeurs via RLS, or ces
// fonctions sont appelées depuis des sessions client/livreur/webhook. Les
// mutations financières passent par le client service-role quand il est
// configuré ; l'appelant reste responsable des contrôles d'appartenance.
async function financialClient(db?: SupabaseClient): Promise<SupabaseClient> {
  return db ?? createAdminClient() ?? (await createClient()) as unknown as SupabaseClient
}

const QUICKGO_COMMISSION_RATE = 0.07  // 7% platform commission
const PAYMENT_FEE_RATE = 0.02         // 2% CinetPay payment fee
const MIN_PAYOUT_AMOUNT = 5000        // 5,000 FCFA minimum payout
const MAX_DAILY_PAYOUT = 2_000_000    // 2M FCFA max daily payout per vendor

export interface OrderFinancials {
  orderId: string
  vendorId: string
  grossAmount: number
  deliveryFee: number
  customCommissionRate?: number
}

export interface WalletBalance {
  vendorId: string
  pendingBalance: number
  availableBalance: number
  withdrawnBalance: number
  totalEarned: number
  totalSales: number
  frozen: boolean
  freezeReason?: string
}

export interface PayoutRequest {
  vendorId: string
  amount: number
  payoutMethod: "orange_money" | "mtn_momo"
  payoutPhone: string
  payoutAccountId?: string
  requestedBy: string
  idempotencyKey: string
}

/**
 * Calculate commission breakdown for an order
 */
export function calculateCommission(grossAmount: number, deliveryFee: number, customRate?: number) {
  const commissionRate = customRate ?? QUICKGO_COMMISSION_RATE
  const paymentFeeRate = PAYMENT_FEE_RATE

  // Commission is on the order subtotal only (not delivery fee)
  const orderSubtotal = grossAmount - deliveryFee
  const quickgoCommission = Math.round(orderSubtotal * commissionRate)
  const paymentFees = Math.round(grossAmount * paymentFeeRate)
  const vendorNetAmount = grossAmount - deliveryFee - quickgoCommission - paymentFees

  return {
    grossAmount,
    quickgoCommissionRate: commissionRate,
    quickgoCommission,
    paymentFees,
    deliveryFees: deliveryFee,
    vendorNetAmount: Math.max(0, vendorNetAmount),
  }
}

/**
 * Credit vendor pending balance when order is paid
 * Called after successful CinetPay webhook
 * `db` optionnel : le webhook (sans session) passe le client service-role,
 * sinon le client de session est utilisé.
 */
export async function creditVendorPending(params: OrderFinancials, db?: SupabaseClient): Promise<{
  success: boolean
  commission?: ReturnType<typeof calculateCommission>
  error?: string
}> {
  const supabase = await financialClient(db)
  const commission = calculateCommission(params.grossAmount, params.deliveryFee, params.customCommissionRate)

  // Atomic: insert commission log + credit pending balance
  const { data: commLog, error: commError } = await supabase
    .from("commission_logs")
    .insert({
      order_id: params.orderId,
      vendor_id: params.vendorId,
      gross_amount: commission.grossAmount,
      quickgo_commission_rate: commission.quickgoCommissionRate,
      quickgo_commission: commission.quickgoCommission,
      payment_fees: commission.paymentFees,
      delivery_fees: commission.deliveryFees,
      vendor_net_amount: commission.vendorNetAmount,
      status: "held",
    })
    .select()
    .single()

  if (commError) {
    return { success: false, error: `Commission log failed: ${commError.message}` }
  }

  // Credit pending balance via RPC (atomic, row-locked)
  const { data: walletResult } = await supabase.rpc("credit_vendor_pending", {
    p_vendor_id: params.vendorId,
    p_amount: commission.vendorNetAmount,
    p_order_id: params.orderId,
  })

  if (!walletResult?.success) {
    return { success: false, error: walletResult?.error ?? "Wallet credit failed" }
  }

  // Create financial notification for vendor
  const { data: vendor } = await supabase
    .from("vendors")
    .select("owner_id")
    .eq("id", params.vendorId)
    .single()

  if (vendor?.owner_id) {
    await supabase.from("financial_notifications").insert({
      user_id: vendor.owner_id,
      type: "funds_held",
      title: "Paiement reçu",
      message: `${formatCFA(commission.vendorNetAmount)} en attente de validation livraison`,
      amount: commission.vendorNetAmount,
      reference_id: params.orderId,
      reference_type: "order",
    })
  }

  return { success: true, commission }
}

/**
 * Release pending → available after delivery confirmation
 * Called when order status becomes "delivered"
 */
export async function releasePendingFunds(orderId: string, db?: SupabaseClient): Promise<{
  success: boolean
  amount?: number
  error?: string
}> {
  const supabase = await financialClient(db)

  // Get commission log for this order
  const { data: commLog, error: logError } = await supabase
    .from("commission_logs")
    .select("*")
    .eq("order_id", orderId)
    .eq("status", "held")
    .single()

  if (logError || !commLog) {
    return { success: false, error: "Commission log not found or already released" }
  }

  // Atomic release via RPC
  const { data: result } = await supabase.rpc("release_vendor_funds", {
    p_vendor_id: commLog.vendor_id,
    p_amount: commLog.vendor_net_amount,
    p_commission_log_id: commLog.id,
  })

  if (!result?.success) {
    return { success: false, error: result?.error ?? "Release failed" }
  }

  // Notify vendor funds available
  const { data: vendor } = await supabase
    .from("vendors")
    .select("owner_id")
    .eq("id", commLog.vendor_id)
    .single()

  if (vendor?.owner_id) {
    await supabase.from("financial_notifications").insert({
      user_id: vendor.owner_id,
      type: "funds_available",
      title: "Fonds disponibles",
      message: `${formatCFA(commLog.vendor_net_amount)} maintenant disponibles pour retrait`,
      amount: commLog.vendor_net_amount,
      reference_id: orderId,
      reference_type: "order",
    })
  }

  return { success: true, amount: commLog.vendor_net_amount }
}

/**
 * Get vendor wallet balance
 */
export async function getVendorWallet(vendorId: string): Promise<WalletBalance | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("vendor_wallets")
    .select("*")
    .eq("vendor_id", vendorId)
    .single()

  if (!data) return null

  return {
    vendorId: data.vendor_id,
    pendingBalance: data.pending_balance,
    availableBalance: data.available_balance,
    withdrawnBalance: data.total_withdrawn,
    totalEarned: data.total_earned,
    totalSales: data.total_earned,  // total_sales not stored separately — use total_earned
    frozen: data.frozen,
    freezeReason: data.freeze_reason,
  }
}

/**
 * Create a payout request (vendor-initiated or admin-initiated)
 */
export async function createPayoutRequest(params: PayoutRequest): Promise<{
  success: boolean
  payoutId?: string
  error?: string
}> {
  const supabase = await createClient()

  // Guard: minimum amount
  if (params.amount < MIN_PAYOUT_AMOUNT) {
    return { success: false, error: `Montant minimum de retrait: ${formatCFA(MIN_PAYOUT_AMOUNT)}` }
  }

  // Guard: check available balance
  const wallet = await getVendorWallet(params.vendorId)
  if (!wallet) return { success: false, error: "Portefeuille introuvable" }
  if (wallet.frozen) return { success: false, error: `Portefeuille gelé: ${wallet.freezeReason}` }
  if (wallet.availableBalance < params.amount) {
    return {
      success: false,
      error: `Solde disponible insuffisant. Disponible: ${formatCFA(wallet.availableBalance)}`,
    }
  }

  // Guard: check daily payout limit
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data: todayPayouts } = await supabase
    .from("vendor_payouts")
    .select("amount")
    .eq("vendor_id", params.vendorId)
    .in("status", ["approved", "processing", "completed"])
    .gte("created_at", today.toISOString())

  const dailyTotal = (todayPayouts ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
  if (dailyTotal + params.amount > MAX_DAILY_PAYOUT) {
    return {
      success: false,
      error: `Limite journalière de ${formatCFA(MAX_DAILY_PAYOUT)} atteinte`,
    }
  }

  // Guard: no duplicate pending payout
  const { data: existingPayout } = await supabase
    .from("vendor_payouts")
    .select("id")
    .eq("idempotency_key", params.idempotencyKey)
    .single()

  if (existingPayout) {
    return { success: true, payoutId: existingPayout.id }
  }

  // Create payout record
  const { data: payout, error } = await supabase
    .from("vendor_payouts")
    .insert({
      vendor_id: params.vendorId,
      amount: params.amount,
      payout_method: params.payoutMethod,
      payout_phone: params.payoutPhone,
      payout_account_id: params.payoutAccountId,
      status: "pending",
      initiated_by_admin: false,
      idempotency_key: params.idempotencyKey,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  // Audit log
  await insertAuditLog(supabase, {
    payoutId: payout.id,
    action: "payout_requested",
    performedBy: params.requestedBy,
    amountAtTime: params.amount,
    newStatus: "pending",
    metadata: { payout_method: params.payoutMethod, phone: params.payoutPhone },
  })

  return { success: true, payoutId: payout.id }
}

/**
 * Approve and process a payout (admin only)
 * Deducts from available balance + calls CinetPay
 */
export async function approveAndProcessPayout(
  payoutId: string,
  adminId: string,
  ipAddress: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get payout
  const { data: payout, error: fetchErr } = await supabase
    .from("vendor_payouts")
    .select("*")
    .eq("id", payoutId)
    .eq("status", "pending")
    .single()

  if (fetchErr || !payout) {
    return { success: false, error: "Paiement introuvable ou déjà traité" }
  }

  // Mark as approved
  await supabase
    .from("vendor_payouts")
    .update({ status: "approved", approved_by: adminId, approved_at: new Date().toISOString() })
    .eq("id", payoutId)

  // Atomic deduct from wallet
  const { data: deductResult } = await supabase.rpc("deduct_vendor_payout", {
    p_vendor_id: payout.vendor_id,
    p_amount: payout.amount,
  })

  if (!deductResult?.success) {
    // Rollback status
    await supabase.from("vendor_payouts").update({ status: "pending" }).eq("id", payoutId)
    return { success: false, error: deductResult?.error ?? "Déduction échouée" }
  }

  // Mark as processing
  await supabase.from("vendor_payouts").update({ status: "processing" }).eq("id", payoutId)

  await insertAuditLog(supabase, {
    payoutId,
    action: "payout_approved",
    performedBy: adminId,
    amountAtTime: payout.amount,
    previousStatus: "pending",
    newStatus: "processing",
    ipAddress,
  })

  return { success: true }
}

/**
 * Mark payout as completed after CinetPay confirms transfer
 */
export async function completePayoutTransfer(
  payoutId: string,
  cinetpayTransactionId: string,
  cinetpayReference: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("vendor_payouts")
    .update({
      status: "completed",
      cinetpay_transaction_id: cinetpayTransactionId,
      cinetpay_reference: cinetpayReference,
      processed_at: new Date().toISOString(),
    })
    .eq("id", payoutId)
    .in("status", ["processing", "approved"])

  if (error) return { success: false, error: error.message }

  // Notify vendor
  const { data: payout } = await supabase
    .from("vendor_payouts")
    .select("vendor_id, amount, vendors(owner_id)")
    .eq("id", payoutId)
    .single() as { data: { vendor_id: string; amount: number; vendors: { owner_id: string } | null } | null }

  if (payout?.vendors?.owner_id) {
    await supabase.from("financial_notifications").insert({
      user_id: payout.vendors.owner_id,
      type: "payout_completed",
      title: "Retrait effectué",
      message: `${formatCFA(payout.amount)} transféré avec succès sur votre compte`,
      amount: payout.amount,
      reference_id: payoutId,
      reference_type: "payout",
    })
  }

  await insertAuditLog(supabase, {
    payoutId,
    action: "payout_completed",
    previousStatus: "processing",
    newStatus: "completed",
    metadata: { cinetpay_transaction_id: cinetpayTransactionId },
  })

  return { success: true }
}

/**
 * Reject a payout (admin only)
 */
export async function rejectPayout(
  payoutId: string,
  adminId: string,
  reason: string,
  ipAddress: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: payout } = await supabase
    .from("vendor_payouts")
    .select("*")
    .eq("id", payoutId)
    .in("status", ["pending", "approved"])
    .single()

  if (!payout) return { success: false, error: "Paiement introuvable ou déjà traité" }

  // If was approved (funds already deducted), refund back to available
  if (payout.status === "approved") {
    await supabase.rpc("refund_payout_to_available", {
      p_vendor_id: payout.vendor_id,
      p_amount: payout.amount,
      p_payout_id: payoutId,
    })
  }

  await supabase
    .from("vendor_payouts")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", payoutId)

  // Notify vendor
  const { data: vendor } = await supabase
    .from("vendors")
    .select("owner_id")
    .eq("id", payout.vendor_id)
    .single()

  if (vendor?.owner_id) {
    await supabase.from("financial_notifications").insert({
      user_id: vendor.owner_id,
      type: "payout_rejected",
      title: "Retrait refusé",
      message: `Votre demande de retrait de ${formatCFA(payout.amount)} a été refusée. Raison: ${reason}`,
      amount: payout.amount,
      reference_id: payoutId,
      reference_type: "payout",
    })
  }

  await insertAuditLog(supabase, {
    payoutId,
    action: "payout_rejected",
    performedBy: adminId,
    amountAtTime: payout.amount,
    previousStatus: payout.status,
    newStatus: "rejected",
    ipAddress,
    metadata: { reason },
  })

  return { success: true }
}

/**
 * Freeze / unfreeze vendor wallet (admin only)
 */
export async function setWalletFrozen(
  vendorId: string,
  frozen: boolean,
  reason: string,
  adminId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("vendor_wallets")
    .update({ frozen, freeze_reason: frozen ? reason : null, updated_at: new Date().toISOString() })
    .eq("vendor_id", vendorId)

  if (error) return { success: false, error: error.message }

  // Notify vendor
  const { data: vendor } = await supabase
    .from("vendors")
    .select("owner_id")
    .eq("id", vendorId)
    .single()

  if (vendor?.owner_id) {
    await supabase.from("financial_notifications").insert({
      user_id: vendor.owner_id,
      type: frozen ? "wallet_frozen" : "funds_available",
      title: frozen ? "Portefeuille gelé" : "Portefeuille réactivé",
      message: frozen
        ? `Votre portefeuille a été temporairement gelé. Raison: ${reason}`
        : "Votre portefeuille est maintenant réactivé",
      reference_id: vendorId,
      reference_type: "vendor_wallet",
    })
  }

  return { success: true }
}

// ─── Helpers ────────────────────────────────────────────────────

export function formatCFA(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " FCFA"
}

async function insertAuditLog(
  supabase: SupabaseClient,
  params: {
    payoutId: string
    action: string
    performedBy?: string
    amountAtTime?: number
    previousStatus?: string
    newStatus?: string
    ipAddress?: string
    metadata?: Record<string, unknown>
  },
) {
  await supabase.from("payout_audit_logs").insert({
    payout_id: params.payoutId,
    action: params.action,
    performed_by: params.performedBy,
    amount_at_time: params.amountAtTime,
    previous_status: params.previousStatus,
    new_status: params.newStatus,
    ip_address: params.ipAddress,
    metadata: params.metadata ?? {},
  })
}
