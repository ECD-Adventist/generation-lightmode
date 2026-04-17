import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy } from "lucide-react";

export default function LeaderboardTab({ user }) {
  const [region, setRegion] = useState('global');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke('listPublicUsers', {});
      return res.data;
    }
  });

  const displayUsers = useMemo(() => {
    let filteredUsers = [...users];
    if (region === 'regional' && user?.country) {
      filteredUsers = filteredUsers.filter(u => u.country === user.country);
    }
    return filteredUsers.sort((a, b) => (b.glow_score || 0) - (a.glow_score || 0)).slice(0, 10);
  }, [users, region, user?.country]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 font-['Inter']">
      <div className="rounded-[1.75rem] p-8 relative overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 8px 32px rgba(11, 63, 217, 0.08)" }}>
        <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,208,0,0.8), transparent)" }} />
        <div style={{ position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)", width: "60%", height: "100%", background: "radial-gradient(circle, rgba(255,208,0,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFF8E6, #FFF0CC)", border: "1px solid #FFE4A0", boxShadow: "0 4px 16px rgba(255, 159, 26, 0.15)" }}>
              <Trophy className="w-7 h-7" style={{ color: "#CC7A00" }} />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Glow Score Wars</h2>
              <p className="text-[15px] font-medium mt-1" style={{ color: "#6B7FA0" }}>Global ranking of digital missionaries</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <div className="flex p-1.5 rounded-xl shrink-0" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
              <button onClick={() => setRegion('global')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all" style={region === 'global' ? { background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 2px 6px rgba(255, 159, 26, 0.25)" } : { background: "transparent", color: "#6B7FA0" }}>Global</button>
              <button onClick={() => setRegion('regional')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all" style={region === 'regional' ? { background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 2px 6px rgba(255, 159, 26, 0.25)" } : { background: "transparent", color: "#6B7FA0" }}>Regional</button>
            </div>
            <div className="flex p-1.5 rounded-xl shrink-0 text-sm items-center px-4" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#6B7FA0" }}>
              Live all-time glow scores
            </div>
          </div>
        </div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 text-xs font-bold uppercase tracking-wider" style={{ borderColor: "#E6ECF5", color: "#6B7FA0" }}>
                <th className="pb-4 px-6 w-20">Rank</th>
                <th className="pb-4 px-6">Missionary</th>
                <th className="pb-4 px-6">Location</th>
                <th className="pb-4 px-6 text-right">Glow Points</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" className="text-center py-12" style={{ color: "#8A97B5" }}>Loading global rankings...</td></tr>
              ) : (
                displayUsers.map((u, i) => {
                  const isTop3 = i < 3;
                  const isMe = u.email === user.email;
                  return (
                    <tr key={u.id} className="border-b transition-all duration-300" style={{ borderColor: "#F0F4FA", background: isMe ? "#EEF3FF" : "transparent" }}
                      onMouseOver={e => { if (!isMe) e.currentTarget.style.background = "#F6F8FC"; }}
                      onMouseOut={e => { if (!isMe) e.currentTarget.style.background = "transparent"; }}>
                      <td className="py-5 px-6 font-bold">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-['Space_Grotesk'] text-sm"
                          style={
                            i === 0 ? { background: "rgba(255, 208, 0, 0.2)", color: "#CC7A00", border: "1px solid #FFE4A0", boxShadow: "0 2px 8px rgba(255, 208, 0, 0.3)" } :
                            i === 1 ? { background: "#F0F4FA", color: "#4A5878", border: "1px solid #D6E4FF" } :
                            i === 2 ? { background: "#FDF4E8", color: "#A16207", border: "1px solid #E8C896" } :
                            { color: "#8A97B5", background: "#F6F8FC" }}>
                          {i + 1}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}>
                            {u.profile_picture_url ? <img src={u.profile_picture_url} className="w-full h-full object-cover" /> : u.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-base flex items-center gap-2" style={{ color: "#0B1B3D" }}>
                              {u.full_name}
                              {isMe && <span className="text-[10px] px-2 py-0.5 rounded-full font-black tracking-wide" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>YOU</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 font-medium text-sm" style={{ color: "#6B7FA0" }}>
                        {u.country ? (
                          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#8A97B5" }}></span> {u.country}</span>
                        ) : "-"}
                      </td>
                      <td className="py-5 px-6 text-right">
                        <span className="font-black font-['Space_Grotesk'] text-xl" style={{ color: isTop3 ? "#CC7A00" : "#0B1B3D" }}>
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