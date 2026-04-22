import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Play, Headphones, BookOpen, Menu, X, ChevronLeft, Search } from "lucide-react";

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

const typeIcon = { video: Play, podcast: Headphones, devotional: BookOpen };
const typeColor = { video: "#00CFFF", podcast: "#8A5CFF", devotional: "#FFD000" };
const typeFilters = ["all", "video", "podcast", "devotional"];
const categoryFilters = ["all", "events", "challenges", "devotional", "testimonies", "podcast"];

export default function MobileMedia() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = mediaItems.filter(item => {
    const catMatch = activeCategory === "all" || item.category === activeCategory;
    const typeMatch = activeType === "all" || item.type === activeType;
    const qMatch = !query || item.title.toLowerCase().includes(query.toLowerCase());
    return catMatch && typeMatch && qMatch;
  });

  return (
    <div className="min-h-screen" style={{ background: "#0B0F1A", color: "#E0E8F0" }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-40 safe-pt" style={{ background: "rgba(11,15,26,0.95)", backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(0,207,255,0.1)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 p-2 -ml-2" style={{ color: "#00CFFF" }}>
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-bold">Home</span>
          </Link>
          <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="" className="h-8 w-auto" />
          <button onClick={() => setMenuOpen(true)} className="p-2 -mr-2" style={{ color: "#00CFFF" }}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="px-5 pt-8 pb-6 text-center">
        <div className="inline-flex items-center gap-2 mb-5" style={{ background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", borderRadius: 999, padding: "6px 16px" }}>
          <Play size={12} color="#00CFFF" />
          <span style={{ color: "#00CFFF", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Media Hub</span>
        </div>
        <h1 className="text-[32px] leading-[1.05] font-black mb-3" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#FFFFFF", letterSpacing: "-0.02em" }}>
          Light Through <br />
          <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Every Screen</span>
        </h1>
        <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "#C8D0E0" }}>
          Videos, podcasts, devotionals & testimonies — to inspire and ignite.
        </p>
      </section>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8A9BB0" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search media..."
            className="w-full rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none"
            style={{ background: "rgba(18,24,38,0.8)", border: "1px solid rgba(255,255,255,0.08)", color: "#FFFFFF" }}
          />
        </div>
      </div>

      {/* Type filter pills */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {typeFilters.map(t => {
            const active = activeType === t;
            return (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition shrink-0"
                style={{
                  background: active ? "rgba(0,207,255,0.15)" : "rgba(18,24,38,0.6)",
                  border: `1px solid ${active ? "#00CFFF" : "rgba(255,255,255,0.08)"}`,
                  color: active ? "#00CFFF" : "#C8D0E0",
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="px-4 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {categoryFilters.map(c => {
            const active = activeCategory === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition shrink-0"
                style={{
                  background: active ? "rgba(138,92,255,0.15)" : "rgba(18,24,38,0.6)",
                  border: `1px solid ${active ? "#8A5CFF" : "rgba(255,255,255,0.08)"}`,
                  color: active ? "#8A5CFF" : "#C8D0E0",
                }}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pb-24 space-y-4">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-4xl mb-3">🔦</div>
            <p style={{ color: "#C8D0E0" }}>No content matches this filter yet.</p>
          </div>
        ) : filtered.map((item, i) => {
          const Icon = typeIcon[item.type];
          const color = typeColor[item.type];
          return (
            <div key={i} className="rounded-2xl overflow-hidden active:scale-[0.99] transition" style={{ background: "#121826", border: "1px solid rgba(0,207,255,0.15)" }}>
              <div className="relative h-48 overflow-hidden">
                <img src={item.thumb} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(11,15,26,0.9) 100%)" }} />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: `${color}20`, border: `1px solid ${color}60` }}>
                  <Icon size={11} color={color} />
                  <span style={{ color, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em" }}>{item.type.toUpperCase()}</span>
                </div>
                {item.type === "video" && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(0,207,255,0.25)", border: "2px solid rgba(0,207,255,0.6)", boxShadow: "0 0 20px rgba(0,207,255,0.4)" }}>
                    <Play size={18} color="#00CFFF" fill="#00CFFF" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2 leading-snug" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#FFFFFF", fontSize: 15 }}>{item.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "#C8D0E0" }}>{item.duration}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>{item.category}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[90]" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-72 safe-pt p-5" style={{ background: "#121826", borderLeft: "1px solid rgba(0,207,255,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold" style={{ color: "#00CFFF", letterSpacing: "0.12em", textTransform: "uppercase" }}>Menu</span>
              <button onClick={() => setMenuOpen(false)} style={{ color: "#C8D0E0" }}><X className="w-5 h-5" /></button>
            </div>
            {[
              { to: "Home", label: "Home" },
              { to: "About", label: "About" },
              { to: "Impact", label: "Impact" },
              { to: "Resources", label: "Resources" },
              { to: "KeepIt100", label: "Keep It 100" },
              { to: "CodesOfTruth", label: "Codes of Truth" },
              { to: "Assistant", label: "Assistant" },
            ].map(l => (
              <Link key={l.to} to={createPageUrl(l.to)} onClick={() => setMenuOpen(false)} className="block py-3 text-sm font-semibold border-b" style={{ color: "#E0E8F0", borderColor: "rgba(255,255,255,0.05)" }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}