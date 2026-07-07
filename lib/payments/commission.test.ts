import { describe, it, expect } from "vitest"
import {
  calculateCommission,
  QUICKGO_COMMISSION_RATE,
  PAYMENT_FEE_RATE,
} from "./commission"

describe("calculateCommission", () => {
  it("applies the 7% commission to the subtotal only, not the delivery fee", () => {
    // gross 10 000 (subtotal 9 000 + delivery 1 000)
    const r = calculateCommission(10_000, 1_000)
    expect(r.quickgoCommissionRate).toBe(QUICKGO_COMMISSION_RATE)
    expect(r.quickgoCommission).toBe(Math.round(9_000 * 0.07)) // 630 — NOT on the 10 000
    expect(r.deliveryFees).toBe(1_000)
  })

  it("applies the 2% payment fee to the full gross amount", () => {
    const r = calculateCommission(10_000, 1_000)
    expect(r.paymentFees).toBe(Math.round(10_000 * PAYMENT_FEE_RATE)) // 200
  })

  it("computes the vendor net as gross − delivery − commission − payment fees", () => {
    const r = calculateCommission(10_000, 1_000)
    // 10 000 − 1 000 − 630 − 200 = 8 170
    expect(r.vendorNetAmount).toBe(8_170)
  })

  it("keeps the full split reconciled (net + commission + fees + delivery = gross)", () => {
    const gross = 27_450
    const delivery = 1_500
    const r = calculateCommission(gross, delivery)
    const sum = r.vendorNetAmount + r.quickgoCommission + r.paymentFees + r.deliveryFees
    expect(sum).toBe(gross)
  })

  it("honours a custom commission rate when provided", () => {
    const r = calculateCommission(10_000, 0, 0.15)
    expect(r.quickgoCommissionRate).toBe(0.15)
    expect(r.quickgoCommission).toBe(Math.round(10_000 * 0.15)) // 1 500
  })

  it("never returns a negative vendor net (floored at 0)", () => {
    // Tiny order where fees would exceed what's left: delivery eats everything.
    const r = calculateCommission(1_000, 1_000)
    expect(r.vendorNetAmount).toBe(0)
    expect(r.vendorNetAmount).toBeGreaterThanOrEqual(0)
  })

  it("handles a zero-amount order without throwing or going negative", () => {
    const r = calculateCommission(0, 0)
    expect(r.quickgoCommission).toBe(0)
    expect(r.paymentFees).toBe(0)
    expect(r.vendorNetAmount).toBe(0)
  })

  it("rounds commission and fees to whole FCFA (no fractional currency)", () => {
    const r = calculateCommission(3_333, 0) // 3 333 * 0.07 = 233.31
    expect(Number.isInteger(r.quickgoCommission)).toBe(true)
    expect(Number.isInteger(r.paymentFees)).toBe(true)
    expect(r.quickgoCommission).toBe(233)
  })
})
