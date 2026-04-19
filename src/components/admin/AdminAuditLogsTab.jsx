import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, Shield, Loader2, Trash2, Filter } from "lucide-react";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

const CATEGORY_COLORS = {
  permissions: { bg: "#7e22ce", label: "Permissions" },
  settings: { bg: "#0B3FD9", label: "Settings" },
  institutions: { bg: "#d97706", label: "Institutions" },
  moderation: { bg: "#dc2626", label: "Moderation" },
  users: { bg: "#0891b2", label: "Users" },
  content: { bg: "#16a34a", label: "Content" },
  territory: { bg: "#8A5CFF", label: "Territory" },
  other: { bg: "#6b7280", label: "Other" },
};

export default function AdminAuditLogsTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["adminAuditLogs"],
    queryFn: () => base44.entities.AdminLog.list("-created_date", 200),
  });

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      log.action?.toLowerCase().includes(q) ||
      log.admin_email?.toLowerCase().includes(q) ||
      log.admin_name?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.target?.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "all" || (log.category || "other") === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = {};
  logs.forEach(l => {
    const c = l.category || "other";
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 border text-xs font-bold rounded-full mb-3 uppercase tracking-widest"
          style={{ background: isDark ? "rgba(239,68,68,0.1)" : "#fee2e2", borderColor: isDark ? "rgba(239,68,68,0.2)" : "#fecaca", color: isDark ? "#f87171" : "#dc2626" }}>
          <Shield size={12} /> Super Admin Only
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Audit Logs</h1>
        <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>Track all sensitive administrative actions across the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Actions", value: logs.length, color: isDark ? "#00CFFF" : "#0B3FD9" },
          { label: "Today", value: logs.filter(l => l.created_date && new Date(l.created_date).toDateString() === new Date().toDateString()).length, color: isDark ? "#22c55e" : "#16a34a" },
          { label: "This Week", value: logs.filter(l => l.created_date && Date.now() - new Date(l.created_date) < 7 * 86400000).length, color: isDark ? "#FFD000" : "#d97706" },
          { label: "Categories", value: Object.keys(categoryCounts).length, color: isDark ? "#8A5CFF" : "#7e22ce" },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs by action, admin, target..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none border"
            style={{ background: t.surface, borderColor: t.border, color: t.textPrimary }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setCategoryFilter("all")} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
            style={categoryFilter === "all" ? { background: t.gradient, color: "#fff" } : { background: t.surface, color: t.textSecondary, border: `1px solid ${t.border}` }}>
            All ({logs.length})
          </button>
          {Object.entries(CATEGORY_COLORS).map(([key, val]) => categoryCounts[key] ? (
            <button key={key} onClick={() => setCategoryFilter(key)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
              style={categoryFilter === key ? { background: val.bg, color: "#fff" } : { background: t.surface, color: t.textSecondary, border: `1px solid ${t.border}` }}>
              {val.label} ({categoryCounts[key]})
            </button>
          ) : null)}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-[1.25rem] border overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: t.accent }} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: t.textMuted }}>
            <FileText size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["Action", "Admin", "Target", "Details", "Category", "Time"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: t.textMuted, background: isDark ? "rgba(255,255,255,0.02)" : "#FAFBFF" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const cat = CATEGORY_COLORS[log.category || "other"] || CATEGORY_COLORS.other;
                  return (
                    <tr key={log.id || i} className="transition" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)"}` }}
                      onMouseOver={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.015)" : "rgba(11,63,217,0.015)"}
                      onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: t.textPrimary }}>{log.action}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold" style={{ color: t.textPrimary }}>{log.admin_name || log.admin_email?.split("@")[0]}</p>
                        <p className="text-[9px]" style={{ color: t.textMuted }}>{log.admin_email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: t.textSecondary }}>{log.target || "—"}</td>
                      <td className="px-4 py-3 text-xs max-w-[220px] truncate" style={{ color: t.textSecondary }}>{log.details || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider text-white" style={{ background: cat.bg }}>{cat.label}</span>
                      </td>
                      <td className="px-4 py-3 text-[10px] whitespace-nowrap" style={{ color: t.textMuted }}>
                        {log.created_date ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}