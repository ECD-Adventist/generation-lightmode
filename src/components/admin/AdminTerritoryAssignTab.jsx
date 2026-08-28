import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, CheckCircle, XCircle, Clock, Zap, MapPin, RefreshCw, UserCheck, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

const TERRITORY_LEVELS = [
  { value: "church", label: "Church" },
  { value: "conference_field", label: "Conference / Field" },
  { value: "union", label: "Union" },
  { value: "country", label: "Country" },
  { value: "ecd", label: "ECD Division" },
];

const getStatusConfig = (isDark) => ({
  approved: { label: "Approved", color: isDark ? "#22c55e" : "#16a34a", icon: CheckCircle },
  pending: { label: "Pending", color: isDark ? "#FFD000" : "#d97706", icon: Clock },
  rejected: { label: "Rejected", color: isDark ? "#ef4444" : "#dc2626", icon: XCircle },
});

function AssignModal({ user: targetUser, onClose, onSave, t, isDark }) {
  const [territoryName, setTerritoryName] = useState(targetUser.territory_name || "");
  const [territoryLevel, setTerritoryLevel] = useState(targetUser.territory_level || "");
  const [territoryCountries, setTerritoryCountries] = useState(targetUser.territory_countries || targetUser.country || "");
  const [status, setStatus] = useState(targetUser.territory_status || "pending");
  const [saving, setSaving] = useState(false);
  const STATUS_CONFIG = getStatusConfig(isDark);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("assignUserTerritory", {
        userId: targetUser.id,
        territory_name: territoryName,
        territory_level: territoryLevel,
        territory_countries: territoryCountries,
        status,
      });
      onSave();
      toast.success(`Territory updated for ${targetUser.full_name || targetUser.email}`);
      onClose();
    } catch {
      toast.error("Could not update territory assignment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl" style={{ background: t.surface, borderColor: t.border }}>
        <div className="flex items-center gap-3 mb-2">
          <img
            src={targetUser.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
            className="w-10 h-10 rounded-full object-cover border" style={{ borderColor: t.border }}
          />
          <div>
            <p className="font-bold text-sm" style={{ color: t.textPrimary }}>{targetUser.full_name || targetUser.email}</p>
            <p className="text-[11px]" style={{ color: t.textMuted }}>{[targetUser.city, targetUser.country].filter(Boolean).join(", ")}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: t.textSecondary }}>Territory Name</label>
          <input
            value={territoryName}
            onChange={e => setTerritoryName(e.target.value)}
            placeholder="e.g. Central Nairobi Church"
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
            style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: t.textSecondary }}>Territory Level</label>
          <select
            value={territoryLevel}
            onChange={e => setTerritoryLevel(e.target.value)}
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
            style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
          >
            <option value="">Select level…</option>
            {TERRITORY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: t.textSecondary }}>Territory Countries / Region</label>
          <input
            value={territoryCountries}
            onChange={e => setTerritoryCountries(e.target.value)}
            placeholder="e.g. Kenya, Uganda"
            className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
            style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: t.textSecondary }}>Approval Status</label>
          <div className="flex gap-2">
            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={val}
                  onClick={() => setStatus(val)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition`}
                  style={status === val
                    ? { background: `${cfg.color}18`, borderColor: `${cfg.color}50`, color: cfg.color }
                    : { borderColor: t.border, color: t.textSecondary, background: "transparent" }
                  }
                >
                  <Icon size={12} /> {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm transition" style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl font-black text-sm transition disabled:opacity-50" style={{ background: t.accent, color: "#fff", border: "none" }}>
            {saving ? "Saving…" : "Save Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTerritoryAssignTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const STATUS_CONFIG = getStatusConfig(isDark);

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterHasAddress, setFilterHasAddress] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [autoAssigning, setAutoAssigning] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["assign_tab_users"],
    queryFn: () => base44.functions.invoke("adminListUsers", {}).then(r => r.data || []),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      if (filterHasAddress && (!u.city || !u.postal_code)) return false;
      if (filterStatus !== "all" && u.territory_status !== filterStatus) return false;
      if (q && !u.full_name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q) &&
          !u.city?.toLowerCase().includes(q) && !u.country?.toLowerCase().includes(q) &&
          !u.postal_code?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, search, filterStatus, filterHasAddress]);

  const handleQuickStatus = async (userId, newStatus) => {
    try {
      await base44.functions.invoke("assignUserTerritory", { userId, status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["assign_tab_users"] });
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      const res = await base44.functions.invoke("autoAssignTerritories", {});
      const assigned = res.data?.assigned || 0;
      const unresolved = res.data?.unresolved || 0;
      toast.success(`Assigned ${assigned} user(s) from stored location data. ${unresolved} still have no usable location.`);
      queryClient.invalidateQueries({ queryKey: ["assign_tab_users"] });
      queryClient.invalidateQueries({ queryKey: ["territory_map_users"] });
      queryClient.invalidateQueries({ queryKey: ["admin_users_countries"] });
    } catch {
      toast.error("Auto-assign failed");
    } finally {
      setAutoAssigning(false);
    }
  };

  const stats = useMemo(() => ({
    total: users.length,
    approved: users.filter(u => u.territory_status === "approved").length,
    pending: users.filter(u => u.territory_status === "pending").length,
    unassigned: users.filter(u => !u.territory_name).length,
  }), [users]);

  return (
    <div className="space-y-6">
      {editingUser && (
        <AssignModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={() => queryClient.invalidateQueries({ queryKey: ["assign_tab_users"] })}
          t={t} isDark={isDark}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>🏷️ Territory Assignment</h1>
          <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>Manually review or auto-assign users to territories based on their address data.</p>
        </div>
        <button
          onClick={handleAutoAssign}
          disabled={autoAssigning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition disabled:opacity-50 shrink-0"
          style={{ background: isDark ? "rgba(138,92,255,0.15)" : "#f3e8ff", borderColor: isDark ? "rgba(138,92,255,0.3)" : "#e9d5ff", color: isDark ? "#8A5CFF" : "#7e22ce" }}
        >
          <RefreshCw size={15} className={autoAssigning ? "animate-spin" : ""} />
          {autoAssigning ? "Auto-Assigning…" : "Auto-Assign All"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, color: isDark ? "#00CFFF" : "#0B3FD9" },
          { label: "Approved", value: stats.approved, color: isDark ? "#22c55e" : "#16a34a" },
          { label: "Pending", value: stats.pending, color: isDark ? "#FFD000" : "#d97706" },
          { label: "Unassigned", value: stats.unassigned, color: isDark ? "#ef4444" : "#dc2626" },
        ].map((s, i) => (
          <div key={i} className="border rounded-2xl p-4 text-center" style={{ background: t.surface, borderColor: t.border }}>
            <p className="text-2xl font-black font-['Space_Grotesk']" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: t.textMuted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, city, postal code…"
            className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none transition"
            style={{ background: t.surface, borderColor: t.border, color: t.textPrimary }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition`}
              style={filterStatus === val ? { background: t.accentSoft, borderColor: t.borderStrong, color: t.accent } : { borderColor: t.border, color: t.textSecondary, background: "transparent" }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setFilterHasAddress(!filterHasAddress)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1`}
            style={filterHasAddress ? { background: isDark ? "rgba(34,197,94,0.15)" : "#dcfce7", borderColor: isDark ? "rgba(34,197,94,0.4)" : "#bbf7d0", color: isDark ? "#22c55e" : "#16a34a" } : { borderColor: t.border, color: t.textSecondary, background: "transparent" }}
          >
            <MapPin size={11} /> Has Address
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="border rounded-2xl overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: t.border }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textSecondary }}>{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
          <UserCheck size={16} style={{ color: t.textMuted }} />
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm" style={{ color: t.textMuted }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: t.textMuted }}>No users match your filters.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: t.border }}>
            {filtered.map(u => {
              const statusCfg = STATUS_CONFIG[u.territory_status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const hasLocation = u.city && u.postal_code;

              return (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 transition hover:opacity-80" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(11,27,61,0.02)" }}>
                  <img
                    src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                    className="w-9 h-9 rounded-full object-cover border shrink-0" style={{ borderColor: t.border }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: t.textPrimary }}>{u.full_name || u.email}</p>
                    <p className="text-[11px] truncate" style={{ color: t.textMuted }}>
                      {hasLocation
                        ? [u.address, u.city, u.postal_code, u.country].filter(Boolean).join(" · ")
                        : <span className="text-orange-500">⚠ Location incomplete</span>
                      }
                    </p>
                    {u.territory_name && (
                      <p className="text-[10px] font-semibold truncate mt-0.5" style={{ color: isDark ? "#8A5CFF" : "#7e22ce" }}>📍 {u.territory_name} {u.territory_level ? `(${u.territory_level})` : ""}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleQuickStatus(u.id, u.territory_status === "approved" ? "pending" : "approved")}
                      title={u.territory_status === "approved" ? "Revoke approval" : "Quick approve"}
                      className={`w-7 h-7 rounded-full flex items-center justify-center border transition`}
                      style={u.territory_status === "approved" ? { background: isDark ? "rgba(34,197,94,0.2)" : "#dcfce7", borderColor: isDark ? "rgba(34,197,94,0.4)" : "#bbf7d0", color: isDark ? "#22c55e" : "#16a34a" } : { borderColor: t.border, color: t.textMuted, background: "transparent" }}
                    >
                      <CheckCircle size={13} />
                    </button>
                    <button
                      onClick={() => handleQuickStatus(u.id, u.territory_status === "rejected" ? "pending" : "rejected")}
                      title={u.territory_status === "rejected" ? "Unreject" : "Quick reject"}
                      className={`w-7 h-7 rounded-full flex items-center justify-center border transition`}
                      style={u.territory_status === "rejected" ? { background: isDark ? "rgba(239,68,68,0.2)" : "#fee2e2", borderColor: isDark ? "rgba(239,68,68,0.4)" : "#fecaca", color: isDark ? "#ef4444" : "#dc2626" } : { borderColor: t.border, color: t.textMuted, background: "transparent" }}
                    >
                      <XCircle size={13} />
                    </button>

                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                      style={{ color: statusCfg.color, background: `${statusCfg.color}15`, border: `1px solid ${statusCfg.color}30` }}>
                      <StatusIcon size={10} /> {statusCfg.label}
                    </div>

                    <button
                      onClick={() => setEditingUser(u)}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold transition hover:opacity-70"
                      style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}