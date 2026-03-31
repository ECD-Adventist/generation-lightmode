import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, CheckCircle, XCircle, Clock, Zap, MapPin, RefreshCw, UserCheck, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const TERRITORY_LEVELS = [
  { value: "church", label: "Church" },
  { value: "conference_field", label: "Conference / Field" },
  { value: "union", label: "Union" },
  { value: "country", label: "Country" },
  { value: "ecd", label: "ECD Division" },
];

const STATUS_CONFIG = {
  approved: { label: "Approved", color: "#22c55e", icon: CheckCircle },
  pending: { label: "Pending", color: "#FFD000", icon: Clock },
  rejected: { label: "Rejected", color: "#ef4444", icon: XCircle },
};

function AssignModal({ user: targetUser, onClose, onSave }) {
  const [territoryName, setTerritoryName] = useState(targetUser.territory_name || "");
  const [territoryLevel, setTerritoryLevel] = useState(targetUser.territory_level || "");
  const [territoryCountries, setTerritoryCountries] = useState(targetUser.territory_countries || targetUser.country || "");
  const [status, setStatus] = useState(targetUser.territory_status || "pending");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.asServiceRole?.entities?.User?.update(targetUser.id, {
        territory_name: territoryName,
        territory_level: territoryLevel,
        territory_countries: territoryCountries,
        territory_status: status,
      });
      onSave();
      toast.success(`Territory updated for ${targetUser.full_name || targetUser.email}`);
      onClose();
    } catch {
      // Fallback: use the updateMe approach via a backend function if direct update fails
      toast.error("Could not update directly — please use the backend assign function.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0B0F1A] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <img
            src={targetUser.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
            className="w-10 h-10 rounded-full object-cover border border-white/10"
          />
          <div>
            <p className="font-bold text-white text-sm">{targetUser.full_name || targetUser.email}</p>
            <p className="text-[11px] text-gray-500">{[targetUser.city, targetUser.country].filter(Boolean).join(", ")}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Territory Name</label>
          <input
            value={territoryName}
            onChange={e => setTerritoryName(e.target.value)}
            placeholder="e.g. Central Nairobi Church"
            className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Territory Level</label>
          <select
            value={territoryLevel}
            onChange={e => setTerritoryLevel(e.target.value)}
            className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00CFFF]/40"
          >
            <option value="">Select level…</option>
            {TERRITORY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Territory Countries / Region</label>
          <input
            value={territoryCountries}
            onChange={e => setTerritoryCountries(e.target.value)}
            placeholder="e.g. Kenya, Uganda"
            className="w-full bg-[#121826] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Approval Status</label>
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
                    : { borderColor: "rgba(255,255,255,0.08)", color: "#6b7280" }
                  }
                >
                  <Icon size={12} /> {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#00CFFF] text-black font-black text-sm hover:bg-[#00CFFF]/80 transition disabled:opacity-50">
            {saving ? "Saving…" : "Save Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTerritoryAssignTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterHasAddress, setFilterHasAddress] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [autoAssigning, setAutoAssigning] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["assign_tab_users"],
    queryFn: () => base44.functions.invoke("listPublicUsers", {}).then(r => r.data || []),
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
      toast.success(`Auto-assigned ${res.data?.assigned || 0} user(s) based on postal/city data.`);
      queryClient.invalidateQueries({ queryKey: ["assign_tab_users"] });
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
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white">🏷️ Territory Assignment</h1>
          <p className="text-gray-400 text-sm mt-1">Manually review or auto-assign users to territories based on their address data.</p>
        </div>
        <button
          onClick={handleAutoAssign}
          disabled={autoAssigning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8A5CFF]/15 border border-[#8A5CFF]/30 text-[#8A5CFF] text-sm font-bold hover:bg-[#8A5CFF]/25 transition disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={15} className={autoAssigning ? "animate-spin" : ""} />
          {autoAssigning ? "Auto-Assigning…" : "Auto-Assign All"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, color: "#00CFFF" },
          { label: "Approved", value: stats.approved, color: "#22c55e" },
          { label: "Pending", value: stats.pending, color: "#FFD000" },
          { label: "Unassigned", value: stats.unassigned, color: "#ef4444" },
        ].map((s, i) => (
          <div key={i} className="bg-[#121826] border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black font-['Space_Grotesk']" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, city, postal code…"
            className="w-full bg-[#121826] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition ${filterStatus === val ? "bg-[#00CFFF]/15 border-[#00CFFF]/40 text-[#00CFFF]" : "border-white/10 text-gray-400 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setFilterHasAddress(!filterHasAddress)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${filterHasAddress ? "bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e]" : "border-white/10 text-gray-400 hover:text-white"}`}
          >
            <MapPin size={11} /> Has Address
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
          <UserCheck size={16} className="text-gray-500" />
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No users match your filters.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(u => {
              const statusCfg = STATUS_CONFIG[u.territory_status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const hasLocation = u.city && u.postal_code;

              return (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition">
                  <img
                    src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                    className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.full_name || u.email}</p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {hasLocation
                        ? [u.address, u.city, u.postal_code, u.country].filter(Boolean).join(" · ")
                        : <span className="text-orange-400">⚠ Location incomplete</span>
                      }
                    </p>
                    {u.territory_name && (
                      <p className="text-[10px] text-[#8A5CFF] font-semibold truncate mt-0.5">📍 {u.territory_name} {u.territory_level ? `(${u.territory_level})` : ""}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Quick approve/reject toggles */}
                    <button
                      onClick={() => handleQuickStatus(u.id, u.territory_status === "approved" ? "pending" : "approved")}
                      title={u.territory_status === "approved" ? "Revoke approval" : "Quick approve"}
                      className={`w-7 h-7 rounded-full flex items-center justify-center border transition ${u.territory_status === "approved" ? "bg-[#22c55e]/20 border-[#22c55e]/40 text-[#22c55e]" : "border-white/10 text-gray-600 hover:text-[#22c55e] hover:border-[#22c55e]/40"}`}
                    >
                      <CheckCircle size={13} />
                    </button>
                    <button
                      onClick={() => handleQuickStatus(u.id, u.territory_status === "rejected" ? "pending" : "rejected")}
                      title={u.territory_status === "rejected" ? "Unreject" : "Quick reject"}
                      className={`w-7 h-7 rounded-full flex items-center justify-center border transition ${u.territory_status === "rejected" ? "bg-[#ef4444]/20 border-[#ef4444]/40 text-[#ef4444]" : "border-white/10 text-gray-600 hover:text-[#ef4444] hover:border-[#ef4444]/40"}`}
                    >
                      <XCircle size={13} />
                    </button>

                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                      style={{ color: statusCfg.color, background: `${statusCfg.color}15`, border: `1px solid ${statusCfg.color}30` }}>
                      <StatusIcon size={10} /> {statusCfg.label}
                    </div>

                    <button
                      onClick={() => setEditingUser(u)}
                      className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:border-white/20 transition"
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