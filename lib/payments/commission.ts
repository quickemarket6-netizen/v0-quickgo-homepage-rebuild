/**
 * Pure commission / fee math for the QuickGo escrow model.
 *
 * Kept dependency-free (no Supabase, no next/headers) so it can be unit-tested
 * in isolation — this is the revenue split, a bug here means real money lost.
 */

export const QUICKGO_COMMISSION_RATE = 0.07 // 7% platform commission
export const PAYMENT_FEE_RATE = 0.02        // 2% CinetPay payment fee

export interface CommissionBreakdown {
  grossAmount: number
  quickgoCommissionRate: number
  quickgoCommission: number
  paymentFees: number
  deliveryFees: number
  vendorNetAmount: number
}

/**
 * Calculate the commission breakdown for a paid order.
 *
 * - Commission (7% by default) applies to the order subtotal only, never to
 *   the delivery fee.
 * - Payment fees (2%) apply to the full gross amount charged to the customer.
 * - The vendor nets gross − delivery − commission − payment fees (floored at 0).
 */
export function calculateCommission(
  grossAmount: number,
  deliveryFee: number,
  customRate?: number,
): CommissionBreakdown {
  const commissionRate = customRate ?? QUICKGO_COMMISSION_RATE
  const paymentFeeRate = PAYMENT_FEE_RATE

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
