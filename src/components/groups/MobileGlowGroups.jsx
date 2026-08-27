import React, { useState, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Search, X, Users, Globe, Video, Star, UserPlus, UserCheck,
  MapPin, Zap, Plus, ChevronRight, Sparkles, Flame, Lock
} from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import GroupSessionsPanel from "@/components/groups/GroupSessionsPanel";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/mobile/PullToRefreshIndicator";

/**
 * Mobile-only GlowGroups — LightMode branded community hub (premium redesign).
 * Palette: cyan #1FB8FF, royal #0B3FD9, gold #FFD000, navy #0B1B3D.
 */
export default function MobileGlowGroups({
  user,
  users,
  systemUserCount,
  drops,
  following,
  hasMoreUsers,
  isLoadingMoreUsers,
  onLoadMoreUsers,
  realGroups,
  myMemberships,
  myJoinRequests,
  pendingRequestCounts = {},
  followMutation,
  joinMutation,
  onOpenCreate,
  onRefresh,
  onPeopleSearchChange,
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("groups"); // people | groups | sessions | leaders
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(scrollRef, async () => {
    await onRefresh?.();
  });
  const q = search.trim().toLowerCase();
  const firstName = user?.full_name?.split(" ")[0] || "Friend";

  useEffect(() => {
    if (activeTab === "people" || activeTab === "leaders") onPeopleSearchChange?.(search);
    else onPeopleSearchChange?.("");
  }, [activeTab, search, onPeopleSearchChange]);

  const dropCountByUser = useMemo(() => {
    const m = {};
    drops.forEach(d => {
      const authorEmail = d.user_email || d.created_by;
      if (authorEmail) m[authorEmail] = (m[authorEmail] || 0) + 1;
    });
    return m;
  }, [drops]);

  const filteredUsers = useMemo(() => users.filter(u => {
    if (u.id === user?.id) return false;
    if (!q) return true;
    return [getDisplayName(u), u.full_name, u.display_name, u.username, u.country, u.city, u.bio, u.leader_title]
      .some(value => (value || "").toLowerCase().includes(q));
  }), [users, user, q]);

  const filteredGroups = useMemo(() => realGroups.filter(g =>
    g.name?.toLowerCase().includes(q) || (g.country || "").toLowerCase().includes(q)
  ), [realGroups, q]);

  const myGroupIds = useMemo(() => new Set(myMemberships.map(m => m.group_id)), [myMemberships]);
  const myGroups = useMemo(() => realGroups.filter(g => myGroupIds.has(g.id)), [realGroups, myGroupIds]);
  const discoverGroups = useMemo(() => filteredGroups.filter(g => !myGroupIds.has(g.id)), [filteredGroups, myGroupIds]);

  const lightLeaders = useMemo(
    () => users
      .filter((entry) => entry.is_managed_leader)
      .filter((entry) => !q || [entry.full_name, entry.leader_title, entry.country, entry.bio]
        .some((value) => String(value || "").toLowerCase().includes(q)))
      .sort((a, b) => String(a.full_name || "").localeCompare(String(b.full_name || ""))),
    [users, q]
  );

  const tabs = [
    { id: "groups", label: "Groups", icon: Globe },
    { id: "people", label: "People", icon: Users },
    { id: "sessions", label: "Live", icon: Video },
    { id: "leaders", label: "Leaders", icon: Star },
  ];

  const stats = [
    { label: "Groups", value: realGroups.length, color: "#0B3FD9" },
    { label: "You joined", value: myMemberships.length, color: "#CC7A00" },
    { label: "System users", value: systemUserCount || users.length, color: "#1FB8FF" },
  ];

  return (
    <div ref={scrollRef} className="min-h-screen font-['Inter'] relative overflow-hidden overflow-y-auto overscroll-y-contain" style={{ background: "linear-gradient(180deg, #F6F8FC 0%, #EEF3FF 40%, #E2EBFF 100%)", color: "#0B1B3D" }}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={threshold} />
      <style>{`
        @keyframes mgg-float { 0%,100% { transform: translateY(0) scale(1); opacity: 0.22 } 50% { transform: translateY(-18px) scale(1.08); opacity: 0.4 } }
        @keyframes mgg-shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(260%) skewX(-20deg); }
        }
        @keyframes mgg-pulse-dot { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: 0.6 } }
        .mgg-hide-scrollbar::-webkit-scrollbar { display: none; }
        .mgg-hide-scrollbar { scrollbar-width: none; }
      `}</style>

      {/* HERO — extends under the status bar / camera notch */}
      <div className="relative overflow-hidden safe-pt pb-16 px-4" style={{
        background: "radial-gradient(ellipse at 20% 0%, #1FB8FF 0%, transparent 55%), radial-gradient(ellipse at 95% 100%, #FFD000 0%, transparent 45%), linear-gradient(135deg, #0A2E9F 0%, #0B3FD9 55%, #1563E8 100%)"
      }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "#FFD000", opacity: 0.25, animation: "mgg-float 9s ease-in-out infinite" }} />
        <div className="absolute -bottom-16 -left-12 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background: "#7FE0FF", opacity: 0.28, animation: "mgg-float 12s ease-in-out infinite 2s" }} />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: 0, width: "40%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), rgba(255,255,255,0.14), rgba(255,255,255,0.08), transparent)",
            animation: "mgg-shimmer 6s infinite ease-in-out",
          }} />
        </div>

        {/* Header row */}
        <div className="relative flex items-center gap-2 mb-4 pt-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.22)" }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/75">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FFD000", animation: "mgg-pulse-dot 2s ease-in-out infinite" }} />
              Community
            </div>
            <h1 className="text-[22px] font-black font-['Space_Grotesk'] text-white leading-tight">GlowGroups</h1>
          </div>
          <button
            onClick={onOpenCreate}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-black active:scale-95 transition"
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
            placeholder={activeTab === "groups" ? "Search communities…" : activeTab === "people" ? "Search people…" : activeTab === "leaders" ? "Top believers…" : "Search…"}
            className="w-full rounded-full py-3 pl-11 pr-10 text-[14px] font-medium focus:outline-none"
            style={{ background: "#FFFFFF", color: "#0B1B3D", boxShadow: "0 8px 24px rgba(11, 27, 61, 0.25)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* STATS CARD — floats over hero */}
      <div className="px-3 -mt-11 relative z-10 mb-4">
        <div className="grid grid-cols-3 rounded-[1.25rem] overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 10px 28px rgba(11, 63, 217, 0.15)" }}>
          {stats.map((s, i) => (
            <div key={s.label} className={`text-center py-3 ${i < stats.length - 1 ? "border-r" : ""}`} style={{ borderColor: "#EEF3FF" }}>
              <div className="text-lg font-black font-['Space_Grotesk']" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7FA0" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 px-3 py-2.5 backdrop-blur-xl" style={{ background: "rgba(246, 248, 252, 0.9)", borderBottom: "1px solid rgba(214, 228, 255, 0.7)" }}>
        <div className="flex items-center gap-1.5 overflow-x-auto mgg-hide-scrollbar">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setSearch(""); }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black whitespace-nowrap transition active:scale-95"
                style={isActive
                  ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.35)" }
                  : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5", boxShadow: "0 2px 6px rgba(11, 63, 217, 0.04)" }}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-3 pb-24 pt-4">

        {/* GROUPS */}
        {activeTab === "groups" && (
          <div className="space-y-5">

            {/* My Groups row (horizontal) */}
            {myGroups.length > 0 && !search && (
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "#CC7A00" }}>Your Groups</h3>
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: "#8A97B5" }}>{myGroups.length}</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto mgg-hide-scrollbar pb-1">
                  {myGroups.map(group => (
                    <button
                      key={group.id}
                      onClick={() => navigate(createPageUrl("GroupChat") + `?id=${encodeURIComponent(group.id)}`)}
                      className="shrink-0 w-[140px] rounded-2xl overflow-hidden active:scale-95 transition text-left"
                      style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.08)" }}
                    >
                      <div className="h-16 relative" style={{
                        background: group.cover_picture_url ? `url(${group.cover_picture_url}) center/cover` : "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)"
                      }}>
                        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.25) 100%)" }} />
                        <div className="absolute bottom-1.5 left-2 right-2 text-[9px] font-black uppercase tracking-wider text-white flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {group.country || "Global"}
                        </div>
                      </div>
                      <div className="p-2.5 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm" style={{
                          background: group.profile_picture_url ? `url(${group.profile_picture_url}) center/cover` : "linear-gradient(135deg, #FFD000, #FF9F1A)",
                          border: "2px solid #FFFFFF",
                        }}>
                          {!group.profile_picture_url && "✨"}
                        </div>
                        <div className="min-w-0"><div className="font-black text-[11px] truncate font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{group.name}</div>{pendingRequestCounts[group.id] > 0 && <div className="mt-0.5 text-[9px] font-bold" style={{ color: "#8A5700" }}>{pendingRequestCounts[group.id]} pending</div>}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create CTA card */}
            <button
              onClick={onOpenCreate}
              className="w-full flex items-center gap-3 rounded-2xl p-4 text-left active:scale-[0.98] transition relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0B3FD9 0%, #1FB8FF 100%)", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.3)" }}
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-50" style={{ background: "#FFD000" }} />
              <div className="absolute -bottom-6 -left-4 w-24 h-24 rounded-full blur-2xl opacity-30" style={{ background: "#FFFFFF" }} />
              <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="font-black text-sm text-white font-['Space_Grotesk']">Start a GlowGroup</div>
                <div className="text-xs text-white/80 mt-0.5">Build your accountability community</div>
              </div>
              <ChevronRight className="relative w-4 h-4 text-white shrink-0" />
            </button>

            {/* Discover section */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" style={{ color: "#0B3FD9" }} />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "#0B3FD9" }}>
                    {search ? "Results" : "Discover Groups"}
                  </h3>
                </div>
                <span className="text-[10px] font-bold" style={{ color: "#8A97B5" }}>{discoverGroups.length}</span>
              </div>

              {discoverGroups.length === 0 ? (
                <EmptyState emoji="🔍" title={search ? "No matches" : "All caught up"} subtitle={search ? "Try a different search" : "You've joined all available groups"} />
              ) : (
                <div className="space-y-3">
                  {discoverGroups.map(group => {
                    const hasPending = myJoinRequests.some(r => r.group_id === group.id && r.status === "pending");
                    return (
                      <div key={group.id} className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.06)" }}>
                        {/* Cover strip */}
                        <div className="h-20 relative" style={{
                          background: group.cover_picture_url
                            ? `url(${group.cover_picture_url}) center/cover`
                            : "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)"
                        }}>
                          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 100%)" }} />
                          {group.privacy === "private" && (
                            <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black backdrop-blur-md" style={{ background: "rgba(11, 27, 61, 0.55)", color: "#FFFFFF" }}>
                              <Lock className="w-2.5 h-2.5" /> Private
                            </span>
                          )}
                        </div>

                        <div className="px-3 pb-3 -mt-8 relative">
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{
                              background: group.profile_picture_url ? `url(${group.profile_picture_url}) center/cover` : "linear-gradient(135deg, #FFD000, #FF9F1A)",
                              border: "3px solid #FFFFFF",
                              boxShadow: "0 4px 14px rgba(11, 63, 217, 0.2)"
                            }}>
                              {!group.profile_picture_url && "✨"}
                            </div>
                            <div className="flex-1 min-w-0 pt-8">
                              <div className="font-black text-sm truncate font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{group.name}</div>
                              <div className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "#6B7FA0" }}>
                                <MapPin className="w-3 h-3" /> {group.country || "Global"}
                              </div>
                            </div>
                          </div>

                          {group.description && (
                            <p className="text-sm mt-2.5 line-clamp-2 leading-relaxed" style={{ color: "#4A5878" }}>{group.description}</p>
                          )}

                          {user?.role === "super_admin" ? (
                            <button
                              onClick={() => navigate(createPageUrl("GroupChat") + `?id=${encodeURIComponent(group.id)}`)}
                              className="w-full mt-3 py-2.5 rounded-full text-sm font-black transition active:scale-95"
                              style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.3)" }}
                            >
                              View Group
                            </button>
                          ) : (
                            <button
                              onClick={() => joinMutation.mutate(group)}
                              disabled={hasPending}
                              className="w-full mt-3 py-2.5 rounded-full text-sm font-black transition active:scale-95 disabled:opacity-70"
                              style={hasPending
                                ? { background: "#FFF8E6", border: "1px solid #FFE4A0", color: "#CC7A00" }
                                : { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.3)" }}
                            >
                              {hasPending ? "⏳ Request Pending" : group.privacy === "private" ? "Request to Join" : "Join Group"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PEOPLE */}
        {activeTab === "people" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between mb-1 px-1">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" style={{ color: "#0B3FD9" }} />
                <h3 className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "#0B3FD9" }}>People</h3>
              </div>
              <span className="text-[10px] font-bold" style={{ color: "#8A97B5" }}>{filteredUsers.length} shown · {systemUserCount || users.length} total</span>
            </div>

            {filteredUsers.length === 0 ? (
              <EmptyState emoji="🔍" title="No people found" subtitle="Search checks public names and locations" />
            ) : filteredUsers.map(u => {
              const targetId = String(u.id || "").replace(/^leader_/, "");
              const isFollowing = following.some(f => f.following_id === targetId);
              const userDrops = dropCountByUser[u.id] || 0;
              return (
                <div key={u.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}>
                  <Link to={createPageUrl("Profile") + (u.is_managed_leader ? `?user=${encodeURIComponent(u.email)}` : `?id=${encodeURIComponent(u.id)}`)} className="flex items-center gap-3 flex-1 min-w-0 no-underline">
                    <div className="w-12 h-12 rounded-full p-[2px] shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9, #FFD000)" }}>
                      <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF", border: "2px solid #FFFFFF" }}>
                        <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt="" width="48" height="48" loading="lazy" decoding="async" className="w-full h-full object-cover" />
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
                    onClick={() => followMutation.mutate(u)}
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
            {hasMoreUsers && (
              <button type="button" onClick={onLoadMoreUsers} disabled={isLoadingMoreUsers} className="w-full min-h-11 rounded-2xl text-sm font-bold disabled:opacity-60" style={{ background: "#FFFFFF", border: "1px solid #D6E4FF", color: "#0B3FD9" }}>
                {isLoadingMoreUsers ? "Loading…" : "Load More People"}
              </button>
            )}
          </div>
        )}

        {/* SESSIONS */}
        {activeTab === "sessions" && (
          <GroupSessionsPanel user={user} groups={realGroups} memberships={myMemberships} />
        )}

        {/* LEADERS — verified managed leader accounts only */}
        {activeTab === "leaders" && (
          <div className="space-y-2.5">
            {lightLeaders.length === 0 && <EmptyState emoji="☆" title="No verified leaders" subtitle="Try a different search" />}
            {lightLeaders.map((leader) => {
              const targetId = String(leader.id || "").replace(/^leader_/, "");
              const isFollowing = following.some((record) => record.following_id === targetId);
              return (
                <div key={leader.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                  <Link to={createPageUrl("Profile") + `?leader=${encodeURIComponent(targetId)}`} className="flex items-center gap-3 flex-1 min-w-0 no-underline">
                    <div className="w-11 h-11 rounded-full overflow-hidden shrink-0" style={{ border: "2px solid #FFD000" }}>
                      <img src={leader.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt={getDisplayName(leader)} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: "#0B1B3D" }}>{getDisplayName(leader)}</div>
                      <div className="text-[10px] truncate" style={{ color: "#CC7A00" }}>{leader.leader_title || "Light Leader"}</div>
                      <div className="text-[10px] truncate" style={{ color: "#6B7FA0" }}>{leader.country || "Global"}</div>
                    </div>
                  </Link>
                  <button onClick={() => followMutation.mutate(leader)} className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition active:scale-90" style={isFollowing ? { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" } : { background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }} aria-label={isFollowing ? "Following" : "Connect"}>
                    {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  </button>
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
    <div className="py-14 text-center rounded-2xl" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF" }}>
      <div className="text-4xl mb-2">{emoji}</div>
      <div className="text-sm font-bold mb-1" style={{ color: "#0B1B3D" }}>{title}</div>
      <div className="text-xs" style={{ color: "#8A97B5" }}>{subtitle}</div>
    </div>
  );
}