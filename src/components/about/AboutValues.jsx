import React from "react";
import { Shield, Sparkles, Users, Smartphone } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Visibility",
    desc: "We do not dim our witness. We switch it on through testimony, courage, and visible faith.",
    color: "#00CFFF",
    img: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/17ae95dc7_4V5A9500.jpg",
  },
  {
    icon: Sparkles,
    title: "Authenticity",
    desc: "We keep faith honest, human, and real — no performance, no pretending, no hiding.",
    color: "#8A5CFF",
    img: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b006b5af7_4V5A9524.jpg",
  },
  {
    icon: Users,
    title: "Community",
    desc: "We grow through GlowGroups, shared prayer, accountability, and discipleship together.",
    color: "#FFD000",
    img: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/1d96a9c18_medium-shot-students-reading-together.jpg",
  },
  {
    icon: Smartphone,
    title: "Digital Mission",
    desc: "We use screens, stories, media, and culture to make the light of Christ impossible to ignore.",
    color: "#1DA1FF",
    img: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/a37f93fdb_close-up-smartphone-recording-vlog-african-influencer-home-studio-using-smartphone-speaking-livestreaming-blogger-discussing-podcast-wearing-headphones-professional-microphone.jpg",
  },
];

export default function AboutValues({ t }) {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "clamp(80px, 10vw, 130px) clamp(20px, 6vw, 80px)", background: "linear-gradient(180deg, #0D1220 0%, #0B0F1A 100%)" }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,207,255,0.06), transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,208,0,0.05), transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00CFFF", boxShadow: "0 0 8px #00CFFF" }} />
            <span style={{ color: "#00CFFF", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>What We Stand For</span>
          </div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(30px, 4.5vw, 56px)", letterSpacing: "-0.02em", marginBottom: 14 }}>
            <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{t("coreValues")}</span>
          </h2>
          <p style={{ color: "#8A9BB0", fontSize: 16, fontFamily: "Inter, sans-serif", maxWidth: 560, margin: "0 auto" }}>{t("coreValuesText")}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} style={{
                position: "relative", borderRadius: 22, overflow: "hidden", minHeight: 340,
                display: "flex", flexDirection: "column", justifyContent: "flex-end",
                transition: "transform 0.4s, box-shadow 0.4s",
              }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 24px 60px ${item.color}20`; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <img src={item.img} alt={item.title} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${item.color}10 0%, rgba(11,15,26,0.55) 40%, rgba(11,15,26,0.95) 100%)` }} />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${item.color}, transparent)` }} />

                <div style={{ position: "relative", zIndex: 2, padding: "26px 24px" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${item.color}15`, border: `1px solid ${item.color}35`,
                    marginBottom: 16, boxShadow: `0 0 20px ${item.color}20`,
                  }}>
                    <Icon size={22} color={item.color} />
                  </div>
                  <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 20, color: "#FFFFFF", marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ color: "#A0AABB", fontSize: 13, fontFamily: "Inter, sans-serif", lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}