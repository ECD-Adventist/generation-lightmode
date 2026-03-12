export default function ResourcesTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: "media", label: "📺 Media & Content" },
    { id: "downloads", label: "📥 Downloads" },
    { id: "keeping-it-100", label: "💯 Keeping It 100" },
    { id: "codes-of-truth", label: "🔐 Codes of Truth" },
  ];

  return (
    <section style={{ padding: "0 24px 12px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: "12px 24px",
              borderRadius: 999,
              border: `1px solid ${activeTab === tab.id ? "#00CFFF" : "rgba(255,255,255,0.12)"}`,
              background: activeTab === tab.id ? "rgba(0,207,255,0.14)" : "rgba(255,255,255,0.03)",
              color: activeTab === tab.id ? "#00CFFF" : "#C8D0E0",
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </section>
  );
}