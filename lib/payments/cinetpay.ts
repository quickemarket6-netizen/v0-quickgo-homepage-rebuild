/**
 * CinetPay API Client — Production Grade
 * Supports payment initiation, status check, and mobile money payouts
 * Covers: Orange Money Cameroun, MTN Mobile Money Cameroun
 */

import { createHash } from "node:crypto"

const CINETPAY_API_URL = "https://api-checkout.cinetpay.com/v2"
const CINETPAY_TRANSFER_URL = "https://client.cinetpay.com/v1"

const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID!
const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY!
const CINETPAY_SECRET = process.env.CINETPAY_SECRET_KEY!

export type PayoutMethod = "orange_money" | "mtn_momo"

export interface InitiatePaymentParams {
  transaction_id: string
  amount: number
  currency?: string
  description: string
  customer_name: string
  customer_email: string
  customer_phone_number: string
  return_url: string
  notify_url: string
  channels?: string
  metadata?: string
}

export interface InitiatePaymentResult {
  success: boolean
  payment_url?: string
  payment_token?: string
  code?: string
  message?: string
}

export interface PaymentStatusResult {
  success: boolean
  status?: "ACCEPTED" | "REFUSED" | "PENDING"
  amount?: number
  currency?: string
  payment_method?: string
  raw?: Record<string, unknown>
  message?: string
}

export interface TransferParams {
  vendor_payout_id: string
  amount: number
  phone_number: string
  payout_method: PayoutMethod
  vendor_name: string
  description?: string
}

export interface TransferResult {
  success: boolean
  transaction_id?: string
  provider_reference?: string
  status?: string
  message?: string
  raw?: Record<string, unknown>
}

/**
 * Initiate a customer payment via CinetPay checkout
 */
export async function initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
  try {
    const payload = {
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: params.transaction_id,
      amount: params.amount,
      currency: params.currency ?? "XAF",
      description: params.description,
      return_url: params.return_url,
      notify_url: params.notify_url,
      channels: params.channels ?? "ALL",
      customer_name: params.customer_name,
      customer_email: params.customer_email,
      customer_phone_number: params.customer_phone_number,
      customer_address: "Cameroun",
      customer_city: "Yaoundé",
      customer_country: "CM",
      customer_state: "CM",
      customer_zip_code: "00000",
      metadata: params.metadata ?? "",
      lang: "FR",
    }

    const res = await fetch(`${CINETPAY_API_URL}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    })

    const data = await res.json()

    if (data.code === "201") {
      return {
        success: true,
        payment_url: data.data?.payment_url,
        payment_token: data.data?.payment_token,
        code: data.code,
      }
    }

    return { success: false, code: data.code, message: data.message ?? "CinetPay error" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error"
    return { success: false, message }
  }
}

/**
 * Verify payment status via CinetPay
 */
export async function verifyPayment(transaction_id: string): Promise<PaymentStatusResult> {
  try {
    const payload = {
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id,
    }

    const res = await fetch(`${CINETPAY_API_URL}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    })

    const data = await res.json()

    if (data.code === "00") {
      const status = data.data?.status === "ACCEPTED" ? "ACCEPTED"
        : data.data?.status === "REFUSED" ? "REFUSED"
        : "PENDING"
      return {
        success: true,
        status,
        amount: data.data?.amount,
        currency: data.data?.currency,
        payment_method: data.data?.payment_method,
        raw: data.data,
      }
    }

    return { success: false, message: data.message }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error"
    return { success: false, message }
  }
}

/**
 * Validate CinetPay webhook signature
 */
export function validateWebhookSignature(payload: Record<string, string>, receivedSig: string): boolean {
  // CinetPay uses cpm_site_id + cpm_trans_id + cpm_amount concatenated + secret
  const dataStr = `${payload.cpm_site_id}${payload.cpm_trans_id}${payload.cpm_amount}${CINETPAY_SECRET}`
  const expected = createHash("sha256").update(dataStr).digest("hex")
  return expected === receivedSig
}

/**
 * Initiate a mobile money transfer (payout) to vendor via CinetPay Transfer API
 * Supports Orange Money and MTN MoMo in Cameroon
 */
export async function initiateTransfer(params: TransferParams): Promise<TransferResult> {
  try {
    // Step 1: Authenticate with CinetPay Transfer API
    const authRes = await fetch(`${CINETPAY_TRANSFER_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: CINETPAY_API_KEY,
        password: CINETPAY_SECRET,
      }),
      signal: AbortSignal.timeout(10000),
    })

    const authData = await authRes.json()
    if (!authData.data?.token) {
      return { success: false, message: "CinetPay auth failed: " + (authData.message ?? "unknown") }
    }

    const token = authData.data.token

    // Step 2: Add contact (idempotent)
    await fetch(`${CINETPAY_TRANSFER_URL}/contact/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: [{
          prefix: "237",
          phone: params.phone_number.replace(/\D/g, "").replace(/^237/, ""),
          name: params.vendor_name,
          email: "",
          type_phone: params.payout_method === "orange_money" ? "OM" : "MTNMOMO",
        }],
      }),
      signal: AbortSignal.timeout(10000),
    })

    // Step 3: Initiate transfer
    const transferRes = await fetch(`${CINETPAY_TRANSFER_URL}/transfer/money/send/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: [{
          prefix: "237",
          phone: params.phone_number.replace(/\D/g, "").replace(/^237/, ""),
          amount: params.amount,
          client_transaction_id: params.vendor_payout_id,
          notify_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/payments/webhook/payout`,
        }],
      }),
      signal: AbortSignal.timeout(15000),
    })

    const transferData = await transferRes.json()

    if (transferData.code === "0") {
      const item = transferData.data?.[0]
      return {
        success: true,
        transaction_id: item?.client_transaction_id,
        provider_reference: item?.transaction_id,
        status: item?.status ?? "processing",
        raw: transferData,
      }
    }

    return {
      success: false,
      message: transferData.message ?? "Transfer initiation failed",
      raw: transferData,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error"
    return { success: false, message }
  }
}

/**
 * Check status of an outgoing transfer
 */
export async function checkTransferStatus(client_transaction_id: string): Promise<{
  success: boolean
  status?: "SUCCESS" | "PENDING" | "FAILED"
  message?: string
}> {
  try {
    const authRes = await fetch(`${CINETPAY_TRANSFER_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey: CINETPAY_API_KEY, password: CINETPAY_SECRET }),
      signal: AbortSignal.timeout(10000),
    })
    const authData = await authRes.json()
    if (!authData.data?.token) return { success: false, message: "Auth failed" }

    const res = await fetch(`${CINETPAY_TRANSFER_URL}/transfer/money/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.data.token}`,
      },
      body: JSON.stringify({ client_transaction_id }),
      signal: AbortSignal.timeout(10000),
    })

    const data = await res.json()
    const item = data.data?.[0]
    if (!item) return { success: false, message: "Transfer not found" }

    const status = item.status === "SUCCESS" ? "SUCCESS"
      : item.status === "FAILED" ? "FAILED"
      : "PENDING"

    return { success: true, status }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error"
    return { success: false, message }
  }
}
