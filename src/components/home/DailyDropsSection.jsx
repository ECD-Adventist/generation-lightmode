import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BookOpen, Share2, Heart, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function DailyDropsSection() {
  const { data: drops = [], isLoading } = useQuery({
    queryKey: ["dailySystemDrops"],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: "system@lightmode.com", status: "approved" }, '-created_date', 6),
  });

  const displayDrops = drops.slice(0, 3);
  const postedDate = (drop) => drop.created_date ? format(new Date(drop.created_date.endsWith('Z') ? drop.created_date : drop.created_date + 'Z'), "MMM d, yyyy") : "";

  return (
    <section style={{ padding: "clamp(60px, 10vw, 100px) 24px", background: "#121826" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 12 }}>
            Daily Truth Drops
          </h2>
          <p className="glm-body" style={{ fontSize: 17, maxWidth: 600, margin: "0 auto" }}>
            System-posted scriptures and reflections that guide the movement.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" />
          </div>
        ) : displayDrops.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 24px", background: "#0B0F1A", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <p className="glm-body" style={{ fontSize: 16, marginBottom: 20 }}>Daily drops coming soon. Stay tuned for inspiring truth.</p>
            <Link to="/DailyTruthFeed" className="glm-btn-primary" style={{ fontSize: 14, padding: "10px 20px", display: "inline-block" }}>
              View All Drops
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, marginBottom: 32 }}>
            {displayDrops.map((drop, idx) => {
              const colors = ["#00CFFF", "#FFD000", "#8A5CFF"];
              const color = colors[idx % colors.length];
              return (
                <div key={drop.id} style={{
                  background: `linear-gradient(135deg, ${color}08, rgba(11,15,26,0.98))`,
                  border: `1px solid ${color}20`,
                  borderRadius: 20,
                  padding: 24,
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s",
                  cursor: "pointer"
                }} onMouseOver={e => e.currentTarget.style.borderColor = `${color}50`} onMouseOut={e => e.currentTarget.style.borderColor = `${color}20`}>
                  {/* Accent line */}
                  <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
                  
                  {/* Content */}
                  <div style={{ paddingTop: 8 }}>
                    {drop.verse && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <BookOpen style={{ width: 16, height: 16, color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Scripture
                        </span>
                      </div>
                    )}

                    {drop.verse && (
                      <p style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 14, lineHeight: 1.5 }}>
                        "{drop.verse}"
                      </p>
                    )}

                    {drop.reflection && (
                      <p style={{ fontSize: 14, color: "#C8D0E0", marginBottom: 14, lineHeight: 1.6, fontStyle: "italic" }}>
                        {drop.reflection}
                      </p>
                    )}

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${color}15` }}>
                      <div style={{ fontSize: 11, color: "#8A9BB0" }}>{postedDate(drop)}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#A0A5B5" }}>
                          <Heart style={{ width: 12, height: 12 }} /> {drop.likes_count || 0}
                        </div>
                        <Share2 style={{ width: 12, height: 12, color: "#A0A5B5", cursor: "pointer" }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && displayDrops.length > 0 && (
          <div style={{ textAlign: "center" }}>
            <Link to="/DailyTruthFeed" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              borderRadius: 12,
              background: "rgba(0,207,255,0.1)",
              border: "1px solid rgba(0,207,255,0.3)",
              color: "#00CFFF",
              textDecoration: "none",
              fontSize: 15,
              fontWeight: 600,
              transition: "all 0.3s",
              cursor: "pointer"
            }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.2)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.5)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(0,207,255,0.1)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.3)"; }}
            >
              Explore All Daily Drops <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}