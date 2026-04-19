import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, MoreVertical, Globe2, Activity } from "lucide-react";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

export default function AdminGlowGroupsTab({ user, territoryRestricted, territoryCountries, territoryApproved }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["admin_groups"],
    queryFn: () => base44.entities.GlowGroup.list()
  });

  const allowedCountries = (territoryCountries || "").split(",").map(item => item.trim()).filter(Boolean);
  const scopedGroups = territoryRestricted && territoryApproved
    ? groups.filter(group => allowedCountries.includes(group.country))
    : groups;

  if (territoryRestricted && !territoryApproved) {
    return <div className="border rounded-2xl p-6 text-sm" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>Please confirm your territory map first to manage groups in your region.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>GlowGroups Management</h1>
        <p className="text-sm md:text-base mt-1" style={{ color: t.textSecondary }}>Monitor community groups and cell leaders globally.</p>
      </div>

      <div className="border rounded-2xl overflow-hidden shadow-xl" style={{ background: t.surface, borderColor: t.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b" style={{ borderColor: t.border, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(11,27,61,0.02)" }}>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>Group Details</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>Leader</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>Region</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider" style={{ color: t.textSecondary }}>Activity</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: t.textSecondary }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scopedGroups.map(g => (
                <tr key={g.id} className="border-b transition hover:opacity-90" style={{ borderColor: t.border }}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border" style={{ background: isDark ? "rgba(138,92,255,0.1)" : "#f3e8ff", color: isDark ? "#8A5CFF" : "#7e22ce", borderColor: isDark ? "rgba(138,92,255,0.2)" : "#e9d5ff" }}>
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: t.textPrimary }}>{g.name}</p>
                        <p className="text-xs mt-0.5 truncate max-w-[200px]" style={{ color: t.textMuted }}>{g.description || "Community Group"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium truncate max-w-[150px]" style={{ color: t.textSecondary }}>{g.leader_email}</p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs" style={{ background: t.surfaceMuted, color: t.textSecondary }}>
                      <Globe2 size={12} style={{ color: t.accent }} /> {g.country || "Global"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full" style={{ color: isDark ? "#4ade80" : "#16a34a", background: isDark ? "rgba(74,222,128,0.1)" : "#dcfce7" }}>
                      <Activity size={12} /> High
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 transition rounded-lg hover:opacity-70" style={{ color: t.textMuted, background: t.surfaceMuted }}>
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {scopedGroups.length === 0 && !isLoading && (
                <tr><td colSpan="5" className="p-8 text-center" style={{ color: t.textMuted }}>No GlowGroups created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}