import { useState } from "react";
import { Play, X } from "lucide-react";
import { categories, typeColor, typeIcon } from "./resourcesData";

export default function MediaShowcase({ items, activeType, activeCategory, onTypeChange, onCategoryChange }) {
  const [activeMedia, setActiveMedia] = useState(null);

  const featured = items[0];

  return (
    <section style={{ padding: "28px 24px 96px" }}>
      {activeMedia && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(11,15,26,0.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(10px)" }}>
          <button onClick={() => setActiveMedia(null)} style={{ position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.1)", border: "none", color: "#FFF", width: 48, height: 48, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={24} />
          </button>
          <div style={{ width: "100%", maxWidth: 1000, background: "#000", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,207,255,0.3)" }}>
            {activeMedia.type === "video" ? (
              <video src={activeMedia.url || "https://www.w3schools.com/html/mov_bbb.mp4"} controls autoPlay style={{ width: "100%", maxHeight: "80vh" }} />
            ) : activeMedia.type === "podcast" ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <img src={activeMedia.thumb} alt={activeMedia.title} style={{ width: 200, height: 200, borderRadius: 16, marginBottom: 20, objectFit: "cover" }} />
                <h3 className="glm-headline" style={{ fontSize: 24, color: "#FFF", marginBottom: 20 }}>{activeMedia.title}</h3>
                <audio src={activeMedia.url || "https://www.w3schools.com/html/horse.mp3"} controls autoPlay style={{ width: "100%" }} />
              </div>
            ) : (
              <div style={{ padding: 40, color: "#FFF" }}>Playback not supported for this media type.</div>
            )}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", marginBottom: 40 }}>
        {featured && (
          <div className="glm-card" style={{ padding: 0, overflow: "hidden", borderRadius: 24, background: "#101625", display: "flex", flexDirection: "column", md: { flexDirection: "row" } }}>
            <div style={{ position: "relative", flex: 1, minHeight: 300 }}>
              <img src={featured.thumb} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(11,15,26,0.9) 0%, rgba(11,15,26,0.1) 100%)" }} />
              <div style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 12px", background: "rgba(0,207,255,0.2)", border: "1px solid rgba(0,207,255,0.5)" }}>
                <span style={{ color: "#00CFFF", fontSize: 12, fontWeight: 700 }}>FEATURED</span>
              </div>
            </div>
            <div style={{ flex: 1, padding: 40, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h2 className="glm-headline" style={{ fontSize: 32, color: "#FFFFFF", marginBottom: 16 }}>{featured.title}</h2>
              <p className="glm-body" style={{ fontSize: 16, marginBottom: 24 }}>Experience our top recommended content to fuel your faith journey today.</p>
              <button onClick={() => { if (featured.type === 'video') { alert('Video is coming soon'); } else if (featured.type === 'podcast') { alert('Audio is coming soon'); } else { setActiveMedia(featured); } }} className="glm-btn-primary" style={{ alignSelf: "flex-start", gap: 8 }}>
                <Play size={18} fill="#0B0F1A" /> Play Now
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="glm-card" style={{ marginBottom: 28, padding: 20, borderRadius: 22, background: "linear-gradient(135deg, rgba(0,207,255,0.06), rgba(18,24,38,0.96))" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            {["all", "video", "podcast", "devotional"].map((type) => (
              <button key={type} onClick={() => onTypeChange(type)} style={{ padding: "8px 16px", borderRadius: 999, border: `1px solid ${activeType === type ? "#00CFFF" : "rgba(255,255,255,0.12)"}`, background: activeType === type ? "rgba(0,207,255,0.16)" : "transparent", color: activeType === type ? "#00CFFF" : "#C8D0E0", fontSize: 13, cursor: "pointer" }}>{type.charAt(0).toUpperCase() + type.slice(1)}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {categories.map((category) => (
              <button key={category} onClick={() => onCategoryChange(category)} style={{ padding: "8px 16px", borderRadius: 999, border: `1px solid ${activeCategory === category ? "#8A5CFF" : "rgba(255,255,255,0.12)"}`, background: activeCategory === category ? "rgba(138,92,255,0.16)" : "transparent", color: activeCategory === category ? "#B59CFF" : "#C8D0E0", fontSize: 13, cursor: "pointer" }}>{category.charAt(0).toUpperCase() + category.slice(1)}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {items.map((item, index) => {
            const Icon = typeIcon[item.type];
            const color = typeColor[item.type];
            return (
              <div key={index} className="glm-card" onClick={() => { if (item.type === 'video') { alert('Video is coming soon'); } else if (item.type === 'podcast') { alert('Audio is coming soon'); } else { setActiveMedia(item); } }} style={{ padding: 0, overflow: "hidden", borderRadius: 24, background: "#101625", cursor: "pointer" }}>
                <div style={{ position: "relative", height: 220 }}>
                  <img src={item.thumb} alt={item.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.12), rgba(11,15,26,0.88))" }} />
                  <div style={{ position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 12px", background: `${color}20`, border: `1px solid ${color}55` }}>
                    <Icon size={14} color={color} />
                    <span style={{ color, fontSize: 12, fontWeight: 700 }}>{item.type.toUpperCase()}</span>
                  </div>
                  {item.type === "video" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 62, height: 62, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,207,255,0.18)", border: "2px solid rgba(0,207,255,0.52)", boxShadow: "0 0 24px rgba(0,207,255,0.22)" }}><Play size={22} color="#00CFFF" fill="#00CFFF" /></div></div>}
                </div>
                <div style={{ padding: 22 }}>
                  <h3 className="glm-headline" style={{ fontSize: 18, marginBottom: 10, color: "#FFFFFF", lineHeight: 1.25 }}>{item.title}</h3>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ color: "#C8D0E0", fontSize: 13 }}>{item.duration}</span>
                    <span style={{ color, fontSize: 12, padding: "4px 10px", borderRadius: 999, background: `${color}12`, textTransform: "capitalize" }}>{item.category}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {items.length === 0 && <div className="glm-card" style={{ textAlign: "center", marginTop: 20 }}><div style={{ fontSize: 42, marginBottom: 10 }}>🔦</div><p className="glm-body">No content matches this filter yet.</p></div>}
      </div>
    </section>
  );
}