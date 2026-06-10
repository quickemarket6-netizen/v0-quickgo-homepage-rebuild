"use client"

/**
 * QuickGo Real-time Order Tracking
 *
 * Architecture:
 * - Customer side: subscribes to Broadcast channel for live GPS + postgres_changes for status
 * - Driver side:   watchPosition → Broadcast every 3s + DB flush every 30s
 *
 * Broadcast channel name: tracking:{orderId}   (ephemeral, no DB write per GPS update)
 * postgres_changes:        orders + tracking_events tables (persisted)
 */

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

export interface TrackingEvent {
  id: string
  order_id: string
  driver_id: string | null
  event_type: string
  status: string | null
  lat: number | null
  lng: number | null
  note: string | null
  created_at: string
}

export interface OrderTrackingState {
  status: string | null
  driverPosition: [number, number] | null
  events: TrackingEvent[]
  loading: boolean
  connected: boolean
}

// ── Customer hook ─────────────────────────────────────────────────────────────

export function useOrderTracking(orderId: string | null): OrderTrackingState {
  const [state, setState] = useState<OrderTrackingState>({
    status: null,
    driverPosition: null,
    events: [],
    loading: true,
    connected: false,
  })

  useEffect(() => {
    if (!orderId) return

    const supabase = createClient()

    const init = async () => {
      const [orderRes, eventsRes] = await Promise.all([
        supabase.from("orders").select("status, driver:drivers(current_latitude, current_longitude)").eq("id", orderId).single(),
        supabase
          .from("tracking_events")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false })
          .limit(20),
      ])

      const d = orderRes.data as { status: string; driver: { current_latitude: number | null; current_longitude: number | null } | null } | null
      const initialPos: [number, number] | null =
        d?.driver?.current_latitude && d?.driver?.current_longitude
          ? [d.driver.current_latitude, d.driver.current_longitude]
          : null

      setState(s => ({
        ...s,
        status: d?.status ?? null,
        driverPosition: initialPos,
        events: (eventsRes.data as TrackingEvent[]) ?? [],
        loading: false,
      }))
    }

    init()

    // High-frequency GPS broadcast (no DB write per update)
    const broadcastCh = supabase
      .channel(`tracking:${orderId}`)
      .on("broadcast", { event: "location" }, ({ payload }: { payload: { lat: number; lng: number } }) => {
        setState(s => ({ ...s, driverPosition: [payload.lat, payload.lng] }))
      })
      .subscribe((status: string) => {
        setState(s => ({ ...s, connected: status === "SUBSCRIBED" }))
      })

    // Order status updates (low-frequency, persisted)
    const orderCh = supabase
      .channel(`order_status:${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new as { status: string }
          setState(s => ({ ...s, status: row.status }))
        },
      )
      .subscribe()

    // Tracking timeline events
    const eventsCh = supabase
      .channel(`tracking_events:${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tracking_events", filter: `order_id=eq.${orderId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          setState(s => ({ ...s, events: [payload.new as unknown as TrackingEvent, ...s.events] }))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(broadcastCh)
      supabase.removeChannel(orderCh)
      supabase.removeChannel(eventsCh)
    }
  }, [orderId])

  return state
}

// ── Driver broadcast hook ─────────────────────────────────────────────────────

export function useDriverBroadcast(orderId: string | null, driverId: string | null) {
  const channelRef       = useRef<RealtimeChannel | null>(null)
  const watchIdRef       = useRef<number | null>(null)
  const lastBroadcastRef = useRef<number>(0)
  const lastFlushRef     = useRef<number>(0)
  const [isTracking, setIsTracking] = useState(false)
  const [position, setPosition]     = useState<[number, number] | null>(null)
  const [gpsError, setGpsError]     = useState<string | null>(null)

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (channelRef.current) {
      const supabase = createClient()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    setIsTracking(false)
  }, [])

  const start = useCallback(() => {
    if (!orderId || !driverId) return
    if (!navigator?.geolocation) {
      setGpsError("GPS non disponible sur cet appareil")
      return
    }

    const supabase = createClient()
    const channel = supabase.channel(`tracking:${orderId}`)
    channelRef.current = channel
    channel.subscribe()

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const now = Date.now()
        setPosition([lat, lng])
        setGpsError(null)

        // Broadcast every ≥3s
        if (now - lastBroadcastRef.current >= 3000) {
          channel.send({ type: "broadcast", event: "location", payload: { lat, lng } })
          lastBroadcastRef.current = now
        }

        // Flush to DB every ≥30s
        if (now - lastFlushRef.current >= 30_000) {
          lastFlushRef.current = now
          await supabase
            .from("drivers")
            .update({
              current_latitude:     lat,
              current_longitude:    lng,
              last_location_update: new Date().toISOString(),
            })
            .eq("id", driverId)
        }
      },
      (err) => {
        setGpsError(`GPS: ${err.message}`)
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10_000 },
    )

    setIsTracking(true)
  }, [orderId, driverId])

  useEffect(() => () => stop(), [stop])

  return { isTracking, position, gpsError, start, stop }
}
