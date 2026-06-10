"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Navigation, Loader2 } from "lucide-react"
import type L from "leaflet"

interface Driver {
  id: string
  name: string
  lat: number
  lng: number
  status: "available" | "busy" | "offline"
  vehicle: string
}

interface LiveMapProps {
  center?: [number, number]
  zoom?: number
  drivers?: Driver[]
  showDrivers?: boolean
  pickupLocation?: [number, number]
  deliveryLocation?: [number, number]
  /** Live driver position — updates the marker in-place without re-rendering the map */
  driverPosition?: [number, number] | null
  onLocationSelect?: (lat: number, lng: number) => void
  className?: string
}

export function LiveMap({
  center = [3.848, 11.5021],
  zoom = 13,
  drivers = [],
  showDrivers = false,
  pickupLocation,
  deliveryLocation,
  driverPosition,
  onLocationSelect,
  className = "h-[400px]",
}: LiveMapProps) {
  const mapRef            = useRef<HTMLDivElement>(null)
  const mapInstanceRef    = useRef<L.Map | null>(null)
  const lRef              = useRef<typeof L | null>(null)
  const driverMarkerRef   = useRef<L.Marker | null>(null)
  const pickupMarkerRef   = useRef<L.Marker | null>(null)
  const deliveryMarkerRef = useRef<L.Marker | null>(null)
  const routeLineRef      = useRef<L.Polyline | null>(null)
  const fleetMarkersRef   = useRef<L.Marker[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // ── One-time map initialisation ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return
    let destroyed = false

    ;(async () => {
      try {
        const leaflet = (await import("leaflet")).default
        await import("leaflet/dist/leaflet.css")
        if (destroyed || !mapRef.current) return

        lRef.current = leaflet
        delete (leaflet.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        })

        const map = leaflet.map(mapRef.current).setView(center, zoom)
        leaflet.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        if (onLocationSelect) {
          map.on("click", (e: L.LeafletMouseEvent) => onLocationSelect(e.latlng.lat, e.latlng.lng))
        }

        mapInstanceRef.current = map
        setIsLoaded(true)
      } catch (err) {
        console.error("Map load error:", err)
        setError("Erreur de chargement de la carte")
      }
    })()

    return () => {
      destroyed = true
      mapInstanceRef.current?.remove()
      mapInstanceRef.current    = null
      driverMarkerRef.current   = null
      pickupMarkerRef.current   = null
      deliveryMarkerRef.current = null
      routeLineRef.current      = null
      fleetMarkersRef.current   = []
      lRef.current              = null
      setIsLoaded(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Live driver position — smooth in-place update ────────────────────────────
  useEffect(() => {
    const L   = lRef.current
    const map = mapInstanceRef.current
    if (!L || !map || !isLoaded) return

    if (driverPosition) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng(driverPosition)
      } else {
        const icon = L.divIcon({
          className: "driver-live-marker",
          html: `
            <div style="
              background:#3b82f6;width:40px;height:40px;border-radius:50%;
              border:3px solid white;box-shadow:0 0 20px rgba(59,130,246,.6);
              display:flex;align-items:center;justify-content:center;
            "><span style="font-size:20px">🛵</span></div>`,
          iconSize:   [40, 40],
          iconAnchor: [20, 20],
        })
        driverMarkerRef.current = L.marker(driverPosition, { icon })
          .addTo(map)
          .bindPopup("Livreur en route")
        map.flyTo(driverPosition, Math.max(map.getZoom(), 15), { duration: 1.5 })
      }
    } else if (driverMarkerRef.current) {
      map.removeLayer(driverMarkerRef.current)
      driverMarkerRef.current = null
    }
  }, [driverPosition, isLoaded])

  // ── Pickup / delivery markers + route ────────────────────────────────────────
  useEffect(() => {
    const L   = lRef.current
    const map = mapInstanceRef.current
    if (!L || !map || !isLoaded) return

    const pinIcon = (color: string, label: string) =>
      L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background:${color};width:32px;height:32px;
            border-radius:50% 50% 50% 0;transform:rotate(-45deg);
            border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);
            display:flex;align-items:center;justify-content:center;
          "><span style="transform:rotate(45deg);color:white;font-size:12px;font-weight:bold">${label}</span></div>`,
        iconSize:   [32, 32],
        iconAnchor: [16, 32],
      })

    if (pickupLocation) {
      if (pickupMarkerRef.current)  pickupMarkerRef.current.setLatLng(pickupLocation)
      else {
        pickupMarkerRef.current = L.marker(pickupLocation, { icon: pinIcon("#22c55e", "A") })
          .addTo(map).bindPopup("Point de départ")
      }
    } else if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current)
      pickupMarkerRef.current = null
    }

    if (deliveryLocation) {
      if (deliveryMarkerRef.current) deliveryMarkerRef.current.setLatLng(deliveryLocation)
      else {
        deliveryMarkerRef.current = L.marker(deliveryLocation, { icon: pinIcon("#ef4444", "B") })
          .addTo(map).bindPopup("Point d'arrivée")
      }
    } else if (deliveryMarkerRef.current) {
      map.removeLayer(deliveryMarkerRef.current)
      deliveryMarkerRef.current = null
    }

    if (pickupLocation && deliveryLocation) {
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs([pickupLocation, deliveryLocation])
      } else {
        routeLineRef.current = L.polyline([pickupLocation, deliveryLocation], {
          color: "#84cc16", weight: 4, opacity: 0.8, dashArray: "10 10",
        }).addTo(map)
        map.fitBounds(routeLineRef.current.getBounds(), { padding: [50, 50] })
      }
    } else if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current)
      routeLineRef.current = null
    }
  }, [pickupLocation, deliveryLocation, isLoaded])

  // ── Fleet driver markers ─────────────────────────────────────────────────────
  useEffect(() => {
    const L   = lRef.current
    const map = mapInstanceRef.current
    if (!L || !map || !isLoaded) return

    fleetMarkersRef.current.forEach(m => map.removeLayer(m))
    fleetMarkersRef.current = []

    if (showDrivers && drivers.length > 0) {
      drivers.forEach((driver) => {
        const color = driver.status === "available" ? "#22c55e" : driver.status === "busy" ? "#f59e0b" : "#6b7280"
        const emoji = driver.vehicle === "moto" ? "🏍️" : driver.vehicle === "car" ? "🚗" : "🚚"
        const icon  = L.divIcon({
          className: "driver-marker",
          html: `<div style="background:${color};width:40px;height:40px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;"><span style="font-size:18px">${emoji}</span></div>`,
          iconSize:   [40, 40],
          iconAnchor: [20, 20],
        })
        const marker = L.marker([driver.lat, driver.lng], { icon })
          .addTo(map)
          .bindPopup(`<div style="text-align:center"><strong>${driver.name}</strong><br/><span style="color:${color}">${driver.status === "available" ? "Disponible" : "Occupé"}</span></div>`)
        fleetMarkersRef.current.push(marker)
      })
    }
  }, [drivers, showDrivers, isLoaded])

  if (error) {
    return (
      <div className={`${className} bg-gray-800/50 rounded-xl flex items-center justify-center`}>
        <div className="text-center">
          <MapPin className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} relative rounded-xl overflow-hidden`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-lime-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Chargement de la carte…</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />

      {showDrivers && (
        <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 z-[1000]">
          <p className="text-white text-xs font-medium mb-2">Légende</p>
          <div className="space-y-1">
            {[
              { color: "bg-green-500",  label: "Disponible" },
              { color: "bg-yellow-500", label: "Occupé" },
              { color: "bg-gray-500",   label: "Hors ligne" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-gray-300 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (navigator.geolocation && mapInstanceRef.current) {
            navigator.geolocation.getCurrentPosition(
              (pos) => mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15),
              () => {},
            )
          }
        }}
        className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm p-2 rounded-lg hover:bg-gray-800 transition-colors z-[1000]"
      >
        <Navigation className="w-5 h-5 text-lime-500" />
      </button>
    </div>
  )
}
