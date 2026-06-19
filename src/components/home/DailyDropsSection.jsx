import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Heart, Share2, Loader2, ArrowRight, Zap } from "lucide-react";
import { sanitizeRichHtml, containsHtml } from "@/lib/sanitizeHtml";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";

const categoryThemes = {
  "Code of Truth": {
    accent: "#00CFFF",
    accentSoft: "rgba(0,207,255,0.12)",
    glow: "rgba(0,207,255,0.2)",
    gradientBg: "linear-gradient(145deg, rgba(0,207,255,0.07) 0%, rgba(11,15,26,0.97) 100%)",
    borderColor: "rgba(0,207,255,0.2)",
    label: "Code of Truth",
    icon: "🔐",
    hashtag: "#CodeOfTruth",
  },
  "Keep It 100": {
    accent: "#FFD000",
    accentSoft: "rgba(255,208,0,0.1)",
    glow: "rgba(255,208,0,0.18)",
    gradientBg: "linear-gradient(145deg, rgba(255,208,0,0.07) 0%, rgba(11,15,26,0.97) 100%)",
    borderColor: "rgba(255,208,0,0.2)",
    label: "Keep It 100",
    icon: "💯",
    hashtag: "#KeepIt100",
  },
  "Daily Verse": {
    accent: "#8A5CFF",
    accentSoft: "rgba(138,92,255,0.1)",
    glow: "rgba(138,92,255,0.2)",
    gradientBg: "linear-gradient(145deg, rgba(138,92,255,0.08) 0%, rgba(11,15,26,0.97) 100%)",
    borderColor: "rgba(138,92,255,0.2)",
    label: "Daily Verse",
    icon: "📖",
    hashtag: "#DailyVerse",
  },
};

const fallbackTheme = {
  accent: "#00CFFF",
  accentSoft: "rgba(0,207,255,0.12)",
  glow: "rgba(0,207,255,0.2)",
  gradientBg: "linear-gradient(145deg, rgba(0,207,255,0.07) 0%, rgba(11,15,26,0.97) 100%)",
  borderColor: "rgba(0,207,255,0.2)",
  label: "Daily Drop",
  icon: "✨",
  hashtag: "#DailyDrops",
};

