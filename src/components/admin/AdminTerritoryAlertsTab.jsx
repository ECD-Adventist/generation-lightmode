import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Flag, Eye, AlertTriangle, Loader2, Search, Globe, Zap, Users, CheckCheck, X, Shield } from "lucide-react";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const TYPE_CONFIG = {
  new_drop: { icon: Zap, label: "New Drop", color: "#d97706", bg: "#FFFBEB" },
  new_group: { icon: Users, label: "New Group", color: "#7e22ce", bg: "#F3E8FF" },
  new_user: { icon: Globe, label: "New User", color: "#0B3FD9", bg: "#EEF3FF" },
};

export default function AdminTerritoryAlertsTab({ currentUser }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, unread, flagged
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["territoryAlerts", currentUser?.email],
    queryFn: () => base44.entities.TerritoryAlert.filter({ admin_email: currentUser?.email }, "-created_date", 200),
    enabled: !!currentUser?.email,
    refetchInterval: 30 * 1000, // polled; table-wide subscription removed
  });


  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.TerritoryAlert.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["territoryAlerts", currentUser?.email] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = alerts.filter(a => !a.read);
      await Promise.all(unread.map(a => base44.entities.TerritoryAlert.update(a.id, { read: true })));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["territoryAlerts", currentUser?.email] }); toast.success("All marked as read"); },
  });

  const takeActionMutation = useMutation({
    mutationFn: ({ id, action }) => base44.entities.TerritoryAlert.update(id, { action_taken: action, read: true, flagged: action === "flagged" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["territoryAlerts", currentUser?.email] }); toast.success("Action recorded"); },
  });

  const filtered = useMemo(() => alerts.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch = !search || a.summary?.toLowerCase().includes(q) || a.country?.toLowerCase().includes(q) || a.actor_email?.toLowerCase().includes(q);
    const matchesFilter = filter === "all" || (filter === "unread" && !a.read) || (filter === "flagged" && a.flagged);
    const matchesType = typeFilter === "all" || a.alert_type === typeFilter;
    return matchesSearch && matchesFilter && matchesType;
  }), [alerts, search, filter, typeFilter]);

  const unreadCount = alerts.filter(a => !a.read).length;
  const flaggedCount = alerts.filter(a => a.flagged).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Territory Alerts</h1>
          <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>Real-time notifications for new activity in your assigned territories.</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={() => markAllReadMutation.mutate()} className="font-bold text-xs" style={{ background: isDark ? "rgba(0,207,255,0.1)" : "#EEF3FF", color: t.accent, border: `1px solid ${isDark ? "rgba(0,207,255,0.2)" : t.border}` }}>
            <CheckCheck size={14} className="mr-1.5" /> Mark All Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Alerts", value: alerts.length, color: isDark ? "#00CFFF" : "#0B3FD9" },
          { label: "Unread", value: unreadCount, color: isDark ? "#FFD000" : "#d97706" },
          { label: "Flagged", value: flaggedCount, color: isDark ? "#f43f5e" : "#dc2626" },
          { label: "Actioned", value: alerts.filter(a => a.action_taken && a.action_taken !== "none").length, color: isDark ? "#22c55e" : "#16a34a" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4 border" style={{ background: t.surface, borderColor: t.border }}>
            <p className="text-2xl font-black font-['Space_Grotesk']" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: t.textMuted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search alerts..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none border"
            style={{ background: t.surface, borderColor: t.border, color: t.textPrimary }} />
        </div>
        <div className="flex gap-1.5">
          {[{ k: "all", l: "All" }, { k: "unread", l: `Unread (${unreadCount})` }, { k: "flagged", l: `Flagged (${flaggedCount})` }].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
              style={filter === f.k ? { background: t.gradient, color: "#fff" } : { background: t.surface, color: t.textSecondary, border: `1px solid ${t.border}` }}>
              {f.l}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {[{ k: "all", l: "All Types" }, { k: "new_drop", l: "Drops" }, { k: "new_group", l: "Groups" }, { k: "new_user", l: "Users" }].map(f => (
            <button key={f.k} onClick={() => setTypeFilter(f.k)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
              style={typeFilter === f.k ? { background: isDark ? "rgba(255,208,0,0.15)" : "#FFFBEB", color: isDark ? "#FFD000" : "#92400E", border: `1px solid ${isDark ? "rgba(255,208,0,0.2)" : "#FDE68A"}` } : { background: t.surface, color: t.textSecondary, border: `1px solid ${t.border}` }}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: t.accent }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-[1.25rem] border" style={{ background: t.surface, borderColor: t.border, color: t.textMuted }}>
          <Bell size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No territory alerts found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(alert => {
            const cfg = TYPE_CONFIG[alert.alert_type] || TYPE_CONFIG.new_drop;
            const Icon = cfg.icon;
            return (
              <div key={alert.id} className="rounded-xl border p-4 flex flex-wrap items-start gap-4 transition-all" style={{
                background: !alert.read ? (isDark ? "rgba(0,207,255,0.03)" : "#F8FAFF") : t.surface,
                borderColor: !alert.read ? (isDark ? "rgba(0,207,255,0.1)" : "rgba(11,63,217,0.08)") : t.border,
                borderLeft: !alert.read ? `3px solid ${cfg.color}` : `1px solid ${t.border}`
              }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: isDark ? `${cfg.color}15` : cfg.bg }}>
                  <Icon size={16} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider text-white" style={{ background: cfg.color }}>{cfg.label}</span>
                    {alert.country && <span className="text-[10px] font-semibold" style={{ color: t.textMuted }}>📍 {alert.country}</span>}
                    {alert.flagged && <Flag size={12} style={{ color: "#dc2626" }} />}
                    {!alert.read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <p className="text-sm font-semibold" style={{ color: t.textPrimary }}>{alert.summary}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {alert.actor_email && <span className="text-[10px]" style={{ color: t.textMuted }}>by {alert.actor_email.split("@")[0]}</span>}
                    <span className="text-[10px]" style={{ color: t.textMuted }}>{alert.created_date ? formatDistanceToNow(new Date(alert.created_date), { addSuffix: true }) : ""}</span>
                    {alert.action_taken && alert.action_taken !== "none" && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase" style={{ background: isDark ? "rgba(34,197,94,0.1)" : "#DCFCE7", color: isDark ? "#4ade80" : "#16a34a" }}>
                        {alert.action_taken}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {!alert.read && (
                    <Button size="sm" onClick={() => markReadMutation.mutate(alert.id)} className="h-7 text-[10px]" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#F0F4FA", color: t.textSecondary, border: `1px solid ${t.border}` }}>
                      <Check size={12} className="mr-0.5" /> Read
                    </Button>
                  )}
                  <Button size="sm" onClick={() => takeActionMutation.mutate({ id: alert.id, action: "moderated" })} className="h-7 text-[10px]" style={{ background: isDark ? "rgba(0,207,255,0.08)" : "#EEF3FF", color: t.accent, border: `1px solid ${isDark ? "rgba(0,207,255,0.15)" : t.border}` }}>
                    <Shield size={12} className="mr-0.5" /> Moderate
                  </Button>
                  <Button size="sm" onClick={() => takeActionMutation.mutate({ id: alert.id, action: "flagged" })} className="h-7 text-[10px]" style={{ background: isDark ? "rgba(239,68,68,0.08)" : "#FEE2E2", color: "#dc2626", border: `1px solid ${isDark ? "rgba(239,68,68,0.15)" : "#FECACA"}` }}>
                    <Flag size={12} className="mr-0.5" /> Flag
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}