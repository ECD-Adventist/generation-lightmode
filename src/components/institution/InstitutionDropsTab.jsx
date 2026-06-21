import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Search, Heart } from "lucide-react";

export default function InstitutionDropsTab({ ownerEmail }) {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ["territoryClaims", ownerEmail],
    queryFn: () => base44.entities.TerritoryMemberClaim.filter({ institution_owner_email: ownerEmail }),
    enabled: !!ownerEmail,
  });

  const { data: drops = [], isLoading: dropsLoading } = useQuery({
    queryKey: ["allDropsForInstitution"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 500),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
  });

  const approvedClaims = claims.filter(c => c.status === "approved");
  const approvedEmails = new Set(approvedClaims.map(c => c.member_email));

  const institutionDrops = useMemo(() => {
    return drops.filter(d => approvedEmails.has(d.user_email) || d.user_email === ownerEmail);
  }, [drops, approvedEmails, ownerEmail]);

  const filteredDrops = institutionDrops.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (d.verse?.toLowerCase().includes(q)) || (d.reflection?.toLowerCase().includes(q));
  });

  if (claimsLoading || dropsLoading) {
    return <div className="py-12 text-center text-gray-500">Loading drops...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Territory Glow Drops</h2>
          <p className="text-sm text-gray-400 mt-1">Content shared by verified members in your territories.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search drops..." className="w-full bg-[#121826] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00CFFF]/50" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrops.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-[#121826] rounded-2xl border border-white/5">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No drops found from your territory members.</p>
          </div>
        ) : (
          filteredDrops.map(drop => {
            const author = allUsers.find(u => u.email === drop.user_email);
            return (
              <div key={drop.id} className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[280px]">
                {drop.media_url ? (
                  <div className="h-32 w-full bg-black shrink-0">
                    <img src={drop.media_url} loading="lazy" className="w-full h-full object-cover opacity-80" />
                  </div>
                ) : (
                  <div className="h-32 w-full bg-gradient-to-br from-[#00CFFF]/10 to-[#8A5CFF]/10 shrink-0 flex items-center justify-center p-4">
                    <p className="text-[#00CFFF] font-bold text-center line-clamp-3 text-sm">"{drop.verse}"</p>
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col min-h-0">
                  <p className="text-sm text-gray-300 line-clamp-2 mb-2 flex-1">{drop.reflection || drop.verse}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={author?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-5 h-5 rounded-full object-cover" />
                      <span className="text-xs text-gray-400 truncate">{author?.full_name || drop.user_email}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500 font-bold"><Heart className="w-3 h-3 text-[#FFD000]" /> {drop.likes_count || 0}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}