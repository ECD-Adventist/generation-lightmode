import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Edit2, Trash2, Shield, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminUsersTab({ user }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || (u.role || "user") === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleEditRole = (targetUser) => {
    toast.info(`Edit role for ${targetUser.email} feature is restricted. Real role changes require explicit backend logic.`);
  };

  const handleSuspend = (targetUser) => {
    toast.error(`Suspension action for ${targetUser.email} logged.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">Users Management</h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Manage platform members, roles, and permissions.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            className="bg-[#121826] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
            value={filterRole} onChange={e => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input 
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..." 
              className="pl-9 bg-[#121826] border-white/10 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">User</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Location</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Role</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Glow Score</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Joined</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="p-8 text-center"><Loader2 className="w-6 h-6 text-[#00CFFF] animate-spin mx-auto" /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No users found.</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.email} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
                        <div>
                          <p className="font-bold text-sm text-white">{u.full_name || 'Unknown'}</p>
                          <p className="text-[11px] text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">{u.country || "Global"}</td>
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
                    <td className="p-4 text-sm font-bold text-[#FFD000]">{u.glow_score || 0} XP</td>
                    <td className="p-4 text-sm text-gray-400">
                      {u.created_date ? new Date(u.created_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEditRole(u)} className="p-1.5 text-gray-400 hover:text-[#00CFFF] transition rounded-lg hover:bg-[#00CFFF]/10 mr-1" title="Edit Role">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleSuspend(u)} className="p-1.5 text-gray-400 hover:text-red-400 transition rounded-lg hover:bg-red-500/10" title="Suspend User">
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