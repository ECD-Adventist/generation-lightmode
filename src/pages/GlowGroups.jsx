import { useState } from "react";
import { Users, MapPin, Globe, Search, ChevronRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

const groups = [
  { name: "Lagos Light Warriors", location: "Lagos, Nigeria", members: 48, region: "Africa", focus: "Campus Outreach", color: "#00CFFF", rank: "Champion" },
  { name: "UK Glow Collective", location: "London, UK", members: 35, region: "Europe", focus: "Digital Evangelism", color: "#8A5CFF", rank: "Trendsetter" },
  { name: "Dallas Glow Starters", location: "Dallas, USA", members: 62, region: "Americas", focus: "Youth Ministry", color: "#FFD000", rank: "Champion" },
  { name: "Manila LightMode", location: "Manila, Philippines", members: 29, region: "Asia", focus: "Prayer & Worship", color: "#00CFFF", rank: "Warrior" },
  { name: "Nairobi Radiant", location: "Nairobi, Kenya", members: 44, region: "Africa", focus: "Community Service", color: "#1DA1FF", rank: "Trendsetter" },
  { name: "São Paulo Glow", location: "São Paulo, Brazil", members: 38, region: "Americas", focus: "Social Media Mission", color: "#8A5CFF", rank: "Warrior" },
];

const rankColors = { Champion: "#FFD000", Trendsetter: "#8A5CFF", Warrior: "#1DA1FF", Starter: "#00CFFF" };

const howItWorks = [
  { step: "01", title: "Find or Create", desc: "Search for a GlowGroup in your city or start your own with just a few clicks.", icon: "🔍" },
  { step: "02", title: "Connect & Commit", desc: "Join the group, meet your accountability partners, and commit to the mission.", icon: "🤝" },
  { step: "03", title: "Complete Challenges", desc: "Do challenges together, support each other, and earn group XP.", icon: "⚡" },
  { step: "04", title: "Climb the Ranks", desc: "As a group grows in faith and activity, your collective rank rises.", icon: "🏆" },
];

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function GlowGroups() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("groups"); // "groups" | "members"
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user
  });

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      if (!user) { toast.error("Please log in to follow"); throw new Error("Not logged in"); }
      const isFollowing = following.some(f => f.following_email === targetEmail);
      if (isFollowing) {
        const followRecord = following.find(f => f.following_email === targetEmail);
        await base44.entities.Follow.delete(followRecord.id);
      } else {
        await base44.entities.Follow.create({ follower_email: user.email, following_email: targetEmail });
        await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + 5 });
      }
      return isFollowing;
    },
    onSuccess: (wasFollowing) => {
      queryClient.invalidateQueries({ queryKey: ["following", user?.email] });
      if (!wasFollowing) {
        toast.success("Followed! +5 XP ⚡");
      }
    }
  });

  const { data: realGroups = [] } = useQuery({
    queryKey: ["allGroups"],
    queryFn: () => base44.entities.GlowGroup.list(),
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ["myMemberships", user?.email],
    queryFn: () => base44.entities.GlowGroupMember.filter({ user_email: user?.email }),
    enabled: !!user
  });

  const joinMutation = useMutation({
    mutationFn: async (groupId) => {
      if (!user) throw new Error("Not logged in");
      const isMember = myMemberships.some(m => m.group_id === groupId);
      if (isMember) {
        const memberRecord = myMemberships.find(m => m.group_id === groupId);
        await base44.entities.GlowGroupMember.delete(memberRecord.id);
      } else {
        await base44.entities.GlowGroupMember.create({ user_email: user.email, group_id: groupId });
        await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + 20 });
      }
      return isMember;
    },
    onSuccess: (wasMember) => {
      queryClient.invalidateQueries({ queryKey: ["myMemberships", user?.email] });
      if (!wasMember) {
        toast.success("Joined group! +20 XP ⚡");
      } else {
        toast.success("Left group.");
      }
    }
  });

  const combinedGroups = [...realGroups.map(g => ({...g, members: g.members || 1, region: g.country || "Global", focus: g.description || "Community", color: "#00CFFF", rank: "Starter"})), ...groups.map(g => ({...g, id: g.name, isMock: true}))];

  const regions = ["all", ...new Set(combinedGroups.map(g => g.region))];
  const filtered = combinedGroups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || (g.location || g.country || "").toLowerCase().includes(search.toLowerCase());
    const matchRegion = regionFilter === "all" || g.region === regionFilter;
    return matchSearch && matchRegion;
  });

  return (
    <div style={{ background: "#0B0F1A" }}>
      {/* HERO */}
      <section style={{ padding: "100px 24px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(138,92,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", right: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,207,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(138,92,255,0.1)", border: "1px solid rgba(138,92,255,0.3)", borderRadius: 50, padding: "8px 20px", marginBottom: 24 }}>
            <Users size={14} color="#8A5CFF" />
            <span style={{ color: "#8A5CFF", fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>GlowGroups</span>
          </div>
          <h1 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 64px)", marginBottom: 20 }}>
            No One Shines <span className="glm-gradient-text">Alone</span>
          </h1>
          <p className="glm-body" style={{ fontSize: 17, maxWidth: 620, margin: "0 auto 40px" }}>
            GlowGroups are small accountability communities that grow together, challenge together, and light up East-Central Africa together. Find yours or start one today. <span style={{ color: "#FFD000", fontWeight: 700 }}>Faith. Always On.</span>
          </p>
          <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" }}>
            {[{ label: "Active Groups", value: "500+", color: "#00CFFF" }, { label: "Nations", value: "12", color: "#FFD000" }, { label: "Members Worldwide", value: "28K+", color: "#8A5CFF" }].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div className="glm-headline" style={{ fontSize: 32, color: s.color }}>{s.value}</div>
                <div className="glm-body" style={{ fontSize: 13 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* HOW IT WORKS */}
      <section style={{ padding: "80px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(24px, 3vw, 40px)", marginBottom: 48 }}>How GlowGroups Work</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
            {howItWorks.map(step => (
              <div key={step.step} className="glm-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{step.icon}</div>
                <div style={{ color: "#00CFFF", fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>STEP {step.step}</div>
                <h3 className="glm-headline" style={{ fontSize: 18, marginBottom: 10 }}>{step.title}</h3>
                <p className="glm-body" style={{ fontSize: 14 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* SEARCH & FILTER */}
      <section style={{ padding: "60px 24px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          
          {/* Tabs */}
          <div style={{ display: "flex", gap: 16, marginBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16 }}>
            <button 
              onClick={() => setActiveTab("groups")}
              style={{
                background: "transparent", border: "none", color: activeTab === "groups" ? "#00CFFF" : "#C8D0E0",
                fontSize: 18, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", cursor: "pointer",
                position: "relative"
              }}
            >
              Groups
              {activeTab === "groups" && <div style={{ position: "absolute", bottom: -17, left: 0, right: 0, height: 2, background: "#00CFFF" }} />}
            </button>
            <button 
              onClick={() => setActiveTab("members")}
              style={{
                background: "transparent", border: "none", color: activeTab === "members" ? "#00CFFF" : "#C8D0E0",
                fontSize: 18, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", cursor: "pointer",
                position: "relative"
              }}
            >
              Members
              {activeTab === "members" && <div style={{ position: "absolute", bottom: -17, left: 0, right: 0, height: 2, background: "#00CFFF" }} />}
            </button>
            <button 
              onClick={() => setActiveTab("leaders")}
              style={{
                background: "transparent", border: "none", color: activeTab === "leaders" ? "#FFD000" : "#C8D0E0",
                fontSize: 18, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", cursor: "pointer",
                position: "relative"
              }}
            >
              Light Leaders
              {activeTab === "leaders" && <div style={{ position: "absolute", bottom: -17, left: 0, right: 0, height: 2, background: "#FFD000" }} />}
            </button>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 32 }}>
            <div style={{ flex: "1 1 300px", position: "relative" }}>
              <Search size={18} color="#C8D0E0" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={activeTab === "groups" ? "Search groups by name or location..." : "Search members by name..."}
                style={{
                  width: "100%", padding: "14px 16px 14px 48px",
                  background: "#121826", border: "1px solid rgba(0,207,255,0.2)",
                  borderRadius: 50, color: "#FFFFFF", fontSize: 15, fontFamily: "Inter, sans-serif",
                  outline: "none",
                }}
              />
            </div>
            {activeTab === "groups" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {regions.map(r => (
                  <button key={r} onClick={() => setRegionFilter(r)} style={{
                    padding: "10px 20px", borderRadius: 50,
                    border: `1px solid ${regionFilter === r ? "#8A5CFF" : "rgba(255,255,255,0.1)"}`,
                    background: regionFilter === r ? "rgba(138,92,255,0.15)" : "transparent",
                    color: regionFilter === r ? "#8A5CFF" : "#C8D0E0",
                    cursor: "pointer", fontSize: 14, fontFamily: "Inter, sans-serif", fontWeight: 500, transition: "all 0.2s",
                  }}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Groups Grid */}
          {activeTab === "groups" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, paddingBottom: 100 }}>
            {filtered.map(group => (
              <div key={group.name} className="glm-card" style={{ border: `1px solid ${group.color}25` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `linear-gradient(135deg, ${group.color}30, ${group.color}10)`,
                    border: `1px solid ${group.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>✨</div>
                  <span style={{ background: `${rankColors[group.rank]}15`, color: rankColors[group.rank], fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 50, fontFamily: "Inter, sans-serif", border: `1px solid ${rankColors[group.rank]}30` }}>
                    {group.rank}
                  </span>
                </div>
                <h3 className="glm-headline" style={{ fontSize: 19, color: "#FFFFFF", marginBottom: 8 }}>{group.name}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <MapPin size={13} color="#C8D0E0" />
                  <span className="glm-body" style={{ fontSize: 13 }}>{group.location}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  <Globe size={13} color={group.color} />
                  <span style={{ color: group.color, fontSize: 13, fontFamily: "Inter, sans-serif" }}>{group.focus}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex" }}>
                      {[...Array(Math.min(4, group.members))].map((_, i) => (
                        <div key={i} style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg, ${group.color}60, ${group.color}30)`, border: "2px solid #0B0F1A", marginLeft: i > 0 ? -8 : 0, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>👤</div>
                      ))}
                    </div>
                    <span className="glm-body" style={{ fontSize: 13 }}>{group.members} members</span>
                  </div>
                  <button 
                    onClick={() => joinMutation.mutate(group.id)}
                    style={{ color: group.color || "#00CFFF", background: "transparent", border: "none", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                    {myMemberships.some(m => m.group_id === group.id) ? "Leave" : "Join"} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* Create Group CTA */}
            <div style={{ background: "rgba(0,207,255,0.03)", border: "2px dashed rgba(0,207,255,0.2)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", cursor: "pointer", transition: "all 0.3s", minHeight: 200 }}
              onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(0,207,255,0.5)"; e.currentTarget.style.background = "rgba(0,207,255,0.06)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(0,207,255,0.2)"; e.currentTarget.style.background = "rgba(0,207,255,0.03)"; }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✨</div>
              <h3 className="glm-headline" style={{ fontSize: 18, color: "#00CFFF", marginBottom: 8 }}>Start a GlowGroup</h3>
              <p className="glm-body" style={{ fontSize: 14, marginBottom: 16 }}>Don't see one near you? Create your own and invite your people.</p>
              <a href={createPageUrl("Dashboard")} className="glm-btn-primary" style={{ fontSize: 14, padding: "10px 24px" }}>Create Group ⚡</a>
            </div>
          </div>
          )}

          {/* Leaders Grid */}
          {activeTab === "leaders" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 100, maxWidth: 800, margin: "0 auto" }}>
              {users.sort((a, b) => (b.glow_score || 0) - (a.glow_score || 0)).slice(0, 50).map((u, index) => {
                const isFollowing = following.some(f => f.following_email === u.email);
                return (
                  <div key={u.id} className="glm-card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", border: index < 3 ? "1px solid rgba(255,208,0,0.4)" : "1px solid rgba(255,255,255,0.05)", background: index === 0 ? "rgba(255,208,0,0.05)" : "#121826" }}>
                    <div style={{ fontSize: 24, fontWeight: "bold", color: index === 0 ? "#FFD000" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : "#8A5CFF", width: 40, textAlign: "center", fontFamily: "Space Grotesk, sans-serif" }}>
                      #{index + 1}
                    </div>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1a2235", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: index < 3 ? "2px solid #FFD000" : "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
                      {u.profile_picture_url ? <img src={u.profile_picture_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 20, fontWeight: "bold", color: "#C8D0E0" }}>{u.full_name?.charAt(0)}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 600, color: "#FFF", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.full_name} {index === 0 && "👑"}</h4>
                      <p style={{ fontSize: 12, color: "#8A5CFF" }}>{u.country || "Global Believer"}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: "bold", color: "#FFD000", fontFamily: "Space Grotesk, sans-serif" }}>{u.glow_score || 0}</div>
                      <div style={{ fontSize: 10, color: "#C8D0E0", textTransform: "uppercase", letterSpacing: 1 }}>XP</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Members Grid */}
          {activeTab === "members" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20, paddingBottom: 100 }}>
              {users.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase()) && u.email !== user?.email).map(u => {
                const isFollowing = following.some(f => f.following_email === u.email);
                return (
                  <div key={u.id} className="glm-card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1a2235", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
                      {u.profile_picture_url ? <img src={u.profile_picture_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 20, fontWeight: "bold", color: "#C8D0E0" }}>{u.full_name?.charAt(0)}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 600, color: "#FFF", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.full_name}</h4>
                      <p style={{ fontSize: 12, color: "#8A5CFF" }}>{u.country || "Global Believer"}</p>
                    </div>
                    <button 
                      onClick={() => followMutation.mutate(u.email)}
                      style={{
                        padding: "8px 16px", borderRadius: 50,
                        background: isFollowing ? "transparent" : "#00CFFF",
                        border: isFollowing ? "1px solid #C8D0E0" : "none",
                        color: isFollowing ? "#C8D0E0" : "#0B0F1A",
                        fontSize: 12, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif",
                        cursor: "pointer", transition: "all 0.2s"
                      }}
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </button>
                  </div>
                );
              })}
              {users.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase()) && u.email !== user?.email).length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0", color: "#C8D0E0" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                  <p>No members found matching "{search}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}