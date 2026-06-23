"use client"

import { track } from "@vercel/analytics"

// ── QuickGo business events ───────────────────────────────────────────────────
// Call these from client components. They no-op in development.

export const analytics = {
  // Auth
  signup(role: "client" | "vendor" | "driver") {
    track("signup", { role })
  },
  login(method: "email" | "google") {
    track("login", { method })
  },

  // Marketplace
  search(query: string, resultCount: number) {
    track("search", { query: query.slice(0, 100), resultCount })
  },
  categoryClick(category: string) {
    track("category_click", { category })
  },
  productView(productId: string, category: string) {
    track("product_view", { productId, category })
  },
  addToCart(productId: string, price: number) {
    track("add_to_cart", { productId, price })
  },
  checkout(itemCount: number, totalCFA: number) {
    track("checkout_start", { itemCount, totalCFA })
  },
  orderComplete(orderId: string, totalCFA: number, paymentMethod: string) {
    track("order_complete", { orderId, totalCFA, paymentMethod })
  },

  // Delivery
  deliveryCreate(serviceType: string, city: string) {
    track("delivery_create", { serviceType, city })
  },
  deliveryTrack(trackingNumber: string) {
    track("delivery_track", { trackingNumber: trackingNumber.slice(0, 20) })
  },

  // Wallet
  walletTopup(amountCFA: number, method: string) {
    track("wallet_topup", { amountCFA, method })
  },
  walletPayout(amountCFA: number, method: string) {
    track("wallet_payout", { amountCFA, method })
  },

  // Vendor
  vendorOnboard() {
    track("vendor_onboard")
  },
  vendorProductAdd(category: string) {
    track("vendor_product_add", { category })
  },

  // Engagement
  citySelect(city: string) {
    track("city_select", { city })
  },
  appInstallPrompt(accepted: boolean) {
    track("pwa_install_prompt", { accepted })
  },
}
