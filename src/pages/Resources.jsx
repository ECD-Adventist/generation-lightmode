import { useState } from "react";
import { Play, Headphones, BookOpen, Download, FileText, Image, Film, ChevronDown } from "lucide-react";

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

const downloads = [
  {
    category: "Strategy Documents",
    icon: FileText,
    color: "#00CFFF",
    items: [
      {
        title: "Generation LightMode — Digital Discipleship Strategy",
        desc: "The East-Central Africa Division's full strategy document (First Edition, 2025)",
        size: "PDF · 64 pages",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/27ca4494b_GENERATIONLIGHTMODE-NEW-2.pdf",
      },
      {
        title: "Vision & System Architecture",
        desc: "Complete structured website + web app + database architecture for Generation LightMode",
        size: "DOCX · Planning Doc",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/3dbf63ad1_VISION-SYSTEMARCHITECTURE.docx",
      },
    ],
  },
  {
    category: "Branding & Graphics",
    icon: Image,
    color: "#8A5CFF",
    items: [
      {
        title: "Generation LightMode Logo (White Version)",
        desc: "Official logo for use on dark backgrounds — PNG format",
        size: "PNG · High Resolution",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/e51a96559_GENERATIONLIGHTMODE-LOGO.png",
      },
      {
        title: "Generation LightMode Logo (Primary)",
        desc: "Full color logo with emblem — PNG format",
        size: "PNG · High Resolution",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_692b64307296ee339e64b660/c20e0f05a_GENERATIONLIGHTMODE-LOGO.png",
      },
      {
        title: "GLM Brand Kit — Version 1",
        desc: "Social media graphics and brand elements pack",
        size: "PNG · Brand Pack",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/09b9053aa_GenerationLightMode.png",
      },
      {
        title: "GLM Brand Kit — Version 2",
        desc: "Extended brand graphics for campaigns and events",
        size: "PNG · Brand Pack",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/4d7820e8f_GenerationLightMode2.png",
      },
      {
        title: "GLM Brand Kit — Version 3",
        desc: "Additional visuals for print and digital use",
        size: "PNG · Brand Pack",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/b53e576f7_GenerationLightMode3.png",
      },
      {
        title: "GLM Brand Kit — Version 4",
        desc: "Supplementary brand graphics and templates",
        size: "PNG · Brand Pack",
        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/cbd01116b_GenerationLightMode4.png",
      },
    ],
  },
];

const typeIcon = { video: Play, podcast: Headphones, devotional: BookOpen };
const typeColor = { video: "#00CFFF", podcast: "#8A5CFF", devotional: "#FFD000" };
const categories = ["all", "events", "challenges", "devotional", "testimonies", "podcast"];

