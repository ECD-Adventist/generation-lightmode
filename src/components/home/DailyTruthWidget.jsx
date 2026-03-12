import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Heart, RefreshCw, Share2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DailyTruthWidget() {
  const [likedIds, setLikedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("glm_liked_codes") || "[]"); } catch { return []; }
  });
  const [dailyCode, setDailyCode] = useState(null);

  const { data: codes = [] } = useQuery({
    queryKey: ["approvedCodesForDaily"],
    queryFn: () => base44.entities.CodeOfTruth.filter({ status: "approved" }),
  });

  useEffect(() => {
    if (codes.length === 0) return;
    // Use date as seed for daily rotation
    const today = new Date().toISOString().split("T")[0];
    const seed = today.split("-").reduce((acc, v) => acc + parseInt(v), 0);
    const idx = seed % codes.length;
    setDailyCode(codes[idx]);
  }, [codes]);

  const handleLike = () => {
    if (!dailyCode) return;
    const newLiked = likedIds.includes(dailyCode.id)
      ? likedIds.filter(id => id !== dailyCode.id)
      : [...likedIds, dailyCode.id];
    setLikedIds(newLiked);
    localStorage.setItem("glm_liked_codes", JSON.stringify(newLiked));
    toast.success(newLiked.includes(dailyCode.id) ? "Bookmarked! 💛" : "Removed from bookmarks");
  };

  const handleWhatsApp = () => {
    if (!dailyCode) return;
    const text = encodeURIComponent(`💯 *${dailyCode.title || dailyCode.slogan_text}*\n\n"${dailyCode.slogan_text}"\n\n📖 ${dailyCode.bible_reference || ""}\n\n✝️ Generation LightMode — Keeping It 100\n${window.location.origin}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (!dailyCode) return null;

  const isLiked = likedIds.includes(dailyCode.id);

  return (
    <section style={{ padding: "80px 24px", background: "#121826" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)", borderRadius: 999, padding: "7px 18px", marginBottom: 16 }}>
            <span style={{ color: "#FFD000", fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif", letterSpacing: "0.06em" }}>💯 DAILY TRUTH</span>
          </div>
          <h2 className="glm-headline" style={{ fontSize: "clamp(24px, 3.5vw, 38px)", marginBottom: 8 }}>
            Today's <span className="glm-gold-text">Keep It 100</span> Truth
          </h2>
          <p className="glm-body" style={{ fontSize: 15 }}>A fresh word daily. Share it, live it, keep it 100.</p>
        </div>

        {/* Poster Card */}
        <div style={{
          background: "linear-gradient(135deg, #0B0F1A 0%, #121826 50%, #0B0F1A 100%)",
          border: "1px solid rgba(0,207,255,0.25)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 0 50px rgba(0,207,255,0.1)",
          position: "relative",
        }}>
          {/* Glow accents */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,207,255,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(138,92,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ padding: "48px 40px", textAlign: "center", position: "relative", zIndex: 1 }}>
            {/* Category badge */}
            {dailyCode.category && (
              <div style={{ display: "inline-block", background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)", borderRadius: 999, padding: "5px 16px", marginBottom: 24 }}>
                <span style={{ color: "#FFD000", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "Inter, sans-serif" }}>{dailyCode.category}</span>
              </div>
            )}

            {/* Title */}
            <h3 className="glm-headline" style={{ fontSize: "clamp(26px, 4vw, 44px)", color: "#FFFFFF", marginBottom: 20, lineHeight: 1.1 }}>
              {dailyCode.title || dailyCode.slogan_text}
            </h3>

            {/* Slogan text (if title is separate) */}
            {dailyCode.title && (
              <p className="glm-body" style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#C8D0E0", marginBottom: 28, maxWidth: 580, margin: "0 auto 28px", lineHeight: 1.7 }}>
                "{dailyCode.slogan_text}"
              </p>
            )}

            {/* Bible Reference */}
            {dailyCode.bible_reference && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.25)", borderRadius: 999, padding: "8px 20px", marginBottom: 36 }}>
                <span style={{ color: "#00CFFF", fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>📖 {dailyCode.bible_reference}</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={handleLike}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", borderRadius: 50,
                  background: isLiked ? "rgba(255,208,0,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isLiked ? "rgba(255,208,0,0.5)" : "rgba(255,255,255,0.15)"}`,
                  color: isLiked ? "#FFD000" : "#C8D0E0",
                  cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif",
                  transition: "all 0.2s"
                }}
              >
                <Heart size={16} fill={isLiked ? "#FFD000" : "none"} /> {isLiked ? "Bookmarked" : "Bookmark"}
              </button>

              <button
                onClick={handleWhatsApp}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", borderRadius: 50,
                  background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)",
                  color: "#25D366", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif",
                  transition: "all 0.2s"
                }}
              >
                <Share2 size={16} /> Share on WhatsApp
              </button>

              <Link
                to={createPageUrl("KeepIt100")}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", borderRadius: 50,
                  background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.25)",
                  color: "#00CFFF", fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif",
                  textDecoration: "none", transition: "all 0.2s"
                }}
              >
                <ExternalLink size={16} /> See All Truths
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}