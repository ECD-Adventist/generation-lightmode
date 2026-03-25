import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Medal, Calendar, CalendarDays, Globe } from "lucide-react";

export default function LeaderboardTab({ user }) {
  const [region, setRegion] = useState('global');
  
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke('listPublicUsers', {});
      return res.data;
    }
  });

  const displayUsers = React.useMemo(() => {
    let filteredUsers = [...users];
    if (region === 'regional' && user?.country) {
      filteredUsers = filteredUsers.filter(u => u.country === user.country);
    }

    return filteredUsers
      .sort((a, b) => (b.glow_score || 0) - (a.glow_score || 0))
      .slice(0, 10);
  }, [users, region, user?.country]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#121826]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        
        {/* Neon decorative elements */}
        <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,208,0,0.8), transparent)" }} />
        <div style={{ position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)", width: "60%", height: "100%", background: "radial-gradient(circle, rgba(255,208,0,0.05) 0%, transparent 60%)", pointerEvents: "none" }} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD000]/20 to-[#FFD000]/5 flex items-center justify-center border border-[#FFD000]/30 shadow-[0_0_20px_rgba(255,208,0,0.2)]">
              <Trophy className="text-[#FFD000] w-7 h-7" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk'] text-white">Glow Score Wars</h2>
              <p className="text-[15px] text-gray-400 font-medium font-['Inter'] mt-1">Global ranking of digital missionaries</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <div className="flex bg-[#0B0F1A] p-1.5 rounded-xl border border-white/10 shrink-0">
              <button 
                onClick={() => setRegion('global')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${region === 'global' ? 'bg-[#FFD000]/20 text-[#FFD000]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Global
              </button>
              <button 
                onClick={() => setRegion('regional')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${region === 'regional' ? 'bg-[#FFD000]/20 text-[#FFD000]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Regional
              </button>
            </div>
            <div className="flex bg-[#0B0F1A] p-1.5 rounded-xl border border-white/10 shrink-0 text-sm text-gray-400 items-center px-4">
              Live all-time glow scores
            </div>
          </div>
        </div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <th className="pb-4 px-6 w-20">Rank</th>
                <th className="pb-4 px-6">Missionary</th>
                <th className="pb-4 px-6">Location</th>
                <th className="pb-4 px-6 text-right">Glow Points</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" className="text-center py-12 text-gray-500 font-['Inter']">Loading global rankings...</td></tr>
              ) : (
                displayUsers.map((u, i) => {
                  const isTop3 = i < 3;
                  const isMe = u.email === user.email;
                  return (
                    <tr key={u.id} className={`
                      border-b border-white/5 transition-all duration-300 group
                      ${isMe ? 'bg-[#00CFFF]/5' : 'hover:bg-white/[0.02]'}
                    `}>
                      <td className="py-5 px-6 font-bold">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-['Space_Grotesk'] text-sm
                          ${i === 0 ? 'bg-[#FFD000]/20 text-[#FFD000] border border-[#FFD000]/50 shadow-[0_0_15px_rgba(255,208,0,0.4)]' : 
                            i === 1 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/50 shadow-[0_0_15px_rgba(209,213,219,0.3)]' : 
                            i === 2 ? 'bg-amber-600/20 text-amber-500 border border-amber-600/50 shadow-[0_0_15px_rgba(217,119,6,0.3)]' : 
                            'text-gray-500 bg-white/5'}`}
                        >
                          {i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : i + 1}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-white font-bold shadow-inner overflow-hidden">
                            {u.profile_picture_url ? <img src={u.profile_picture_url} className="w-full h-full object-cover" /> : u.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className={`font-bold font-['Inter'] text-base flex items-center gap-2 ${isTop3 ? 'text-white' : 'text-gray-200'}`}>
                              {u.full_name}
                              {isMe && <span className="text-[10px] bg-[#00CFFF] text-[#0B0F1A] px-2 py-0.5 rounded-full font-black tracking-wide">YOU</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-gray-400 font-medium text-sm">
                        {u.country ? (
                          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> {u.country}</span>
                        ) : "-"}
                      </td>
                      <td className="py-5 px-6 text-right">
                        <span className={`font-black font-['Space_Grotesk'] text-xl ${isTop3 ? 'text-[#FFD000] drop-shadow-[0_0_8px_rgba(255,208,0,0.5)]' : 'text-white'}`}>
                          {(u.displayScore ?? u.glow_score) || 0}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}