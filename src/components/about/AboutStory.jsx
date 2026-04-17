import React from "react";
import { BookOpen, Zap, Users, Globe, ArrowRight } from "lucide-react";

const chapters = [
  {
    num: "01",
    title: "The New Mission Field",
    text: "For past generations, the mission field was measured by miles — ships sailing across oceans, bicycles riding into villages, literature evangelists walking from door to door. Today, the mission field is measured in clicks, screens, and connections. Billions live online, searching for meaning, scrolling for connection. If the church does not show up here, silence will fill the space — and darkness will dominate it.",
    accent: "#FFD000",
    icon: Globe,
  },
  {
    num: "02",
    title: "From Dark Mode to Light Mode",
    text: "Every phone has two settings: dark mode and light mode. For too long, many young Christians kept their faith in 'dark mode' — silent, private, invisible. But Jesus never called us to hide. He called us to shine. Generation LightMode is the decision to switch faith on — to move from silence to testimony, from hidden to visible, from dimming to glowing.",
    accent: "#00CFFF",
    icon: Zap,
  },
  {
    num: "03",
    title: "The Digital Great Commission",
    text: "When Jesus said 'Go into all the world,' He was also speaking to our generation. Today, the world is online — from TikTok to Telegram, Instagram to WhatsApp. In our time, the Commission sounds like this: 'Go ye into all the networks, and preach the gospel to every person online.' This is not a replacement of the mission; it is its expansion.",
    accent: "#8A5CFF",
    icon: BookOpen,
  },
  {
    num: "04",
    title: "Standing on the Shoulders of Giants",
    text: "This movement stands on the shoulders of giants — the pathfinders who marched, the literature evangelists who walked, and the missionaries who sailed oceans. Instead of printed tracts, we share Glow Drops. Instead of door-to-door visits, we enter hearts through status updates and reels. The mission remains the same: to make truth visible and irresistible.",
    accent: "#FFA500",
    icon: Users,
  },
];

export default function AboutStory() {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "clamp(80px, 10vw, 130px) clamp(20px, 6vw, 80px)", background: "radial-gradient(ellipse at 20% 30%, #1A1208 0%, #0B0F1A 55%, #080C14 100%)" }}>
      {/* Warm ambient blobs */}
      <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,165,0,0.1), transparent 65%)", pointerEvents: "none", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", bottom: "-15%", right: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,207,255,0.06), transparent 65%)", pointerEvents: "none", filter: "blur(50px)" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.28)", borderRadius: 999, padding: "7px 18px", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFD000", boxShadow: "0 0 10px #FFD000" }} />
            <span style={{ color: "#FFD000", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>The Evolution of LightMode</span>
          </div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(30px, 4.5vw, 56px)", letterSpacing: "-0.03em", color: "#FFFFFF", marginBottom: 18, lineHeight: 1.05 }}>
            How The{" "}
            <span style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Movement Was Born
            </span>
          </h2>
          <p style={{ color: "#8A9BB0", fontSize: 16, fontFamily: "Inter, sans-serif", maxWidth: 640, margin: "0 auto", lineHeight: 1.7 }}>
            Generation LightMode is a strategic response to the digital age — mobilizing a generation of youth to become bold, creative, and authentic missionaries, online and offline. Here's the story behind the vision.
          </p>
        </div>

        {/* Chapter cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 22 }}>
          {chapters.map((ch) => {
            const Icon = ch.icon;
            return (
              <div key={ch.num} style={{
                background: "rgba(18,24,38,0.7)", backdropFilter: "blur(20px)",
                border: `1px solid ${ch.accent}20`, borderRadius: 22, padding: "30px 26px",
                position: "relative", overflow: "hidden",
                transition: "transform 0.4s, box-shadow 0.4s",
              }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 24px 60px ${ch.accent}18`; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top, ${ch.accent}08, transparent 50%)`, pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 2, background: `linear-gradient(90deg, transparent, ${ch.accent}50, transparent)` }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ch.accent}12`, border: `1px solid ${ch.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${ch.accent}15` }}>
                      <Icon size={20} color={ch.accent} />
                    </div>
                    <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 900, fontSize: 13, color: ch.accent, letterSpacing: "0.1em" }}>{ch.num}</span>
                  </div>
                  <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 19, color: "#FFFFFF", marginBottom: 12, lineHeight: 1.25 }}>{ch.title}</h3>
                  <p style={{ color: "#A0AABB", fontSize: 13, fontFamily: "Inter, sans-serif", lineHeight: 1.75 }}>{ch.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Key quote */}
        <div style={{ marginTop: 48, textAlign: "center", maxWidth: 700, margin: "48px auto 0" }}>
          <div style={{ background: "rgba(255,208,0,0.06)", border: "1px solid rgba(255,208,0,0.15)", borderRadius: 20, padding: "28px 32px", backdropFilter: "blur(10px)" }}>
            <p style={{ color: "#FFD000", fontSize: 16, fontFamily: "Inter, sans-serif", fontStyle: "italic", lineHeight: 1.7, marginBottom: 12 }}>
              "In a world scrolling through darkness, we are called to switch on the Light of Christ. Generation LightMode is a strategic response to the digital age — mobilizing a generation of youth to become bold, creative, and authentic missionaries."
            </p>
            <p style={{ color: "#8A9BB0", fontSize: 13, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700 }}>— ECD President</p>
          </div>
        </div>
      </div>
    </section>
  );
}