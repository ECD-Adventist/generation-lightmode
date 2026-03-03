import { useState } from "react";
import { Zap, Clock, Users, Star, CheckCircle } from "lucide-react";

const challenges = [
  {
    id: 1, title: "7 Days of Light", category: "Faith", difficulty: "Starter",
    duration: "7 Days", participants: 12450, points: 100,
    description: "Complete a daily faith action for 7 consecutive days. Post your moment of faith online.",
    color: "#00CFFF", badge: "💡",
    tasks: ["Day 1: Share one Bible verse on social media", "Day 2: Pray publicly for someone", "Day 3: Share your testimony in 60 seconds"],
  },
  {
    id: 2, title: "GlowDrop Challenge", category: "Social", difficulty: "Warrior",
    duration: "3 Days", participants: 8200, points: 150,
    description: "Drop a daily 'Glow Drop' — a Bible verse with your personal reflection — on all your social platforms.",
    color: "#1DA1FF", badge: "✨",
    tasks: ["Create your Glow Drop template", "Post Day 1 verse + reflection", "Tag 3 friends to join"],
  },
  {
    id: 3, title: "Switch On Summit", category: "Event", difficulty: "Champion",
    duration: "1 Day", participants: 5000, points: 300,
    description: "Attend or host a LightMode gathering in your city. Bring your GlowGroup and celebrate together.",
    color: "#FFD000", badge: "🏆",
    tasks: ["Register your city", "Invite your GlowGroup", "Document your Summit moment"],
  },
  {
    id: 4, title: "30-Day Prayer Chain", category: "Prayer", difficulty: "Starter",
    duration: "30 Days", participants: 22000, points: 200,
    description: "Join the global prayer chain — pray for one nation each day for 30 days.",
    color: "#8A5CFF", badge: "🙏",
    tasks: ["Join the prayer chain", "Pray for today's assigned nation", "Share your prayer on the app"],
  },
  {
    id: 5, title: "Digital Evangelist", category: "Outreach", difficulty: "Trendsetter",
    duration: "14 Days", participants: 3800, points: 250,
    description: "Share your faith story online every day for 14 days. Bold. Public. Unashamed.",
    color: "#8A5CFF", badge: "📱",
    tasks: ["Write your 2-minute testimony", "Post Day 1: Who I was before", "Post Day 7: How light changed me"],
  },
  {
    id: 6, title: "Verse Streak", category: "Devotional", difficulty: "Starter",
    duration: "21 Days", participants: 34500, points: 120,
    description: "Read and share one Bible verse every day for 21 days. Build your daily habit of the Word.",
    color: "#00CFFF", badge: "📖",
    tasks: ["Choose your reading plan", "Day 1: Share verse + why it speaks to you", "Maintain your streak"],
  },
];

const difficultyColors = {
  Starter: "#00CFFF", Warrior: "#1DA1FF", Trendsetter: "#8A5CFF", Champion: "#FFD000"
};

export default function Challenges() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const categories = ["all", ...new Set(challenges.map(c => c.category))];
  const filtered = filter === "all" ? challenges : challenges.filter(c => c.category === filter);

  return (
    <div style={{ background: "#0B0F1A" }}>
      {/* HERO */}
      <section style={{ padding: "100px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,208,0,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)", borderRadius: 50, padding: "8px 20px", marginBottom: 24 }}>
            <Zap size={14} color="#FFD000" />
            <span style={{ color: "#FFD000", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>Faith Challenges</span>
          </div>
          <h1 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 20 }}>
            Dare To <span className="glm-gold-text">Glow</span>
          </h1>
          <p className="glm-body" style={{ fontSize: 17, maxWidth: 600, margin: "0 auto 40px" }}>
            Faith-activating challenges designed to push you out of the dark and into the light. Pick your level. Start today.
          </p>
          <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" }}>
            {[{ label: "Active Challenges", value: "6+", color: "#00CFFF" }, { label: "Total Participants", value: "86K+", color: "#FFD000" }, { label: "Points to Earn", value: "1,120+", color: "#8A5CFF" }].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div className="glm-headline" style={{ fontSize: 32, color: s.color }}>{s.value}</div>
                <div className="glm-body" style={{ fontSize: 13 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* FILTERS */}
      <section style={{ padding: "32px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: "10px 24px", borderRadius: 50,
              border: `1px solid ${filter === cat ? "#00CFFF" : "rgba(255,255,255,0.1)"}`,
              background: filter === cat ? "rgba(0,207,255,0.15)" : "transparent",
              color: filter === cat ? "#00CFFF" : "#C8D0E0",
              cursor: "pointer", fontSize: 14, fontFamily: "Inter, sans-serif", fontWeight: 500, transition: "all 0.2s",
            }}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* CHALLENGE GRID */}
      <section style={{ padding: "60px 24px 100px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {filtered.map(challenge => (
              <div key={challenge.id} className="glm-card" style={{ border: `1px solid ${challenge.color}30`, cursor: "pointer" }}
                onClick={() => setSelected(selected?.id === challenge.id ? null : challenge)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ fontSize: 40 }}>{challenge.badge}</div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span style={{ background: `${difficultyColors[challenge.difficulty]}20`, color: difficultyColors[challenge.difficulty], fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 50, fontFamily: "Inter, sans-serif", border: `1px solid ${difficultyColors[challenge.difficulty]}40` }}>
                      {challenge.difficulty}
                    </span>
                    <span style={{ color: "#FFD000", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>+{challenge.points} pts</span>
                  </div>
                </div>
                <h3 className="glm-headline" style={{ fontSize: 22, color: "#FFFFFF", marginBottom: 10 }}>{challenge.title}</h3>
                <p className="glm-body" style={{ fontSize: 14, marginBottom: 20 }}>{challenge.description}</p>
                <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={14} color="#C8D0E0" />
                    <span className="glm-body" style={{ fontSize: 13 }}>{challenge.duration}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={14} color="#C8D0E0" />
                    <span className="glm-body" style={{ fontSize: 13 }}>{challenge.participants.toLocaleString()}</span>
                  </div>
                </div>

                {/* Expanded tasks */}
                {selected?.id === challenge.id && (
                  <div style={{ borderTop: `1px solid ${challenge.color}20`, paddingTop: 20, marginTop: 8 }}>
                    <h4 className="glm-headline" style={{ fontSize: 14, color: challenge.color, marginBottom: 12 }}>CHALLENGE TASKS</h4>
                    {challenge.tasks.map((task, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                        <CheckCircle size={16} color={challenge.color} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span className="glm-body" style={{ fontSize: 14 }}>{task}</span>
                      </div>
                    ))}
                    <a href="/app/dashboard" className="glm-btn-primary" style={{ display: "block", textAlign: "center", marginTop: 20, fontSize: 15 }}>
                      Accept Challenge ⚡
                    </a>
                  </div>
                )}

                {selected?.id !== challenge.id && (
                  <div style={{ color: challenge.color, fontSize: 14, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>
                    View Tasks →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}