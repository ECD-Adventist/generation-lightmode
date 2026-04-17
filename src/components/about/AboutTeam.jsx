import React from "react";

const team = [
  { name: "Communication Dept.", role: "Message Strategy & PR — Shapes the voice and narrative of the movement", color: "#00CFFF", emoji: "📡" },
  { name: "Media Dept.", role: "Creative Content & Branding — Videos, reels, campaigns, and storytelling tools", color: "#8A5CFF", emoji: "🎬" },
  { name: "IT Dept.", role: "Digital Infrastructure (Lead) — Dashboard, chatbot, website/app, and analytics", color: "#FFD000", emoji: "💻" },
  { name: "Youth Ministries", role: "Mobilization — GlowGroup expansion, ambassador training, and Pathfinder alignment", color: "#1DA1FF", emoji: "🔥" },
  { name: "Evangelism Dept.", role: "Integration with evangelistic campaigns, Bible studies, and digital reaping", color: "#FFA500", emoji: "📖" },
  { name: "Personal Ministries", role: "Connecting online witness to offline service and real-world impact", color: "#00E5A0", emoji: "🤝" },
  { name: "Education Dept.", role: "Campus & school-based LightMode clubs and student mobilization", color: "#FF6B8A", emoji: "🎓" },
  { name: "Publishing Ministries", role: "Extending the legacy of Literature Evangelism into the digital space", color: "#C7A8FF", emoji: "📚" },
];

export default function AboutTeam() {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "clamp(80px, 10vw, 120px) clamp(20px, 6vw, 80px)", background: "linear-gradient(180deg, #0B0F1A 0%, #0D1424 50%, #0B0F1A 100%)" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(138,92,255,0.06) 0%, transparent 50%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(138,92,255,0.08)", border: "1px solid rgba(138,92,255,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8A5CFF", boxShadow: "0 0 8px #8A5CFF" }} />
            <span style={{ color: "#8A5CFF", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>The Team</span>
          </div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.02em", color: "#FFFFFF", marginBottom: 14 }}>
            The Departments Behind{" "}
            <span style={{ background: "linear-gradient(90deg, #8A5CFF, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>The Movement</span>
          </h2>
          <p style={{ color: "#8A9BB0", fontSize: 16, fontFamily: "Inter, sans-serif", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
            Generation LightMode is driven by a collaborative effort across ECD departments — each bringing their unique gift to the digital mission.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {team.map((member) => (
            <div key={member.name} style={{
              background: "rgba(18,24,38,0.6)", backdropFilter: "blur(16px)",
              border: `1px solid ${member.color}18`, borderRadius: 18,
              padding: "24px 22px",
              position: "relative", overflow: "hidden",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 16px 40px ${member.color}15`; }}
              onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1.5, background: `linear-gradient(90deg, transparent, ${member.color}50, transparent)` }} />
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: "50%",
                  background: `${member.color}10`, border: `1px solid ${member.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, flexShrink: 0,
                }}>
                  {member.emoji}
                </div>
                <div>
                  <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 15, color: "#FFFFFF", marginBottom: 4 }}>{member.name}</h3>
                  <p style={{ color: "#8A9BB0", fontSize: 12, fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>{member.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quote */}
        <p style={{ textAlign: "center", marginTop: 40, color: "#5A6478", fontSize: 14, fontFamily: "Inter, sans-serif", fontStyle: "italic", maxWidth: 600, margin: "40px auto 0" }}>
          "For we are God's fellow workers." — 1 Corinthians 3:9 (NKJV)
        </p>
      </div>
    </section>
  );
}