import React, { memo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getDisplayName } from "@/lib/displayName";
import { feedThumb, avatarThumb } from "@/lib/imageProxy";
import KeepIt100Poster from "@/components/keep-it-100/KeepIt100Poster";
import CodesOfTruthPoster from "@/components/codes-of-truth/CodesOfTruthPoster";

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
  const navigate = useNavigate();
  const clickTimerRef = useRef(null);
  const userHasLiked = userLikes.some(like => like.drop_id === drop.id);

  const leaderForDrop = leaderAccounts.find(a => a.leader_email === drop.user_email);
  const isLeaderPost = !!leaderForDrop;
  const isKeepIt100 = !drop.media_url && (drop.category === "Keep It 100" || /keepit100/i.test(drop.hashtags || ""));
  const isCodeOfTruth = !drop.media_url && drop.category === "Code of Truth";
  const usesDesignedPoster = isKeepIt100 || isCodeOfTruth;

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
    mutationFn: async () => {
      const res = await base44.functions.invoke("deleteGlowDrop", { drop_id: drop.id });
      if (!res?.data?.success) throw new Error(res?.data?.error || "Failed to delete post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      queryClient.invalidateQueries({ queryKey: ["glowFeed"] });
      queryClient.invalidateQueries({ queryKey: ["myGlowDropsProfile"] });
      toast.success("Post deleted");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || err?.message || "Could not delete post");
    },
  });

  const handleLike = () => {
    likeMutation.mutate({
      id: drop.id,
      authorEmail: drop.user_email,
      authorName: getDisplayName(dropUser),
    });
  };

  const handlePostSurfaceClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      handleLike();
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      navigate(postLink);
    }, 240);
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
      className="relative rounded-[2rem] mb-5 p-3 overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid #D6E4FF", boxShadow: "0 10px 28px rgba(11, 63, 217, 0.10)" }}
    >
      <div className="relative rounded-[1.45rem] overflow-hidden" style={{ aspectRatio: "4 / 5", background: drop.media_url ? "#DDE7FB" : usesDesignedPoster ? "#050814" : "linear-gradient(135deg, #EEF5FF 0%, #DCE8FF 100%)" }}>
        <div
          role="button"
          tabIndex={0}
          onClick={handlePostSurfaceClick}
          onKeyDown={(e) => { if (e.key === "Enter") navigate(postLink); }}
          className="absolute inset-0 block no-underline cursor-pointer touch-manipulation"
        >
          {drop.media_url ? (
            <img
              src={feedThumb(drop.media_url)}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : isKeepIt100 ? (
            <KeepIt100Poster text={drop.reflection} verse={drop.verse} className="absolute inset-0 w-full h-full" />
          ) : isCodeOfTruth ? (
            <CodesOfTruthPoster text={drop.reflection} verse={drop.verse} className="absolute inset-0 w-full h-full" />
          ) : (
            <div className="absolute inset-0 pl-6 pr-[5.75rem] pt-20 pb-10 flex flex-col items-center justify-center text-center" style={{ background: "linear-gradient(135deg, #EEF5FF 0%, #DCE8FF 100%)" }}>
              {drop.verse && (
                <p className="text-[20px] font-black leading-tight mb-4 line-clamp-7" style={{ color: "#62A4FF", fontFamily: "Space Grotesk, Inter, sans-serif" }}>
                  {drop.verse}
                </p>
              )}
              {reflectionText ? (
                <p className="text-[14px] italic leading-snug line-clamp-6" style={{ color: "#344B73" }}>
                  “{reflectionText.length > 220 ? reflectionText.slice(0, 220) + "…" : reflectionText}”
                </p>
              ) : !drop.verse ? (
                <p className="text-[15px] italic" style={{ color: "#8A97B5" }}>Tap to view post</p>
              ) : null}
              <div className="mt-6 w-16 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #0B3FD9, #1FB8FF)" }} />
            </div>
          )}
        </div>

        <Link to={profileLink} className="absolute top-3 left-3 z-20 flex items-center rounded-full pr-4 py-1 pl-1 no-underline" style={{ background: "rgba(255,255,255,0.96)", border: "1px solid #E6ECF5", boxShadow: "0 4px 14px rgba(11, 27, 61, 0.12)" }}>
          <div className="shrink-0 w-9 h-9 rounded-full p-[2px] mr-2" style={{ background: isLeaderPost ? "linear-gradient(135deg, #FFD000, #FF9F1A)" : "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
            <img
              src={avatarThumb(dropUser?.profile_picture_url) || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full rounded-full object-cover bg-white"
            />
          </div>
          <div className="min-w-0 max-w-[150px]">
            <div className="text-[12px] font-black truncate" style={{ color: "#0B1B3D" }}>{getDisplayName(dropUser)}</div>
            <div className="text-[10px] truncate" style={{ color: "#4A5878" }}>
              {drop.created_date ? formatDistanceToNow(new Date(drop.created_date.endsWith('Z') ? drop.created_date : drop.created_date + 'Z'), { addSuffix: true }) : ''}
            </div>
          </div>
        </Link>

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3">
          <button onClick={handleLike} className="flex flex-col items-center gap-1 active:scale-95 transition">
            <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.96)", border: "1px solid #D6E4FF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.12)", color: userHasLiked ? "#EF4444" : "#0B3FD9" }}>
              <Heart className={`w-5 h-5 ${userHasLiked ? "fill-red-500 text-red-500" : ""}`} />
            </span>
            <span className="text-[11px] font-black" style={{ color: drop.media_url ? "#FFFFFF" : "#0B1B3D", textShadow: drop.media_url ? "0 1px 4px rgba(0,0,0,0.45)" : "none" }}>{drop.likes_count || 0}</span>
          </button>
          <Link to={postLink} className="flex flex-col items-center gap-1 active:scale-95 transition no-underline">
            <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.96)", border: "1px solid #D6E4FF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.12)", color: "#0B3FD9" }}>
              <MessageCircle className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-black" style={{ color: drop.media_url ? "#FFFFFF" : "#0B1B3D", textShadow: drop.media_url ? "0 1px 4px rgba(0,0,0,0.45)" : "none" }}>0</span>
          </Link>
          <button onClick={() => handleShare(drop)} className="flex flex-col items-center gap-1 active:scale-95 transition">
            <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.96)", border: "1px solid #D6E4FF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.12)", color: "#0B3FD9" }}>
              <Share2 className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-black" style={{ color: drop.media_url ? "#FFFFFF" : "#0B1B3D", textShadow: drop.media_url ? "0 1px 4px rgba(0,0,0,0.45)" : "none" }}>0</span>
          </button>
          <button onClick={() => toggleSaveMutation.mutate()} className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition" style={{ background: "rgba(255,255,255,0.96)", border: "1px solid #D6E4FF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.12)", color: isSaved ? "#F59E0B" : "#0B3FD9" }}>
            <Bookmark className={`w-5 h-5 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition" style={{ background: "rgba(255,255,255,0.96)", border: "1px solid #D6E4FF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.12)", color: "#0B3FD9" }}>
                <MoreHorizontal className="w-5 h-5" />
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
      </div>

      {(drop.verse || reflectionText || drop.category || drop.hashtags) && (
        <div className="px-3 pt-3 pb-1">
          {drop.verse && (
            <Link to={postLink} className="block text-[14px] font-black mb-1 no-underline" style={{ color: "#004CFF" }}>{drop.verse}</Link>
          )}
          {reflectionText && (
            <p className="text-[13px] leading-relaxed line-clamp-3" style={{ color: "#8A8F98" }}>
              {drop.category === "Keep It 100" ? "📌 " : ""}{reflectionText}
            </p>
          )}
          {drop.category && (
            <div className="mt-3">
              <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide" style={{ background: "#EAF5FF", border: "1px solid #B8E5FF", color: "#004CFF" }}>
                {drop.category}
              </span>
            </div>
          )}
          {drop.hashtags && (
            <div className="mt-3 text-[12px] font-semibold leading-relaxed" style={{ color: "#004CFF" }}>{drop.hashtags}</div>
          )}
        </div>
      )}
    </article>
  );
}

export default memo(MobileDropCard);