export default function DailyDropsSection() {
  // Use the public, service-role snapshot so this works for logged-out visitors
  // and reflects the 3 most recent approved drops across all categories/authors.
  const { data: snapshot, isLoading } = usePublicCommunitySnapshot();
  const displayDrops = (snapshot?.recentDrops || []).slice(0, 3);

  return (
    <section style={{ padding: "clamp(60px, 10vw, 100px) 24px", background: "#0B0F1A", position: "relative", overflow: "hidden" }}>
      {/* Subtle ambient glow only — no background image */}
      {/* Ambient background blobs */}
      <div style={{ position: "absolute", top: "10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,207,255,0.05), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "5%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(138,92,255,0.06), transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.25)", borderRadius: 999, padding: "6px 18px", marginBottom: 18 }}>
            <Zap style={{ width: 13, height: 13, color: "#00CFFF" }} />
            <span style={{ color: "#00CFFF", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Live from the Movement</span>
          </div>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 52px)", marginBottom: 14 }}>
            Daily Drops
          </h2>
          <p className="glm-body" style={{ fontSize: 17, maxWidth: 580, margin: "0 auto", lineHeight: 1.7 }}>
            Scripture-rooted reflections posted daily to flood your feed with the light of Christ.
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 style={{ width: 36, height: 36, color: "#00CFFF", animation: "spin 1s linear infinite" }} />
          </div>
        ) : displayDrops.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 32px", background: "#121826", borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
            <p className="glm-body" style={{ fontSize: 16, marginBottom: 24 }}>Daily drops coming soon — stay tuned for inspiring truth.</p>
            <Link to="/DailyTruthFeed" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 50, background: "#00CFFF", color: "#0B0F1A", fontWeight: 800, fontFamily: "Space Grotesk, sans-serif", textDecoration: "none", fontSize: 14 }}>
              View All Drops
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 40 }}>
            {displayDrops.map((drop, idx) => {
              const theme = fallbackTheme;
              return (
                <div key={drop.id}
                  style={{
                    background: theme.gradientBg,
                    border: `1px solid ${theme.borderColor}`,
                    borderRadius: 26,
                    padding: "28px 26px",
                    minHeight: 280,
                    position: "relative",
                    overflow: "hidden",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    cursor: "default",
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 24px 60px ${theme.glow}`; }}
                  onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Corner glow */}
                  <div style={{ position: "absolute", top: 0, left: 0, width: 180, height: 180, background: `radial-gradient(circle at top left, ${theme.accentSoft}, transparent 60%)`, pointerEvents: "none" }} />
                  {/* Accent top bar */}
                  <div style={{ position: "absolute", top: 0, left: 24, right: 24, height: 2, background: `linear-gradient(90deg, ${theme.accent}, transparent)`, borderRadius: 999 }} />

                  <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
                    {/* Label row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, background: theme.accentSoft, borderRadius: 999, padding: "4px 12px" }}>
                        <span style={{ fontSize: 12 }}>{theme.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 900, color: theme.accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>{theme.label}</span>
                      </div>
                      {drop.country && drop.country !== "Global" && (
                        <span style={{ fontSize: 11, color: "#5A6478", fontFamily: "Inter, sans-serif" }}>{drop.country}</span>
                      )}
                    </div>

                    {/* Verse */}
                    <p style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#FFFFFF",
                      marginBottom: 16,
                      lineHeight: 1.5,
                      fontFamily: "Space Grotesk, sans-serif",
                      flex: 1,
                    }}>
                      "{drop.verse || "Daily truth"}"
                    </p>

                    {/* Reflection */}
                    {drop.reflection && (
                      containsHtml(drop.reflection) ? (
                        <div
                          className="break-words [&_p]:mb-3 [&_p:last-child]:mb-0 [&_a]:break-all"
                          style={{
                            fontSize: 13,
                            color: "#A0AABB",
                            marginBottom: 22,
                            lineHeight: 1.75,
                            fontStyle: "italic",
                            fontFamily: "Inter, sans-serif",
                            borderLeft: `2px solid ${theme.accent}50`,
                            paddingLeft: 12,
                            display: "-webkit-box",
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(drop.reflection) }}
                        />
                      ) : (
                        <p
                          className="break-words"
                          style={{
                            fontSize: 13,
                            color: "#A0AABB",
                            marginBottom: 22,
                            lineHeight: 1.75,
                            fontStyle: "italic",
                            fontFamily: "Inter, sans-serif",
                            borderLeft: `2px solid ${theme.accent}50`,
                            paddingLeft: 12,
                            display: "-webkit-box",
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {drop.reflection}
                        </p>
                      )
                    )}

                    {/* Footer */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      paddingTop: 14,
                      borderTop: `1px solid ${theme.accent}18`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6A7288", fontSize: 12 }}>
                          <Heart style={{ width: 13, height: 13 }} />
                          <span>{drop.likes_count || 0}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#6A7288", fontSize: 12 }}>
                          <Share2 style={{ width: 13, height: 13 }} />
                          <span>Share</span>
                        </div>
                      </div>
                      <div style={{
                        fontSize: 10, fontWeight: 800, color: theme.accent,
                        background: theme.accentSoft, borderRadius: 999,
                        padding: "3px 10px", letterSpacing: "0.06em"
                      }}>
                        {theme.hashtag}
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
            <Link
              to="/DailyTruthFeed"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "14px 32px", borderRadius: 999,
                background: "rgba(0,207,255,0.08)",
                border: "1px solid rgba(0,207,255,0.3)",
                color: "#00CFFF",
                textDecoration: "none",
                fontSize: 15, fontWeight: 700,
                fontFamily: "Space Grotesk, sans-serif",
                transition: "all 0.3s",
              }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.18)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.6)"; e.currentTarget.style.boxShadow = "0 0 28px rgba(0,207,255,0.25)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(0,207,255,0.08)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.3)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              Explore All Daily Drops <ArrowRight style={{ width: 17, height: 17 }} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}