import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Clock, Users, MapPin, Search, Filter } from "lucide-react";
import { toast } from "sonner";

export default function TerritoryVerificationQueue({ institutionApps, ownerEmail }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["territoryClaims", ownerEmail],
    queryFn: () => base44.entities.TerritoryMemberClaim.filter({ institution_owner_email: ownerEmail }),
    enabled: !!ownerEmail,
  });

  // Get territories from apps
  const territories = useMemo(() => {
    for (const app of institutionApps) {
      if (app.extracted_territories) {
        try { return JSON.parse(app.extracted_territories); } catch { /* ignore */ }
      }
    }
    return [];
  }, [institutionApps]);

  const filteredClaims = useMemo(() => {
    return claims
      .filter(c => statusFilter === "all" || c.status === statusFilter)
      .filter(c => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (c.member_name?.toLowerCase().includes(q)) ||
               (c.member_email?.toLowerCase().includes(q)) ||
               (c.claimed_territory?.toLowerCase().includes(q));
      });
  }, [claims, statusFilter, searchQuery]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      await base44.entities.TerritoryMemberClaim.update(id, { status, reviewer_notes: notes || "" });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["territoryClaims", ownerEmail] });
      toast.success(status === "approved" ? "Member approved!" : "Member rejected.");
    },
  });

  const pending = claims.filter(c => c.status === "pending").length;
  const approved = claims.filter(c => c.status === "approved").length;
  const rejected = claims.filter(c => c.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#121826] rounded-xl p-4 border border-yellow-500/10 text-center">
          <div className="text-xl font-black text-yellow-400">{pending}</div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-1">Pending</div>
        </div>
        <div className="bg-[#121826] rounded-xl p-4 border border-green-500/10 text-center">
          <div className="text-xl font-black text-green-400">{approved}</div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-1">Approved</div>
        </div>
        <div className="bg-[#121826] rounded-xl p-4 border border-red-500/10 text-center">
          <div className="text-xl font-black text-red-400">{rejected}</div>
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-1">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, territory..."
            className="w-full bg-[#121826] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00CFFF]/50"
          />
        </div>
        <div className="flex gap-2">
          {["pending", "approved", "rejected", "all"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                statusFilter === s
                  ? "bg-[#00CFFF]/15 text-[#00CFFF] border border-[#00CFFF]/30"
                  : "bg-[#121826] text-gray-500 border border-white/5 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Claims List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading claims...</div>
      ) : filteredClaims.length === 0 ? (
        <div className="text-center py-12 bg-[#121826] rounded-2xl border border-white/5">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No {statusFilter !== "all" ? statusFilter : ""} verification requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClaims.map(claim => (
            <div key={claim.id} className="bg-[#121826] rounded-xl p-5 border border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-bold text-white truncate">{claim.member_name || claim.member_email}</h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      claim.status === "approved" ? "bg-green-500/20 text-green-400" :
                      claim.status === "rejected" ? "bg-red-500/20 text-red-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>{claim.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{claim.member_email}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {claim.claimed_territory}</span>
                    {claim.member_city && <span>{claim.member_city}</span>}
                    {claim.member_country && <span>{claim.member_country}</span>}
                  </div>
                  {claim.reviewer_notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">Note: {claim.reviewer_notes}</p>
                  )}
                </div>

                {claim.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => updateMutation.mutate({ id: claim.id, status: "approved" })}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/15 text-green-400 text-xs font-bold border border-green-500/20 hover:bg-green-500/25 transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => updateMutation.mutate({ id: claim.id, status: "rejected" })}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/15 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/25 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}