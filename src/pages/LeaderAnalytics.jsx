import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, BarChart3, Users, Heart, MessageCircle, Bookmark, TrendingUp, Eye, Pin, Loader2, Sparkles } from "lucide-react";
import { createPageUrl } from "@/utils";
import { format, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import LeaderAnalyticsKpiCards from "@/components/leader-analytics/LeaderAnalyticsKpiCards";
import LeaderPostPerformanceTable from "@/components/leader-analytics/LeaderPostPerformanceTable";

/**
 * Private analytics dashboard for managers of a ManagedLeaderAccount.
 *
 * URL: /LeaderAnalytics?leader=<leader_email>
 *
 * Access: only the leader's authorized managers (or platform admins/super_admins)
 * can open this page. Unauthorized users see a 403-style message.
 */
export default function LeaderAnalytics() {
  const [me, setMe] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const leaderEmail = urlParams.get("leader");

  useEffect(() => {
    base44.auth.isAuthenticated().then((ok) => {
      if (!ok) {
        base44.auth.redirectToLogin(window.location.pathname + window.location.search);
        return;
      }
      base44.auth.me().then(setMe).catch(() => {});
    });
  }, []);

  const { data: leaderAccount, isLoading: loadingLeader } = useQuery({
    queryKey: ["leaderAccount", leaderEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("listManagedLeaderAccounts", { leader_email: leaderEmail });
      return Array.isArray(res.data) ? (res.data[0] || null) : null;
    },
    enabled: !!leaderEmail && !!me,
  });

  const isAuthorized = useMemo(() => {
    if (!me || !leaderAccount) return false;
    if (me.role === "admin" || me.role === "super_admin") return true;
    return Array.isArray(leaderAccount.manager_emails) && leaderAccount.manager_emails.includes(me.email);
  }, [me, leaderAccount]);

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ["leaderAnalyticsPosts", leaderEmail],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: leaderEmail }, "-created_date", 500),
    enabled: !!leaderEmail && isAuthorized,
  });

  const postIds = useMemo(() => posts.map(p => p.id), [posts]);

  // Comments + saves across all this leader's posts (used for engagement totals)
  const { data: allComments = [] } = useQuery({
    queryKey: ["leaderAnalyticsComments", leaderEmail],
    queryFn: async () => {
      if (postIds.length === 0) return [];
      const chunks = [];
      // Filter per post id and merge — keeps single requests reasonable
      for (const id of postIds) {
        const c = await base44.entities.GlowDropComment.filter({ drop_id: id });
        chunks.push(...c);
      }
      return chunks;
    },
    enabled: isAuthorized && postIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Followers of the leader account (audience growth)
  const { data: followers = [] } = useQuery({
    queryKey: ["leaderAnalyticsFollowers", leaderEmail],
    queryFn: () => base44.entities.Follow.filter({ following_email: leaderEmail }),
    enabled: isAuthorized,
  });

  // Aggregate KPIs
  const totals = useMemo(() => {
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
    const totalComments = allComments.length;
    const pinnedCount = posts.filter(p => p.pinned).length;
    // Reach is approximated as: unique people who liked + commented + followers
    const reachers = new Set([
      ...followers.map(f => f.follower_email),
      ...allComments.map(c => c.user_email),
    ].filter(Boolean));
    return {
      posts: posts.length,
      followers: followers.length,
      reach: reachers.size,
      likes: totalLikes,
      comments: totalComments,
      pinned: pinnedCount,
      avgEngagement: posts.length === 0 ? 0 : ((totalLikes + totalComments) / posts.length),
    };
  }, [posts, allComments, followers]);

  // Audience growth — followers per day for last 30 days
  const followerGrowth = useMemo(() => {
    const days = 30;
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, "yyyy-MM-dd");
      buckets[key] = 0;
    }
    followers.forEach(f => {
      if (!f.created_date) return;
      const key = format(new Date(f.created_date), "yyyy-MM-dd");
      if (key in buckets) buckets[key]++;
    });
    // Cumulative count
    let running = followers.length - Object.values(buckets).reduce((a, b) => a + b, 0);
    return Object.entries(buckets).map(([date, count]) => {
      running += count;
      return { date: format(new Date(date), "MMM d"), followers: running, new: count };
    });
  }, [followers]);

  // Post engagement bar chart — top 8 posts by total engagement
  const topPosts = useMemo(() => {
    return posts
      .map(p => {
        const comments = allComments.filter(c => c.drop_id === p.id).length;
        const likes = p.likes_count || 0;
        return { ...p, _likes: likes, _comments: comments, _engagement: likes + comments };
      })
      .sort((a, b) => b._engagement - a._engagement)
      .slice(0, 8);
  }, [posts, allComments]);

  // Loading & access guards
  if (!me || loadingLeader) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} />
      </div>
    );
  }

  if (!leaderEmail || !leaderAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#F6F8FC" }}>
        <div className="max-w-md text-center rounded-2xl p-8" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
          <BarChart3 className="w-10 h-10 mx-auto mb-3" style={{ color: "#8A97B5" }} />
          <h2 className="text-lg font-bold mb-2" style={{ color: "#0B1B3D" }}>Leader account not found</h2>
          <p className="text-sm" style={{ color: "#6B7FA0" }}>Check the URL or open this page from your Profile via the leader switcher.</p>
          <Link to={createPageUrl("Profile")} className="inline-block mt-4 px-5 py-2 rounded-full text-sm font-bold" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>Back to Profile</Link>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#F6F8FC" }}>
        <div className="max-w-md text-center rounded-2xl p-8" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
          <BarChart3 className="w-10 h-10 mx-auto mb-3" style={{ color: "#EF4444" }} />
          <h2 className="text-lg font-bold mb-2" style={{ color: "#0B1B3D" }}>Access denied</h2>
          <p className="text-sm" style={{ color: "#6B7FA0" }}>This analytics dashboard is private to authorized managers of {leaderAccount.leader_name}.</p>
          <Link to={createPageUrl("Profile")} className="inline-block mt-4 px-5 py-2 rounded-full text-sm font-bold" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>Back to Profile</Link>
        </div>
      </div>
    );
  }

  const accent = "#CC7A00";
  const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

  return (
    <div className="min-h-screen pb-16 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E6ECF5" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(leaderEmail)}`} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#4A5878" }}>
            <ArrowLeft className="w-4 h-4" /> Back to leader profile
          </Link>
          <div className="flex-1" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-full" style={{ background: "rgba(255, 208, 0, 0.18)", color: accent }}>
            Private · Manager Only
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="rounded-3xl p-6 mb-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #FFFCF0 100%)", border: "1px solid #FFE4A0", boxShadow: "0 4px 16px rgba(255, 159, 26, 0.12)" }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-40" style={{ background: "#FFD000" }} />
          <div className="relative flex items-center gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-full overflow-hidden shrink-0" style={{ border: "3px solid #FFD000", boxShadow: "0 4px 14px rgba(255, 208, 0, 0.4)" }}>
              <img src={leaderAccount.leader_profile_picture_url || defaultAvatar} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
                <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: accent }}>{leaderAccount.leader_title || "Leader Account"}</span>
              </div>
              <h1 className="text-2xl font-black font-['Space_Grotesk'] truncate" style={{ color: "#0B1B3D" }}>{leaderAccount.leader_name}</h1>
              <p className="text-sm" style={{ color: "#6B7FA0" }}>Audience reach, growth, and per-post engagement.</p>
            </div>
          </div>
        </div>

        {loadingPosts ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#0B3FD9" }} /></div>
        ) : (
          <>
            <LeaderAnalyticsKpiCards totals={totals} />

            {/* Audience growth chart */}
            <div className="rounded-3xl p-6 mb-6" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.04)" }}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4" style={{ color: "#0B3FD9" }} />
                <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "#0B3FD9" }}>Audience Growth · 30 days</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: "#8A97B5" }}>Cumulative followers and daily new followers.</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={followerGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FF" />
                    <XAxis dataKey="date" stroke="#8A97B5" fontSize={11} tickLine={false} interval="preserveStartEnd" />
                    <YAxis stroke="#8A97B5" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 12, fontSize: 12 }} />
                    <Line type="monotone" dataKey="followers" stroke="#0B3FD9" strokeWidth={2.5} dot={false} name="Total followers" />
                    <Line type="monotone" dataKey="new" stroke="#FFD000" strokeWidth={2} dot={false} name="New today" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top posts engagement bar chart */}
            <div className="rounded-3xl p-6 mb-6" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.04)" }}>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4" style={{ color: "#0B3FD9" }} />
                <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "#0B3FD9" }}>Top Posts by Engagement</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: "#8A97B5" }}>Likes + comments per post (top 8).</p>
              {topPosts.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: "#8A97B5" }}>No posts yet.</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPosts.map((p, i) => ({ name: `#${i + 1}`, Likes: p._likes, Comments: p._comments }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FF" />
                      <XAxis dataKey="name" stroke="#8A97B5" fontSize={11} tickLine={false} />
                      <YAxis stroke="#8A97B5" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="Likes" stackId="a" fill="#0B3FD9" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Comments" stackId="a" fill="#FFD000" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Per-post performance table */}
            <LeaderPostPerformanceTable posts={posts} comments={allComments} />
          </>
        )}
      </div>
    </div>
  );
}