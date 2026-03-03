import { useState } from "react";
import { Play, Headphones, BookOpen, Filter } from "lucide-react";

const mediaItems = [
  { type: "video", title: "Switch On Summit 2025 Highlights", duration: "8:42", category: "events", thumb: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80" },
  { type: "video", title: "GlowChallenge: 7 Days of Light", duration: "3:15", category: "challenges", thumb: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80" },
  { type: "podcast", title: "Faith in the Digital Age", duration: "42 min", category: "devotional", thumb: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=80" },
  { type: "video", title: "Testimonies: When Faith Goes Public", duration: "12:08", category: "testimonies", thumb: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80" },
  { type: "devotional", title: "Light Drops: Morning Devotional Series", duration: "5 min read", category: "devotional", thumb: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&q=80" },
  { type: "podcast", title: "GlowTalks: Gen Z & Faith", duration: "55 min", category: "podcast", thumb: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80" },
  { type: "video", title: "Nations Lighting Up: Africa Report", duration: "6:30", category: "events", thumb: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80" },
  { type: "devotional", title: "The Glow Drop: Weekly Verse", duration: "3 min read", category: "devotional", thumb: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80" },
];

const categories = ["all", "events", "challenges", "devotional", "testimonies", "podcast"];

const typeIcon = { video: Play, podcast: Headphones, devotional: BookOpen };
const typeColor = { video: "#00CFFF", podcast: "#8A5CFF", devotional: "#FFD000" };

export default function Media() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType] = useState("all");

  const filtered = mediaItems.filter(item => {
    const catMatch = activeCategory === "all" || item.category === activeCategory;
    const typeMatch = activeType === "all" || item.type === activeType;
    return catMatch && typeMatch;
  });

  return (
    <div style={{ background: "#0B0F1A" }}>
      {/* HERO */}
      <section style={{ padding: "100px 24px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", borderRadius: 50, padding: "8px 20px", marginBottom: 24 }}>
          <Play size={14} color="#00CFFF" />
          <span style={{ color: "#00CFFF", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Media Hub</span>
        </div>
        <h1 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 20 }}>
          Light Through <span className="glm-gradient-text">Every Screen</span>
        </h1>
        <p className="glm-body" style={{ fontSize: 17, maxWidth: 600, margin: "0 auto" }}>
          Videos, podcasts, devotionals and testimonies — all in one place to inspire, equip, and ignite.
        </p>
      </section>

      <div className="section-divider" />

      {/* FILTERS */}
      <section style={{ padding: "40px 24px", background: "#121826", position: "sticky", top: 72, zIndex: 100, backdropFilter: "blur(10px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {["all", "video", "podcast", "devotional"].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  style={{
                    padding: "8px 20px", borderRadius: 50, border: `1px solid ${activeType === t ? "#00CFFF" : "rgba(255,255,255,0.1)"}`,
                    background: activeType === t ? "rgba(0,207,255,0.15)" : "transparent",
                    color: activeType === t ? "#00CFFF" : "#C8D0E0",
                    cursor: "pointer", fontSize: 14, fontFamily: "Inter, sans-serif", fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  style={{
                    padding: "8px 20px", borderRadius: 50, border: `1px solid ${activeCategory === c ? "#8A5CFF" : "rgba(255,255,255,0.1)"}`,
                    background: activeCategory === c ? "rgba(138,92,255,0.15)" : "transparent",
                    color: activeCategory === c ? "#8A5CFF" : "#C8D0E0",
                    cursor: "pointer", fontSize: 14, fontFamily: "Inter, sans-serif", fontWeight: 500,
                    transition: "all 0.2s",
                  }}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section style={{ padding: "60px 24px 100px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {filtered.map((item, i) => {
              const Icon = typeIcon[item.type];
              const color = typeColor[item.type];
              return (
                <div key={i} className="glm-card" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}>
                  <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                    <img src={item.thumb} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                      onMouseOver={e => e.target.style.transform = "scale(1.05)"}
                      onMouseOut={e => e.target.style.transform = "scale(1)"}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(11,15,26,0.9) 100%)" }} />
                    <div style={{
                      position: "absolute", top: 16, right: 16,
                      background: `${color}20`, border: `1px solid ${color}60`,
                      borderRadius: 50, padding: "6px 12px",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <Icon size={12} color={color} />
                      <span style={{ color, fontSize: 11, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>{item.type.toUpperCase()}</span>
                    </div>
                    {item.type === "video" && (
                      <div style={{
                        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                        width: 56, height: 56, borderRadius: "50%",
                        background: "rgba(0,207,255,0.2)", border: "2px solid rgba(0,207,255,0.6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 20px rgba(0,207,255,0.4)",
                      }}>
                        <Play size={20} color="#00CFFF" fill="#00CFFF" />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 20 }}>
                    <h3 className="glm-headline" style={{ fontSize: 16, color: "#FFFFFF", marginBottom: 8, lineHeight: 1.3 }}>{item.title}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#C8D0E0", fontSize: 13, fontFamily: "Inter, sans-serif" }}>{item.duration}</span>
                      <span style={{ color: color, fontSize: 12, fontFamily: "Inter, sans-serif", background: `${color}15`, padding: "2px 8px", borderRadius: 50 }}>{item.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔦</div>
              <p className="glm-body" style={{ fontSize: 17 }}>No content matches this filter yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}