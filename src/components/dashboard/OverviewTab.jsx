import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy, Award, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function OverviewTab({ user }) {
  const { data: glowDrops = [] } = useQuery({
    queryKey: ["myGlowDrops", user.email],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: user.email })
  });

  const statCards = [
    { title: "Total Drops", value: glowDrops.length, desc: "Submitted reflections", icon: Flame, color: "#00CFFF" },
    { title: "Current Streak", value: user.streak_count || 0, desc: "Days active", icon: Trophy, color: "#FFD000" },
    { title: "Badges", value: "0", desc: "Earned so far", icon: Award, color: "#8A5CFF" },
    { title: "Country", value: user.country || "Not set", desc: "Representing", icon: MapPin, color: "#1DA1FF" }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="relative group overflow-hidden rounded-2xl bg-[#121826]/80 backdrop-blur-md border border-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-white/10" style={{ boxShadow: `inset 0 0 40px ${stat.color}05` }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle, ${stat.color}20 0%, transparent 70%)`, borderRadius: "50%" }} />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-3xl font-bold font-['Space_Grotesk'] text-white mb-1" style={{ textShadow: `0 0 20px ${stat.color}40` }}>{stat.value}</div>
                <div className="text-sm font-semibold tracking-wide" style={{ color: stat.color }}>{stat.title}</div>
                <p className="text-xs text-gray-500 mt-2 font-['Inter']">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 bg-[#121826]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div style={{ position: "absolute", bottom: "-20%", right: "10%", width: "40%", height: "40%", borderRadius: "50%", background: "radial-gradient(circle, rgba(138,92,255,0.05) 0%, transparent 60%)", pointerEvents: "none" }} />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h3 className="text-2xl font-bold font-['Space_Grotesk'] text-white">Recent Drops</h3>
            <p className="text-sm text-gray-400 mt-1">Your latest digital witness</p>
          </div>
        </div>
        
        <div className="space-y-4 relative z-10">
          {glowDrops.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
              <div className="text-4xl mb-4 opacity-50">✨</div>
              <p className="text-gray-400 font-['Inter']">No drops submitted yet.</p>
              <p className="text-[#00CFFF] mt-2 font-bold font-['Space_Grotesk']">Time to switch on your faith!</p>
            </div>
          ) : (
            glowDrops.slice(0, 5).map((drop, idx) => (
              <div key={drop.id} className="group p-5 bg-[#0B0F1A]/80 border border-white/5 rounded-xl hover:border-[#8A5CFF]/30 transition-all duration-300 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00CFFF] to-[#8A5CFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
                  <span className="inline-block font-bold text-[#8A5CFF] bg-[#8A5CFF]/10 px-3 py-1 rounded-md text-sm border border-[#8A5CFF]/20 font-['Space_Grotesk']">
                    {drop.verse}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${drop.status === 'approved' ? 'bg-[#00CFFF]/10 text-[#00CFFF] border-[#00CFFF]/30' : 'bg-[#FFD000]/10 text-[#FFD000] border-[#FFD000]/30'}`}>
                    {drop.status}
                  </span>
                </div>
                <p className="text-base text-gray-300 font-['Inter'] leading-relaxed pl-1 border-l-2 border-white/10 ml-1">
                  "{drop.reflection}"
                </p>
                {drop.hashtags && (
                  <div className="mt-4 flex gap-2">
                    {drop.hashtags.split(' ').map((tag, i) => (
                      <span key={i} className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}