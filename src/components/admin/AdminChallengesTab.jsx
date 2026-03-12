import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Target, Plus, Edit2, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminChallengesTab() {
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["admin_challenges"],
    queryFn: () => base44.entities.Challenge.list()
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">Challenges</h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Create and manage daily/weekly missions.</p>
        </div>
        <Button className="bg-[#FFD000] text-black hover:bg-[#FFD000]/80 font-bold w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Create Challenge
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map(c => (
          <div key={c.id} className="bg-[#121826] border border-white/5 rounded-2xl p-5 shadow-lg relative group flex flex-col">
            <div className="absolute top-4 right-4 flex gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 bg-white/10 rounded-md hover:bg-white/20 text-gray-300 transition"><Edit2 size={14}/></button>
              <button className="p-1.5 bg-red-500/10 rounded-md hover:bg-red-500/20 text-red-400 transition"><Trash2 size={14}/></button>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FFD000]/10 flex items-center justify-center border border-[#FFD000]/20 mb-4 shrink-0">
              <Target className="text-[#FFD000] w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">{c.title}</h3>
            <p className="text-sm text-gray-400 mb-6 flex-1">{c.description}</p>
            
            <div className="flex items-center gap-4 mb-4 text-xs text-gray-400 font-medium">
              <span className="flex items-center gap-1.5"><Users size={14} className="text-[#00CFFF]" /> 124 Participants</span>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
              <span className={`text-xs font-bold px-2 py-1 rounded ${c.active ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-400'}`}>
                {c.active ? "● Active" : "○ Inactive"}
              </span>
              <span className="text-[#FFD000] font-black text-sm">+{c.points_reward} XP</span>
            </div>
          </div>
        ))}
        {challenges.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center text-gray-500">No challenges created yet.</div>
        )}
      </div>
    </div>
  );
}