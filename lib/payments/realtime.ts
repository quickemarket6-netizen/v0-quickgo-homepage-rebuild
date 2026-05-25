/**
 * QuickGo Realtime Financial Subscriptions
 * Client-side hooks for live wallet + payout updates
 */

"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface VendorWalletState {
  pendingBalance: number
  availableBalance: number
  withdrawnBalance: number
  totalEarned: number
  totalSales: number
  frozen: boolean
  loading: boolean
}

export interface FinancialNotification {
  id: string
  type: string
  title: string
  message: string
  amount?: number
  read: boolean
  created_at: string
}

/**
 * Hook: Real-time vendor wallet balance
 */
export function useVendorWallet(vendorId: string | null): VendorWalletState {
  const [state, setState] = useState<VendorWalletState>({
    pendingBalance: 0,
    availableBalance: 0,
    withdrawnBalance: 0,
    totalEarned: 0,
    totalSales: 0,
    frozen: false,
    loading: true,
  })

  const fetchWallet = useCallback(async () => {
    if (!vendorId) return
    const supabase = createClient()
    const { data } = await supabase
      .from("vendor_wallets")
      .select("*")
      .eq("vendor_id", vendorId)
      .single()

    if (data) {
      setState({
        pendingBalance: data.pending_balance ?? 0,
        availableBalance: data.available_balance ?? 0,
        withdrawnBalance: data.withdrawn_balance ?? 0,
        totalEarned: data.total_earned ?? 0,
        totalSales: data.total_sales ?? 0,
        frozen: data.frozen ?? false,
        loading: false,
      })
    } else {
      setState((s) => ({ ...s, loading: false }))
    }
  }, [vendorId])

  useEffect(() => {
    if (!vendorId) return
    fetchWallet()

    const supabase = createClient()
    const channel = supabase
      .channel(`wallet:${vendorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendor_wallets", filter: `vendor_id=eq.${vendorId}` },
        (payload) => {
          const d = payload.new as Record<string, unknown>
          setState({
            pendingBalance: Number(d.pending_balance ?? 0),
            availableBalance: Number(d.available_balance ?? 0),
            withdrawnBalance: Number(d.withdrawn_balance ?? 0),
            totalEarned: Number(d.total_earned ?? 0),
            totalSales: Number(d.total_sales ?? 0),
            frozen: Boolean(d.frozen),
            loading: false,
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [vendorId, fetchWallet])

  return state
}

/**
 * Hook: Real-time financial notifications for a user
 */
export function useFinancialNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<FinancialNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()
    const { data } = await supabase
      .from("financial_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.read).length)
    }
    setLoading(false)
  }, [userId])

  const markRead = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase.from("financial_notifications").update({ read: true }).eq("id", id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()
    await supabase.from("financial_notifications").update({ read: true }).eq("user_id", userId)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    fetchNotifications()

    const supabase = createClient()
    const channel = supabase
      .channel(`fin_notif:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "financial_notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as FinancialNotification
          setNotifications((prev) => [n, ...prev])
          setUnreadCount((c) => c + 1)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchNotifications])

  return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications }
}

/**
 * Hook: Real-time payout status for a specific payout
 */
export function usePayoutStatus(payoutId: string | null) {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!payoutId) return

    const supabase = createClient()

    supabase
      .from("vendor_payouts")
      .select("status")
      .eq("id", payoutId)
      .single()
      .then(({ data }) => {
        setStatus(data?.status ?? null)
        setLoading(false)
      })

    const channel = supabase
      .channel(`payout:${payoutId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "vendor_payouts", filter: `id=eq.${payoutId}` },
        (payload) => {
          const d = payload.new as { status: string }
          setStatus(d.status)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [payoutId])

  return { status, loading }
}
