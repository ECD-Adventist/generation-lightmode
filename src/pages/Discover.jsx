import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, TrendingUp, Heart, Zap, Home, Bell, User, Globe, Users, Flame, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DropCard from "@/components/feed/DropCard";
import useGlowDropsFeed from "@/hooks/useGlowDropsFeed";
import AppFooter from "@/components/AppFooter";
import { getDisplayName } from "@/lib/displayName";
import MobileDiscover from "@/components/discover/MobileDiscover";
import MusicLibraryCard from "@/components/discover/MusicLibraryCard";
import MusicPickerModal from "@/components/feed/MusicPickerModal";
import useUrlOverlay from "@/hooks/useUrlOverlay";
import { profileUrl } from "@/lib/profileLink";

const fetchAll = async (entity, query = {}, sort = null) => {
  let allRecords = [];
  let skip = 0;
  const limit = 100;
  while (true) {
    const result = await entity.filter(query, sort, limit, skip);
    allRecords = [...allRecords, ...result];
    if (result.length < limit) break;
    skip += limit;
  }
  return allRecords;
};

export default function Discover() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);

  const [authChecked, setAuthChecked] = useState(false);
  const musicLibrary = useUrlOverlay("music");
  const openMusicLibrary = () => {
    if (!user) {
      base44.auth.redirectToLogin(`${window.location.origin}/Discover?music=true`);
      return;
    }
    musicLibrary.open();
  };

  React.useEffect(() => {
    // Discover is fully public — guests can browse read-only. Only load the
    // current user when authenticated; never redirect guests away.
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser).finally(() => setAuthChecked(true));
      else setAuthChecked(true);
    });
  }, []);

  const { data: drops = [] } = useGlowDropsFeed();

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", { include_email: true, limit: 50 });
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ["userLikes", user?.email],
    queryFn: () => fetchAll(base44.entities.GlowDropLike, { user_email: user?.email }),
    enabled: !!user,
  });

  const getUserInfo = (email) => {
    if (user?.email === email) return user;
    const found = allUsers.find(u => u.email === email);
    if (found) return found;
    return { full_name: email?.split("@")[0] || "Glow Believer", email };
  };

  const trendingTags = useMemo(() => {
    const counts = new Map();
    drops.forEach(drop => {
      (drop.hashtags || "").split(/[\s,]+/).map(t => t.trim()).filter(t => t.startsWith("#") && t.length > 1)
        .forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([tag, count]) => ({ tag, count }));
  }, [drops]);

  const topLikedDrops = useMemo(() => {
    return [...drops].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 20);
  }, [drops]);

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

  const topCreators = useMemo(() => {
    const likesMap = new Map();
    drops.forEach(d => {
      const authorEmail = d.user_email || d.created_by;
      if (authorEmail) likesMap.set(authorEmail, (likesMap.get(authorEmail) || 0) + (d.likes_count || 0));
    });
    return Array.from(likesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([email, likes]) => ({ ...getUserInfo(email), totalLikes: likes }));
  }, [drops, allUsers, user]);

  const noopLike = { mutate: () => {} };
  const noopShare = () => {};

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><Zap className="w-8 h-8 animate-pulse" style={{ color: "#1FB8FF" }} /></div>;

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      {/* MOBILE: Instagram-style Explore/Search */}
      <div className="md:hidden">
        <MobileDiscover
          user={user}
          drops={drops}
          allUsers={allUsers}
          trendingTags={trendingTags}
          topLikedDrops={topLikedDrops}
          onOpenMusicLibrary={openMusicLibrary}
          getUserInfo={getUserInfo}
        />
      </div>

      {/* DESKTOP: original design */}
      <div className="hidden md:block">
      {/* Nav */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E2E8F0" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg transition" style={{ color: "#4A5878" }}><ArrowLeft className="w-5 h-5" /></button>
            <Link to={createPageUrl("Home")} className="shrink-0">
              <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" className="h-14 w-auto object-contain" />
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
              { to: "Leaderboard", icon: <Flame className="w-4 h-4" />, label: "Leaderboard" },
              { to: "Profile", icon: <User className="w-4 h-4" />, label: "Profile" },
            ].map(item => (
              <Link key={item.to} to={createPageUrl(item.to)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-sm font-semibold" style={{ color: "#4A5878" }}
                onMouseOver={e => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5878"; }}>
                {item.icon}<span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(31, 184, 255, 0.08)", border: "1px solid #B8E5FF" }}>
            <TrendingUp className="w-3.5 h-3.5" style={{ color: "#0B3FD9" }} />
            <span className="text-xs font-bold tracking-wider uppercase" style={{ color: "#0B3FD9" }}>Discover</span>
          </div>
          <h1 className="text-4xl font-bold font-['Space_Grotesk'] mb-2" style={{ color: "#0B1B3D" }}>Explore the Light</h1>
          <p className="text-lg" style={{ color: "#6B7FA0" }}>Trending content and top creators across the community.</p>
        </div>

        <div className="mb-8">
          <MusicLibraryCard onOpen={openMusicLibrary} />
        </div>
        {/* Search */}
        <div className="relative mb-8 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#1FB8FF" }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); if (e.target.value) setSelectedTag(null); }}
            placeholder="Search drops by verse, reflection, hashtag..."
            className="w-full rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none"
            style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
          />
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
          <div>
            {/* Trending Tags */}
            <div className="mb-8">
              <h2 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#CC7A00" }}><TrendingUp className="w-4 h-4" /> Trending Hashtags</h2>
              <div className="flex flex-wrap gap-2">
                {trendingTags.length === 0 ? (
                  <p className="text-xs" style={{ color: "#8A97B5" }}>No trending hashtags yet.</p>
                ) : trendingTags.map(t => (
                  <button
                    key={t.tag}
                    onClick={() => { setSelectedTag(selectedTag === t.tag ? null : t.tag); setSearch(""); }}
                    className="px-4 py-2 rounded-full text-sm font-bold transition-all"
                    style={selectedTag === t.tag
                      ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }
                      : { background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
                  >
                    {t.tag} <span className="text-xs opacity-60 ml-1">{t.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <h2 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#0B3FD9" }}>
              <Heart className="w-4 h-4" /> {selectedTag ? `Drops with ${selectedTag}` : search ? "Search Results" : "Top Liked Drops"}
            </h2>
            <div className="max-w-2xl space-y-6">
              {displayDrops.length === 0 ? (
                <div className="text-center py-16 rounded-3xl" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#8A97B5" }}>
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No drops found. Try a different search or hashtag.</p>
                </div>
              ) : displayDrops.map(drop => (
                <DropCard key={drop.id} drop={drop} user={user} dropUser={getUserInfo(drop.user_email || drop.created_by)} likeMutation={noopLike} handleShare={noopShare} userLikes={userLikes} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6">
            <div className="rounded-3xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
              <h3 className="font-black text-xs mb-4 tracking-widest uppercase flex items-center gap-2" style={{ color: "#CC7A00" }}><Flame className="w-4 h-4" /> Top Glow Creators</h3>
              <div className="space-y-4">
                {topCreators.map((creator, i) => (
                  <Link key={creator.email} to={profileUrl(creator) || createPageUrl("Discover")} className="flex items-center gap-3 no-underline group">
                    <span className="text-sm font-black w-5 text-center" style={{ color: i === 0 ? "#CC7A00" : i === 1 ? "#8A97B5" : i === 2 ? "#CD7F32" : "#8A97B5" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0" style={{ border: "1px solid #E6ECF5" }}>
                      <img src={creator.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate transition" style={{ color: "#0B1B3D" }}>{getDisplayName(creator)}</div>
                      <div className="text-xs flex items-center gap-1" style={{ color: "#6B7FA0" }}><Heart className="w-3 h-3 text-red-400" />{creator.totalLikes} likes</div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to={createPageUrl("Leaderboard")} className="block text-center text-xs font-bold mt-4 no-underline" style={{ color: "#0B3FD9" }}>View Full Leaderboard →</Link>
            </div>

            <div className="rounded-3xl p-5 space-y-3" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
              <h3 className="font-black text-xs mb-3 tracking-widest uppercase" style={{ color: "#0B3FD9" }}>Quick Links</h3>
              <Link to={createPageUrl("Feed")} className="block text-sm transition no-underline" style={{ color: "#4A5878" }}>🏠 Back to Feed</Link>
              <Link to={createPageUrl("Challenges")} className="block text-sm transition no-underline" style={{ color: "#4A5878" }}>🎯 Challenges</Link>
              <Link to={createPageUrl("GlowGroups")} className="block text-sm transition no-underline" style={{ color: "#4A5878" }}>👥 Explore Groups</Link>
              <Link to={createPageUrl("Leaderboard")} className="block text-sm transition no-underline" style={{ color: "#4A5878" }}>🏆 Leaderboard</Link>
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
      </div>
      {user && musicLibrary.isOpen && (
        <MusicPickerModal isOpen onClose={musicLibrary.close} />
      )}
    </div>
  );
}