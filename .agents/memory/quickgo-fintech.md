---
name: QuickGo Fintech System
description: Escrow payout system architecture — tables, rates, RPCs, CinetPay, API routes, dashboard locations
---

## Architecture
Escrow model: customer pays → vendor pending → delivery confirmed → vendor available → vendor requests payout → admin approves → CinetPay transfer API.

## Commission rates
- QuickGo commission: 7% on order subtotal (not delivery fee)
- CinetPay payment fee: 2% on gross
- Min payout: 5,000 FCFA · Max daily: 2,000,000 FCFA

## DB Tables (in supabase/financial_schema.sql)
- `vendor_wallets` — escrow ledger (pending_balance, available_balance, withdrawn_balance, frozen)
- `vendor_payout_accounts` — registered Orange Money / MTN MoMo accounts (max 5 per vendor)
- `vendor_payouts` — payout requests with status machine (pending→approved→processing→completed/failed/rejected)
- `commission_logs` — immutable per-order financial ledger (unique on order_id)
- `payment_transactions` — CinetPay incoming payments (idempotency_key prevents duplicates)
- `payout_audit_logs` — tamper-evident audit trail for all payout actions
- `financial_notifications` — in-app alerts for financial events

## Atomic RPC Functions (Supabase)
- `credit_vendor_pending(p_vendor_id, p_amount, p_order_id)` — credits pending balance after payment
- `release_vendor_funds(p_vendor_id, p_amount, p_order_id)` — moves pending→available on delivery
- `deduct_vendor_payout(p_vendor_id, p_amount, p_payout_id)` — moves available→withdrawn on approve
- `refund_payout_to_available(p_vendor_id, p_amount)` — restores funds on payout failure/rejection

**Why:** Row-level FOR UPDATE locks prevent race conditions on concurrent payouts.

## CinetPay Integration
- lib: `lib/payments/cinetpay.ts`
- Payment initiation: POST https://api-checkout.cinetpay.com/v2/payment
- Transfer (payout): POST https://client.cinetpay.com/v1/transfer/money/send/contact
- Required env vars: CINETPAY_SITE_ID, CINETPAY_API_KEY, CINETPAY_SECRET_KEY, NEXT_PUBLIC_APP_URL
- Supported: Orange Money Cameroun (OM), MTN MoMo (MTNMOMO)
- Webhook for payments: /api/payments/webhook
- Webhook for payouts: /api/payments/webhook/payout

## API Routes
- `POST /api/payments/initiate` — customer initiates CinetPay checkout
- `POST /api/payments/webhook` — CinetPay payment webhook (double-verify + credit vendor pending)
- `POST /api/payments/verify` — poll payment status
- `POST /api/payments/webhook/payout` — CinetPay payout webhook (complete/fail transfer)
- `POST /api/payouts/request` — vendor creates payout request (rate-limited: 3/hr)
- `POST /api/payouts/[id]/approve` — admin approves + calls CinetPay transfer
- `POST /api/payouts/[id]/reject` — admin rejects with reason
- `GET /api/payouts` — admin list all payouts (filter by status)
- `GET /api/vendor/wallet?vendor_id=X` — vendor wallet + payouts + commissions + accounts + analytics
- `POST /api/vendor/payout-accounts` — add payout account
- `DELETE /api/vendor/payout-accounts` — remove payout account
- `GET /api/admin/finances?period=30` — admin summary (revenue, commissions, pending payouts, wallets)
- `POST /api/admin/wallets/[vendorId]/freeze` — admin freeze/unfreeze wallet

## Pages
- `/admin/finances` — full admin dashboard (stats, revenue chart, payout approval modal, wallet freeze modal)
- `/vendor/finances` — vendor wallet dashboard (live balances via realtime, payout request modal)
- `/vendor/payouts` — vendor payout history with filters
- `/vendor/payout-accounts` — manage Orange Money / MTN MoMo accounts (max 5)

## Security
- lib: `lib/payments/security.ts`
- Rate limiting: in-memory (3 payout requests/hr per vendor, 10 payment initiations/min per IP)
- Fraud scoring: 0-100 score (blocks if ≥80), checks: large withdrawal ratio, multiple payouts/hr, new vendor, no delivered orders
- All admin actions verified via verifyAdmin() (checks role=admin in profiles)
- Vendor ownership verified via verifyVendorOwnership() (checks owner_id match)

## Realtime hooks (client-side)
- lib: `lib/payments/realtime.ts`
- `useVendorWallet(vendorId)` — live wallet balances via Supabase realtime
- `useFinancialNotifications(userId)` — live financial notifications
- `usePayoutStatus(payoutId)` — live payout status updates

## Key patterns
- vendors API: `GET /api/vendors?my=true` returns authenticated user's own vendor(s)
- Vendor pages fetch vendorId via GET /api/vendors?my=true then use it for wallet/payout APIs
- Idempotency: payment_transactions.idempotency_key = sha256(order_id:user_id); payout idempotency_key = sha256(vendor_id:amount:phone)
- Auto-create wallet: trigger on vendors INSERT calls create_vendor_wallet()
- Only one default payout account per vendor: trigger enforce_single_default_payout()
