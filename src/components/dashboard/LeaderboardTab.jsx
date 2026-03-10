import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Medal } from "lucide-react";

export default function LeaderboardTab({ user }) {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["leaderboardUsers"],
    queryFn: () => base44.entities.User.list('-glow_score', 10)
  });

  return (
    <div className="bg-[#121826] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="text-[#FFD000] w-6 h-6" />
        <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">Glow Score Wars</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-sm">
              <th className="pb-3 px-4">Rank</th>
              <th className="pb-3 px-4">Name</th>
              <th className="pb-3 px-4">Country</th>
              <th className="pb-3 px-4 text-right">Glow Points</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : (
              users.map((u, i) => (
                <tr key={u.id} className={`border-b border-gray-800/50 ${u.email === user.email ? 'bg-[#00CFFF]/5' : ''} hover:bg-[#1A2033] transition-colors`}>
                  <td className="py-4 px-4 font-bold">
                    {i === 0 ? <Medal className="w-5 h-5 text-[#FFD000]" /> : 
                     i === 1 ? <Medal className="w-5 h-5 text-gray-300" /> : 
                     i === 2 ? <Medal className="w-5 h-5 text-amber-600" /> : 
                     <span className="text-gray-500 pl-1">{i + 1}</span>}
                  </td>
                  <td className="py-4 px-4 font-medium text-white flex items-center gap-2">
                    {u.full_name}
                    {u.email === user.email && <span className="text-[10px] bg-[#00CFFF]/20 text-[#00CFFF] px-2 py-0.5 rounded">YOU</span>}
                  </td>
                  <td className="py-4 px-4 text-gray-400">{u.country || "-"}</td>
                  <td className="py-4 px-4 text-right font-bold text-[#FFD000]">{u.glow_score || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}