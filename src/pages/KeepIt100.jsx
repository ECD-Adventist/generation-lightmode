import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Share2, Heart, BookOpen } from "lucide-react";
import { toast } from "sonner";
import CodeCard from "@/components/resources/CodeCard";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORIES = [
  "Sexuality & Purity", "Self-Control", "Sanctity of Life", "Gambling & Stewardship",
  "Education & Career", "Entrepreneurship", "Marriage & Courtship", "Peer Pressure",
  "Spiritual Warfare", "Friendship", "Alcohol", "Entertainment", "Social Media",
  "Modesty", "Music & Media", "Integrity", "Speech & Gossip"
];

export default function KeepIt100() {
  const [user, setUser] = React.useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  React.useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
    });
  }, []);

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["keepIt100Approved"],
    queryFn: () => base44.entities.CodeOfTruth.filter({ source_document: "keeping_it_100", status: "approved" }),
  });

  const filteredCodes = useMemo(() => {
    return codes.filter(code => {
      const matchCat = activeCategory === "All" || code.category === activeCategory;
      const matchSearch = (code.slogan_text || "").toLowerCase().includes(search.toLowerCase()) ||
                          (code.title || "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [codes, activeCategory, search]);

  return (
    <div style={{ background: "#0B0F1A", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{
        padding: "100px 24px 60px",
        textAlign: "center",
        background: "linear-gradient(180deg, #121826 0%, #0B0F1A 100%)",
        borderBottom: "1px solid rgba(0,207,255,0.1)",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,208,0,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)", borderRadius: 999, padding: "7px 18px", marginBottom: 20 }}>
            <span style={{ color: "#FFD000", fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif", letterSpacing: "0.06em" }}>💯 KEEPING IT 100</span>
          </div>
          <h1 className="glm-headline" style={{ fontSize: "clamp(36px, 6vw, 72px)", lineHeight: 1.05, marginBottom: 20 }}>
            Keep It <span className="glm-gold-text">100</span> with God
          </h1>
          <p className="glm-body" style={{ fontSize: 18, maxWidth: 580, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Real truth slogans for real life. No cap—stand bold in Christ across every area of life. Share these in your group chats and flood socials with truth.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#FFD000", fontFamily: "Space Grotesk, sans-serif" }}>{codes.length}</div>
              <div style={{ fontSize: 11, color: "#8A9BB0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Truth Slogans</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#00CFFF", fontFamily: "Space Grotesk, sans-serif" }}>{CATEGORIES.length}</div>
              <div style={{ fontSize: 11, color: "#8A9BB0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Life Topics</div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "48px 24px" }}>
        {/* Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
            {["All", ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "9px 20px", borderRadius: 999, border: `1px solid ${activeCategory === cat ? "#FFD000" : "rgba(255,255,255,0.12)"}`,
                  background: activeCategory === cat ? "rgba(255,208,0,0.12)" : "rgba(255,255,255,0.03)",
                  color: activeCategory === cat ? "#FFD000" : "#C8D0E0",
                  fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.2s"
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div style={{ position: "relative", maxWidth: 320 }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#666" }} />
            <input
              type="text"
              placeholder="Search slogans..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", background: "#121826", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "10px 14px 10px 40px", color: "#FFF", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none" }}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <Loader2 className="animate-spin text-[#00CFFF]" size={36} />
          </div>
        ) : filteredCodes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", background: "#121826", borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💯</div>
            <p style={{ color: "#8A9BB0", fontSize: 16, fontFamily: "Inter, sans-serif" }}>
              No approved slogans yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCodes.map(code => (
              <CodeCard key={code.id} code={code} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}