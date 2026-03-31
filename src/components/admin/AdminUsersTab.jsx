import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Search, Edit2, Trash2, Shield, Loader2, Calendar, Users, Activity,
  Filter, MapPin, Zap, AlertCircle, Mail, X, Check, User, Clock, Map
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function roleColor(role) {
  switch (role) {
    case "super_admin": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "admin":
    case "ecd_admin":
    case "country_admin":
    case "union_admin":
    case "conference_field_admin":
    case "church_admin":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "moderator": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "missionary": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "GlowGroup Leader": return "bg-[#00CFFF]/20 text-[#00CFFF] border-[#00CFFF]/30";
    default: return "bg-white/5 text-gray-400 border-white/10";
  }
}

function EditRoleModal({ targetUser, allRoles, onClose, onSave }) {
  const [role, setRole] = useState(targetUser.role || "user");
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-lg">Edit Role</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Changing role for <span className="text-white font-semibold">{targetUser.full_name || targetUser.email}</span>
        </p>
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {allRoles.map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition ${role === r ? "bg-[#00CFFF]/15 border-[#00CFFF]/40 text-[#00CFFF]" : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}`}>
              <Shield size={14} />
              <span className="capitalize">{r.replace(/_/g, " ")}</span>
              {role === r && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition">Cancel</button>
          <button
            disabled={saving}
            onClick={async () => { setSaving(true); await onSave(targetUser.email, role); setSaving(false); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-[#00CFFF] text-black text-sm font-bold hover:bg-[#00CFFF]/80 transition flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Save Role
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ targetUser, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#121826] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-red-400 text-lg">Remove User</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-300 mb-2">
          Are you sure you want to remove <span className="text-white font-semibold">{targetUser.full_name || targetUser.email}</span>?
        </p>
        <p className="text-xs text-gray-500 mb-6">This action cannot be undone. All their data will remain but access will be revoked.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition">Cancel</button>
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
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [filterIncomplete, setFilterIncomplete] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
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

  // Dynamically collect all roles from the actual user data
  const allRoles = useMemo(() => {
    const fromData = new Set(users.map(u => u.role).filter(Boolean));
    // Merge with known roles
    [
      "user",
      "admin",
      "super_admin",
      "ecd_admin",
      "country_admin",
      "union_admin",
      "conference_field_admin",
      "church_admin",
      "moderator",
      "missionary",
      "GlowGroup Leader"
    ].forEach(r => fromData.add(r));
    return Array.from(fromData).sort();
  }, [users]);

  // Unique countries from data
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

      return matchesSearch && matchesRole && matchesGender && matchesCountry && matchesTime && matchesIncomplete;
    }).sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  }, [users, search, filterRole, filterGender, filterCountry, timeFilter, filterIncomplete]);

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
      const allUsers = await base44.entities.User.filter({ email });
      if (allUsers.length > 0) {
        await base44.entities.User.update(allUsers[0].id, { role: newRole });
        toast.success(`Role updated to "${newRole}"`);
        queryClient.invalidateQueries({ queryKey: ["admin_users_full"] });
      }
    } catch {
      toast.error("Failed to update role.");
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
        <EditRoleModal
          targetUser={editingUser}
          allRoles={allRoles}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveRole}
        />
      )}
      {deletingUser && (
        <DeleteConfirmModal
          targetUser={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={() => handleDeleteUser(deletingUser)}
        />
      )}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">Users Directory</h1>
        <p className="text-gray-400 mt-1 text-sm">Monitor and manage your community members.</p>
      </div>

      {/* Incomplete Profiles Banner */}
      {incompleteCount > 0 && (
        <div className="bg-[#FFD000]/10 border border-[#FFD000]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-[#FFD000] w-5 h-5 shrink-0" />
            <div>
              <p className="text-[#FFD000] font-bold text-sm">{incompleteCount} members have incomplete profiles</p>
              <p className="text-gray-400 text-xs mt-0.5">Missing country, bio, or profile picture.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setFilterIncomplete(v => !v)}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${filterIncomplete ? "bg-[#FFD000]/20 border-[#FFD000]/50 text-[#FFD000]" : "border-white/10 text-gray-400 hover:border-[#FFD000]/40 hover:text-[#FFD000]"}`}
            >
              {filterIncomplete ? "Show All" : "Filter Incomplete"}
            </button>
            <button
              onClick={handleSendReminders}
              disabled={sendingReminders}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#FFD000] text-black hover:bg-[#FFD000]/80 transition disabled:opacity-50"
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
          <div key={i} className={`bg-[#121826] border ${s.highlight ? "border-[#FFD000]/40" : "border-white/5"} rounded-2xl p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="font-bold text-white text-lg leading-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2">
            <Filter size={14} className="text-gray-500" />
            <select className="bg-transparent text-sm text-gray-300 focus:outline-none" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              {allRoles.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2">
            <User size={14} className="text-gray-500" />
            <select className="bg-transparent text-sm text-gray-300 focus:outline-none" value={filterGender} onChange={e => setFilterGender(e.target.value)}>
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2">
            <MapPin size={14} className="text-gray-500" />
            <select className="bg-transparent text-sm text-gray-300 focus:outline-none max-w-[140px]" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
              <option value="all">All Countries</option>
              {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2">
            <Clock size={14} className="text-gray-500" />
            <select className="bg-transparent text-sm text-gray-300 focus:outline-none" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}>
              <option value="all">Any Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last 1 Year</option>
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, country..."
              className="pl-9 bg-[#0B0F1A] border-white/10 rounded-lg text-sm w-full"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Showing <span className="text-white font-bold">{filteredUsers.length}</span> of {users.length} users
        </p>
      </div>

      {/* Table */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">User</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Country</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Gender</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Age</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Role</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Territory</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">XP</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Joined</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="9" className="p-8 text-center"><Loader2 className="w-6 h-6 text-[#00CFFF] animate-spin mx-auto" /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="9" className="p-8 text-center text-gray-500">No users match your filters.</td></tr>
              ) : (
                filteredUsers.map(u => {
                  const age = calcAge(u.date_of_birth);
                  const isNew = u.created_date && ((new Date() - new Date(u.created_date)) / (1000 * 60 * 60)) <= 24;
                  return (
                    <tr key={u.email} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                            {isNew && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-[#121826] rounded-full" title="Joined in last 24h" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">{u.full_name || 'Unknown'}</p>
                            <p className="text-[11px] text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {u.country ? (
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-gray-500" />{u.country}</span>
                        ) : <span className="text-orange-400 text-xs">Not set</span>}
                      </td>
                      <td className="p-4 text-sm text-gray-400 capitalize">
                        {u.gender ? u.gender.replace(/_/g, " ") : <span className="text-gray-600 text-xs">—</span>}
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {age !== null ? age : <span className="text-gray-600 text-xs">—</span>}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${roleColor(u.role)}`}>
                          {(u.role === "super_admin" || String(u.role).includes("admin")) && <Shield size={10} />}
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {u.territory_name ? (
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1"><Map size={12} className="text-[#00CFFF]" />{u.territory_name}</span>
                            <span className="text-[10px] uppercase tracking-wider text-gray-500">{u.territory_status || "not submitted"}</span>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs">Not set</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-xs font-bold text-[#FFD000]">
                          <Zap size={12} />{u.glow_score || 0}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        <div className="flex flex-col gap-0.5">
                          <span>{u.created_date ? new Date(u.created_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "N/A"}</span>
                          {isNew && <span className="text-[10px] text-green-400 font-bold">● NEW</span>}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setEditingUser(u)} className="p-2 text-gray-400 hover:text-[#00CFFF] transition rounded-lg hover:bg-[#00CFFF]/10 mr-1" title="Edit Role">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setDeletingUser(u)} className="p-2 text-gray-400 hover:text-red-400 transition rounded-lg hover:bg-red-500/10" title="Remove User">
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