export default function Resources() {
  const [activeTab, setActiveTab] = useState("media");
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
          <Film size={14} color="#00CFFF" />
          <span style={{ color: "#00CFFF", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Resources Hub</span>
        </div>
        <h1 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 20 }}>
          Light Through <span className="glm-gradient-text">Every Screen</span>
        </h1>
        <p className="glm-body" style={{ fontSize: 17, maxWidth: 600, margin: "0 auto 40px" }}>
          Videos, podcasts, devotionals, downloadable documents and branding resources — all in one place.
        </p>

        {/* Tab Switcher */}
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 50, padding: 4, gap: 4 }}>
          {[{ id: "media", label: "🎬 Media" }, { id: "downloads", label: "📥 Downloads" }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "10px 28px", borderRadius: 50, border: "none",
              background: activeTab === tab.id ? "rgba(0,207,255,0.2)" : "transparent",
              color: activeTab === tab.id ? "#00CFFF" : "#C8D0E0",
              cursor: "pointer", fontSize: 15, fontFamily: "Inter, sans-serif", fontWeight: 600,
              transition: "all 0.2s",
              boxShadow: activeTab === tab.id ? "0 0 16px rgba(0,207,255,0.3)" : "none",
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* MEDIA TAB */}
      {activeTab === "media" && (
        <>
          <section style={{ padding: "32px 24px", background: "#121826", position: "sticky", top: 72, zIndex: 100 }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {["all", "video", "podcast", "devotional"].map(t => (
                    <button key={t} onClick={() => setActiveType(t)} style={{
                      padding: "8px 18px", borderRadius: 50,
                      border: `1px solid ${activeType === t ? "#00CFFF" : "rgba(255,255,255,0.1)"}`,
                      background: activeType === t ? "rgba(0,207,255,0.15)" : "transparent",
                      color: activeType === t ? "#00CFFF" : "#C8D0E0",
                      cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif",
                    }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {categories.map(c => (
                    <button key={c} onClick={() => setActiveCategory(c)} style={{
                      padding: "8px 18px", borderRadius: 50,
                      border: `1px solid ${activeCategory === c ? "#8A5CFF" : "rgba(255,255,255,0.1)"}`,
                      background: activeCategory === c ? "rgba(138,92,255,0.15)" : "transparent",
                      color: activeCategory === c ? "#8A5CFF" : "#C8D0E0",
                      cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif",
                    }}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section style={{ padding: "60px 24px 100px" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                {filtered.map((item, i) => {
                  const Icon = typeIcon[item.type];
                  const color = typeColor[item.type];
                  return (
                    <div key={i} className="glm-card" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}>
                      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                        <img src={item.thumb} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                          onMouseOver={e => e.target.style.transform = "scale(1.05)"}
                          onMouseOut={e => e.target.style.transform = "scale(1)"}
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(11,15,26,0.9) 100%)" }} />
                        <div style={{ position: "absolute", top: 12, right: 12, background: `${color}20`, border: `1px solid ${color}60`, borderRadius: 50, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                          <Icon size={10} color={color} />
                          <span style={{ color, fontSize: 10, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>{item.type.toUpperCase()}</span>
                        </div>
                        {item.type === "video" && (
                          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 48, height: 48, borderRadius: "50%", background: "rgba(0,207,255,0.2)", border: "2px solid rgba(0,207,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Play size={16} color="#00CFFF" fill="#00CFFF" />
                          </div>
                        )}
                      </div>
                      <div style={{ padding: 16 }}>
                        <h3 className="glm-headline" style={{ fontSize: 15, color: "#FFFFFF", marginBottom: 6, lineHeight: 1.3 }}>{item.title}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#C8D0E0", fontSize: 12 }}>{item.duration}</span>
                          <span style={{ color, fontSize: 11, background: `${color}15`, padding: "2px 8px", borderRadius: 50 }}>{item.category}</span>
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
        </>
      )}

      {/* DOWNLOADS TAB */}
      {activeTab === "downloads" && (
        <section style={{ padding: "60px 24px 100px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            {downloads.map((group, gi) => {
              const GroupIcon = group.icon;
              return (
                <div key={gi} style={{ marginBottom: 64 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${group.color}20`, border: `1px solid ${group.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <GroupIcon size={18} color={group.color} />
                    </div>
                    <h2 className="glm-headline" style={{ fontSize: 22, color: group.color }}>{group.category}</h2>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {group.items.map((item, i) => (
                      <div key={i} className="glm-card" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <h3 className="glm-headline" style={{ fontSize: 16, color: "#FFFFFF", marginBottom: 4 }}>{item.title}</h3>
                          <p className="glm-body" style={{ fontSize: 13, marginBottom: 4 }}>{item.desc}</p>
                          <span style={{ color: group.color, fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>{item.size}</span>
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            background: `${group.color}15`, border: `1px solid ${group.color}40`,
                            color: group.color, padding: "10px 20px", borderRadius: 50,
                            textDecoration: "none", fontFamily: "Inter, sans-serif",
                            fontSize: 14, fontWeight: 700, whiteSpace: "nowrap",
                            transition: "all 0.2s",
                          }}
                          onMouseOver={e => e.currentTarget.style.background = `${group.color}30`}
                          onMouseOut={e => e.currentTarget.style.background = `${group.color}15`}
                        >
                          <Download size={14} />
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}