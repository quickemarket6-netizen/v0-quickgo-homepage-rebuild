import { describe, it, expect } from "vitest"
import { createHash } from "node:crypto"
import { validateWebhookSignature } from "./cinetpay"

// Must match vitest.config.ts -> test.env.CINETPAY_SECRET_KEY
const SECRET = "test_secret_key_deterministic"

function sign(payload: Record<string, string>): string {
  const dataStr = `${payload.cpm_site_id}${payload.cpm_trans_id}${payload.cpm_amount}${SECRET}`
  return createHash("sha256").update(dataStr).digest("hex")
}

const payload = {
  cpm_site_id: "123456",
  cpm_trans_id: "QG-TX-0001",
  cpm_amount: "10000",
}

describe("validateWebhookSignature", () => {
  it("accepts a signature computed with the correct secret and fields", () => {
    expect(validateWebhookSignature(payload, sign(payload))).toBe(true)
  })

  it("rejects a tampered amount (replay/altered payload)", () => {
    const tampered = { ...payload, cpm_amount: "1" }
    // Signature was made for the original 10 000, but the amount now says 1.
    expect(validateWebhookSignature(tampered, sign(payload))).toBe(false)
  })

  it("rejects a tampered transaction id", () => {
    const tampered = { ...payload, cpm_trans_id: "QG-TX-9999" }
    expect(validateWebhookSignature(tampered, sign(payload))).toBe(false)
  })

  it("rejects an empty signature", () => {
    expect(validateWebhookSignature(payload, "")).toBe(false)
  })

  it("rejects a signature forged with the wrong secret", () => {
    const forged = createHash("sha256")
      .update(`${payload.cpm_site_id}${payload.cpm_trans_id}${payload.cpm_amount}WRONG_SECRET`)
      .digest("hex")
    expect(validateWebhookSignature(payload, forged)).toBe(false)
  })
})
