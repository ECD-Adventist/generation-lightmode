import React, { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BarChart3, Trophy, Target as TargetIcon } from "lucide-react";

export default function ChallengesAnalytics({ challenges, submissions, t, isDark }) {
  // Submissions per day, last 30 days
  const submissionsOverTime = useMemo(() => {
    const days = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.key, i]));
    submissions.forEach(s => {
      if (!s.created_date) return;
      const k = new Date(s.created_date).toISOString().slice(0, 10);
      if (idx.has(k)) days[idx.get(k)].count += 1;
    });
    return days;
  }, [submissions]);

  // Top 5 challenges by participants
  const topChallenges = useMemo(() => {
    return challenges.map(c => {
      const subs = submissions.filter(s => s.challenge_id === c.id);
      const participants = new Set(subs.map(s => s.user_email)).size;
      return { id: c.id, title: c.title, participants, submissions: subs.length };
    }).sort((a, b) => b.participants - a.participants).slice(0, 5);
  }, [challenges, submissions]);

  // Completion rate: active/ended challenges with ≥1 submission
  const completionStats = useMemo(() => {
    const withSubs = challenges.filter(c => submissions.some(s => s.challenge_id === c.id)).length;
    const total = challenges.length || 1;
    return { withSubs, total: challenges.length, rate: Math.round((withSubs / total) * 100) };
  }, [challenges, submissions]);

  if (challenges.length === 0) return null;

  const chartColor = "#FFD000";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  return (
    <div className="rounded-2xl border p-5" style={{ background: t.surface, borderColor: t.border }}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} style={{ color: t.accent }} />
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: t.textPrimary }}>Analytics Snapshot</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2">
          <p className="text-xs font-semibold mb-2" style={{ color: t.textSecondary }}>Submissions — last 30 days</p>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={submissionsOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fill: t.textMuted, fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: t.textMuted, fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: t.textPrimary }}
                  itemStyle={{ color: chartColor }}
                />
                <Line type="monotone" dataKey="count" stroke={chartColor} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side panels */}
        <div className="space-y-4">
          <div className="rounded-xl p-3 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <p className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 mb-1" style={{ color: t.textMuted }}>
              <TargetIcon size={11} /> Completion Rate
            </p>
            <p className="font-black text-2xl" style={{ color: isDark ? "#FFD000" : "#d97706" }}>{completionStats.rate}%</p>
            <p className="text-[10px]" style={{ color: t.textMuted }}>{completionStats.withSubs} of {completionStats.total} have ≥1 submission</p>
          </div>

          <div className="rounded-xl p-3 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <p className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 mb-2" style={{ color: t.textMuted }}>
              <Trophy size={11} /> Top Performers
            </p>
            {topChallenges.length === 0 ? (
              <p className="text-[11px]" style={{ color: t.textMuted }}>No data yet.</p>
            ) : (
              <div className="space-y-1.5">
                {topChallenges.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2 text-[11px]">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0" style={{ background: i === 0 ? "#FFD000" : t.surface, color: i === 0 ? "#0B1B3D" : t.textSecondary }}>{i + 1}</span>
                    <span className="flex-1 truncate font-semibold" style={{ color: t.textPrimary }}>{c.title}</span>
                    <span className="shrink-0 font-bold" style={{ color: t.accent }}>{c.participants}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}