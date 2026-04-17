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
    <div style={{ background: "#F6F8FC", minHeight: "100vh", fontFamily: "Inter, sans-serif", color: "#0B1B3D" }}>
      <section style={{ padding: "100px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.12)", border: "1px solid #FFE4A0", borderRadius: 50, padding: "8px 20px", marginBottom: 24 }}>
            <Target size={14} color="#CC7A00" />
            <span style={{ color: "#CC7A00", fontSize: 13, fontWeight: 600 }}>Live Challenges</span>
          </div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 20, color: "#0B1B3D" }}>
            Real <span style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Challenges</span>
          </h1>
          <p style={{ fontSize: 17, maxWidth: 600, margin: "0 auto 32px", color: "#4A5878" }}>
            These challenges come directly from the app's live challenge records.
          </p>
          <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { label: "Active", value: snapshot.totalChallenges || 0, color: "#0B3FD9" },
              { label: "All Challenges", value: challenges.length, color: "#CC7A00" },
              { label: "Participants", value: challenges.reduce((sum, challenge) => sum + (challenge.participantsCount || 0), 0), color: "#0B3FD9" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 32, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: "#6B7FA0" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #E6ECF5, transparent)" }} />

      <section style={{ padding: "32px 24px", background: "#FFFFFF" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { id: "active", label: "Active" },
            { id: "all", label: "All" },
            { id: "completed", label: "Completed" },
          ].map((item) => (
            <button key={item.id} onClick={() => setFilter(item.id)} style={{ padding: "10px 24px", borderRadius: 50, border: `1px solid ${filter === item.id ? "#0B3FD9" : "#E6ECF5"}`, background: filter === item.id ? "linear-gradient(90deg, #1FB8FF, #0B3FD9)" : "#FFFFFF", color: filter === item.id ? "#FFFFFF" : "#4A5878", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section style={{ padding: "60px 24px 100px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {filteredChallenges.length === 0 ? (
            <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 16, padding: 28, textAlign: "center" }}>
              <p style={{ color: "#8A97B5" }}>No live challenges match this filter yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
              {filteredChallenges.map((challenge) => (
                <div key={challenge.id} style={{ background: "#FFFFFF", border: `1px solid ${challenge.active ? "#B8E5FF" : "#E6ECF5"}`, borderRadius: 16, padding: 28, transition: "all 0.3s", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
                    <span style={{ background: challenge.active ? "rgba(31, 184, 255, 0.1)" : "#F6F8FC", color: challenge.active ? "#0B3FD9" : "#6B7FA0", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 50, border: `1px solid ${challenge.active ? "#B8E5FF" : "#E6ECF5"}` }}>
                      {challenge.active ? "Active" : "Completed"}
                    </span>
                    <span style={{ color: "#CC7A00", fontSize: 13, fontWeight: 700 }}>+{challenge.points_reward} XP</span>
                  </div>
                  <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 22, color: "#0B1B3D", marginBottom: 10 }}>{challenge.title}</h3>
                  <p style={{ fontSize: 14, marginBottom: 20, color: "#4A5878", lineHeight: 1.7 }}>{challenge.description || "No description yet."}</p>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Users size={14} color="#6B7FA0" />
                      <span style={{ fontSize: 13, color: "#6B7FA0" }}>{challenge.participantsCount || 0} participants</span>
                    </div>
                    {(challenge.start_date || challenge.end_date) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={14} color="#6B7FA0" />
                        <span style={{ fontSize: 13, color: "#6B7FA0" }}>{challenge.start_date || "Open"} {challenge.end_date ? `→ ${challenge.end_date}` : ""}</span>
                      </div>
                    )}
                  </div>
                  <Link to={createPageUrl("Dashboard") + "?tab=challenges"} style={{ display: "block", textAlign: "center", fontSize: 15, background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, padding: "14px 32px", borderRadius: 50, textDecoration: "none", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }}>
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