import React, { useEffect, useMemo, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Activity, Users, TrendingUp, Flame, Radio, Zap } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import AdminReadStatus from '@/components/admin/data/AdminReadStatus';

/**
 * LiveOverviewPanel
 * Real-time overview using Base44's entity subscribe() (WebSocket-backed).
 * Shows:
 *  - Concurrent active users (users active in last 5 min, based on Glow Drop + Like activity)
 *  - Recent growth spike (new users in last 15 min vs previous 15 min)
 *  - Trending content categories (from last 50 drops)
 */
export default function LiveOverviewPanel({ databaseDrops = [], databaseUsers = [], t, isDark }) {
  const [drops, setDrops] = useState(databaseDrops);
  const [likes, setLikes] = useState([]);
  const [users, setUsers] = useState(databaseUsers);
  const [pulse, setPulse] = useState(0); // triggers re-calc every 30s
  const [lastEvent, setLastEvent] = useState(null);
  const mountedRef = useRef(true);

  // Reuse the complete database reads from the dashboard instead of capped samples.
  useEffect(() => { setDrops(databaseDrops); }, [databaseDrops]);
  useEffect(() => { setUsers(databaseUsers); }, [databaseUsers]);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  const likesQuery = useQuery({
    queryKey: ['adminDashboardRecentLikesDatabase'],
    queryFn: async () => {
      const rows = [];
      const since = new Date(Date.now() - 5 * 60_000).toISOString();
      for (let skip = 0; ; skip += 1000) {
        const page = await base44.entities.GlowDropLike.filter({ created_date: { $gte: since } }, '-created_date', 1000, skip, ['id', 'user_email', 'created_date']);
        rows.push(...page);
        if (page.length < 1000) return rows;
      }
    }, staleTime: 30_000, refetchInterval: 30_000, refetchOnWindowFocus: false,
  });
  useEffect(() => { if (likesQuery.data) setLikes(likesQuery.data); }, [likesQuery.data]);

  // Realtime subscriptions on GlowDrop / GlowDropLike / User were removed: they pushed every
  // event in the app to this panel. Drops and users arrive from the dashboard's polled reads
  // (props); recent likes are polled every 30s above.
  useEffect(() => { setLastEvent({ type: "poll", at: Date.now() }); }, [databaseDrops, databaseUsers, likesQuery.data]);

  // Tick every 30s so time-windowed metrics stay fresh
  useEffect(() => {
    const id = setInterval(() => setPulse(p => p + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const metrics = useMemo(() => {
    const now = Date.now();
    const FIVE_MIN = 5 * 60 * 1000;
    const FIFTEEN_MIN = 15 * 60 * 1000;

    // Concurrent active users = unique user_emails from drops+likes in last 5 min
    const activeSet = new Set();
    drops.forEach(d => { if (d.user_email && d.created_date && now - new Date(d.created_date) <= FIVE_MIN) activeSet.add(d.user_email); });
    likes.forEach(l => { if (l.user_email && l.created_date && now - new Date(l.created_date) <= FIVE_MIN) activeSet.add(l.user_email); });
    const activeNow = activeSet.size;

    // Growth spike: new users in last 15 min vs previous 15 min
    let last15 = 0, prev15 = 0;
    users.forEach(u => {
      if (!u.created_date) return;
      const delta = now - new Date(u.created_date);
      if (delta <= FIFTEEN_MIN) last15++;
      else if (delta <= 2 * FIFTEEN_MIN) prev15++;
    });
    const spikePct = prev15 === 0 ? (last15 > 0 ? 100 : 0) : Math.round(((last15 - prev15) / prev15) * 100);

    // Trending categories (last 50 drops)
    const catCounts = {};
    drops.slice(0, 50).forEach(d => {
      const c = (d.category || "Uncategorized").trim();
      catCounts[c] = (catCounts[c] || 0) + 1;
    });
    const trending = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const total = trending.reduce((s, [, v]) => s + v, 0) || 1;

    return { activeNow, last15, prev15, spikePct, trending, total };
  }, [drops, likes, users, pulse]);

  const liveJustNow = lastEvent && (Date.now() - lastEvent.at < 4000);
  if (!likesQuery.data || likesQuery.isError) return <AdminReadStatus t={t} loading={likesQuery.isFetching} error={likesQuery.isError} onRefresh={() => likesQuery.refetch()} message="Reading live engagement…" />;

  const cardStyle = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20 };

  return (
    <div className="rounded-2xl p-5 relative overflow-hidden" style={cardStyle}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isDark ? "rgba(0,207,255,0.15)" : "rgba(11,63,217,0.1)" }}>
              <Radio className="w-5 h-5" style={{ color: isDark ? "#00CFFF" : "#0B3FD9" }} />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`absolute inline-flex h-full w-full rounded-full ${liveJustNow ? "animate-ping" : ""}`} style={{ background: "#22c55e", opacity: 0.75 }}></span>
              <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: "#22c55e" }}></span>
            </span>
          </div>
          <div>
            <h2 className="font-black text-base leading-tight" style={{ color: t.textPrimary }}>Live Overview</h2>
            <p className="text-[11px] font-semibold" style={{ color: t.textMuted }}>
              Real-time · {liveJustNow ? `${lastEvent.type} event just now` : "streaming"}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }}></span>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#16a34a" }}>Connected</span>
        </div>
      </div>

      {/* 3 metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {/* Active now */}
        <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: isDark ? "linear-gradient(135deg, rgba(0,207,255,0.08), rgba(11,63,217,0.04))" : "linear-gradient(135deg, rgba(31,184,255,0.08), rgba(11,63,217,0.04))", border: `1px solid ${t.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <Users className="w-4 h-4" style={{ color: isDark ? "#00CFFF" : "#0B3FD9" }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Last 5 min</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-black text-3xl" style={{ color: t.textPrimary }}>{metrics.activeNow}</span>
            <span className="text-xs font-semibold" style={{ color: t.textSecondary }}>active</span>
          </div>
          <p className="text-[11px] mt-1" style={{ color: t.textMuted }}>Members posting or liking</p>
        </div>

        {/* Growth spike */}
        <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: isDark ? "linear-gradient(135deg, rgba(255,208,0,0.08), rgba(255,159,26,0.04))" : "linear-gradient(135deg, rgba(255,208,0,0.12), rgba(255,159,26,0.06))", border: `1px solid ${t.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: "#FF9F1A" }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Last 15 min</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-black text-3xl" style={{ color: t.textPrimary }}>+{metrics.last15}</span>
            <span className={`text-xs font-bold ${metrics.spikePct >= 0 ? "text-green-500" : "text-red-500"}`}>
              {metrics.spikePct >= 0 ? "▲" : "▼"} {Math.abs(metrics.spikePct)}%
            </span>
          </div>
          <p className="text-[11px] mt-1" style={{ color: t.textMuted }}>New users · vs prev 15m</p>
        </div>

        {/* Total events */}
        <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: isDark ? "linear-gradient(135deg, rgba(138,92,255,0.08), rgba(0,207,255,0.04))" : "linear-gradient(135deg, rgba(138,92,255,0.08), rgba(11,63,217,0.04))", border: `1px solid ${t.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-4 h-4" style={{ color: isDark ? "#8A5CFF" : "#7c3aed" }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Today</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-black text-3xl" style={{ color: t.textPrimary }}>
              {drops.filter(d => d.created_date && (Date.now() - new Date(d.created_date)) < 86400000).length}
            </span>
            <span className="text-xs font-semibold" style={{ color: t.textSecondary }}>drops</span>
          </div>
          <p className="text-[11px] mt-1" style={{ color: t.textMuted }}>In last 24 hours</p>
        </div>
      </div>

      {/* Trending categories */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4" style={{ color: "#FF9F1A" }} />
          <h3 className="font-bold text-sm" style={{ color: t.textPrimary }}>Trending Categories</h3>
          <span className="text-[10px]" style={{ color: t.textMuted }}>· last 50 drops</span>
        </div>
        {metrics.trending.length === 0 ? (
          <p className="text-xs italic" style={{ color: t.textMuted }}>No drop activity yet.</p>
        ) : (
          <div className="space-y-2">
            {metrics.trending.map(([cat, count], i) => {
              const pct = Math.round((count / metrics.total) * 100);
              const colors = ["#0B3FD9", "#1FB8FF", "#FF9F1A", "#FFD000", "#8A5CFF"];
              const color = colors[i % colors.length];
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="font-bold text-xs w-4 text-center" style={{ color: t.textMuted }}>{i + 1}</span>
                  <span className="font-semibold text-xs flex-1 truncate" style={{ color: t.textPrimary }}>{cat}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden max-w-[200px]" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(11,63,217,0.06)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
                  </div>
                  <span className="font-bold text-xs w-10 text-right" style={{ color: t.textSecondary }}>{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}