import React from "react";
import { Globe2 } from "lucide-react";

export default function AboutVision({ t }) {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "clamp(80px, 10vw, 130px) clamp(20px, 6vw, 80px)", background: "#0B0F1A" }}>
      {/* Ambient blobs */}
      <div style={{ position: "absolute", top: "5%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(138,92,255,0.08), transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,208,0,0.06), transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
            <Globe2 size={13} color="#FFD000" />
            <span style={{ color: "#FFD000", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>{t("vision")}</span>
          </div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(30px, 4.5vw, 56px)", letterSpacing: "-0.03em", color: "#FFFFFF", marginBottom: 18, lineHeight: 1.05 }}>
            Where We're{" "}
            <span style={{ background: "linear-gradient(90deg, #FFD000 0%, #00CFFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Going
            </span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {/* Vision card 1 */}
          <div style={{
            position: "relative", borderRadius: 24, overflow: "hidden", minHeight: 380,
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
          }}>
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/8a30f4210_happy-friends-taking-selfiecopy.jpg" alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,207,255,0.1) 0%, rgba(11,15,26,0.4) 40%, rgba(11,15,26,0.95) 100%)" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #00CFFF, transparent)" }} />
            <div style={{ position: "relative", zIndex: 2, padding: "28px 26px" }}>
              <div style={{ display: "inline-block", background: "rgba(0,207,255,0.12)", borderRadius: 999, padding: "4px 12px", fontSize: 10, fontWeight: 800, color: "#00CFFF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>01 — Vision</div>
              <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 22, color: "#FFFFFF", marginBottom: 12 }}>Known For Light, Not Silence</h3>
              <p style={{ color: "#B0BAC8", fontSize: 14, fontFamily: "Inter, sans-serif", lineHeight: 1.7 }}>
                {t("visionText1")}
              </p>
            </div>
          </div>

          {/* Vision card 2 */}
          <div style={{
            position: "relative", borderRadius: 24, overflow: "hidden", minHeight: 380,
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
          }}>
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/3474ac78b_business-people-having-online-meeting.jpg" alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(138,92,255,0.1) 0%, rgba(11,15,26,0.4) 40%, rgba(11,15,26,0.95) 100%)" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #8A5CFF, transparent)" }} />
            <div style={{ position: "relative", zIndex: 2, padding: "28px 26px" }}>
              <div style={{ display: "inline-block", background: "rgba(138,92,255,0.12)", borderRadius: 999, padding: "4px 12px", fontSize: 10, fontWeight: 800, color: "#8A5CFF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>02 — Community</div>
              <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 22, color: "#FFFFFF", marginBottom: 12 }}>Faith Communities Thriving Online</h3>
              <p style={{ color: "#B0BAC8", fontSize: 14, fontFamily: "Inter, sans-serif", lineHeight: 1.7 }}>
                {t("visionText2")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}