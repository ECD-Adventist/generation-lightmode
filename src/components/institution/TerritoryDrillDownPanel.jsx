import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { X, Users, MapPin, Zap, ExternalLink, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function TerritoryDrillDownPanel({ country, territories, ownerEmail, onClose }) {
  const countryTerritories = territories.filter(t => t.country === country);

  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ["territoryClaims", ownerEmail],
    queryFn: () => base44.entities.TerritoryMemberClaim.filter({ institution_owner_email: ownerEmail }),
    enabled: !!ownerEmail,
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
  });

  const { data: allGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["allGlowGroups"],
    queryFn: () => base44.entities.GlowGroup.list(),
  });

  const isLoading = claimsLoading || usersLoading || groupsLoading;

  // Members in this country
  const countryMembers = claims
    .filter(c => c.status === "approved" && c.member_country === country)
    .map(c => ({
      ...c,
      userProfile: allUsers.find(u => u.email === c.member_email),
    }));

  // GlowGroups in this country
  const countryGroups = allGroups.filter(g => g.country === country);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md h-full overflow-y-auto flex flex-col"
        style={{ background: "#0e1117", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-5 flex items-center gap-3 border-b border-white/5"
          style={{ background: "#0e1117" }}>
          <div className="w-9 h-9 rounded-xl bg-[#00CFFF]/20 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-white truncate" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              {country}
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              {countryTerritories.length} territories · {countryMembers.length} members · {countryGroups.length} groups
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#00CFFF] animate-spin" />
          </div>
        ) : (
          <div className="flex-1 px-6 py-5 space-y-6">

            {/* Territories in this country */}
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-[#FFD000] mb-3">Territories</div>
              <div className="flex flex-wrap gap-1.5">
                {countryTerritories.map((t, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
                    style={{ background: "rgba(0,207,255,0.08)", borderColor: "rgba(0,207,255,0.25)", color: "rgba(0,207,255,0.85)" }}>
                    <MapPin className="w-2.5 h-2.5" /> {t.name}
                  </span>
                ))}
                {countryTerritories.length === 0 && (
                  <span className="text-xs text-gray-500">No territories mapped for this country.</span>
                )}
              </div>
            </div>

            {/* GlowGroups */}
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-[#00CFFF] mb-3 flex items-center gap-2">
                GlowGroups
                <span className="px-1.5 py-0.5 rounded-full bg-[#00CFFF]/10 text-[#00CFFF]">{countryGroups.length}</span>
              </div>
              {countryGroups.length === 0 ? (
                <p className="text-xs text-gray-500">No GlowGroups in this country yet.</p>
              ) : (
                <div className="space-y-2">
                  {countryGroups.map(group => {
                    const leader = allUsers.find(u => u.email === group.leader_email);
                    return (
                      <div key={group.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#8A5CFF] to-[#00CFFF] flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white truncate">{group.name}</div>
                          {leader && (
                            <div className="text-[10px] text-gray-400 truncate">Leader: {leader.full_name}</div>
                          )}
                        </div>
                        {leader && (
                          <Link
                            to={`${createPageUrl("Profile")}?user=${encodeURIComponent(group.leader_email)}`}
                            className="shrink-0 w-7 h-7 rounded-lg bg-[#00CFFF]/10 hover:bg-[#00CFFF]/20 flex items-center justify-center transition"
                          >
                            <ExternalLink className="w-3 h-3 text-[#00CFFF]" />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Members */}
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-[#8A5CFF] mb-3 flex items-center gap-2">
                Active Members
                <span className="px-1.5 py-0.5 rounded-full bg-[#8A5CFF]/10 text-[#8A5CFF]">{countryMembers.length}</span>
              </div>
              {countryMembers.length === 0 ? (
                <p className="text-xs text-gray-500">No verified members in this country yet.</p>
              ) : (
                <div className="space-y-2">
                  {countryMembers.map((claim, i) => {
                    const profile = claim.userProfile;
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition">
                        <img
                          src={profile?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10"
                          alt=""
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white truncate">{profile?.full_name || claim.member_email}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 truncate">{claim.claimed_territory}</span>
                            {profile?.glow_score > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#FFD000]">
                                <Zap className="w-2.5 h-2.5" />{profile.glow_score}
                              </span>
                            )}
                          </div>
                        </div>
                        <Link
                          to={`${createPageUrl("Profile")}?user=${encodeURIComponent(claim.member_email)}`}
                          className="shrink-0 w-7 h-7 rounded-lg bg-[#8A5CFF]/10 hover:bg-[#8A5CFF]/20 flex items-center justify-center transition"
                        >
                          <ExternalLink className="w-3 h-3 text-[#8A5CFF]" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}