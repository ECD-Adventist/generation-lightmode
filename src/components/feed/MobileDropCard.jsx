import React, { memo, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getDisplayName } from "@/lib/displayName";

/**
 * Lightweight mobile-only DropCard.
 * - No heavy gradients, animations, or hover cards.
 * - Lazy-loads images and renders a simplified post layout.
 * - Reuses the same mutation signatures as DropCard so behavior is identical.
 */
function MobileDropCard({
  drop,
  user,
  dropUser,
  likeMutation,
  handleShare,
  userLikes = [],
  savedDropRecords = [],
  leaderAccounts = [],
}) {
  const queryClient = useQueryClient();
  const userHasLiked = userLikes.some(like => like.drop_id === drop.id);

  const leaderForDrop = leaderAccounts.find(a => a.leader_email === drop.user_email);
  const isLeaderPost = !!leaderForDrop;

  const savedForThisDrop = savedDropRecords.filter(s => s.drop_id === drop.id);
  const isSaved = savedForThisDrop.length > 0;

  const cleanReflection = (reflection) =>
    reflection?.replace(/^(\[Reposted from .+?\]\s*)+/i, "").trim() || "";

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (!user) { toast.error("Please log in to save"); return; }
      if (isSaved) {
        await base44.entities.SavedDrop.delete(savedForThisDrop[0].id);
      } else {
        await base44.entities.SavedDrop.create({ drop_id: drop.id, user_email: user.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedDrops", user?.email] });
      toast.success(isSaved ? "Removed from Saved" : "Saved");
    },
  });

  const deleteDropMutation = useMutation({
    mutationFn: async () => { await base44.entities.GlowDrop.delete(drop.id); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      toast.success("Post deleted");
    },
  });

  const handleLike = () => {
    likeMutation.mutate({
      id: drop.id,
      authorEmail: drop.user_email,
      authorName: getDisplayName(dropUser),
    });
  };

  const isManagerOfLeader = !!leaderForDrop && Array.isArray(leaderForDrop.manager_emails) && leaderForDrop.manager_emails.includes(user?.email);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const canDelete = user?.email === drop.user_email || isManagerOfLeader || isAdmin;

  const reflectionText = cleanReflection(drop.reflection);
  const profileLink = drop.user_email === "system@lightmode.com"
    ? createPageUrl("GenerationLightMode")
    : createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`;

  const [showComments, setShowComments] = useState(false);

  return (
    <article
      className="rounded-2xl overflow-hidden mb-3"
      style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Link to={profileLink} className="shrink-0">
          <img
            src={dropUser?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
            alt=""
            width="36"
            height="36"
            loading="lazy"
            decoding="async"
            className="w-9 h-9 rounded-full object-cover"
            style={{ border: isLeaderPost ? "2px solid #FFD000" : "1px solid #E6ECF5" }}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={profileLink} className="block no-underline">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold truncate" style={{ color: "#0B1B3D" }}>
                {getDisplayName(dropUser)}
              </span>
              {isLeaderPost && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full" style={{ background: "#FFF3CC", color: "#CC7A00" }}>
                  Leader
                </span>
              )}
            </div>
            <div className="text-[11px]" style={{ color: "#8A97B5" }}>
              {drop.created_date ? formatDistanceToNow(new Date(drop.created_date.endsWith('Z') ? drop.created_date : drop.created_date + 'Z'), { addSuffix: true }) : ''}
            </div>
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 flex items-center justify-center rounded-full" style={{ color: "#6B7FA0" }}>
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {canDelete ? (
              <DropdownMenuItem
                className="text-red-500 cursor-pointer"
                onClick={() => {
                  if (window.confirm("Delete this post? This cannot be undone.")) {
                    deleteDropMutation.mutate();
                  }
                }}
              >
                Delete Post
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => {
                  if (!user) return toast.error("Please log in to report");
                  const reason = window.prompt("Why are you reporting this content?");
                  if (reason) {
                    base44.entities.ReportedDrop.create({
                      drop_id: drop.id,
                      reporter_email: user.email,
                      reason,
                    }).then(() => toast.success("Reported"));
                  }
                }}
              >
                Report Post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Media (lazy-loaded) */}
      {drop.media_url ? (
        <Link to={createPageUrl("Post") + `?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`}>
          <img
            src={drop.media_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full block"
            style={{ aspectRatio: "4 / 5", objectFit: "cover", background: "#F1F5FB" }}
          />
        </Link>
      ) : (
        <Link
          to={createPageUrl("Post") + `?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`}
          className="block px-4 py-6 no-underline min-h-[140px]"
          style={{ background: "linear-gradient(135deg, #EEF3FF 0%, #DDE7FB 100%)" }}
        >
          {drop.verse && (
            <p className="text-base font-bold leading-snug mb-2 line-clamp-3" style={{ color: "#0B3FD9" }}>
              {drop.verse}
            </p>
          )}
          {reflectionText ? (
            <p className="text-[13px] italic leading-snug line-clamp-5" style={{ color: "#3A4A6B" }}>
              "{reflectionText.length > 220 ? reflectionText.slice(0, 220) + "…" : reflectionText}"
            </p>
          ) : !drop.verse ? (
            <p className="text-[13px] italic" style={{ color: "#8A97B5" }}>Tap to view post</p>
          ) : null}
        </Link>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full active:scale-95 transition"
        >
          <Heart className={`w-5 h-5 ${userHasLiked ? "fill-red-500 text-red-500" : ""}`} style={{ color: userHasLiked ? undefined : "#0B1B3D" }} />
          <span className="text-[12px] font-bold" style={{ color: "#0B1B3D" }}>{drop.likes_count || 0}</span>
        </button>
        <Link
          to={createPageUrl("Post") + `?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full active:scale-95 transition no-underline"
        >
          <MessageCircle className="w-5 h-5" style={{ color: "#0B1B3D" }} />
        </Link>
        <button
          onClick={() => handleShare(drop)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full active:scale-95 transition"
        >
          <Share2 className="w-5 h-5" style={{ color: "#0B1B3D" }} />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => toggleSaveMutation.mutate()}
          className="px-2.5 py-1.5 rounded-full active:scale-95 transition"
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} style={{ color: isSaved ? undefined : "#0B1B3D" }} />
        </button>
      </div>

      {/* Caption preview (when media exists) */}
      {drop.media_url && (drop.verse || reflectionText) && (
        <div className="px-3 pb-3 -mt-1">
          {drop.verse && (
            <p className="text-[13px] font-bold mb-0.5 line-clamp-2" style={{ color: "#0B3FD9" }}>{drop.verse}</p>
          )}
          {reflectionText && (
            <p className="text-[13px] leading-snug line-clamp-3" style={{ color: "#3A4A6B" }}>
              {reflectionText}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export default memo(MobileDropCard);