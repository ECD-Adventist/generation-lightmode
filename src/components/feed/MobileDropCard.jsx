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
import { feedThumb, avatarThumb } from "@/lib/imageProxy";

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
  const postLink = createPageUrl("Post") + `?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`;

  const [showComments, setShowComments] = useState(false);

  return (
    <article
      className="relative rounded-[1.35rem] overflow-hidden mb-4"
      style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 6px rgba(11, 63, 217, 0.06)" }}
    >
      <Link to={postLink} className="block relative no-underline">
        <div className="relative overflow-hidden" style={{ aspectRatio: "4 / 5", background: drop.media_url ? "#DDE7FB" : "linear-gradient(135deg, #EEF3FF 0%, #DDE7FB 100%)" }}>
          {drop.media_url ? (
            <img
              src={feedThumb(drop.media_url)}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 p-5 flex flex-col justify-center" style={{ background: "linear-gradient(135deg, #EAF3FF 0%, #D4E6FF 55%, #C7DEF8 100%)" }}>
              {drop.verse && (
                <p className="text-[18px] font-black leading-tight mb-3 line-clamp-4" style={{ color: "#0B3FD9" }}>
                  {drop.verse}
                </p>
              )}
              {reflectionText ? (
                <p className="text-[14px] italic leading-snug line-clamp-6" style={{ color: "#3A4A6B" }}>
                  “{reflectionText.length > 260 ? reflectionText.slice(0, 260) + "…" : reflectionText}”
                </p>
              ) : !drop.verse ? (
                <p className="text-[14px] italic" style={{ color: "#8A97B5" }}>Tap to view post</p>
              ) : null}
            </div>
          )}

          <div className="absolute inset-x-0 top-0 h-28 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.48), rgba(0,0,0,0))" }} />
          <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.34), rgba(0,0,0,0))" }} />

          <div className="absolute top-3 left-3 right-12 flex items-center gap-2.5">
            <div className="shrink-0 w-10 h-10 rounded-full p-[2px]" style={{ background: isLeaderPost ? "linear-gradient(135deg, #FFD000, #FF9F1A)" : "rgba(255,255,255,0.85)" }}>
              <img
                src={avatarThumb(dropUser?.profile_picture_url) || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="min-w-0 rounded-full px-3 py-1.5" style={{ background: "rgba(0,0,0,0.55)" }}>
              <div className="text-[12px] font-black truncate text-white">{getDisplayName(dropUser)}</div>
              <div className="text-[10px] text-white/80">
                {drop.created_date ? formatDistanceToNow(new Date(drop.created_date.endsWith('Z') ? drop.created_date : drop.created_date + 'Z'), { addSuffix: true }) : ''}
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="absolute top-3 right-3 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ color: "#FFFFFF", background: "rgba(0,0,0,0.45)" }}>
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

      <div className="absolute right-3 bottom-14 z-20 flex flex-col gap-3">
        <button onClick={handleLike} className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition" style={{ background: "rgba(255,255,255,0.85)", color: userHasLiked ? "#EF4444" : "#0B1B3D" }}>
          <Heart className={`w-5 h-5 ${userHasLiked ? "fill-red-500 text-red-500" : ""}`} />
        </button>
        <Link to={postLink} className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition" style={{ background: "rgba(255,255,255,0.85)", color: "#0B1B3D" }}>
          <MessageCircle className="w-5 h-5" />
        </Link>
        <button onClick={() => handleShare(drop)} className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition" style={{ background: "rgba(255,255,255,0.85)", color: "#0B1B3D" }}>
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4 px-4 py-3">
        <button onClick={handleLike} className="flex items-center gap-1.5 active:scale-95 transition">
          <Heart className={`w-5 h-5 ${userHasLiked ? "fill-red-500 text-red-500" : ""}`} style={{ color: userHasLiked ? undefined : "#0B1B3D" }} />
          <span className="text-[12px] font-black" style={{ color: "#0B1B3D" }}>{drop.likes_count || 0}</span>
        </button>
        <Link to={postLink} className="flex items-center gap-1.5 active:scale-95 transition no-underline">
          <MessageCircle className="w-5 h-5" style={{ color: "#0B1B3D" }} />
          <span className="text-[12px] font-black" style={{ color: "#0B1B3D" }}>0</span>
        </Link>
        <button onClick={() => handleShare(drop)} className="active:scale-95 transition">
          <Share2 className="w-5 h-5" style={{ color: "#0B1B3D" }} />
        </button>
        <div className="flex-1" />
        <button onClick={() => toggleSaveMutation.mutate()} className="active:scale-95 transition">
          <Bookmark className={`w-5 h-5 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} style={{ color: isSaved ? undefined : "#0B1B3D" }} />
        </button>
      </div>

      {drop.media_url && (drop.verse || reflectionText) && (
        <div className="px-4 pb-4 -mt-1">
          {drop.verse && (
            <p className="text-[13px] font-black mb-1 line-clamp-2" style={{ color: "#0B3FD9" }}>{drop.verse}</p>
          )}
          {reflectionText && (
            <p className="text-[13px] leading-snug line-clamp-3" style={{ color: "#3A4A6B" }}>{reflectionText}</p>
          )}
        </div>
      )}
    </article>
  );
}

export default memo(MobileDropCard);