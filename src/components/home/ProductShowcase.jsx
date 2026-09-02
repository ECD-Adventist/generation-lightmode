import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Zap, Users, Target, Trophy } from "lucide-react";
import ShowcasePreview from "./ShowcasePreview";

const TABS = [
  { id: "feed", label: "Feed", icon: Zap, accent: "#00CFFF", caption: "Post, glow, respond — the feed your movement lives in." },
  { id: "groups", label: "GlowGroups", icon: Users, accent: "#8A5CFF", caption: "Every city gets a home. Leaders gather, members grow." },
  { id: "challenges", label: "Challenges", icon: Target, accent: "#FFD000", caption: "Weekly missions that turn belief into visible action." },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy, accent: "#1DA1FF", caption: "Recognition that compounds — across 12 nations." },
];

/**
 * Tabbed product showcase (Fora-style): one large live-looking preview that swaps per tab.
 */
export default function ProductShowcase({ compact = false }) {
  const [active, setActive] = useState("feed");
  const reduce = useReducedMotion();
  const tab = TABS.find(t => t.id === active);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div role="tablist" aria-label="Product areas" className="hide-scrollbar" style={{ display: "flex", gap: 6, justifyContent: compact ? "flex-start" : "center", overflowX: "auto", padding: "4px 2px", marginBottom: compact ? 18 : 28 }}>
        {TABS.map(({ id, label, icon: Icon, accent }) => {
          const on = id === active;
          return (
            <button key={id} role="tab" aria-selected={on} onClick={() => setActive(id)} style={{
              display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0,
              padding: compact ? "9px 14px" : "10px 18px", borderRadius: 999, cursor: "pointer",
              fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: compact ? 13 : 14,
              color: on ? "#0B0F1A" : "#C8D0E0",
              background: on ? accent : "rgba(255,255,255,0.05)",
              border: on ? `1px solid ${accent}` : "1px solid rgba(255,255,255,0.08)",
              boxShadow: on ? `0 0 24px ${accent}55` : "none", transition: "all 0.25s",
            }}>
              <Icon size={14} /> {label}
            </button>
          );
        })}
      </div>

      <div style={{
        borderRadius: compact ? 22 : 28, padding: compact ? 16 : 28, position: "relative", overflow: "hidden",
        background: "rgba(13,18,32,0.85)", border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: `0 30px 90px rgba(0,0,0,0.55), 0 0 60px ${tab.accent}12`, backdropFilter: "blur(20px)",
        minHeight: compact ? 300 : 340,
      }}>
        <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: `linear-gradient(90deg, transparent, ${tab.accent}, transparent)`, transition: "background 0.4s" }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${tab.accent}10, transparent 55%)`, pointerEvents: "none", transition: "background 0.4s" }} />
        <div style={{ display: "flex", gap: 6, marginBottom: 18, position: "relative" }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.8 }} />)}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "relative" }}
          >
            <ShowcasePreview tab={active} />
          </motion.div>
        </AnimatePresence>
      </div>

      <p style={{ textAlign: "center", marginTop: 18, fontFamily: "Inter, sans-serif", fontSize: compact ? 13 : 14, color: "#8A9BB0" }}>{tab.caption}</p>
    </div>
  );
}