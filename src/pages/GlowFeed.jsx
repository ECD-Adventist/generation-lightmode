import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Globe, Flame, Sparkles, Clock, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import GlowFeedCard from "@/components/feed/GlowFeedCard";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/mobile/PullToRefreshIndicator";

const FILTERS = [
  { id: "latest", label: "Latest", icon: Clock },
  { id: "top", label: "Top Liked", icon: Flame },
  { id: "territory", label: "By Territory", icon: Globe },
];

const CATEGORIES = ["All", "Devotional", "Testimony", "Prayer", "Outreach", "Worship"];

export default function GlowFeed() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("latest");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerritory, setSelectedTerritory] = useState("All");
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(scrollRef, async () => {
    await queryClient.invalidateQueries({ queryKey: ["glowFeed"] });
    await queryClient.invalidateQueries({ queryKey: ["glowFeedLikes"] });
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setCurrentUser);
    });
  }, []);

  const { data: drops = [], isLoading } = useQuery({
    queryKey: ["glowFeed"],
    queryFn: () => base44.entities.GlowDrop.filter({ status: "approved" }, "-created_date", 200),
    staleTime: 1000 * 60 * 2,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["glowFeedUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data || [];
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ["glowFeedLikes"],
    queryFn: () => base44.entities.GlowDropLike.filter({ user_email: currentUser.email }),
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 2,
  });

  const getUserInfo = email => allUsers.find(u => u.email === email) || { full_name: email?.split("@")[0] || "Glow Believer", email };

  const territories = useMemo(() => {
    const set = new Set();
    drops.forEach(d => {
      const u = allUsers.find(u => u.email === d.user_email);
      const t = u?.territory_name || u?.country;
      if (t) set.add(t);
    });
    return ["All", ...Array.from(set).sort()];
  }, [drops, allUsers]);

  const filtered = useMemo(() => {
    let list = drops.filter(d => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        d.verse?.toLowerCase().includes(q) ||
        d.reflection?.toLowerCase().includes(q) ||
        d.hashtags?.toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q) ||
        getUserInfo(d.user_email)?.full_name?.toLowerCase().includes(q);

      const matchCategory = activeCategory === "All" || d.category === activeCategory;

      const u = allUsers.find(u => u.email === d.user_email);
      const territory = u?.territory_name || u?.country;
      const matchTerritory = selectedTerritory === "All" || territory === selectedTerritory;

      return matchSearch && matchCategory && matchTerritory;
    });

    if (activeFilter === "top") list = [...list].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    if (activeFilter === "territory") list = [...list].sort((a, b) => {
      const ta = getUserInfo(a.user_email)?.territory_name || getUserInfo(a.user_email)?.country || "";
      const tb = getUserInfo(b.user_email)?.territory_name || getUserInfo(b.user_email)?.country || "";
      return ta.localeCompare(tb);
    });

    return list;
  }, [drops, allUsers, searchQuery, activeCategory, activeFilter, selectedTerritory]);

  // Territory stats for header
  const statsTerritoriesCount = useMemo(() => territories.length - 1, [territories]);
  const statsTotalDrops = drops.length;
  const statsTotalLikes = drops.reduce((s, d) => s + (d.likes_count || 0), 0);

  return (
    <div ref={scrollRef} className="min-h-screen bg-[#0B0F1A] text-white" style={{ overflowY: "auto" }}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={threshold} />
      {/* Top Nav */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="shrink-0">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
              alt="LightMode" style={{ height: 48, filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
            />
          </Link>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link to={createPageUrl("Feed")} className="px-4 py-2 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 text-[#00CFFF] text-xs font-bold hover:bg-[#00CFFF]/20 transition">
                ⚡ My Feed
              </Link>
            ) : (
              <button
                onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                className="px-4 py-2 rounded-full bg-[#00CFFF] text-black text-xs font-bold hover:bg-[#00CFFF]/80 transition"
              >
                Join the Movement
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00CFFF] rounded-full blur-[140px] opacity-[0.06]" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8A5CFF] rounded-full blur-[140px] opacity-[0.05]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 mb-5">
            <Globe className="w-4 h-4 text-[#00CFFF]" />
            <span className="text-[#00CFFF] text-xs font-bold tracking-wider uppercase">Global Community Feed</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            The <span className="bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] bg-clip-text text-transparent">Glow Feed</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Faith in action — approved Glow Drops from missionaries across every territory.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-center">
            {[
              { label: "Drops", value: statsTotalDrops },
              { label: "Territories", value: statsTerritoriesCount },
              { label: "Total Lights", value: statsTotalLikes },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{s.value.toLocaleString()}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  activeFilter === f.id
                    ? "bg-[#00CFFF]/15 border-[#00CFFF]/40 text-[#00CFFF]"
                    : "bg-[#121826] border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                }`}
              >
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search verse, reflection, hashtag…"
              className="w-full bg-[#121826] border border-white/10 rounded-full pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00CFFF]/40"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category & Territory filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                  activeCategory === cat
                    ? "bg-[#8A5CFF]/20 border-[#8A5CFF]/40 text-[#8A5CFF]"
                    : "bg-transparent border-white/10 text-gray-500 hover:text-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {territories.length > 2 && (
            <div className="ml-auto w-full sm:w-56">
              <BottomSheetSelect
                value={selectedTerritory}
                onChange={setSelectedTerritory}
                options={territories}
                placeholder="Filter by territory"
                triggerClassName="!py-2 !px-4 !text-xs !rounded-full"
                triggerStyle={{ background: "#121826", border: "1px solid rgba(255,255,255,0.1)", color: "#D1D5DB" }}
              />
            </div>
          )}
        </div>

        {/* Feed Grid */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg">No drops found.</p>
            <p className="text-sm mt-1">Try adjusting your filters or check back soon.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-0">
            {filtered.map(drop => (
              <div key={drop.id} className="break-inside-avoid mb-5">
                <GlowFeedCard
                  drop={drop}
                  currentUser={currentUser}
                  dropUser={getUserInfo(drop.user_email)}
                  userLikes={userLikes}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}