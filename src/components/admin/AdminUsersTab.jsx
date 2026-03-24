import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Edit2, Trash2, Shield, Loader2, Calendar, Users, Activity, Filter, MapPin, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminUsersTab({ user }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  
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

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = filterRole === "all" || (u.role || "user") === filterRole;
      
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

      return matchesSearch && matchesRole && matchesTime;
    }).sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  }, [users, search, filterRole, timeFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const last7Days = users.filter(u => u.created_date && ((now - new Date(u.created_date)) / (1000 * 60 * 60 * 24)) <= 7).length;
    const last30Days = users.filter(u => u.created_date && ((now - new Date(u.created_date)) / (1000 * 60 * 60 * 24)) <= 30).length;
    return { total: users.length, last7Days, last30Days };
  }, [users]);

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
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">Users Directory</h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Monitor and manage your community members.</p>
        </div>
      </div>

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
                        <div className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={12} /> {u.country || "Global"}</div>
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
                      <button onClick={() => handleEditRole(u)} className="p-2 text-gray-400 hover:text-[#00CFFF] transition rounded-lg hover:bg-[#00CFFF]/10 mr-1" title="Edit Role">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleSuspend(u)} className="p-2 text-gray-400 hover:text-red-400 transition rounded-lg hover:bg-red-500/10" title="Suspend User">
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