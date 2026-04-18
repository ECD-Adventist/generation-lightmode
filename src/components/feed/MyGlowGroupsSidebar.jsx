import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Users, ChevronRight, MessageCircle } from "lucide-react";

export default function MyGlowGroupsSidebar({ userEmail }) {
  const { data: memberships = [] } = useQuery({
    queryKey: ["myMemberships", userEmail],
    queryFn: () => base44.entities.GlowGroupMember.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const { data: leaderGroups = [] } = useQuery({
    queryKey: ["myLeaderGroups", userEmail],
    queryFn: () => base44.entities.GlowGroup.filter({ leader_email: userEmail }),
    enabled: !!userEmail,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ["allGlowGroupsSidebar"],
    queryFn: () => base44.entities.GlowGroup.list(),
    enabled: !!userEmail,
    staleTime: 60000,
  });

  const memberGroupIds = new Set(memberships.map(m => m.group_id));
  const leaderGroupIds = new Set(leaderGroups.map(g => g.id));
  const myGroups = allGroups.filter(g => memberGroupIds.has(g.id) || leaderGroupIds.has(g.id));

  if (myGroups.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between px-3 mb-1.5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "#8A97B5" }}>My Groups</p>
        <Link to={createPageUrl("GlowGroups")} className="text-[10px] font-bold no-underline" style={{ color: "#0B3FD9" }}>See all</Link>
      </div>
      <div className="flex flex-col gap-0.5">
        {myGroups.slice(0, 5).map(group => {
          const isLeader = leaderGroupIds.has(group.id);
          return (
            <Link
              key={group.id}
              to={createPageUrl("GlowGroups")}
              className="group flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-200 hover:bg-[#F0F4FA] no-underline"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(31,184,255,0.1)", border: "1px solid #D6E4FF" }}>
                <Users className="w-3.5 h-3.5" style={{ color: "#0B3FD9" }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-semibold truncate block" style={{ color: "#3A4A6B" }}>{group.name}</span>
                {isLeader && <span className="text-[9px] font-bold" style={{ color: "#CC7A00" }}>Leader</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}