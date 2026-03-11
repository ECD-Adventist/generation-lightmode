import { useState } from "react";
import { Users, MapPin, Search, UserPlus, UserCheck, Star, Zap, Globe, Plus, ChevronRight, Home, Bell, User } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

const rankColors = { Champion: "#FFD000", Trendsetter: "#8A5CFF", Warrior: "#1DA1FF", Starter: "#00CFFF" };

export default function GlowGroups() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("people"); // "people" | "groups" | "leaders"
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [], isError: usersError } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
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

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      if (!user) { toast.error("Please log in to follow"); throw new Error("Not logged in"); }
      const isFollowing = following.some(f => f.following_email === targetEmail);
      if (isFollowing) {
        const rec = following.find(f => f.following_email === targetEmail);
        await base44.entities.Follow.delete(rec.id);
      } else {
        await base44.entities.Follow.create({ follower_email: user.email, following_email: targetEmail });
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
    mutationFn: async (groupId) => {
      if (!user) { toast.error("Please log in"); throw new Error("Not logged in"); }
      const isMember = myMemberships.some(m => m.group_id === groupId);
      if (isMember) {
        const rec = myMemberships.find(m => m.group_id === groupId);
        await base44.entities.GlowGroupMember.delete(rec.id);
      } else {
        await base44.entities.GlowGroupMember.create({ user_email: user.email, group_id: groupId });
        await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + 20 });
      }
      return isMember;
    },
    onSuccess: (wasMember) => {
      queryClient.invalidateQueries({ queryKey: ["myMemberships", user?.email] });
      toast.success(wasMember ? "Left group." : "Joined group! +20 XP ⚡");
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
    { id: "leaders", label: "Light Leaders", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0B0F1A] sticky top-0 z-10 px-4 pt-6 pb-0">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-black mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Explore
          </h1>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={activeTab === "groups" ? "Search communities..." : "Search people..."}
              className="w-full bg-[#121826] border border-white/10 rounded-full py-3 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00CFFF]/50 transition"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-[#00CFFF] text-[#00CFFF]"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
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
              <div className="text-center py-20 text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p>No people found.</p>
              </div>
            )}
            {filteredUsers.map(u => {
              const isFollowing = following.some(f => f.following_email === u.email);
              const userDrops = dropCountByUser[u.email] || 0;
              return (
                <div key={u.id} className="flex items-center gap-4 bg-[#121826] border border-white/5 rounded-2xl p-4 hover:border-[#00CFFF]/30 transition-all">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[2px] shrink-0">
                    <div className="w-full h-full rounded-full bg-[#121826] overflow-hidden flex items-center justify-center font-bold text-lg text-white">
                      {u.profile_picture_url
                        ? <img src={u.profile_picture_url} className="w-full h-full object-cover" />
                        : u.full_name?.charAt(0)}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">{u.full_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      {u.country && <><MapPin className="w-3 h-3 inline" /> {u.country}</>}
                      {u.country && <span>·</span>}
                      <span>{userDrops} drops</span>
                      {(u.glow_score > 0) && <><span>·</span><Zap className="w-3 h-3 inline text-[#FFD000]" /><span className="text-[#FFD000] font-bold">{u.glow_score} XP</span></>}
                    </div>
                  </div>
                  {/* Action */}
                  <button
                    onClick={() => followMutation.mutate(u.email)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                      isFollowing
                        ? "bg-white/10 text-gray-300 hover:bg-red-500/20 hover:text-red-400"
                        : "bg-[#00CFFF] text-black hover:bg-white"
                    }`}
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
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 bg-[#00CFFF]/5 border border-dashed border-[#00CFFF]/30 rounded-2xl p-4 hover:border-[#00CFFF]/60 hover:bg-[#00CFFF]/10 transition-all group">
              <div className="w-10 h-10 rounded-full bg-[#00CFFF]/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#00CFFF]" />
              </div>
              <div>
                <div className="font-bold text-[#00CFFF] text-sm">Start a GlowGroup</div>
                <div className="text-xs text-gray-500">Create your own accountability community</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#00CFFF] ml-auto" />
            </Link>

            {filteredGroups.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">👥</div>
                <p>No groups found. Be the first to create one!</p>
              </div>
            )}

            {filteredGroups.map(group => {
              const isMember = myMemberships.some(m => m.group_id === group.id);
              return (
                <div key={group.id} className="flex items-center gap-4 bg-[#121826] border border-white/5 rounded-2xl p-4 hover:border-[#8A5CFF]/40 transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8A5CFF]/30 to-[#00CFFF]/20 flex items-center justify-center text-2xl shrink-0 border border-white/10">
                    ✨
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">{group.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {group.country || "Global"}
                    </div>
                    {group.description && (
                      <div className="text-xs text-gray-400 mt-1 line-clamp-1">{group.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => joinMutation.mutate(group.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                      isMember
                        ? "bg-white/10 text-gray-300 hover:bg-red-500/20 hover:text-red-400"
                        : "bg-[#8A5CFF] text-white hover:bg-[#7a4de6]"
                    }`}
                  >
                    {isMember ? "Leave" : "Join"}
                  </button>
                </div>
              );
            })}
          </div>
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
                  className={`flex items-center gap-4 rounded-2xl p-4 border transition-all ${
                    index === 0 ? "bg-[#FFD000]/5 border-[#FFD000]/30" :
                    index < 3 ? "bg-[#121826] border-white/10" :
                    "bg-[#121826] border-white/5"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center shrink-0">
                    {medal
                      ? <span className="text-xl">{medal}</span>
                      : <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                    }
                  </div>
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-base shrink-0 border-2 ${index < 3 ? "border-[#FFD000]" : "border-white/10"} bg-[#1a2235]`}>
                    {u.profile_picture_url
                      ? <img src={u.profile_picture_url} className="w-full h-full object-cover" />
                      : <span className="text-white">{u.full_name?.charAt(0)}</span>}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">
                      {u.full_name} {index === 0 && "👑"}
                    </div>
                    <div className="text-xs text-gray-500">{u.country || "Global Believer"}</div>
                  </div>
                  {/* XP */}
                  <div className="text-right shrink-0 mr-2">
                    <div className="text-lg font-black text-[#FFD000]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{u.glow_score || 0}</div>
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest">XP</div>
                  </div>
                  {/* Follow */}
                  {u.email !== user?.email && (
                    <button
                      onClick={() => followMutation.mutate(u.email)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                        isFollowing ? "bg-white/10 text-gray-400 hover:text-red-400" : "border border-[#00CFFF] text-[#00CFFF] hover:bg-[#00CFFF]/10"
                      }`}
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
    </div>
  );
}