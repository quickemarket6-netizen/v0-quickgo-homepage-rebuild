import { describe, it, expect } from "vitest"
import { canAcceptCashOrder } from "./cash"

const CAP = 50_000

describe("canAcceptCashOrder", () => {
  it("allows an order that stays under the cap", () => {
    expect(canAcceptCashOrder(10_000, 15_000, CAP)).toBe(true)
  })

  it("allows an order that lands exactly on the cap", () => {
    expect(canAcceptCashOrder(30_000, 20_000, CAP)).toBe(true)
  })

  it("rejects an order that would push cash-on-hand above the cap", () => {
    expect(canAcceptCashOrder(45_000, 10_000, CAP)).toBe(false)
  })

  it("rejects when the driver is already at the cap", () => {
    expect(canAcceptCashOrder(50_000, 1, CAP)).toBe(false)
  })

  it("allows a first order for a driver holding no cash", () => {
    expect(canAcceptCashOrder(0, 50_000, CAP)).toBe(true)
  })

  it("treats null/NaN inputs as zero rather than throwing", () => {
    // Route passes Number(driver.cash_on_hand ?? 0); guard against bad data.
    expect(canAcceptCashOrder(NaN, 10_000, CAP)).toBe(true)
    expect(canAcceptCashOrder(undefined as unknown as number, 10_000, CAP)).toBe(true)
  })

  it("uses the default cap when none is provided", () => {
    // Default cap is 50 000 unless DRIVER_CASH_CAP overrides it.
    expect(canAcceptCashOrder(49_000, 1_000)).toBe(true)
    expect(canAcceptCashOrder(49_000, 1_001)).toBe(false)
  })
})
