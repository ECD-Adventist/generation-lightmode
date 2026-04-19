import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Plus, Edit2, Trash2, Eye, EyeOff, Loader2, Calendar, Medal, Heart, Zap, Save } from "lucide-react";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";

function SeasonModal({ season, onClose, onSave, t, isDark }) {
  const [form, setForm] = useState({
    title: season?.title || "",
    start_date: season?.start_date || new Date().toISOString().split("T")[0],
    end_date: season?.end_date || "",
    metric: season?.metric || "combined",
    active: season?.active !== false,
    show_on_public: season?.show_on_public !== false,
    hidden_users: season?.hidden_users || "",
    top_count: season?.top_count || 10,
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(11,27,61,0.45)", backdropFilter: "blur(6px)" }}>
      <div className="rounded-[1.5rem] w-full max-w-lg overflow-hidden" style={{ background: isDark ? t.surface : "#FFFFFF", border: `1px solid ${t.border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
        <div className="p-6 border-b" style={{ borderColor: t.border }}>
          <h3 className="text-lg font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{season ? "Edit Season" : "New Leaderboard Season"}</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: t.textMuted }}>Season Title *</label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Monthly Glow Leaders — April 2026"
              style={{ background: isDark ? t.surfaceMuted : "#FAFBFF", borderColor: t.border, color: t.textPrimary }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: t.textMuted }}>Start Date *</label>
              <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                style={{ background: isDark ? t.surfaceMuted : "#FAFBFF", borderColor: t.border, color: t.textPrimary }} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: t.textMuted }}>End Date *</label>
              <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                style={{ background: isDark ? t.surfaceMuted : "#FAFBFF", borderColor: t.border, color: t.textPrimary }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: t.textMuted }}>Ranking Metric</label>
              <select value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background: isDark ? t.surfaceMuted : "#FAFBFF", borderColor: t.border, color: t.textPrimary }}>
                <option value="combined">Combined (Likes + Drops)</option>
                <option value="likes">Likes Only</option>
                <option value="drops">Drop Count Only</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: t.textMuted }}>Top Performers Count</label>
              <Input type="number" value={form.top_count} onChange={e => setForm({ ...form, top_count: parseInt(e.target.value) || 10 })}
                style={{ background: isDark ? t.surfaceMuted : "#FAFBFF", borderColor: t.border, color: t.textPrimary }} />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded" />
              <span className="text-xs font-semibold" style={{ color: t.textSecondary }}>Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.show_on_public} onChange={e => setForm({ ...form, show_on_public: e.target.checked })} className="rounded" />
              <span className="text-xs font-semibold" style={{ color: t.textSecondary }}>Show on Public Dashboard</span>
            </label>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: t.textMuted }}>Hidden Users (emails, comma-separated)</label>
            <Input value={form.hidden_users} onChange={e => setForm({ ...form, hidden_users: e.target.value })} placeholder="user@email.com, another@email.com"
              style={{ background: isDark ? t.surfaceMuted : "#FAFBFF", borderColor: t.border, color: t.textPrimary }} />
          </div>
        </div>
        <div className="flex items-center justify-between p-6 border-t" style={{ borderColor: t.border }}>
          <Button variant="ghost" onClick={onClose} style={{ color: t.textSecondary }}>Cancel</Button>
          <Button onClick={() => onSave(form)} disabled={!form.title || !form.start_date || !form.end_date}
            className="font-bold px-6" style={{ background: t.gradient, color: "#fff", border: "none" }}>
            <Save size={14} className="mr-1.5" /> Save Season
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminGlobalLeaderboardsTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null); // null | "new" | season object
  const [expandedId, setExpandedId] = useState(null);

  const { data: seasons = [], isLoading } = useQuery({
    queryKey: ["leaderboardSeasons"],
    queryFn: () => base44.entities.LeaderboardSeason.list("-created_date"),
  });
  const { data: drops = [] } = useQuery({ queryKey: ["admin_drops"], queryFn: () => base44.entities.GlowDrop.list() });
  const { data: users = [] } = useQuery({ queryKey: ["admin_users"], queryFn: () => base44.functions.invoke("listPublicUsers", {}).then(r => r.data) });

  const saveMutation = useMutation({
    mutationFn: async (form) => {
      if (modal && modal.id) {
        await base44.entities.LeaderboardSeason.update(modal.id, form);
      } else {
        await base44.entities.LeaderboardSeason.create(form);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leaderboardSeasons"] }); setModal(null); toast.success("Season saved!"); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LeaderboardSeason.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leaderboardSeasons"] }); toast.success("Season deleted"); }
  });

  const getRankings = (season) => {
    const start = new Date(season.start_date);
    const end = new Date(season.end_date);
    end.setHours(23, 59, 59);
    const hidden = new Set((season.hidden_users || "").split(",").map(s => s.trim()).filter(Boolean));

    const seasonDrops = drops.filter(d => {
      if (!d.created_date || !d.user_email) return false;
      const dt = new Date(d.created_date);
      return dt >= start && dt <= end && d.status === "approved" && !hidden.has(d.user_email);
    });

    const map = {};
    seasonDrops.forEach(d => {
      if (!map[d.user_email]) map[d.user_email] = { email: d.user_email, drops: 0, likes: 0 };
      map[d.user_email].drops++;
      map[d.user_email].likes += d.likes_count || 0;
    });

    return Object.values(map)
      .map(p => ({
        ...p,
        score: season.metric === "likes" ? p.likes : season.metric === "drops" ? p.drops : p.likes + p.drops,
        name: users.find(u => u.email === p.email)?.full_name || p.email?.split("@")[0],
        avatar: users.find(u => u.email === p.email)?.profile_picture_url,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, season.top_count || 10);
  };

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Global Leaderboard Seasons</h1>
          <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>Define time-bound leaderboard seasons with auto-calculated rankings from drops.</p>
        </div>
        <Button onClick={() => setModal("new")} className="font-bold" style={{ background: t.gradient, color: "#fff", border: "none" }}>
          <Plus size={14} className="mr-1.5" /> New Season
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: t.accent }} /></div>
      ) : seasons.length === 0 ? (
        <div className="text-center py-16 rounded-[1.25rem] border" style={{ background: t.surface, borderColor: t.border, color: t.textMuted }}>
          <Trophy size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No leaderboard seasons created yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {seasons.map(season => {
            const isExpanded = expandedId === season.id;
            const rankings = isExpanded ? getRankings(season) : [];
            const isActive = season.active && new Date(season.end_date) >= new Date();
            return (
              <div key={season.id} className="rounded-[1.25rem] border overflow-hidden transition-all" style={{ background: t.surface, borderColor: t.border }}>
                <div className="p-5 flex flex-wrap items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : season.id)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: isDark ? "rgba(255,208,0,0.12)" : "#FFFBEB" }}>
                    <Trophy size={18} style={{ color: isDark ? "#FFD000" : "#d97706" }} />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="text-sm font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{season.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] flex items-center gap-1" style={{ color: t.textMuted }}><Calendar size={10} /> {season.start_date} → {season.end_date}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${isActive ? (isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-700") : (isDark ? "bg-gray-500/10 text-gray-400" : "bg-gray-100 text-gray-500")}`}>
                        {isActive ? "Active" : "Ended"}
                      </span>
                      <span className="text-[9px] font-bold uppercase" style={{ color: t.textMuted }}>
                        {season.metric === "likes" ? "Likes" : season.metric === "drops" ? "Drops" : "Combined"}
                      </span>
                      {season.show_on_public ? <Eye size={12} style={{ color: isDark ? "#22c55e" : "#16a34a" }} /> : <EyeOff size={12} style={{ color: t.textMuted }} />}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={e => { e.stopPropagation(); setModal(season); }} className="h-8" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#EEF3FF", color: t.accent, border: `1px solid ${t.border}` }}>
                      <Edit2 size={12} className="mr-1" /> Edit
                    </Button>
                    <Button size="sm" onClick={e => { e.stopPropagation(); if (window.confirm("Delete this season?")) deleteMutation.mutate(season.id); }} className="h-8" style={{ background: isDark ? "rgba(239,68,68,0.08)" : "#FEE2E2", color: "#dc2626", border: `1px solid ${isDark ? "rgba(239,68,68,0.15)" : "#FECACA"}` }}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-5 pb-5 border-t" style={{ borderColor: t.border }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-4 mb-3" style={{ color: t.textMuted }}>Live Rankings ({rankings.length})</p>
                    {rankings.length === 0 ? (
                      <p className="text-xs py-4 text-center" style={{ color: t.textMuted }}>No qualifying drops in this period.</p>
                    ) : (
                      <div className="space-y-2">
                        {rankings.map((r, i) => (
                          <div key={r.email} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: i < 3 ? (isDark ? "rgba(255,208,0,0.04)" : "rgba(255,208,0,0.06)") : "transparent" }}>
                            <span className="w-7 text-center text-sm">{medals[i] || <span className="text-[10px] font-bold" style={{ color: t.textMuted }}>#{i + 1}</span>}</span>
                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0" style={{ border: `1.5px solid ${t.border}` }}>
                              <img src={r.avatar || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate" style={{ color: t.textPrimary }}>{r.name}</p>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold shrink-0">
                              <span className="flex items-center gap-0.5" style={{ color: isDark ? "#f43f5e" : "#e11d48" }}><Heart size={10} /> {r.likes}</span>
                              <span className="flex items-center gap-0.5" style={{ color: isDark ? "#FFD000" : "#d97706" }}><Zap size={10} /> {r.drops}</span>
                              <span className="px-2 py-0.5 rounded-md font-black" style={{ background: isDark ? "rgba(0,207,255,0.1)" : "#EEF3FF", color: t.accent }}>{r.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && (
        <SeasonModal season={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={form => saveMutation.mutate(form)} t={t} isDark={isDark} />
      )}
    </div>
  );
}