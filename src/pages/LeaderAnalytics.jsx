import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft, Users, Heart, MessageCircle, TrendingUp, Eye,
  Calendar, Loader2, Sparkles, Trophy, BarChart3, Bookmark
} from "lucide-react";
import { format, formatDistanceToNow, subDays, isAfter } from "date-fns";

/**
 * Private analytics dashboard for managed leader accounts.
 *
 * Access is restricted to:
 *  - The leader account's authorized managers (manager_emails)
 *  - Admins / super_admins
 *
 * Shows:
 *  - Total reach (followers + cumulative engagement)
 *  - Audience growth (new followers in last 7 / 30 days)
 *  - Per-post engagement table (likes, comments, saves, shares-as-reposts)
 *
 * Route: /LeaderAnalytics?leader=<leader_email>
 */
export default function LeaderAnalytics() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const leaderEmail = urlParams.get("leader");

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (isAuth) => {
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.pathname + window.location.search);
        return;
      }
      try {
        const me = await base44.auth.me();
        setCurrentUser(me);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAuth(false);
      }
    });
  }, []);

  // Resolve the leader account (managed account record)
  const { data: leaderAccounts = [], isLoading: loadingLeader } = useQuery({
    queryKey: ["leaderAnalyticsAccount", leaderEmail],
    queryFn: () => base44.entities.ManagedLeaderAccount.filter({ leader_email: leaderEmail }),
    enabled: !!leaderEmail && !!currentUser,
  });
  const leader = leaderAccounts[0] || null;

  // Authorization check
  const isAuthorized = useMemo(() => {
    if (!currentUser || !leader) return false;
    if (currentUser.role === "admin" || currentUser.role === "super_admin") return true;
    return Array.isArray(leader.manager_emails) && leader.manager_emails.includes(currentUser.email);
  }, [currentUser, leader]);

  // Posts authored by this leader
  const { data: leaderDrops = [], isLoading: loadingDrops } = useQuery({
    queryKey: ["leaderAnalyticsDrops", leaderEmail],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: leaderEmail }, "-created_date"),
    enabled: !!leaderEmail && isAuthorized,
  });

  // Followers of this leader
  const { data: followers = [], isLoading: loadingFollowers } = useQuery({
    queryKey: ["leaderAnalyticsFollowers", leaderEmail],
    queryFn: () => base44.entities.Follow.filter({ following_email: leaderEmail }),
    enabled: !!leaderEmail && isAuthorized,
  });

  // Per-drop engagement data — comments + saves count per drop
  const dropIds = leaderDrops.map(d => d.id);
  const { data: comments = [] } = useQuery({
    queryKey: ["leaderAnalyticsComments", leaderEmail, dropIds.length],
    queryFn: async () => {
      if (dropIds.length === 0) return [];
      const all = await Promise.all(dropIds.map(id => base44.entities.GlowDropComment.filter({ drop_id: id })));
      return all.flat();
    },
    enabled: dropIds.length > 0 && isAuthorized,
  });

  const { data: saves = [] } = useQuery({
    queryKey: ["leaderAnalyticsSaves", leaderEmail, dropIds.length],
    queryFn: async () => {
      if (dropIds.length === 0) return [];
      const all = await Promise.all(dropIds.map(id => base44.entities.SavedDrop.filter({ drop_id: id })));
      return all.flat();
    },
    enabled: dropIds.length > 0 && isAuthorized,
  });

  // Aggregate metrics
  const totals = useMemo(() => {
    const totalLikes = leaderDrops.reduce((sum, d) => sum + (d.likes_count || 0), 0);
    const totalComments = comments.length;
    const totalSaves = saves.length;
    const totalFollowers = followers.length;
    const totalPosts = leaderDrops.length;
    // Approx unique reach = followers + unique engagers (likers/commenters/savers)
    const engagerEmails = new Set([
      ...comments.map(c => c.user_email),
      ...saves.map(s => s.user_email),
    ]);
    const reach = totalFollowers + engagerEmails.size;
    return { totalLikes, totalComments, totalSaves, totalFollowers, totalPosts, reach };
  }, [leaderDrops, comments, saves, followers]);

  // Audience growth
  const growth = useMemo(() => {
    const now = new Date();
    const last7 = subDays(now, 7);
    const last30 = subDays(now, 30);
    const newLast7 = followers.filter(f => f.created_date && isAfter(new Date(f.created_date), last7)).length;
    const newLast30 = followers.filter(f => f.created_date && isAfter(new Date(f.created_date), last30)).length;
    return { newLast7, newLast30 };
  }, [followers]);

  // Per-post breakdown
  const postBreakdown = useMemo(() => {
    return leaderDrops.map(d => {
      const dropComments = comments.filter(c => c.drop_id === d.id).length;
      const dropSaves = saves.filter(s => s.drop_id === d.id).length;
      const likes = d.likes_count || 0;
      const engagementScore = likes + dropComments * 2 + dropSaves * 3;
      return {
        ...d,
        commentsCount: dropComments,
        savesCount: dropSaves,
        engagementScore,
      };
    }).sort((a, b) => b.engagementScore - a.engagementScore);
  }, [leaderDrops, comments, saves]);

  // Loading & error states
  if (loadingAuth || loadingLeader) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} />
      </div>
    );
  }

  if (!leaderEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F6F8FC" }}>
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold mb-2" style={{ color: "#0B1B3D" }}>Leader required</h1>
          <p className="text-sm mb-4" style={{ color: "#6B7FA0" }}>Add ?leader=&lt;email&gt; to the URL to view a leader's analytics.</p>
          <Link to={createPageUrl("Profile")} className="inline-block px-5 py-2 rounded-full text-sm font-bold" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  if (!leader) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F6F8FC" }}>
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold mb-2" style={{ color: "#0B1B3D" }}>Leader not found</h1>
          <p className="text-sm" style={{ color: "#6B7FA0" }}>No managed leader account exists for {leaderEmail}.</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F6F8FC" }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#FFF8E6", border: "1px solid #FFE4A0" }}>
            🔒
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "#0B1B3D" }}>Access Restricted</h1>
          <p className="text-sm mb-4" style={{ color: "#6B7FA0" }}>
            Only authorized managers of <strong>{leader.leader_name}</strong> can view this analytics dashboard.
          </p>
          <button onClick={() => navigate(-1)} className="inline-block px-5 py-2 rounded-full text-sm font-bold" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B3FD9" }}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const dataLoading = loadingDrops || loadingFollowers;

  return (
    <div className="min-h-screen pb-12 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E2E8F0" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <BarChart3 className="w-5 h-5 shrink-0" style={{ color: "#0B3FD9" }} />
            <h1 className="text-lg font-bold truncate" style={{ color: "#0B1B3D" }}>Leader Analytics</h1>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: "#FFF8E6", border: "1px solid #FFE4A0", color: "#CC7A00" }}>
            🔒 Private
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        {/* Leader identity card */}
        <div className="rounded-2xl p-5 mb-6 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #FFFFFF 0%, #FFFCF0 100%)", border: "1px solid #FFE4A0", boxShadow: "0 4px 16px rgba(255, 159, 26, 0.1)" }}>
          <div className="w-16 h-16 rounded-full overflow-hidden shrink-0" style={{ border: "2px solid #FFD000" }}>
            <img src={leader.leader_profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#CC7A00" }}>{leader.leader_title || "Leader Account"}</div>
            <h2 className="text-xl font-black font-['Space_Grotesk'] truncate" style={{ color: "#0B1B3D" }}>{leader.leader_name}</h2>
            <div className="text-xs truncate" style={{ color: "#6B7FA0" }}>{leader.leader_email}{leader.leader_country ? ` • ${leader.leader_country}` : ""}</div>
          </div>
        </div>

        {dataLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "#1FB8FF" }} />
            <p className="text-sm mt-3" style={{ color: "#6B7FA0" }}>Crunching numbers…</p>
          </div>
        ) : (
          <>
            {/* Top-level KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <KpiCard icon={<Eye className="w-5 h-5" />} label="Total Reach" value={totals.reach.toLocaleString()} accent="#0B3FD9" sub="followers + engagers" />
              <KpiCard icon={<Users className="w-5 h-5" />} label="Followers" value={totals.totalFollowers.toLocaleString()} accent="#1FB8FF" />
              <KpiCard icon={<Sparkles className="w-5 h-5" />} label="Posts Published" value={totals.totalPosts.toLocaleString()} accent="#CC7A00" />
              <KpiCard icon={<Heart className="w-5 h-5" />} label="Total Likes" value={totals.totalLikes.toLocaleString()} accent="#E11D48" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Audience growth */}
              <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.04)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4" style={{ color: "#0B3FD9" }} />
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "#0B3FD9" }}>Audience Growth</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <GrowthBlock label="Last 7 days" value={growth.newLast7} accent="#0B3FD9" />
                  <GrowthBlock label="Last 30 days" value={growth.newLast30} accent="#1FB8FF" />
                </div>
                <p className="text-[11px] mt-4" style={{ color: "#8A97B5" }}>
                  New followers gained over the recent period. Total followers all-time: <strong style={{ color: "#0B1B3D" }}>{totals.totalFollowers}</strong>.
                </p>
              </div>

              {/* Engagement summary */}
              <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.04)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-4 h-4" style={{ color: "#E11D48" }} />
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "#E11D48" }}>Engagement</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <EngagementBlock icon={<Heart className="w-4 h-4" />} label="Likes" value={totals.totalLikes} accent="#E11D48" />
                  <EngagementBlock icon={<MessageCircle className="w-4 h-4" />} label="Comments" value={totals.totalComments} accent="#0B3FD9" />
                  <EngagementBlock icon={<Bookmark className="w-4 h-4" />} label="Saves" value={totals.totalSaves} accent="#CC7A00" />
                </div>
                <p className="text-[11px] mt-4" style={{ color: "#8A97B5" }}>
                  Avg per post:{" "}
                  <strong style={{ color: "#0B1B3D" }}>
                    {totals.totalPosts > 0 ? Math.round(((totals.totalLikes + totals.totalComments + totals.totalSaves) / totals.totalPosts) * 10) / 10 : 0}
                  </strong>{" "}
                  total interactions.
                </p>
              </div>
            </div>

            {/* Per-post breakdown */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.04)" }}>
              <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#E6ECF5" }}>
                <Trophy className="w-4 h-4" style={{ color: "#CC7A00" }} />
                <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "#0B1B3D" }}>Posts by Engagement</h3>
                <span className="text-[10px] font-bold ml-auto" style={{ color: "#8A97B5" }}>{postBreakdown.length} total</span>
              </div>

              {postBreakdown.length === 0 ? (
                <div className="text-center py-12 px-4" style={{ color: "#8A97B5" }}>
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No posts published yet.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "#F0F4FA" }}>
                  {postBreakdown.map((d, i) => (
                    <Link
                      key={d.id}
                      to={`${createPageUrl("Post")}?id=${encodeURIComponent(d.id)}&user=${encodeURIComponent(d.user_email)}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F6F8FC] transition no-underline"
                      style={{ borderColor: "#F0F4FA" }}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0" style={{ background: i < 3 ? "linear-gradient(135deg, #FFD000, #FF9F1A)" : "#EEF3FF", color: i < 3 ? "#0B1B3D" : "#0B3FD9" }}>
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold truncate" style={{ color: "#0B1B3D" }}>
                          {d.verse || (d.reflection ? d.reflection.replace(/<[^>]*>/g, "").slice(0, 80) : "Untitled drop")}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] mt-0.5 flex-wrap" style={{ color: "#6B7FA0" }}>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {d.created_date ? formatDistanceToNow(new Date(d.created_date.endsWith("Z") ? d.created_date : d.created_date + "Z"), { addSuffix: true }) : "—"}</span>
                          {d.pinned && <span className="px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider" style={{ background: "#FFF8E6", color: "#CC7A00" }}>Pinned</span>}
                          {d.category && <span style={{ color: "#0B3FD9" }}>#{d.category}</span>}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 text-[11px] shrink-0">
                        <Stat icon={<Heart className="w-3 h-3" />} value={d.likes_count || 0} color="#E11D48" />
                        <Stat icon={<MessageCircle className="w-3 h-3" />} value={d.commentsCount} color="#0B3FD9" />
                        <Stat icon={<Bookmark className="w-3 h-3" />} value={d.savesCount} color="#CC7A00" />
                      </div>
                      <div className="flex flex-col items-end shrink-0 ml-2">
                        <div className="text-[10px] uppercase tracking-wider font-black" style={{ color: "#8A97B5" }}>Score</div>
                        <div className="text-sm font-black" style={{ color: "#0B3FD9" }}>{d.engagementScore}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[10px] mt-4 text-center" style={{ color: "#8A97B5" }}>
              📊 Analytics update in real time as engagement comes in. Data is private to authorized managers and admins only.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, accent, sub }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.04)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}15`, color: accent }}>
          {icon}
        </div>
        <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#8A97B5" }}>{label}</div>
      </div>
      <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "#8A97B5" }}>{sub}</div>}
    </div>
  );
}

function GrowthBlock({ label, value, accent }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: `${accent}10`, border: `1px solid ${accent}25` }}>
      <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: accent }}>+{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "#6B7FA0" }}>{label}</div>
    </div>
  );
}

function EngagementBlock({ icon, label, value, accent }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color: accent }}>{icon}</div>
      <div className="text-lg font-black" style={{ color: "#0B1B3D" }}>{value.toLocaleString()}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#8A97B5" }}>{label}</div>
    </div>
  );
}

function Stat({ icon, value, color }) {
  return (
    <div className="flex items-center gap-1 font-bold" style={{ color }}>
      {icon} <span style={{ color: "#0B1B3D" }}>{value}</span>
    </div>
  );
}