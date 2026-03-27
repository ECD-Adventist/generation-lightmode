import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, TrendingUp, Heart, Zap, Home, Bell, User, Globe, Users, Flame, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DropCard from "@/components/feed/DropCard";
import useGlowDropsFeed from "@/hooks/useGlowDropsFeed";

export default function Discover() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);

  React.useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: drops = [] } = useGlowDropsFeed();

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    enabled: !!user,
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ["userLikes", user?.email],
    queryFn: () => base44.entities.GlowDropLike.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const getUserInfo = (email) => {
    if (user?.email === email) return user;
    const found = allUsers.find(u => u.email === email);
    if (found) return found;
    return { full_name: email?.split("@")[0] || "Glow Believer", email };
  };

  // Trending hashtags
  const trendingTags = useMemo(() => {
    const counts = new Map();
    drops.forEach(drop => {
      (drop.hashtags || "").split(/[\s,]+/).map(t => t.trim()).filter(t => t.startsWith("#") && t.length > 1)
        .forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([tag, count]) => ({ tag, count }));
  }, [drops]);

  // Top liked drops
  const topLikedDrops = useMemo(() => {
    return [...drops].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 20);
  }, [drops]);

  // Filtered by search or tag
  const displayDrops = useMemo(() => {
    let list = selectedTag
      ? drops.filter(d => (d.hashtags || "").toLowerCase().includes(selectedTag.toLowerCase()))
      : topLikedDrops;

    if (search) {
      list = drops.filter(d =>
        (d.verse || "").toLowerCase().includes(search.toLowerCase()) ||
        (d.reflection || "").toLowerCase().includes(search.toLowerCase()) ||
        (d.hashtags || "").toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  }, [drops, topLikedDrops, selectedTag, search]);

  // Top creators by total likes
  const topCreators = useMemo(() => {
    const likesMap = new Map();
    drops.forEach(d => {
      likesMap.set(d.user_email, (likesMap.get(d.user_email) || 0) + (d.likes_count || 0));
    });
    return Array.from(likesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([email, likes]) => ({ ...getUserInfo(email), totalLikes: likes }));
  }, [drops, allUsers, user]);

  const noopLike = { mutate: () => {} };
  const noopShare = () => {};

  if (!user) return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center"><Zap className="w-8 h-8 text-[#00CFFF] animate-pulse" /></div>;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Nav */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"><ArrowLeft className="w-5 h-5" /></button>
            <Link to={createPageUrl("Home")} className="shrink-0">
              <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="LightMode" className="h-14 w-auto object-contain" style={{ filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }} />
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium"><Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span></Link>
            <Link to={createPageUrl("Leaderboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium"><Flame className="w-4 h-4" /><span className="hidden sm:inline">Leaderboard</span></Link>
            <Link to={createPageUrl("Profile")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium"><User className="w-4 h-4" /><span className="hidden sm:inline">Profile</span></Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 mb-4">
            <TrendingUp className="w-3.5 h-3.5 text-[#00CFFF]" />
            <span className="text-[#00CFFF] text-xs font-bold tracking-wider uppercase">Discover</span>
          </div>
          <h1 className="text-4xl font-bold font-['Space_Grotesk'] mb-2">Explore the Light</h1>
          <p className="text-gray-400 text-lg">Trending content and top creators across the community.</p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); if (e.target.value) setSelectedTag(null); }}
            placeholder="Search drops by verse, reflection, hashtag..."
            className="w-full bg-[#121826] border border-white/10 rounded-full py-3 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00CFFF]/50"
          />
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
          {/* Main Column */}
          <div>
            {/* Trending Tags */}
            <div className="mb-8">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#FFD000] mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Trending Hashtags</h2>
              <div className="flex flex-wrap gap-2">
                {trendingTags.length === 0 ? (
                  <p className="text-xs text-gray-500">No trending hashtags yet.</p>
                ) : trendingTags.map(t => (
                  <button
                    key={t.tag}
                    onClick={() => { setSelectedTag(selectedTag === t.tag ? null : t.tag); setSearch(""); }}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      selectedTag === t.tag
                        ? "bg-[#00CFFF] text-black"
                        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                    }`}
                  >
                    {t.tag} <span className="text-xs opacity-60 ml-1">{t.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Drops */}
            <h2 className="text-sm font-black uppercase tracking-widest text-[#00CFFF] mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4" /> {selectedTag ? `Drops with ${selectedTag}` : search ? "Search Results" : "Top Liked Drops"}
            </h2>
            <div className="max-w-2xl space-y-6">
              {displayDrops.length === 0 ? (
                <div className="text-center py-16 text-gray-500 bg-[#121826]/50 rounded-3xl border border-white/5">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No drops found. Try a different search or hashtag.</p>
                </div>
              ) : displayDrops.map(drop => (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  user={user}
                  dropUser={getUserInfo(drop.user_email)}
                  likeMutation={noopLike}
                  handleShare={noopShare}
                  userLikes={userLikes}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            {/* Top Glow Creators */}
            <div className="bg-[#121826] rounded-3xl p-5 border border-white/5">
              <h3 className="font-black text-xs text-[#FFD000] mb-4 tracking-widest uppercase flex items-center gap-2"><Flame className="w-4 h-4" /> Top Glow Creators</h3>
              <div className="space-y-4">
                {topCreators.map((creator, i) => (
                  <Link key={creator.email} to={createPageUrl("Profile") + `?user=${encodeURIComponent(creator.email)}`} className="flex items-center gap-3 no-underline group">
                    <span className="text-sm font-black w-5 text-center" style={{ color: i === 0 ? "#FFD000" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#666" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0">
                      <img src={creator.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate group-hover:text-[#00CFFF] transition">{creator.full_name || creator.email?.split("@")[0]}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" />{creator.totalLikes} likes</div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to={createPageUrl("Leaderboard")} className="block text-center text-xs text-[#00CFFF] font-bold mt-4 hover:underline no-underline">View Full Leaderboard →</Link>
            </div>

            {/* Quick Links */}
            <div className="bg-[#121826] rounded-3xl p-5 border border-white/5 space-y-3">
              <h3 className="font-black text-xs text-[#00CFFF] mb-3 tracking-widest uppercase">Quick Links</h3>
              <Link to={createPageUrl("Feed")} className="block text-sm text-gray-300 hover:text-white transition no-underline">🏠 Back to Feed</Link>
              <Link to={createPageUrl("Challenges")} className="block text-sm text-gray-300 hover:text-white transition no-underline">🎯 Challenges</Link>
              <Link to={createPageUrl("GlowGroups")} className="block text-sm text-gray-300 hover:text-white transition no-underline">👥 Explore Groups</Link>
              <Link to={createPageUrl("Leaderboard")} className="block text-sm text-gray-300 hover:text-white transition no-underline">🏆 Leaderboard</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}