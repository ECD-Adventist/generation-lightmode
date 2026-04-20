import { useState, useEffect, useRef } from "react";
import { Users, MapPin, Search, UserPlus, UserCheck, Star, Zap, Globe, Plus, ChevronRight, Home, Bell, User, Video, Loader2, MessageCircle } from "lucide-react";
import GroupSessionsPanel from "@/components/groups/GroupSessionsPanel";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { isNotificationEnabled } from "@/lib/notifications";
import AppFooter from "@/components/AppFooter";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/mobile/PullToRefreshIndicator";

const rankColors = { Champion: "#FFD000", Trendsetter: "#8A5CFF", Warrior: "#1DA1FF", Starter: "#00CFFF" };

export default function GlowGroups() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("groups"); // "people" | "groups" | "leaders"
  const [authChecked, setAuthChecked] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(scrollRef, async () => {
    await queryClient.invalidateQueries({ queryKey: ["allGroups"] });
    await queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    await queryClient.invalidateQueries({ queryKey: ["myMemberships", user?.email] });
    await queryClient.invalidateQueries({ queryKey: ["myJoinRequests", user?.email] });
    await queryClient.invalidateQueries({ queryKey: ["following", user?.email] });
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (!isAuth) base44.auth.redirectToLogin(window.location.pathname);
      else setAuthChecked(true);
    });
  }, []);

  // Auto-redirect to dedicated GroupChat page when ?group=<id> is present
  useEffect(() => {
    if (!authChecked) return;
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get("group");
    if (groupId) {
      navigate(createPageUrl("GroupChat") + `?id=${encodeURIComponent(groupId)}`, { replace: true });
    }
  }, [authChecked, navigate]);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    enabled: authChecked,
  });

  const { data: users = [], isError: usersError } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke('listPublicUsers', {});
      return res.data;
    },
    retry: 2,
  });

  const { data: drops = [] } = useQuery({
    queryKey: ["allGlowDrops"],
    queryFn: () => base44.entities.GlowDrop.list('-created_date', 50),
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user
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

  const { data: myJoinRequests = [] } = useQuery({
    queryKey: ["myJoinRequests", user?.email],
    queryFn: () => base44.entities.GlowGroupJoinRequest.filter({ user_email: user?.email }),
    enabled: !!user
  });

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      if (!user) { toast.error("Please log in to follow"); throw new Error("Not logged in"); }
      const isFollowing = following.some(f => f.following_email === targetEmail);
      if (isFollowing) {
        const rec = following.find(f => f.following_email === targetEmail);
        await base44.entities.Follow.delete(rec.id);
      } else {
        await base44.entities.Follow.create({ follower_email: user.email, following_email: targetEmail });
        const targetUser = users.find(u => u.email === targetEmail);
        if (isNotificationEnabled(targetUser, "follows")) {
          await base44.entities.Notification.create({
            user_email: targetEmail,
            type: "follow",
            message: `${user.full_name || 'Someone'} started following you.`,
            link: createPageUrl("Profile") + `?user=${encodeURIComponent(user.email)}`
          });
        }
        await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + 5 });
      }
      return isFollowing;
    },
    onSuccess: (wasFollowing) => {
      queryClient.invalidateQueries({ queryKey: ["following", user?.email] });
      if (!wasFollowing) toast.success("Connected! +5 XP ⚡");
    }
  });

  const joinMutation = useMutation({
    mutationFn: async (group) => {
      if (!user) { toast.error("Please log in"); throw new Error("Not logged in"); }
      const isMember = myMemberships.some(m => m.group_id === group.id);
      if (isMember) {
        const rec = myMemberships.find(m => m.group_id === group.id);
        await base44.entities.GlowGroupMember.delete(rec.id);
        return { action: "left" };
      }
      // Leader auto-joins their own group
      if (group.leader_email === user.email) {
        await base44.entities.GlowGroupMember.create({ user_email: user.email, group_id: group.id });
        return { action: "joined" };
      }
      // Already has a pending request?
      const pending = myJoinRequests.find(r => r.group_id === group.id && r.status === "pending");
      if (pending) return { action: "already_pending" };

      // Create a join request
      await base44.entities.GlowGroupJoinRequest.create({
        user_email: user.email,
        group_id: group.id,
        status: "pending",
      });
      // Notify leader
      await base44.entities.Notification.create({
        user_email: group.leader_email,
        type: "system",
        message: `${user.full_name || "Someone"} requested to join your group "${group.name}".`,
        link: `/GroupChat?id=${group.id}`,
      }).catch(() => {});
      return { action: "requested" };
    },
    onSuccess: ({ action }) => {
      queryClient.invalidateQueries({ queryKey: ["myMemberships", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["myJoinRequests", user?.email] });
      if (action === "left") toast.success("Left group.");
      else if (action === "joined") toast.success("Joined group! +20 XP ⚡");
      else if (action === "requested") toast.success("Request sent. Awaiting leader approval. ⏳");
      else if (action === "already_pending") toast("Your request is pending approval.", { icon: "⏳" });
    }
  });

  const filteredUsers = users.filter(u =>
    u.email !== user?.email &&
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) || (u.country || "").toLowerCase().includes(search.toLowerCase()))
  );

  const filteredGroups = realGroups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) || (g.country || "").toLowerCase().includes(search.toLowerCase())
  );

  const sortedLeaders = [...users].sort((a, b) => (b.glow_score || 0) - (a.glow_score || 0)).slice(0, 50);

  // Get drop count per user
  const dropCountByUser = {};
  drops.forEach(d => { dropCountByUser[d.user_email] = (dropCountByUser[d.user_email] || 0) + 1; });

  const tabs = [
    { id: "people", label: "People", icon: Users },
    { id: "groups", label: "GlowGroups", icon: Globe },
    { id: "sessions", label: "Sessions", icon: Video },
    { id: "leaders", label: "Light Leaders", icon: Star },
  ];

  if (!authChecked || !user) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>;
  }

  return (
    <div ref={scrollRef} className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D", overflowY: "auto" }}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={threshold} />
      {/* Top Nav Bar */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.9)", borderColor: "#E2E8F0" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png"
              alt="LightMode"
              style={{ height: 48, width: "auto" }}
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
              { to: "Dashboard", icon: <Zap className="w-4 h-4" />, label: "Dashboard" },
              { to: "Notifications", icon: <Bell className="w-4 h-4" />, label: "Alerts" },
              { to: "Profile", icon: <User className="w-4 h-4" />, label: "Profile" },
            ].map(item => (
              <Link key={item.to} to={createPageUrl(item.to)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-sm font-semibold" style={{ color: "#4A5878" }}
                onMouseOver={e => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5878"; }}
              >
                {item.icon}<span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="border-b sticky top-[57px] z-10 px-4 pt-6 pb-0 backdrop-blur-xl" style={{ background: "rgba(246, 248, 252, 0.95)", borderColor: "#E6ECF5" }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-black mb-4" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#0B1B3D" }}>
            Explore
          </h1>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#1FB8FF" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={activeTab === "groups" ? "Search communities..." : "Search people..."}
              className="w-full rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none transition"
              style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                className="flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all"
                style={activeTab === tab.id
                  ? { borderColor: "#0B3FD9", color: "#0B3FD9" }
                  : { borderColor: "transparent", color: "#6B7FA0" }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* PEOPLE TAB */}
        {activeTab === "people" && (
          <div className="space-y-3">
            {filteredUsers.length === 0 && (
              <div className="text-center py-20" style={{ color: "#8A97B5" }}>
                <div className="text-4xl mb-3">🔍</div>
                <p>No people found.</p>
              </div>
            )}
            {filteredUsers.map(u => {
              const isFollowing = following.some(f => f.following_email === u.email);
              const userDrops = dropCountByUser[u.email] || 0;
              return (
                <div key={u.id} className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}>
                  <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`} className="flex items-center gap-4 flex-1 min-w-0 no-underline">
                    <div className="w-14 h-14 rounded-full p-[2px] shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)" }}>
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-lg" style={{ background: "#FFFFFF" }}>
                        <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: "#0B1B3D" }}>{u.full_name}</div>
                      <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: "#6B7FA0" }}>
                        {u.country && <><MapPin className="w-3 h-3 inline" /> {u.country}</>}
                        {u.country && <span>·</span>}
                        <span>{userDrops} drops</span>
                        {(u.glow_score > 0) && <><span>·</span><Zap className="w-3 h-3 inline" style={{ color: "#CC7A00" }} /><span className="font-bold" style={{ color: "#CC7A00" }}>{u.glow_score} XP</span></>}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => followMutation.mutate(u.email)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0"
                    style={isFollowing
                      ? { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }
                      : { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.25)" }}
                  >
                    {isFollowing ? <><UserCheck className="w-3.5 h-3.5" /> Following</> : <><UserPlus className="w-3.5 h-3.5" /> Connect</>}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === "groups" && (
          <div className="space-y-4">
            {/* Create Group CTA */}
            <button onClick={() => setIsCreateOpen(true)} className="w-full flex items-center gap-3 rounded-2xl p-4 transition-all group hover:-translate-y-0.5 text-left" style={{ background: "rgba(31, 184, 255, 0.06)", border: "1px dashed #B8E5FF" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(31, 184, 255, 0.12)" }}>
                <Plus className="w-5 h-5" style={{ color: "#0B3FD9" }} />
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: "#0B3FD9" }}>Start a GlowGroup</div>
                <div className="text-xs" style={{ color: "#6B7FA0" }}>Create your own accountability community</div>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "#0B3FD9" }} />
            </button>

            {filteredGroups.length === 0 && (
              <div className="text-center py-16" style={{ color: "#8A97B5" }}>
                <div className="text-4xl mb-3">👥</div>
                <p>No groups found. Be the first to create one!</p>
              </div>
            )}

            {filteredGroups.map(group => {
              const isMember = myMemberships.some(m => m.group_id === group.id);
              const hasPending = myJoinRequests.some(r => r.group_id === group.id && r.status === "pending");
              return (
                <div key={group.id} className="flex items-center gap-4 rounded-2xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: "linear-gradient(135deg, rgba(31,184,255,0.1), rgba(11,63,217,0.08))", border: "1px solid #D6E4FF" }}>
                    ✨
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate" style={{ color: "#0B1B3D" }}>{group.name}</div>
                    <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#6B7FA0" }}>
                      <MapPin className="w-3 h-3" /> {group.country || "Global"}
                    </div>
                    {group.description && (
                      <div className="text-xs mt-1 line-clamp-1" style={{ color: "#4A5878" }}>{group.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isMember && (
                      <button
                        onClick={() => navigate(createPageUrl("GroupChat") + `?id=${encodeURIComponent(group.id)}`)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all"
                        style={{ background: "rgba(31, 184, 255, 0.1)", color: "#0B3FD9", border: "1px solid #B8E5FF" }}
                        title="Open group chat"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Chat</span>
                      </button>
                    )}
                    <button
                      onClick={() => joinMutation.mutate(group)}
                      disabled={hasPending && !isMember}
                      className="px-4 py-2 rounded-full text-xs font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      style={isMember
                        ? { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }
                        : hasPending
                        ? { background: "#FFF8E6", border: "1px solid #FFE4A0", color: "#CC7A00" }
                        : { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.25)" }}
                    >
                      {isMember ? "Leave" : hasPending ? "Pending" : "Request"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "sessions" && (
          <GroupSessionsPanel user={user} groups={realGroups} memberships={myMemberships} />
        )}

        {/* LIGHT LEADERS TAB */}
        {activeTab === "leaders" && (
          <div className="space-y-3">
            {sortedLeaders.map((u, index) => {
              const isFollowing = following.some(f => f.following_email === u.email);
              const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-4 rounded-2xl p-4 transition-all"
                  style={index === 0
                    ? { background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0" }
                    : { background: "#FFFFFF", border: "1px solid #E6ECF5" }}
                >
                  <div className="w-8 text-center shrink-0">
                    {medal
                      ? <span className="text-xl">{medal}</span>
                      : <span className="text-sm font-bold" style={{ color: "#8A97B5" }}>#{index + 1}</span>
                    }
                  </div>
                  <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`} className="flex items-center gap-4 flex-1 min-w-0 no-underline">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-base shrink-0" style={{ border: index < 3 ? "2px solid #FFD000" : "2px solid #E6ECF5", background: "#FFFFFF" }}>
                      <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: "#0B1B3D" }}>
                        {u.full_name} {index === 0 && "👑"}
                      </div>
                      <div className="text-xs" style={{ color: "#6B7FA0" }}>{u.country || "Global Believer"}</div>
                    </div>
                  </Link>
                  <div className="text-right shrink-0 mr-2">
                    <div className="text-lg font-black" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#CC7A00" }}>{u.glow_score || 0}</div>
                    <div className="text-[9px] uppercase tracking-widest" style={{ color: "#8A97B5" }}>XP</div>
                  </div>
                  {u.email !== user?.email && (
                    <button
                      onClick={() => followMutation.mutate(u.email)}
                      className="px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shrink-0"
                      style={isFollowing
                        ? { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }
                        : { border: "1px solid #1FB8FF", color: "#0B3FD9", background: "rgba(31, 184, 255, 0.08)" }}
                    >
                      {isFollowing ? "Following" : "Connect"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} user={user} />
      <AppFooter />
    </div>
  );
}