import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

export default function AdminGlowDropsTab({ user, territoryRestricted, territoryCountries, territoryApproved }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("pending");

  const { data: drops = [], isLoading } = useQuery({
    queryKey: ["admin_drops_all"],
    queryFn: () => base44.entities.GlowDrop.list('-created_date', 100)
  });

  const allowedCountries = (territoryCountries || "").split(",").map(item => item.trim()).filter(Boolean);

  const filteredDrops = drops.filter(d => {
    if (territoryRestricted && territoryApproved) {
      const ownerCountry = user?.countryMap?.[d.user_email];
      if (ownerCountry && !allowedCountries.includes(ownerCountry)) return false;
    }
    return filter === "all" || d.status === filter;
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      await base44.entities.GlowDrop.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_drops_all"] });
      toast.success("Status updated");
    }
  });

  if (territoryRestricted && !territoryApproved) {
    return <div className="border rounded-2xl p-6 text-sm" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>Please confirm your territory map first to review drops in your region.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Glow Drops Moderation</h1>
          <p className="text-sm md:text-base mt-1" style={{ color: t.textSecondary }}>Review and approve user-submitted content.</p>
        </div>
        <div className="flex p-1 rounded-lg border w-full md:w-auto overflow-x-auto" style={{ background: t.surface, borderColor: t.border }}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium capitalize transition whitespace-nowrap`}
              style={filter === f ? { background: t.surfaceMuted, color: t.textPrimary, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: t.textMuted, background: "transparent" }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: t.accent }} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDrops.map(drop => (
            <div key={drop.id} className="border rounded-2xl p-5 flex flex-col gap-4 shadow-lg" style={{ background: t.surface, borderColor: t.border }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: t.gradient }}>
                    {drop.user_email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-sm truncate max-w-[150px] sm:max-w-[200px]" style={{ color: t.textPrimary }}>{drop.user_email}</p>
                    <p className="text-xs" style={{ color: t.textMuted }}>{new Date(drop.created_date).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  drop.status === 'approved' ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') :
                  drop.status === 'rejected' ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700') :
                  (isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
                }`}>
                  {drop.status || 'pending'}
                </span>
              </div>

              <div className="flex-1 rounded-xl p-4 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
                <p className="font-bold mb-2 text-sm" style={{ color: t.accent }}>{drop.verse || "No verse attached"}</p>
                <p className="text-sm leading-relaxed" style={{ color: t.textSecondary }}>{drop.reflection || "No reflection"}</p>
                
                {drop.media_url && (
                  <div className="mt-4 relative rounded-lg overflow-hidden border bg-black h-40 group" style={{ borderColor: t.border }}>
                    <img src={drop.media_url} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" alt="Attachment" />
                  </div>
                )}
              </div>

              {filter === 'pending' && (
                <div className="flex gap-3 mt-2">
                  <button 
                    onClick={() => updateStatus.mutate({ id: drop.id, status: 'approved' })}
                    disabled={updateStatus.isPending}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition hover:opacity-80 disabled:opacity-50"
                    style={{ background: isDark ? "rgba(34,197,94,0.1)" : "#dcfce7", color: isDark ? "#4ade80" : "#16a34a", border: `1px solid ${isDark ? "rgba(34,197,94,0.2)" : "#bbf7d0"}` }}
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button 
                    onClick={() => updateStatus.mutate({ id: drop.id, status: 'rejected' })}
                    disabled={updateStatus.isPending}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition hover:opacity-80 disabled:opacity-50"
                    style={{ background: isDark ? "rgba(239,68,68,0.1)" : "#fee2e2", color: isDark ? "#f87171" : "#dc2626", border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "#fecaca"}` }}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredDrops.length === 0 && (
            <div className="col-span-full py-16 text-center rounded-2xl border border-dashed" style={{ background: t.surface, borderColor: t.border, color: t.textMuted }}>
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No drops found for '{filter}'.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}