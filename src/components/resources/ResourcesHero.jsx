export default function ResourcesHero({ activeTab, onTabChange }) {
  const cards = [
    {
      id: "media",
      title: "Media & Content",
      text: "Videos, devotionals, podcasts, and stories that carry the movement across every screen.",
      accent: "#00CFFF",
      icon: "📺",
    },
    {
      id: "downloads",
      title: "Downloads",
      text: "Beautiful documents, posters, and toolkit assets ready for church, campus, and campaign use.",
      accent: "#FFD000",
      icon: "📥",
    },
  ];

  return (
    <section style={{ padding: "96px 24px 56px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top, rgba(0,207,255,0.12), transparent 45%), radial-gradient(circle at bottom right, rgba(138,92,255,0.14), transparent 38%)" }} />
      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.28)", borderRadius: 999, padding: "8px 18px", marginBottom: 22 }}>
            <span className="glow-dot"></span>
            <span style={{ color: "#00CFFF", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>Resources Hub</span>
          </div>
          <h1 className="glm-headline" style={{ fontSize: "clamp(34px, 6vw, 68px)", lineHeight: 1.04, marginBottom: 18 }}>
            Built To <span className="glm-gradient-text">Equip</span>,<br />Designed To <span className="glm-gold-text">Inspire</span>
          </h1>
          <p className="glm-body" style={{ maxWidth: 760, margin: "0 auto", fontSize: 18 }}>
            A premium home for movement media, downloadable assets, and discipleship tools — crafted to feel worthy of the vision.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => onTabChange(card.id)}
              style={{
                textAlign: "left",
                padding: 28,
                borderRadius: 24,
                border: `1px solid ${activeTab === card.id ? card.accent : "rgba(255,255,255,0.1)"}`,
                background: activeTab === card.id ? `linear-gradient(135deg, ${card.accent}22, rgba(18,24,38,0.96))` : "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(18,24,38,0.96))",
                boxShadow: activeTab === card.id ? `0 0 32px ${card.accent}22` : "none",
                cursor: "pointer",
                transition: "all 0.25s ease",
                color: "white",
              }}
            >
              <div style={{ fontSize: 34, marginBottom: 14 }}>{card.icon}</div>
              <h2 className="glm-headline" style={{ fontSize: 24, marginBottom: 10, color: activeTab === card.id ? card.accent : "#FFFFFF" }}>{card.title}</h2>
              <p className="glm-body" style={{ fontSize: 15 }}>{card.text}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}