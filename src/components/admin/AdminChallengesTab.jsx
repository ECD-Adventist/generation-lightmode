import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Target, Plus, Edit2, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

export default function AdminChallengesTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["admin_challenges"],
    queryFn: () => base44.entities.Challenge.list()
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Challenges</h1>
          <p className="mt-1 text-sm md:text-base" style={{ color: t.textSecondary }}>Create and manage daily/weekly missions.</p>
        </div>
        <Button className="font-bold w-full sm:w-auto" style={{ background: "linear-gradient(90deg, #FFD000 0%, #FF9F1A 100%)", color: "#0B1B3D", border: "none" }}>
          <Plus className="w-4 h-4 mr-2" /> Create Challenge
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map(c => (
          <div key={c.id} className="border rounded-2xl p-5 shadow-lg relative group flex flex-col" style={{ background: t.surface, borderColor: t.border }}>
            <div className="absolute top-4 right-4 flex gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 rounded-md transition hover:opacity-70" style={{ background: t.surfaceMuted, color: t.textSecondary }}><Edit2 size={14}/></button>
              <button className="p-1.5 rounded-md transition hover:opacity-70" style={{ background: isDark ? "rgba(239,68,68,0.1)" : "#fee2e2", color: isDark ? "#f87171" : "#dc2626" }}><Trash2 size={14}/></button>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border mb-4 shrink-0" style={{ background: "rgba(255,208,0,0.1)", borderColor: "rgba(255,208,0,0.2)" }}>
              <Target className="w-6 h-6" style={{ color: isDark ? "#FFD000" : "#d97706" }} />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: t.textPrimary }}>{c.title}</h3>
            <p className="text-sm mb-6 flex-1" style={{ color: t.textSecondary }}>{c.description}</p>
            
            <div className="flex items-center gap-4 mb-4 text-xs font-medium" style={{ color: t.textMuted }}>
              <span className="flex items-center gap-1.5"><Users size={14} style={{ color: t.accent }} /> 124 Participants</span>
            </div>

            <div className="flex items-center justify-between border-t pt-4 mt-auto" style={{ borderColor: t.border }}>
              <span className={`text-xs font-bold px-2 py-1 rounded`} style={{ background: c.active ? (isDark ? "rgba(34,197,94,0.1)" : "#dcfce7") : t.surfaceMuted, color: c.active ? (isDark ? "#4ade80" : "#16a34a") : t.textMuted }}>
                {c.active ? "● Active" : "○ Inactive"}
              </span>
              <span className="font-black text-sm" style={{ color: isDark ? "#FFD000" : "#d97706" }}>+{c.points_reward} XP</span>
            </div>
          </div>
        ))}
        {challenges.length === 0 && !isLoading && (
          <div className="col-span-full py-12 text-center" style={{ color: t.textMuted }}>No challenges created yet.</div>
        )}
      </div>
    </div>
  );
}