import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Search, Edit2, Trash2, Shield, Loader2, Calendar, Users, Activity,
  Filter, MapPin, Zap, AlertCircle, Mail, X, Check, User, Clock, Map,
  CheckSquare, Square, RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function roleColor(role, isDark) {
  switch (role) {
    case "super_admin": return isDark ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-purple-100 text-purple-700 border-purple-200";
    case "admin":
    case "ecd_admin":
    case "country_admin":
    case "union_admin":
    case "conference_field_admin":
    case "church_admin":
      return isDark ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-700 border-red-200";
    case "moderator": return isDark ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-orange-100 text-orange-700 border-orange-200";
    case "missionary": return isDark ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-green-100 text-green-700 border-green-200";
    case "GlowGroup Leader": return isDark ? "bg-[#00CFFF]/20 text-[#00CFFF] border-[#00CFFF]/30" : "bg-blue-100 text-blue-700 border-blue-200";
    default: return isDark ? "bg-white/5 text-gray-400 border-white/10" : "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function EditRoleModal({ targetUser, allRoles, onClose, onSave, t, isDark }) {
  const [role, setRole] = useState(targetUser.role || "user");
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="border rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ background: t.surface, borderColor: t.border }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg" style={{ color: t.textPrimary }}>Edit Role</h3>
          <button onClick={onClose} className="transition hover:opacity-70" style={{ color: t.textMuted }}><X size={18} /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: t.textSecondary }}>
          Changing role for <span className="font-semibold" style={{ color: t.textPrimary }}>{targetUser.full_name || targetUser.email}</span>
        </p>
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {allRoles.map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition`}
              style={role === r
                ? { background: t.accentSoft, borderColor: t.borderStrong, color: t.accent }
                : { background: "transparent", borderColor: t.border, color: t.textSecondary }}
            >
              <Shield size={14} />
              <span>{r === "ecd_admin" ? "ECD Admin" : r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
              {role === r && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm transition" style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}>Cancel</button>
          <button
            disabled={saving}
            onClick={async () => { setSaving(true); await onSave(targetUser.email, role); setSaving(false); onClose(); }}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition flex items-center justify-center gap-2"
            style={{ background: t.accent, border: "none" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Role
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ targetUser, onClose, onConfirm, t }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="border rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ background: t.surface, borderColor: "rgba(239,68,68,0.3)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-red-500 text-lg">Remove User</h3>
          <button onClick={onClose} className="transition hover:opacity-70" style={{ color: t.textMuted }}><X size={18} /></button>
        </div>
        <p className="text-sm mb-2" style={{ color: t.textSecondary }}>
          Are you sure you want to remove <span className="font-semibold" style={{ color: t.textPrimary }}>{targetUser.full_name || targetUser.email}</span>?
        </p>
        <p className="text-xs mb-6" style={{ color: t.textMuted }}>This action cannot be undone. All their data will remain but access will be revoked.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm transition" style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}>Cancel</button>
          <button
            disabled={deleting}
            onClick={async () => { setDeleting(true); await onConfirm(); setDeleting(false); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersTab({ user }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterTerritoryStatus, setFilterTerritoryStatus] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [filterIncomplete, setFilterIncomplete] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("approved");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin_users_full"],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke("listPublicUsers", {});
        return res.data || [];
      } catch {
        return [];
      }
    }
  });

  const ROLE_ORDER = [
    "super_admin", "admin", "ecd_admin", "country_admin", "union_admin",
    "conference_field_admin", "church_admin", "moderator", "missionary",
    "GlowGroup Leader", "user"
  ];

  const allRoles = useMemo(() => {
    const fromData = new Set(users.map(u => u.role).filter(Boolean));
    ROLE_ORDER.forEach(r => fromData.add(r));
    return ROLE_ORDER.filter(r => fromData.has(r));
  }, [users]);

  const allCountries = useMemo(() => {
    const set = new Set(users.map(u => u.country).filter(Boolean));
    return Array.from(set).sort();
  }, [users]);

  const incompleteCount = useMemo(() => users.filter(u => !u.country || !u.bio || !u.profile_picture_url).length, [users]);

  const stats = useMemo(() => {
    const now = new Date();
    const last24h = users.filter(u => u.created_date && ((now - new Date(u.created_date)) / (1000 * 60 * 60)) <= 24).length;
    const last7Days = users.filter(u => u.created_date && ((now - new Date(u.created_date)) / (1000 * 60 * 60 * 24)) <= 7).length;
    const last30Days = users.filter(u => u.created_date && ((now - new Date(u.created_date)) / (1000 * 60 * 60 * 24)) <= 30).length;
    const males = users.filter(u => u.gender === "male").length;
    const females = users.filter(u => u.gender === "female").length;
    return { total: users.length, last24h, last7Days, last30Days, males, females };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !search ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.country?.toLowerCase().includes(search.toLowerCase());

      const matchesRole = filterRole === "all" || (u.role || "user") === filterRole;
      const matchesGender = filterGender === "all" || u.gender === filterGender;
      const matchesCountry = filterCountry === "all" || u.country === filterCountry;
      const matchesIncomplete = !filterIncomplete || (!u.country || !u.bio || !u.profile_picture_url);

      let matchesTime = true;
      if (timeFilter !== "all" && u.created_date) {
        const diffHours = (new Date() - new Date(u.created_date)) / (1000 * 60 * 60);
        if (timeFilter === "24h") matchesTime = diffHours <= 24;
        else if (timeFilter === "7days") matchesTime = diffHours <= 24 * 7;
        else if (timeFilter === "30days") matchesTime = diffHours <= 24 * 30;
        else if (timeFilter === "6months") matchesTime = diffHours <= 24 * 180;
        else if (timeFilter === "1year") matchesTime = diffHours <= 24 * 365;
      }
      const matchesTerritoryStatus = filterTerritoryStatus === "all" || (u.territory_status || "none") === filterTerritoryStatus;

      return matchesSearch && matchesRole && matchesGender && matchesCountry && matchesTime && matchesIncomplete && matchesTerritoryStatus;
    }).sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  }, [users, search, filterRole, filterGender, filterCountry, timeFilter, filterIncomplete, filterTerritoryStatus]);

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await base44.functions.invoke("sendProfileReminder", {});
      toast.success(`✅ Reminders sent to ${res.data.sent} users!`);
    } catch {
      toast.error("Failed to send reminders.");
    } finally {
      setSendingReminders(false);
    }
  };

  const handleSaveRole = async (email, newRole) => {
    try {
      const targetUsers = await base44.entities.User.filter({ email });
      if (targetUsers.length > 0) {
        await base44.functions.invoke("adminUpdateUserRole", { targetUserId: targetUsers[0].id, newRole });
        toast.success(`Role updated to "${newRole}"`);
        queryClient.invalidateQueries({ queryKey: ["admin_users_full"] });
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update role.");
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedUsers.size === 0) return;
    setBulkUpdating(true);
    let success = 0;
    for (const email of selectedUsers) {
      try {
        const targetUsers = await base44.entities.User.filter({ email });
        if (targetUsers.length > 0) {
          await base44.functions.invoke("assignUserTerritory", { userId: targetUsers[0].id, status: bulkStatus });
          success++;
        }
      } catch { }
    }
    toast.success(`Updated territory status for ${success} user(s) to "${bulkStatus}"`);
    setSelectedUsers(new Set());
    setBulkUpdating(false);
    queryClient.invalidateQueries({ queryKey: ["admin_users_full"] });
  };

  const toggleSelectUser = (email) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.email)));
    }
  };

  const handleDeleteUser = async (targetUser) => {
    try {
      const allUsers = await base44.entities.User.filter({ email: targetUser.email });
      if (allUsers.length > 0) {
        await base44.entities.User.delete(allUsers[0].id);
        toast.success(`${targetUser.full_name || targetUser.email} removed.`);
        queryClient.invalidateQueries({ queryKey: ["admin_users_full"] });
      }
    } catch {
      toast.error("Failed to remove user.");
    }
  };

  return (
    <div className="space-y-6">
      {editingUser && (
        <EditRoleModal targetUser={editingUser} allRoles={allRoles} onClose={() => setEditingUser(null)} onSave={handleSaveRole} t={t} isDark={isDark} />
      )}
      {deletingUser && (
        <DeleteConfirmModal targetUser={deletingUser} onClose={() => setDeletingUser(null)} onConfirm={() => handleDeleteUser(deletingUser)} t={t} />
      )}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Users Directory</h1>
        <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>Monitor and manage your community members.</p>
      </div>

      {incompleteCount > 0 && (
        <div className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ background: isDark ? "rgba(255,208,0,0.1)" : "#FFF8E6", border: "1px solid rgba(255,208,0,0.3)" }}>
          <div className="flex items-center gap-3">
            <AlertCircle className="text-[#FFD000] w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-sm" style={{ color: isDark ? "#FFD000" : "#CC7A00" }}>{incompleteCount} members have incomplete profiles</p>
              <p className="text-xs mt-0.5" style={{ color: t.textMuted }}>Missing country, bio, or profile picture.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setFilterIncomplete(v => !v)}
              className="px-4 py-2 rounded-lg text-xs font-bold border transition"
              style={filterIncomplete ? { background: "rgba(255,208,0,0.2)", borderColor: "rgba(255,208,0,0.5)", color: isDark ? "#FFD000" : "#CC7A00" } : { borderColor: t.border, color: t.textSecondary, background: "transparent" }}
            >
              {filterIncomplete ? "Show All" : "Filter Incomplete"}
            </button>
            <button
              onClick={handleSendReminders}
              disabled={sendingReminders}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-50"
              style={{ background: "#FFD000", color: "#0B1B3D", border: "none" }}
            >
              {sendingReminders ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
              {sendingReminders ? "Sending..." : "Send Reminders"}
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Users", value: stats.total, icon: <Users size={20} />, color: "#00CFFF" },
          { label: "Last 24 hrs", value: `+${stats.last24h}`, icon: <Clock size={20} />, color: "#FFD000", highlight: stats.last24h > 0 },
          { label: "Last 7 Days", value: `+${stats.last7Days}`, icon: <Activity size={20} />, color: "#FFD000" },
          { label: "Last 30 Days", value: `+${stats.last30Days}`, icon: <Calendar size={20} />, color: "#8A5CFF" },
          { label: "Male / Female", value: `${stats.males} / ${stats.females}`, icon: <User size={20} />, color: "#00CFFF" },
        ].map((s, i) => (
          <div key={i} className="border rounded-2xl p-4 flex items-center gap-3" style={{ background: t.surface, borderColor: s.highlight ? "rgba(255,208,0,0.4)" : t.border }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs" style={{ color: t.textSecondary }}>{s.label}</p>
              <p className="font-bold text-lg leading-tight" style={{ color: t.textPrimary }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="border rounded-2xl p-4 flex flex-col gap-3" style={{ background: t.surface, borderColor: t.border }}>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <Filter size={14} style={{ color: t.textMuted }} />
            <select className="bg-transparent text-sm focus:outline-none" style={{ color: t.textPrimary }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              {allRoles.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 border rounded-lg px-3 py-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <User size={14} style={{ color: t.textMuted }} />
            <select className="bg-transparent text-sm focus:outline-none" style={{ color: t.textPrimary }} value={filterGender} onChange={e => setFilterGender(e.target.value)}>
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div className="flex items-center gap-2 border rounded-lg px-3 py-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <MapPin size={14} style={{ color: t.textMuted }} />
            <select className="bg-transparent text-sm focus:outline-none max-w-[140px]" style={{ color: t.textPrimary }} value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
              <option value="all">All Countries</option>
              {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 border rounded-lg px-3 py-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <Clock size={14} style={{ color: t.textMuted }} />
            <select className="bg-transparent text-sm focus:outline-none" style={{ color: t.textPrimary }} value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
              <option value="all">Any Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last 1 Year</option>
            </select>
          </div>

          <div className="flex items-center gap-2 border rounded-lg px-3 py-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
            <Map size={14} style={{ color: t.textMuted }} />
            <select className="bg-transparent text-sm focus:outline-none" style={{ color: t.textPrimary }} value={filterTerritoryStatus} onChange={e => setFilterTerritoryStatus(e.target.value)}>
              <option value="all">All Territory Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="none">Not Set</option>
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textMuted }} />
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, country..."
              className="pl-9 rounded-lg text-sm w-full"
              style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition" style={{ color: t.textMuted }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs" style={{ color: t.textSecondary }}>
            Showing <span className="font-bold" style={{ color: t.textPrimary }}>{filteredUsers.length}</span> of {users.length} users
            {selectedUsers.size > 0 && <span className="ml-2 font-bold" style={{ color: t.accent }}>· {selectedUsers.size} selected</span>}
          </p>

          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: t.textSecondary }}>Bulk set territory status:</span>
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={bulkUpdating}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-bold transition disabled:opacity-50"
                style={{ background: t.accent, border: "none" }}
              >
                {bulkUpdating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Apply to {selectedUsers.size} user(s)
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-3 py-1.5 rounded-lg border text-xs transition"
                style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-2xl overflow-hidden shadow-xl" style={{ background: t.surface, borderColor: t.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b" style={{ borderColor: t.border, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(11,27,61,0.02)" }}>
                <th className="p-4">
                  <button onClick={toggleSelectAll} className="transition hover:opacity-70" style={{ color: t.textMuted }}>
                    {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0
                      ? <CheckSquare size={16} style={{ color: t.accent }} />
                      : <Square size={16} />}
                  </button>
                </th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>User</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>Country</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>Gender</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>Age</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>Role</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>Territory</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>XP</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>Joined</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: t.textSecondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="10" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: t.accent }} /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="10" className="p-8 text-center" style={{ color: t.textMuted }}>No users match your filters.</td></tr>
              ) : (
                filteredUsers.map(u => {
                  const age = calcAge(u.date_of_birth);
                  const isNew = u.created_date && ((new Date() - new Date(u.created_date)) / (1000 * 60 * 60)) <= 24;
                  const isSelected = selectedUsers.has(u.email);
                  return (
                    <tr key={u.email} className={`border-b transition hover:opacity-90`} style={{ borderColor: t.border, background: isSelected ? t.accentSoft : "transparent" }}>
                      <td className="p-4">
                        <button onClick={() => toggleSelectUser(u.email)} className="transition hover:opacity-70" style={{ color: t.textMuted }}>
                          {isSelected ? <CheckSquare size={16} style={{ color: t.accent }} /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt="" className="w-10 h-10 rounded-full object-cover border" style={{ borderColor: t.border }} />
                            {isNew && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 rounded-full" style={{ borderColor: t.surface }} title="Joined in last 24h" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ color: t.textPrimary }}>{u.full_name || 'Unknown'}</p>
                            <p className="text-[11px]" style={{ color: t.textMuted }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm" style={{ color: t.textSecondary }}>
                        {u.country ? (
                          <span className="flex items-center gap-1"><MapPin size={12} style={{ color: t.textMuted }} />{u.country}</span>
                        ) : <span className="text-orange-500 text-xs">Not set</span>}
                      </td>
                      <td className="p-4 text-sm capitalize" style={{ color: t.textSecondary }}>
                        {u.gender ? u.gender.replace(/_/g, " ") : <span className="text-xs" style={{ color: t.textMuted }}>—</span>}
                      </td>
                      <td className="p-4 text-sm" style={{ color: t.textSecondary }}>
                        {age !== null ? age : <span className="text-xs" style={{ color: t.textMuted }}>—</span>}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${roleColor(u.role, isDark)}`}>
                          {(u.role === "super_admin" || String(u.role).includes("admin")) && <Shield size={10} />}
                          {u.role === "ecd_admin" ? "ECD Admin" : (u.role || "user").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="p-4 text-sm" style={{ color: t.textSecondary }}>
                        {u.territory_name ? (
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1 text-xs"><Map size={12} style={{ color: t.accent }} />{u.territory_name}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit ${
                              u.territory_status === "approved" ? (isDark ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-green-100 text-green-700 border-green-200") :
                              u.territory_status === "pending" ? (isDark ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-yellow-100 text-yellow-700 border-yellow-200") :
                              u.territory_status === "rejected" ? (isDark ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-red-100 text-red-700 border-red-200") :
                              (isDark ? "bg-white/5 text-gray-500 border border-white/10" : "bg-gray-100 text-gray-600 border-gray-200")
                            }`}>
                              {u.territory_status || "not set"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: t.textMuted }}>Not set</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-xs font-bold text-[#FFD000]">
                          <Zap size={12} />{u.glow_score || 0}
                        </span>
                      </td>
                      <td className="p-4 text-sm" style={{ color: t.textSecondary }}>
                        <div className="flex flex-col gap-0.5">
                          <span>{u.created_date ? new Date(u.created_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "N/A"}</span>
                          {isNew && <span className="text-[10px] text-green-500 font-bold">● NEW</span>}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setEditingUser(u)} className="p-2 transition rounded-lg mr-1 hover:opacity-70" title="Edit Role" style={{ color: t.textSecondary, background: t.surfaceMuted }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setDeletingUser(u)} className="p-2 transition rounded-lg hover:opacity-70" title="Remove User" style={{ color: "#ef4444", background: isDark ? "rgba(239,68,68,0.1)" : "#fee2e2" }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}