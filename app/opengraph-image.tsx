import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "QuickGo — Super App Cameroun · Livraison, Marketplace & Paiements"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Brand colors (from globals.css oklch values, converted to hex)
const LIME = "#C8FF00"
const BLUE = "#1A6BFF"
const CYAN = "#00C8FF"
const BG = "#050A14"
const BG2 = "#0A1428"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${BG} 0%, ${BG2} 60%, #071020 100%)`,
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow — blue left */}
        <div style={{
          position: "absolute", top: -80, left: -120,
          width: 700, height: 700, borderRadius: "50%",
          background: `radial-gradient(circle, ${BLUE}22 0%, transparent 70%)`,
          display: "flex",
        }} />
        {/* Background glow — lime right */}
        <div style={{
          position: "absolute", bottom: -100, right: -80,
          width: 600, height: 600, borderRadius: "50%",
          background: `radial-gradient(circle, ${LIME}15 0%, transparent 70%)`,
          display: "flex",
        }} />
        {/* Scan lines texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 6px)",
          display: "flex",
        }} />

        {/* Top accent bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: `linear-gradient(90deg, ${BLUE}, ${CYAN}, ${LIME})`,
          display: "flex",
        }} />

        {/* Main content */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "0 80px",
          flex: 1,
          gap: 0,
        }}>
          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
            {/* Q mark */}
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: LIME,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 40px ${LIME}55`,
            }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: "#000", lineHeight: 1 }}>Q</span>
            </div>
            <span style={{
              fontSize: 60, fontWeight: 800, color: "#fff",
              letterSpacing: -2, lineHeight: 1,
            }}>
              Quick<span style={{ color: LIME }}>Go</span>
            </span>
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: 34, fontWeight: 700, color: "#fff",
            lineHeight: 1.25, marginBottom: 16, maxWidth: 780,
            display: "flex",
          }}>
            Tout ce dont vous avez besoin.{" "}
            <span style={{ color: LIME }}> Livré intelligemment.</span>
          </div>

          {/* Sub-tagline */}
          <div style={{
            fontSize: 22, color: "rgba(255,255,255,0.55)", marginBottom: 52,
            display: "flex",
          }}>
            Marketplace locale · Livraison express · Paiements mobiles · Cameroun
          </div>

          {/* Stats row */}
          <div style={{
            display: "flex", gap: 0,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, overflow: "hidden",
          }}>
            {[
              ["10 000+", "Clients satisfaits", LIME],
              ["5 000+", "Boutiques partenaires", CYAN],
              ["30 min", "Livraison moyenne", BLUE],
              ["100%", "Paiement sécurisé", "#FF6B35"],
            ].map(([val, label, color], i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "20px 40px",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}>
                <span style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{val}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6, display: "flex" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom right: URL */}
        <div style={{
          position: "absolute", bottom: 28, right: 80,
          fontSize: 18, color: "rgba(255,255,255,0.3)",
          display: "flex",
        }}>
          quickgo.cm
        </div>
      </div>
    ),
    { ...size }
  )
}
