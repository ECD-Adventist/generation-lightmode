import { useState } from "react";
import { Zap, Clock, Users, Star, CheckCircle } from "lucide-react";

const challenges = [
  {
    id: 1, title: "#LightOverLust", category: "Purity", difficulty: "Warrior",
    duration: "14 Days", participants: 18450, points: 200,
    description: "A purity & identity campaign. Choose Jesus over digital darkness and lust. Reclaim your feed.",
    color: "#00CFFF", badge: "🛡️",
    tasks: ["Day 1: Post your commitment to purity", "Day 7: Fast from social media for 24h", "Day 14: Share a victory testimony"],
  },
  {
    id: 2, title: "#GlowInTheDark", category: "Mental Health", difficulty: "Starter",
    duration: "7 Days", participants: 24200, points: 150,
    description: "Mental health and hope campaign. Be a light for someone struggling with anxiety or depression.",
    color: "#8A5CFF", badge: "🌟",
    tasks: ["Share a verse of hope for the anxious", "Check in on 3 friends privately", "Post a raw testimony of overcoming"],
  },
  {
    id: 3, title: "#FaithOnFridays", category: "Testimony", difficulty: "Starter",
    duration: "Weekly", participants: 45000, points: 50,
    description: "Every Friday, flood the internet with short, authentic testimonies of what God did this week.",
    color: "#FFD000", badge: "🔥",
    tasks: ["Reflect on your week", "Record a 30-sec testimony video", "Post with #FaithOnFridays"],
  },
  {
    id: 4, title: "#LitForLife", category: "Outreach", difficulty: "Trendsetter",
    duration: "30 Days", participants: 12000, points: 300,
    description: "Choosing Jesus over peer pressure. Stand boldly for your values at school and online.",
    color: "#1DA1FF", badge: "⚡",
    tasks: ["Start a GlowGroup at school", "Post your 'Why I Follow Jesus' story", "Invite 2 peers to your GlowGroup"],
  },
  {
    id: 5, title: "Switch It On Summit", category: "Event", difficulty: "Champion",
    duration: "1 Day", participants: 5000, points: 300,
    description: "Attend or host a LightMode gathering in your city. Bring your GlowGroup and celebrate together.",
    color: "#FFD000", badge: "🏆",
    tasks: ["Register your city", "Invite your GlowGroup", "Document your Summit moment"],
  },
  {
    id: 6, title: "GlowDrop Consistency", category: "Devotional", difficulty: "Champion",
    duration: "30 Days", participants: 8500, points: 400,
    description: "Drop a daily 'Glow Drop' — a Bible verse with reflection — for an entire month.",
    color: "#8A5CFF", badge: "📖",
    tasks: ["Create your Glow Drop template", "Post consistently for 30 days", "Earn your Bronze Glow Pin"],
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
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/f58fb7f4b_LOGO02ALL.png"
              alt="LightMode"
              style={{ height: 56, width: "auto", filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Zap className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Globe className="w-4 h-4" /><span className="hidden sm:inline">Reach</span>
            </Link>
            <Link to={createPageUrl("Notifications")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Bell className="w-4 h-4" /><span className="hidden sm:inline">Alerts</span>
            </Link>
            <Link to={createPageUrl("Profile")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <User className="w-4 h-4" /><span className="hidden sm:inline">Profile</span>
            </Link>
            <Link to={createPageUrl("Home")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-[#00CFFF] hover:bg-white/5 transition text-sm font-medium border border-white/5">
              <Globe className="w-4 h-4" /> Website
            </Link>
          </div>
        </div>
      </div>

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