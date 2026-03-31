import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Edit2, Trash2, Shield, Loader2, Calendar, Users, Activity, Filter, MapPin, Zap, AlertCircle, Mail, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ROLES = ["user", "admin", "super_admin"];

function EditRoleModal({ targetUser, onClose, onSave }) {
  const [role, setRole] = useState(targetUser.role || "user");
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-lg">Edit Role</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-400 mb-4">Changing role for <span className="text-white font-semibold">{targetUser.full_name || targetUser.email}</span></p>
        <div className="space-y-2 mb-6">
          {ROLES.map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition ${role === r ? "bg-[#00CFFF]/15 border-[#00CFFF]/40 text-[#00CFFF]" : "border-white/8 text-gray-400 hover:border-white/20 hover:text-white"}`}>
              <Shield size={14} />
              <span className="capitalize">{r.replace("_", " ")}</span>
              {role === r && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition">Cancel</button>
          <button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(targetUser.email, role);
              setSaving(false);
              onClose();
            }}
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
        <p className="text-sm text-gray-300 mb-2">Are you sure you want to remove <span className="text-white font-semibold">{targetUser.full_name || targetUser.email}</span> from the platform?</p>
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

  const incompleteCount = useMemo(() => users.filter(u => !u.country || !u.bio || !u.profile_picture_url).length, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = filterRole === "all" || (u.role || "user") === filterRole;
      const matchesIncomplete = !filterIncomplete || (!u.country || !u.bio || !u.profile_picture_url);
      
      let matchesTime = true;
      if (timeFilter !== "all" && u.created_date) {
        const created = new Date(u.created_date);
        const now = new Date();
        const diffDays = (now - created) / (1000 * 60 * 60 * 24);
        
        if (timeFilter === "7days") matchesTime = diffDays <= 7;
        else if (timeFilter === "30days") matchesTime = diffDays <= 30;
        else if (timeFilter === "6months") matchesTime = diffDays <= 180;
        else if (timeFilter === "1year") matchesTime = diffDays <= 365;
      }

      return matchesSearch && matchesRole && matchesTime && matchesIncomplete;
    }).sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  }, [users, search, filterRole, timeFilter, filterIncomplete]);

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await base44.functions.invoke("sendProfileReminder", {});
      toast.success(`✅ Reminders sent to ${res.data.sent} users! Summary emailed to admin.`);
    } catch {
      toast.error("Failed to send reminders.");
    } finally {
      setSendingReminders(false);
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const last7Days = users.filter(u => u.created_date && ((now - new Date(u.created_date)) / (1000 * 60 * 60 * 24)) <= 7).length;
    const last30Days = users.filter(u => u.created_date && ((now - new Date(u.created_date)) / (1000 * 60 * 60 * 24)) <= 30).length;
    return { total: users.length, last7Days, last30Days };
  }, [users]);

  const handleSaveRole = async (email, newRole) => {
    try {
      const allUsers = await base44.entities.User.filter({ email });
      if (allUsers.length > 0) {
        await base44.entities.User.update(allUsers[0].id, { role: newRole });
        toast.success(`Role updated to "${newRole}" for ${email}`);
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
      {editingUser && <EditRoleModal targetUser={editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveRole} />}
      {deletingUser && <DeleteConfirmModal targetUser={deletingUser} onClose={() => setDeletingUser(null)} onConfirm={() => handleDeleteUser(deletingUser)} />}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">Users Directory</h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Monitor and manage your community members.</p>
        </div>
      </div>

      {/* Incomplete Profiles Banner */}
      {incompleteCount > 0 && (
        <div className="bg-[#FFD000]/10 border border-[#FFD000]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-[#FFD000] w-5 h-5 shrink-0" />
            <div>
              <p className="text-[#FFD000] font-bold text-sm">{incompleteCount} members have incomplete profiles</p>
              <p className="text-gray-400 text-xs mt-0.5">Missing country, bio, or profile picture — they won't appear correctly on the Global Map.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#00CFFF]/10 flex items-center justify-center text-[#00CFFF]">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Users</p>
            <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFD000]/10 flex items-center justify-center text-[#FFD000]">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">New Last 7 Days</p>
            <h3 className="text-2xl font-bold text-white">+{stats.last7Days}</h3>
          </div>
        </div>
        <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#8A5CFF]/10 flex items-center justify-center text-[#8A5CFF]">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">New Last 30 Days</p>
            <h3 className="text-2xl font-bold text-white">+{stats.last30Days}</h3>
          </div>
        </div>
      </div>

      <div className="bg-[#121826] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2">
            <Filter size={16} className="text-gray-500" />
            <select 
              className="bg-transparent text-sm text-gray-300 focus:outline-none w-28"
              value={filterRole} onChange={e => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-2">
            <Calendar size={16} className="text-gray-500" />
            <select 
              className="bg-transparent text-sm text-gray-300 focus:outline-none w-32"
              value={timeFilter} onChange={e => setTimeFilter(e.target.value)}
            >
              <option value="all">Any Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 1 Month</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last 1 Year</option>
            </select>
          </div>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input 
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..." 
            className="pl-9 bg-[#0B0F1A] border-white/10 rounded-lg text-sm w-full"
          />
        </div>
      </div>

      <div className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">User</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Details</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Role</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Joined</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="p-8 text-center"><Loader2 className="w-6 h-6 text-[#00CFFF] animate-spin mx-auto" /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No users found.</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.email} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        <div>
                          <p className="font-bold text-sm text-white">{u.full_name || 'Unknown'}</p>
                          <p className="text-[11px] text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={12} /> {u.country || <span className="text-orange-400">No country</span>}</div>
                        <div className="flex items-center gap-1 text-xs font-bold text-[#FFD000]"><Zap size={12} /> {u.glow_score || 0} XP</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                        u.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        u.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        u.role === 'GlowGroup Leader' ? 'bg-[#00CFFF]/20 text-[#00CFFF] border border-[#00CFFF]/30' :
                        'bg-white/5 text-gray-400 border border-white/10'
                      }`}>
                        {(u.role === 'super_admin' || u.role === 'admin') && <Shield size={10} />}
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {u.created_date ? new Date(u.created_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}