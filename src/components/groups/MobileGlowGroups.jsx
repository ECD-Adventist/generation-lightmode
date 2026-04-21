import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Search, X, Users, Globe, Video, Star, UserPlus, UserCheck,
  MapPin, Zap, Plus, MessageCircle, ChevronRight, Sparkles, Crown, Flame
} from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import GroupSessionsPanel from "@/components/groups/GroupSessionsPanel";

/**
 * Mobile-only GlowGroups — LightMode branded community hub.
 * Palette: cyan #1FB8FF, royal #0B3FD9, gold #FFD000, navy #0B1B3D.
 */
export default function MobileGlowGroups({
  user,
  users,
  drops,
  following,
  realGroups,
  myMemberships,
  myJoinRequests,
  followMutation,
  joinMutation,
  onOpenCreate,
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("groups"); // people | groups | sessions | leaders
  const navigate = useNavigate();
  const q = search.trim().toLowerCase();

  const dropCountByUser = useMemo(() => {
    const m = {};
    drops.forEach(d => { m[d.user_email] = (m[d.user_email] || 0) + 1; });
    return m;
  }, [drops]);

  const filteredUsers = useMemo(() => users.filter(u =>
    u.email !== user?.email &&
    (getDisplayName(u)?.toLowerCase().includes(q) || (u.country || "").toLowerCase().includes(q))
  ), [users, user, q]);

  const filteredGroups = useMemo(() => realGroups.filter(g =>
    g.name?.toLowerCase().includes(q) || (g.country || "").toLowerCase().includes(q)
  ), [realGroups, q]);

  const sortedLeaders = useMemo(
    () => [...users].sort((a, b) => (b.glow_score || 0) - (a.glow_score || 0)).slice(0, 50),
    [users]
  );

  const tabs = [
    { id: "groups", label: "Groups", icon: Globe },
    { id: "people", label: "People", icon: Users },
    { id: "sessions", label: "Live", icon: Video },
    { id: "leaders", label: "Leaders", icon: Star },
  ];

  return (
    <div className="min-h-screen font-['Inter'] relative overflow-hidden" style={{ background: "linear-gradient(180deg, #F6F8FC 0%, #EEF3FF 60%, #E2EBFF 100%)", color: "#0B1B3D" }}>
      <style>{`
        @keyframes mgg-float { 0%,100% { transform: translateY(0) scale(1); opacity: 0.18 } 50% { transform: translateY(-16px) scale(1.08); opacity: 0.32 } }
        .mgg-hide-scrollbar::-webkit-scrollbar { display: none; }
        .mgg-hide-scrollbar { scrollbar-width: none; }
      `}</style>

      {/* Ambient orbs */}
      <div className="absolute top-[25%] -left-10 w-48 h-48 rounded-full blur-[80px] pointer-events-none" style={{ background: "#1FB8FF", animation: "mgg-float 10s ease-in-out infinite" }} />
      <div className="absolute top-[60%] -right-10 w-56 h-56 rounded-full blur-[90px] pointer-events-none" style={{ background: "#FFD000", opacity: 0.18, animation: "mgg-float 14s ease-in-out infinite 2s" }} />

      {/* HERO */}
      <div className="relative overflow-hidden pt-6 pb-5 px-4" style={{ background: "linear-gradient(135deg, #0B3FD9 0%, #1FB8FF 100%)" }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-40" style={{ background: "#FFD000" }} />
        <div className="absolute -bottom-12 -left-10 w-48 h-48 rounded-full blur-3xl opacity-30" style={{ background: "#7FE0FF" }} />

        <div className="relative flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(10px)" }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Community</div>
            <h1 className="text-xl font-black font-['Space_Grotesk'] text-white leading-tight">GlowGroups</h1>
          </div>
          <button
            onClick={onOpenCreate}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-black active:scale-95 transition"
            style={{ background: "#FFD000", color: "#0B1B3D", boxShadow: "0 6px 16px rgba(255, 208, 0, 0.45)" }}
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>

        {/* Search pill */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#0B3FD9" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === "groups" ? "Search communities…" : "Search people…"}
            className="w-full rounded-full py-3 pl-11 pr-10 text-[14px] font-medium focus:outline-none"
            style={{ background: "#FFFFFF", color: "#0B1B3D", boxShadow: "0 8px 24px rgba(11, 27, 61, 0.18)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 px-3 py-2.5 backdrop-blur-xl" style={{ background: "rgba(246, 248, 252, 0.92)", borderBottom: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-1.5">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setSearch(""); }}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-[11px] font-black transition"
                style={isActive
                  ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.3)" }
                  : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-3 pb-10 pt-4">

        {/* GROUPS */}
        {activeTab === "groups" && (
          <div className="space-y-3">
            {/* Create CTA card */}
            <button
              onClick={onOpenCreate}
              className="w-full flex items-center gap-3 rounded-2xl p-4 text-left active:scale-[0.98] transition relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0B3FD9 0%, #1FB8FF 100%)", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.25)" }}
            >
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-50" style={{ background: "#FFD000" }} />
              <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)" }}>
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="font-black text-sm text-white font-['Space_Grotesk']">Start a GlowGroup</div>
                <div className="text-[11px] text-white/80">Build your own accountability community</div>
              </div>
              <ChevronRight className="relative w-4 h-4 text-white shrink-0" />
            </button>

            {filteredGroups.length === 0 ? (
              <EmptyState emoji="👥" title="No groups yet" subtitle="Be the first to create one!" />
            ) : filteredGroups.map(group => {
              const isMember = myMemberships.some(m => m.group_id === group.id);
              const hasPending = myJoinRequests.some(r => r.group_id === group.id && r.status === "pending");
              const memberCount = 0; // optional: compute if available
              return (
                <div key={group.id} className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.06)" }}>
                  {/* Cover strip */}
                  <div className="h-14 relative" style={{
                    background: group.cover_picture_url
                      ? `url(${group.cover_picture_url}) center/cover`
                      : "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)"
                  }}>
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.15) 100%)" }} />
                  </div>

                  <div className="px-3 pb-3 -mt-6 relative">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{
                        background: group.profile_picture_url ? `url(${group.profile_picture_url}) center/cover` : "linear-gradient(135deg, #FFD000, #FF9F1A)",
                        border: "3px solid #FFFFFF",
                        boxShadow: "0 4px 10px rgba(11, 63, 217, 0.15)"
                      }}>
                        {!group.profile_picture_url && "✨"}
                      </div>
                      <div className="flex-1 min-w-0 pt-6">
                        <div className="font-black text-sm truncate font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{group.name}</div>
                        <div className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "#6B7FA0" }}>
                          <MapPin className="w-3 h-3" /> {group.country || "Global"}
                          {group.privacy === "private" && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>🔒 Private</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {group.description && (
                      <p className="text-[12px] mt-2 line-clamp-2" style={{ color: "#4A5878" }}>{group.description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      {isMember && (
                        <button
                          onClick={() => navigate(createPageUrl("GroupChat") + `?id=${encodeURIComponent(group.id)}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-[12px] font-black transition active:scale-95"
                          style={{ background: "#EEF3FF", color: "#0B3FD9", border: "1px solid #B8E5FF" }}
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Open Chat
                        </button>
                      )}
                      <button
                        onClick={() => joinMutation.mutate(group)}
                        disabled={hasPending && !isMember}
                        className="flex-1 py-2 rounded-full text-[12px] font-black transition active:scale-95 disabled:opacity-70"
                        style={isMember
                          ? { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }
                          : hasPending
                          ? { background: "#FFF8E6", border: "1px solid #FFE4A0", color: "#CC7A00" }
                          : { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.3)" }}
                      >
                        {isMember ? "Leave" : hasPending ? "⏳ Pending" : "Request to Join"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PEOPLE */}
        {activeTab === "people" && (
          <div className="space-y-2.5">
            {filteredUsers.length === 0 ? (
              <EmptyState emoji="🔍" title="No people found" subtitle="Try a different search" />
            ) : filteredUsers.map(u => {
              const isFollowing = following.some(f => f.following_email === u.email);
              const userDrops = dropCountByUser[u.email] || 0;
              return (
                <div key={u.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}>
                  <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`} className="flex items-center gap-3 flex-1 min-w-0 no-underline">
                    <div className="w-12 h-12 rounded-full p-[2px] shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
                      <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF", border: "2px solid #FFFFFF" }}>
                        <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm truncate" style={{ color: "#0B1B3D" }}>{getDisplayName(u)}</div>
                      <div className="text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: "#6B7FA0" }}>
                        {u.country && <><MapPin className="w-2.5 h-2.5" /><span className="truncate max-w-[100px]">{u.country}</span></>}
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>{userDrops} drops</span>
                        {u.glow_score > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black flex items-center gap-0.5" style={{ background: "#FFF8E6", color: "#CC7A00" }}>
                            <Zap className="w-2.5 h-2.5" />{u.glow_score}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => followMutation.mutate(u.email)}
                    className="flex items-center justify-center w-10 h-10 rounded-full transition active:scale-90 shrink-0"
                    style={isFollowing
                      ? { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }
                      : { background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.3)" }}
                    title={isFollowing ? "Following" : "Connect"}
                  >
                    {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* SESSIONS */}
        {activeTab === "sessions" && (
          <GroupSessionsPanel user={user} groups={realGroups} memberships={myMemberships} />
        )}

        {/* LEADERS */}
        {activeTab === "leaders" && (
          <div className="space-y-2.5">
            {/* Top-3 podium */}
            {sortedLeaders.slice(0, 3).length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[sortedLeaders[1], sortedLeaders[0], sortedLeaders[2]].filter(Boolean).map((u, i) => {
                  const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
                  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
                  const isTop = rank === 1;
                  return (
                    <Link
                      key={u.email}
                      to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`}
                      className="no-underline rounded-2xl p-3 flex flex-col items-center relative overflow-hidden transition active:scale-[0.97]"
                      style={{
                        background: isTop
                          ? "linear-gradient(145deg, #FFD000 0%, #FF9F1A 100%)"
                          : "linear-gradient(145deg, #FFFFFF 0%, #F4F7FE 100%)",
                        border: isTop ? "none" : "1px solid #E6ECF5",
                        boxShadow: isTop ? "0 8px 20px rgba(255, 159, 26, 0.4)" : "0 4px 12px rgba(11, 63, 217, 0.06)",
                        transform: isTop ? "scale(1.05)" : undefined,
                      }}
                    >
                      {isTop && <Crown className="absolute top-1 right-1 w-4 h-4" style={{ color: "#FFFFFF" }} />}
                      <div className="text-2xl mb-1">{medal}</div>
                      <div className="w-12 h-12 rounded-full p-[2px] mb-1.5" style={{ background: isTop ? "#FFFFFF" : "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
                        <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF" }}>
                          <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="text-[11px] font-black text-center truncate w-full font-['Space_Grotesk']" style={{ color: isTop ? "#0B1B3D" : "#0B1B3D" }}>
                        {getDisplayName(u)?.split(" ")[0]}
                      </div>
                      <div className="flex items-center gap-0.5 mt-1 px-2 py-0.5 rounded-full" style={{ background: isTop ? "rgba(11, 27, 61, 0.15)" : "#EEF3FF" }}>
                        <Zap className="w-2.5 h-2.5" style={{ color: isTop ? "#0B1B3D" : "#0B3FD9" }} />
                        <span className="text-[10px] font-black" style={{ color: isTop ? "#0B1B3D" : "#0B3FD9" }}>{u.glow_score || 0}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Rest of leaders as rows */}
            {sortedLeaders.slice(3).map((u, index) => {
              const isFollowing = following.some(f => f.following_email === u.email);
              const position = index + 4;
              return (
                <div key={u.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                  <div className="w-7 text-center shrink-0">
                    <span className="text-xs font-black" style={{ color: "#8A97B5" }}>#{position}</span>
                  </div>
                  <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`} className="flex items-center gap-3 flex-1 min-w-0 no-underline">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ border: "2px solid #E6ECF5" }}>
                      <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[13px] truncate" style={{ color: "#0B1B3D" }}>{getDisplayName(u)}</div>
                      <div className="text-[10px] truncate" style={{ color: "#6B7FA0" }}>{u.country || "Global Believer"}</div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full shrink-0" style={{ background: "#FFF8E6" }}>
                    <Zap className="w-3 h-3" style={{ color: "#CC7A00" }} />
                    <span className="text-[11px] font-black" style={{ color: "#CC7A00" }}>{u.glow_score || 0}</span>
                  </div>
                  {u.email !== user?.email && (
                    <button
                      onClick={() => followMutation.mutate(u.email)}
                      className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition active:scale-90"
                      style={isFollowing
                        ? { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }
                        : { background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}
                    >
                      {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ emoji, title, subtitle }) {
  return (
    <div className="py-16 text-center rounded-2xl" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF" }}>
      <div className="text-4xl mb-2">{emoji}</div>
      <div className="text-sm font-bold mb-1" style={{ color: "#0B1B3D" }}>{title}</div>
      <div className="text-xs" style={{ color: "#8A97B5" }}>{subtitle}</div>
    </div>
  );
}