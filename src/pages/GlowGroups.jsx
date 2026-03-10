import { useState } from "react";
import { Users, MapPin, Globe, Search, ChevronRight } from "lucide-react";

const groups = [
  { name: "Lagos Light Warriors", location: "Lagos, Nigeria", members: 48, region: "Africa", focus: "Campus Outreach", color: "#00CFFF", rank: "Champion" },
  { name: "UK Glow Collective", location: "London, UK", members: 35, region: "Europe", focus: "Digital Evangelism", color: "#8A5CFF", rank: "Trendsetter" },
  { name: "Dallas Glow Starters", location: "Dallas, USA", members: 62, region: "Americas", focus: "Youth Ministry", color: "#FFD000", rank: "Champion" },
  { name: "Manila LightMode", location: "Manila, Philippines", members: 29, region: "Asia", focus: "Prayer & Worship", color: "#00CFFF", rank: "Warrior" },
  { name: "Nairobi Radiant", location: "Nairobi, Kenya", members: 44, region: "Africa", focus: "Community Service", color: "#1DA1FF", rank: "Trendsetter" },
  { name: "São Paulo Glow", location: "São Paulo, Brazil", members: 38, region: "Americas", focus: "Social Media Mission", color: "#8A5CFF", rank: "Warrior" },
];

const rankColors = { Champion: "#FFD000", Trendsetter: "#8A5CFF", Warrior: "#1DA1FF", Starter: "#00CFFF" };

const howItWorks = [
  { step: "01", title: "Find or Create", desc: "Search for a GlowGroup in your city or start your own with just a few clicks.", icon: "🔍" },
  { step: "02", title: "Connect & Commit", desc: "Join the group, meet your accountability partners, and commit to the mission.", icon: "🤝" },
  { step: "03", title: "Complete Challenges", desc: "Do challenges together, support each other, and earn group XP.", icon: "⚡" },
  { step: "04", title: "Climb the Ranks", desc: "As a group grows in faith and activity, your collective rank rises.", icon: "🏆" },
];

export default function GlowGroups() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");

  const regions = ["all", ...new Set(groups.map(g => g.region))];
  const filtered = groups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.location.toLowerCase().includes(search.toLowerCase());
    const matchRegion = regionFilter === "all" || g.region === regionFilter;
    return matchSearch && matchRegion;
  });

  return (
    <div style={{ background: "#0B0F1A" }}>
      {/* HERO */}
      <section style={{ padding: "100px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(138,92,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,207,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(138,92,255,0.1)", border: "1px solid rgba(138,92,255,0.3)", borderRadius: 50, padding: "8px 20px", marginBottom: 24 }}>
            <Users size={14} color="#8A5CFF" />
            <span style={{ color: "#8A5CFF", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>GlowGroups</span>
          </div>
          <h1 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 20 }}>
            No One Shines <span className="glm-gradient-text">Alone</span>
          </h1>
          <p className="glm-body" style={{ fontSize: 17, maxWidth: 620, margin: "0 auto 40px" }}>
            GlowGroups are small accountability communities that grow together, challenge together, and light up East-Central Africa together. Find yours or start one today. <span style={{ color: "#FFD000", fontWeight: 700 }}>Faith. Always On.</span>
          </p>
          <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" }}>
            {[{ label: "Active Groups", value: "500+", color: "#00CFFF" }, { label: "Nations", value: "12", color: "#FFD000" }, { label: "Members Worldwide", value: "28K+", color: "#8A5CFF" }].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div className="glm-headline" style={{ fontSize: 32, color: s.color }}>{s.value}</div>
                <div className="glm-body" style={{ fontSize: 13 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* HOW IT WORKS */}
      <section style={{ padding: "80px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(24px, 3vw, 40px)", marginBottom: 48 }}>How GlowGroups Work</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {howItWorks.map(step => (
              <div key={step.step} className="glm-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{step.icon}</div>
                <div style={{ color: "#00CFFF", fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>STEP {step.step}</div>
                <h3 className="glm-headline" style={{ fontSize: 18, marginBottom: 10 }}>{step.title}</h3>
                <p className="glm-body" style={{ fontSize: 14 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* SEARCH & FILTER */}
      <section style={{ padding: "60px 24px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 32 }}>
            <div style={{ flex: "1 1 300px", position: "relative" }}>
              <Search size={18} color="#C8D0E0" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or location..."
                style={{
                  width: "100%", padding: "14px 16px 14px 48px",
                  background: "#121826", border: "1px solid rgba(0,207,255,0.2)",
                  borderRadius: 50, color: "#FFFFFF", fontSize: 15, fontFamily: "Inter, sans-serif",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {regions.map(r => (
                <button key={r} onClick={() => setRegionFilter(r)} style={{
                  padding: "10px 20px", borderRadius: 50,
                  border: `1px solid ${regionFilter === r ? "#8A5CFF" : "rgba(255,255,255,0.1)"}`,
                  background: regionFilter === r ? "rgba(138,92,255,0.15)" : "transparent",
                  color: regionFilter === r ? "#8A5CFF" : "#C8D0E0",
                  cursor: "pointer", fontSize: 14, fontFamily: "Inter, sans-serif", fontWeight: 500, transition: "all 0.2s",
                }}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Groups Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, paddingBottom: 100 }}>
            {filtered.map(group => (
              <div key={group.name} className="glm-card" style={{ border: `1px solid ${group.color}25` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `linear-gradient(135deg, ${group.color}30, ${group.color}10)`,
                    border: `1px solid ${group.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>✨</div>
                  <span style={{ background: `${rankColors[group.rank]}15`, color: rankColors[group.rank], fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 50, fontFamily: "Inter, sans-serif", border: `1px solid ${rankColors[group.rank]}30` }}>
                    {group.rank}
                  </span>
                </div>
                <h3 className="glm-headline" style={{ fontSize: 19, color: "#FFFFFF", marginBottom: 8 }}>{group.name}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <MapPin size={13} color="#C8D0E0" />
                  <span className="glm-body" style={{ fontSize: 13 }}>{group.location}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  <Globe size={13} color={group.color} />
                  <span style={{ color: group.color, fontSize: 13, fontFamily: "Inter, sans-serif" }}>{group.focus}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex" }}>
                      {[...Array(Math.min(4, group.members))].map((_, i) => (
                        <div key={i} style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg, ${group.color}60, ${group.color}30)`, border: "2px solid #0B0F1A", marginLeft: i > 0 ? -8 : 0, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>👤</div>
                      ))}
                    </div>
                    <span className="glm-body" style={{ fontSize: 13 }}>{group.members} members</span>
                  </div>
                  <a href={createPageUrl("Dashboard")} style={{ color: group.color, fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                    Join <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            ))}

            {/* Create Group CTA */}
            <div style={{ background: "rgba(0,207,255,0.03)", border: "2px dashed rgba(0,207,255,0.2)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", cursor: "pointer", transition: "all 0.3s", minHeight: 200 }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(0,207,255,0.5)"; e.currentTarget.style.background = "rgba(0,207,255,0.06)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(0,207,255,0.2)"; e.currentTarget.style.background = "rgba(0,207,255,0.03)"; }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✨</div>
              <h3 className="glm-headline" style={{ fontSize: 18, color: "#00CFFF", marginBottom: 8 }}>Start a GlowGroup</h3>
              <p className="glm-body" style={{ fontSize: 14, marginBottom: 16 }}>Don't see one near you? Create your own and invite your people.</p>
              <a href={createPageUrl("Dashboard")} className="glm-btn-primary" style={{ fontSize: 14, padding: "10px 24px" }}>Create Group ⚡</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}