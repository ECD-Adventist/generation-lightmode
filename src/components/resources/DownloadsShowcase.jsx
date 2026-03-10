import { Download } from "lucide-react";

export default function DownloadsShowcase({ sections }) {
  return (
    <section style={{ padding: "28px 24px 96px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {sections.map((section) => (
          <div key={section.category} style={{ marginBottom: 42 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span style={{ fontSize: 28 }}>{section.icon}</span>
              <h2 className="glm-headline" style={{ fontSize: 28, color: section.color }}>{section.category}</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22 }}>
              {section.items.map((item, index) => (
                <div key={index} className="glm-card" style={{ borderRadius: 24, border: `1px solid ${section.color}26`, background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(18,24,38,0.98))", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ background: `${section.color}18`, border: `1px solid ${section.color}44`, color: section.color, fontSize: 11, fontWeight: 800, padding: "5px 10px", borderRadius: 999 }}>{item.type}</span>
                    {item.size && <span style={{ color: "#C8D0E0", fontSize: 12 }}>{item.size}</span>}
                  </div>
                  <h3 className="glm-headline" style={{ fontSize: 18, color: "#FFFFFF", lineHeight: 1.25 }}>{item.title}</h3>
                  <p className="glm-body" style={{ fontSize: 14, flexGrow: 1 }}>{item.desc}</p>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", background: `${section.color}18`, border: `1px solid ${section.color}44`, color: section.color, padding: "12px 18px", borderRadius: 999, fontWeight: 700 }}>
                      <Download size={14} /> Download Asset
                    </a>
                  ) : (
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.05)", color: "#C8D0E0", padding: "12px 18px", borderRadius: 999, fontWeight: 700 }}>
                      🔜 Coming Soon
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}