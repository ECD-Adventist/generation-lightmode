import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Pin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatDistanceToNow } from "date-fns";

/**
 * Desktop-only ribbon of pinned leader announcements that always sit at the
 * top of the feed (just under the Daily Drops button row). Posts marked
 * `pinned: true` on the GlowDrop entity show up here. Only ECD Admins and
 * super admins can toggle the pin state from the moderation panel.
 */
export default function PinnedLeaderPosts({ leaderAccounts = [] }) {
  const { data: pinnedDrops = [], isLoading } = useQuery({
    queryKey: ["pinnedLeaderDrops"],
    queryFn: () => base44.entities.GlowDrop.filter({ pinned: true, hidden: false, status: "approved" }, "-created_date", 6),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  if (isLoading || pinnedDrops.length === 0) return null;

  const resolveLeader = (email) => {
    if (!email) return null;
    // Match by leader_email, or by manager_emails if the drop was created by a manager
    return leaderAccounts.find(a => a.leader_email === email || (a.manager_emails || []).includes(email));
  };

  return (
    <div className="px-3 sm:px-4 mb-5 sm:mb-6 shrink-0">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFD000, #FF9F1A)", boxShadow: "0 4px 12px rgba(255, 159, 26, 0.35)" }}>
          <Pin className="w-3.5 h-3.5" style={{ color: "#0B1B3D" }} />
        </div>
        <h3 className="font-black text-[11px] tracking-[0.18em] uppercase" style={{ color: "#CC7A00" }}>
          Pinned Announcements
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(255, 208, 0, 0.18)", color: "#CC7A00" }}>
          {pinnedDrops.length}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {pinnedDrops.map(drop => {
          const leader = resolveLeader(drop.user_email);
          const leaderName = leader?.leader_name || drop.author_name || drop.user_email?.split("@")[0] || "Leader";
          const leaderTitle = leader?.leader_title || "Official Leader";
          const avatar = leader?.leader_profile_picture_url || drop.author_avatar || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

          return (
            <Link
              key={drop.id}
              to={`${createPageUrl("Post")}?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`}
              className="shrink-0 w-[320px] rounded-[1.25rem] p-4 transition-all hover:-translate-y-0.5 no-underline relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #F4F8FF 50%, #FFFCF0 100%)",
                border: "1px solid #FFE4A0",
                boxShadow: "0 4px 16px rgba(255, 159, 26, 0.12), 0 8px 24px rgba(11, 63, 217, 0.08)",
              }}
            >
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider" style={{ background: "linear-gradient(135deg, #FFD000, #FF9F1A)", color: "#0B1B3D" }}>
                <Pin className="w-2.5 h-2.5" /> Pinned
              </div>

              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ border: "2px solid #FFD000", boxShadow: "0 2px 8px rgba(255, 208, 0, 0.3)" }}>
                  <img src={avatar} alt="" width="40" height="40" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1 pr-12">
                  <div className="font-bold text-sm truncate" style={{ color: "#0B1B3D" }}>{leaderName}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: "#CC7A00" }}>{leaderTitle}</div>
                </div>
              </div>

              {drop.verse && (
                <p className="text-sm font-bold font-['Space_Grotesk'] leading-snug mb-1.5 line-clamp-2" style={{ color: "#0B3FD9" }}>
                  {drop.verse}
                </p>
              )}
              {drop.reflection && (
                <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "#3A4A6B" }}>
                  {drop.reflection}
                </p>
              )}

              <div className="mt-3 pt-3 border-t flex items-center justify-between text-[10px]" style={{ borderColor: "#FFE4A0", color: "#8A97B5" }}>
                <span>{drop.created_date ? formatDistanceToNow(new Date(drop.created_date.endsWith("Z") ? drop.created_date : drop.created_date + "Z"), { addSuffix: true }) : ""}</span>
                <span className="font-bold" style={{ color: "#CC7A00" }}>Read post →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}