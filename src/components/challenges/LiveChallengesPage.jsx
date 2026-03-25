import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Zap, Target } from "lucide-react";
import { createPageUrl } from "@/utils";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";

export default function LiveChallengesPage() {
  const [filter, setFilter] = useState("active");
  const { data: snapshot } = usePublicCommunitySnapshot();
  const challenges = snapshot.challenges || [];

  const filteredChallenges = useMemo(() => {
    if (filter === "all") return challenges;
    if (filter === "active") return challenges.filter((challenge) => challenge.active);
    return challenges.filter((challenge) => !challenge.active);
  }, [challenges, filter]);

  return (
    <div style={{ background: "#0B0F1A" }}>
      <section style={{ padding: "100px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,208,0,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)", borderRadius: 50, padding: "8px 20px", marginBottom: 24 }}>
            <Target size={14} color="#FFD000" />
            <span style={{ color: "#FFD000", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Live Challenges</span>
          </div>
          <h1 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 20 }}>
            Real <span className="glm-gold-text">Challenges</span>
          </h1>
          <p className="glm-body" style={{ fontSize: 17, maxWidth: 600, margin: "0 auto 32px" }}>
            These challenges come directly from the app's live challenge records.
          </p>
          <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { label: "Active", value: snapshot.totalChallenges || 0, color: "#00CFFF" },
              { label: "All Challenges", value: challenges.length, color: "#FFD000" },
              { label: "Participants", value: challenges.reduce((sum, challenge) => sum + (challenge.participantsCount || 0), 0), color: "#8A5CFF" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div className="glm-headline" style={{ fontSize: 32, color: stat.color }}>{stat.value}</div>
                <div className="glm-body" style={{ fontSize: 13 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      <section style={{ padding: "32px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { id: "active", label: "Active" },
            { id: "all", label: "All" },
            { id: "completed", label: "Completed" },
          ].map((item) => (
            <button key={item.id} onClick={() => setFilter(item.id)} style={{ padding: "10px 24px", borderRadius: 50, border: `1px solid ${filter === item.id ? "#00CFFF" : "rgba(255,255,255,0.1)"}`, background: filter === item.id ? "rgba(0,207,255,0.15)" : "transparent", color: filter === item.id ? "#00CFFF" : "#C8D0E0", cursor: "pointer", fontSize: 14, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section style={{ padding: "60px 24px 100px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {filteredChallenges.length === 0 ? (
            <div className="glm-card" style={{ textAlign: "center" }}>
              <p className="glm-body">No live challenges match this filter yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
              {filteredChallenges.map((challenge) => (
                <div key={challenge.id} className="glm-card" style={{ border: `1px solid ${challenge.active ? "rgba(0,207,255,0.2)" : "rgba(255,255,255,0.1)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
                    <span style={{ background: challenge.active ? "rgba(0,207,255,0.15)" : "rgba(255,255,255,0.08)", color: challenge.active ? "#00CFFF" : "#C8D0E0", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 50, border: `1px solid ${challenge.active ? "rgba(0,207,255,0.35)" : "rgba(255,255,255,0.14)"}` }}>
                      {challenge.active ? "Active" : "Completed"}
                    </span>
                    <span style={{ color: "#FFD000", fontSize: 13, fontWeight: 700 }}>+{challenge.points_reward} XP</span>
                  </div>
                  <h3 className="glm-headline" style={{ fontSize: 22, color: "#FFFFFF", marginBottom: 10 }}>{challenge.title}</h3>
                  <p className="glm-body" style={{ fontSize: 14, marginBottom: 20 }}>{challenge.description || "No description yet."}</p>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Users size={14} color="#C8D0E0" />
                      <span className="glm-body" style={{ fontSize: 13 }}>{challenge.participantsCount || 0} participants</span>
                    </div>
                    {(challenge.start_date || challenge.end_date) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={14} color="#C8D0E0" />
                        <span className="glm-body" style={{ fontSize: 13 }}>{challenge.start_date || "Open"} {challenge.end_date ? `→ ${challenge.end_date}` : ""}</span>
                      </div>
                    )}
                  </div>
                  <Link to={createPageUrl("Dashboard") + "?tab=challenges"} className="glm-btn-primary" style={{ display: "block", textAlign: "center", fontSize: 15 }}>
                    Open in dashboard
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}