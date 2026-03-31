import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, MoreVertical, Globe2, Activity } from "lucide-react";

export default function AdminGlowGroupsTab({ user, territoryRestricted, territoryCountries, territoryApproved }) {
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["admin_groups"],
    queryFn: () => base44.entities.GlowGroup.list()
  });

  const allowedCountries = (territoryCountries || "").split(",").map(item => item.trim()).filter(Boolean);
  const scopedGroups = territoryRestricted && territoryApproved
    ? groups.filter(group => allowedCountries.includes(group.country))
    : groups;

  if (territoryRestricted && !territoryApproved) {
    return <div className="bg-[#121826] border border-[#FFD000]/30 rounded-2xl p-6 text-sm text-gray-300">Please confirm your territory map first to manage groups in your region.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">GlowGroups Management</h1>
        <p className="text-sm md:text-base text-gray-400 mt-1">Monitor community groups and cell leaders globally.</p>
      </div>

      <div className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Group Details</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Leader</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Region</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Activity</th>
                <th className="p-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scopedGroups.map(g => (
                <tr key={g.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8A5CFF]/20 to-[#00CFFF]/20 flex items-center justify-center text-[#8A5CFF] border border-[#8A5CFF]/30 shrink-0">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{g.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{g.description || "Community Group"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-gray-300 truncate max-w-[150px]">{g.leader_email}</p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-xs text-gray-300">
                      <Globe2 size={12} className="text-[#00CFFF]" /> {g.country || "Global"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-full">
                      <Activity size={12} /> High
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-white/10">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {scopedGroups.length === 0 && !isLoading && (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No GlowGroups created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}