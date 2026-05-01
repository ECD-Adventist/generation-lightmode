import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Pin } from "lucide-react";
import DropCard from "@/components/feed/DropCard";

/**
 * Desktop-only ribbon of pinned leader announcements at the top of the feed.
 * Posts marked `pinned: true` on the GlowDrop entity render here using the
 * same `DropCard` styling as the main feed for visual consistency.
 */
export default function PinnedLeaderPosts({
  leaderAccounts = [],
  user,
  allUsers = [],
  likeMutation,
  handleShare,
  userLikes = [],
  savedDropRecords = [],
  following = [],
  followMutation,
}) {
  const { data: pinnedDrops = [], isLoading } = useQuery({
    queryKey: ["pinnedLeaderDrops"],
    queryFn: () => base44.entities.GlowDrop.filter({ pinned: true, hidden: false, status: "approved" }, "-created_date", 6),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  if (isLoading || pinnedDrops.length === 0) return null;

  const resolveDropUser = (email) => {
    if (user?.email === email) return user;
    const found = allUsers.find(u => u.email === email);
    if (found) return found;
    const leader = leaderAccounts.find(a => a.leader_email === email);
    if (leader) {
      return {
        email: leader.leader_email,
        full_name: leader.leader_name,
        bio: leader.leader_bio,
        profile_picture_url: leader.leader_profile_picture_url,
        country: leader.leader_country,
        is_managed_leader: true,
      };
    }
    return { full_name: email?.split("@")[0] || "Leader", email };
  };

  return (
    <div className="px-3 sm:px-4 mb-5 sm:mb-6 shrink-0 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-3">
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

      <div className="space-y-2">
        {pinnedDrops.map(drop => (
          <DropCard
            key={drop.id}
            drop={drop}
            user={user}
            dropUser={resolveDropUser(drop.user_email)}
            likeMutation={likeMutation}
            handleShare={handleShare}
            userLikes={userLikes}
            allUsers={allUsers}
            savedDropRecords={savedDropRecords}
            leaderAccounts={leaderAccounts}
            following={following}
            followMutation={followMutation}
          />
        ))}
      </div>
    </div>
  );
}