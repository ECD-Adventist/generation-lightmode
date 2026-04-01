import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Search, MapPin } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function InstitutionUsersTab({ ownerEmail }) {
  const [searchQuery, setSearchQuery] = useState("");

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

  const approvedClaims = claims.filter(c => c.status === "approved");
  const approvedEmails = new Set(approvedClaims.map(c => c.member_email));
  const institutionUsers = allUsers.filter(u => approvedEmails.has(u.email));
  const filteredUsers = institutionUsers.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.full_name?.toLowerCase().includes(q)) || (u.email?.toLowerCase().includes(q));
  });

  if (claimsLoading || usersLoading) {
    return <div className="py-12 text-center text-gray-500">Loading members...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Institution Members</h2>
          <p className="text-sm text-gray-400 mt-1">Verified members in your territories.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search members..." className="w-full bg-[#121826] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00CFFF]/50" />
        </div>
      </div>

      <div className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Member</th>
                  <th className="px-6 py-4 font-semibold">Territory</th>
                  <th className="px-6 py-4 font-semibold">XP</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(user => {
                  const claim = approvedClaims.find(c => c.member_email === user.email);
                  return (
                    <tr key={user.email} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={user.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="font-semibold text-white">{user.full_name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <MapPin className="w-3.5 h-3.5 text-[#00CFFF]" />
                          {claim?.claimed_territory || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#FFD000]">{user.glow_score || 0}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{user.created_date ? new Date(user.created_date).toLocaleDateString() : ""}</td>
                      <td className="px-6 py-4 text-right">
                        <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(user.email)}`} className="text-xs font-bold text-[#00CFFF] hover:underline">View Profile</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}