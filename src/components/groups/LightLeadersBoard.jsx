import React, { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Building2, Globe2, Loader2, ShieldCheck, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

const CATEGORIES = [
  { id: "warriors", label: "Light Warriors", icon: Trophy },
  { id: "institutions", label: "Institutions", icon: Building2 },
  { id: "groups", label: "GlowGroups", icon: Users },
  { id: "territories", label: "Territories", icon: Globe2 },
];
const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

function itemLink(item) {
  if (item.type === "warrior") return `${createPageUrl("Profile")}?id=${encodeURIComponent(item.id)}`;
  if (item.type === "institution" && item.slug) return `${createPageUrl("InstitutionPage")}?slug=${encodeURIComponent(item.slug)}`;
  if (item.type === "group") return `${createPageUrl("GroupChat")}?id=${encodeURIComponent(item.id)}`;
  return null;
}

export default function LightLeadersBoard({ currentUser, following = [], followMutation, searchQuery = "" }) {
  const [category, setCategory] = useState("warriors");
  const normalizedSearch = searchQuery.trim().length >= 2 ? searchQuery.trim() : "";
  const query = useInfiniteQuery({
    queryKey: ["lightLeadersLeaderboard", category, normalizedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await base44.functions.invoke("getLightLeadersLeaderboard", { category, limit: 25, skip: pageParam, ...(normalizedSearch ? { search: normalizedSearch } : {}) });
      if (!response?.data || response.data.error || !Array.isArray(response.data.items)) throw new Error(response?.data?.error || "Invalid leaderboard response");
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => lastPage.has_more ? pages.reduce((sum, page) => sum + page.items.length, 0) : undefined,
    staleTime: 5 * 60 * 1000,
  });
  const items = useMemo(() => query.data?.pages?.flatMap((page) => page.items) || [], [query.data]);
  const total = query.data?.pages?.[0]?.total || 0;
  const counts = query.data?.pages?.[0]?.counts || {};

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFFFFF 100%)", border: "1px solid #FFE4A0" }}>
        <div className="flex items-center gap-2"><Trophy className="w-5 h-5" style={{ color: "#CC7A00" }} /><h3 className="font-black" style={{ color: "#0B1B3D" }}>Light Leaders</h3></div>
        <p className="text-xs mt-1" style={{ color: "#6B7FA0" }}>Live rankings from experience points earned by warriors and their communities.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setCategory(id)} className="rounded-xl px-3 py-3 text-xs font-bold flex items-center justify-center gap-2 transition" style={category === id ? { background: "#0B3FD9", color: "#FFFFFF", border: "1px solid #0B3FD9" } : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}>
            <Icon className="w-4 h-4" /> {label}{counts[id] !== undefined ? ` (${counts[id]})` : ""}
          </button>
        ))}
      </div>
      {query.isLoading && <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#0B3FD9" }} /></div>}
      {query.isError && <div className="rounded-2xl p-6 text-center" style={{ background: "#FFF8E6", border: "1px solid #FFE4A0", color: "#6B7FA0" }}>Rankings could not be loaded. <button className="font-bold" style={{ color: "#0B3FD9" }} onClick={() => query.refetch()}>Retry</button></div>}
      {!query.isLoading && !query.isError && items.length === 0 && <div className="rounded-2xl p-8 text-center" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#6B7FA0" }}>No ranked results found.</div>}
      <div className="space-y-3">
        {items.map((item) => {
          const href = itemLink(item);
          const isFollowing = item.type === "warrior" && following.some((record) => record.following_id === item.id);
          const content = (
            <><div className="w-9 text-center shrink-0"><span className="text-sm font-black" style={{ color: item.rank <= 3 ? "#CC7A00" : "#8A97B5" }}>#{item.rank}</span></div><div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ border: "2px solid #FFD000", background: "#F6F8FC" }}>{item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <ShieldCheck className="w-5 h-5" style={{ color: "#0B3FD9" }} />}</div><div className="flex-1 min-w-0"><div className="font-bold text-sm truncate" style={{ color: "#0B1B3D" }}>{item.name}</div><div className="text-xs truncate" style={{ color: "#6B7FA0" }}>{item.subtitle}{item.member_count !== undefined ? ` · ${item.member_count} members` : ""}</div></div><div className="text-right shrink-0"><div className="text-lg font-black" style={{ color: "#CC7A00" }}>{Number(item.score || 0).toLocaleString()}</div><div className="text-[9px] uppercase tracking-widest" style={{ color: "#8A97B5" }}>XP</div></div></>
          );
          return <div key={`${item.type}_${item.id}`} className="flex items-center gap-3 rounded-2xl p-3 md:p-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>{href ? <Link to={href} className="flex items-center gap-3 flex-1 min-w-0 no-underline">{content}</Link> : <div className="flex items-center gap-3 flex-1 min-w-0">{content}</div>}{item.type === "warrior" && item.id !== currentUser?.id && <button type="button" disabled={followMutation?.isPending} onClick={() => followMutation?.mutate(item)} className="px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 disabled:opacity-60" style={isFollowing ? { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" } : { border: "1px solid #1FB8FF", color: "#0B3FD9", background: "rgba(31, 184, 255, 0.08)" }}>{isFollowing ? "Following" : "Connect"}</button>}</div>;
        })}
      </div>
      {query.hasNextPage && <button type="button" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()} className="w-full rounded-xl py-3 text-sm font-bold disabled:opacity-60" style={{ background: "#FFFFFF", border: "1px solid #D6E4FF", color: "#0B3FD9" }}>{query.isFetchingNextPage ? "Loading…" : `Load more (${items.length} of ${total})`}</button>}
    </div>
  );
}
