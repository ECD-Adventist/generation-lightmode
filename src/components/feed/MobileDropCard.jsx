import React, { memo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getDisplayName } from "@/lib/displayName";
import { avatarThumb } from "@/lib/imageProxy";
import CountryFlag from "@/components/common/CountryFlag";
import KeepIt100Poster from "@/components/keep-it-100/KeepIt100Poster";
import CodesOfTruthPoster from "@/components/codes-of-truth/CodesOfTruthPoster";
import RepostButton from "@/components/feed/RepostButton";
import PostMusicEditor from "@/components/feed/PostMusicEditor";
import PostAudioTrack from "@/components/feed/PostAudioTrack";
import FeedActionCapsule, { FeedActionItem } from "@/components/feed/FeedActionCapsule";
import MobileDropComments from "@/components/feed/MobileDropComments";

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
  following = [],
  followMutation,
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const clickTimerRef = useRef(null);
  const userHasLiked = userLikes.some(like => like.drop_id === drop.id);

  const authorProfile = {
    ...(dropUser || {}),
    email: drop.user_email,
    username: drop.author_username || dropUser?.username || "",
    full_name: drop.author_name || dropUser?.full_name || drop.user_email?.split("@")[0] || "Glow Believer",
    profile_picture: drop.author_avatar || dropUser?.profile_picture || dropUser?.profile_picture_url || "",
    profile_picture_url: drop.author_avatar || dropUser?.profile_picture || dropUser?.profile_picture_url || "",
  };
  const leaderForDrop = leaderAccounts.find(a => a.leader_email === drop.user_email);
  const isLeaderPost = !!leaderForDrop;
  const isKeepIt100 = !drop.media_url && (drop.category === "Keep It 100" || /keepit100/i.test(drop.hashtags || ""));
  const isCodeOfTruth = !drop.media_url && (
    drop.category === "Code of Truth" ||
    /codes?\s*of\s*truth|codes?oftruth/i.test(drop.hashtags || "")
  );
  const usesDesignedPoster = isKeepIt100 || isCodeOfTruth;
  const hasDarkActionBackdrop = Boolean(drop.media_url || usesDesignedPoster);
  const isFollowingAuthor = following.some(follow =>
    follow.following_id === dropUser?.id || follow.following_email === drop.user_email
  );
  const canFollowAuthor = !!user && user.email !== drop.user_email && drop.user_email !== "system@lightmode.com" && !isFollowingAuthor;

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
      authorName: getDisplayName(authorProfile),
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
  const [musicEditorOpen, setMusicEditorOpen] = useState(false);
  const canEditMusic = user?.email === drop.user_email || isManagerOfLeader;

  const actionBar = (
    <FeedActionCapsule
      inline
      more={
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button className="w-[44px] h-[44px] rounded-full flex items-center justify-center bg-[#08111F] border border-white/10 text-[#18C8FF]" aria-label="Post options"><MoreHorizontal className="w-4 h-4" /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {canEditMusic && <DropdownMenuItem onClick={() => setMusicEditorOpen(true)}>{drop.audio_url ? "Change Music" : "Add Music"}</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${postLink}`).then(() => toast.success("Link copied")); }}>Copy Link</DropdownMenuItem>
            {canDelete
              ? <DropdownMenuItem className="text-red-500" onClick={() => { if (window.confirm("Delete this post? This cannot be undone.")) deleteDropMutation.mutate(); }}>Delete Post</DropdownMenuItem>
              : <DropdownMenuItem onClick={() => { if (!user) return toast.error("Please log in to report"); const reason = window.prompt("Why are you reporting this content?"); if (reason) base44.entities.ReportedDrop.create({ drop_id: drop.id, reporter_email: user.email, reason }).then(() => toast.success("Reported")); }}>Report Post</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      <FeedActionItem icon={<Heart className={`w-4 h-4 ${userHasLiked ? "fill-[#F4C84A]" : ""}`} />} label="Like" value={drop.likes_count || 0} active={userHasLiked} onClick={handleLike} />
      <FeedActionItem icon={<MessageCircle className="w-4 h-4" />} label="Comment" active={showComments} onClick={() => setShowComments(v => !v)} />
      <FeedActionItem icon={<Share2 className="w-4 h-4" />} label="Share" value={drop.shares_count || 0} onClick={(event) => { event.stopPropagation(); handleShare(drop); }} />
      <RepostButton drop={drop} user={user} capsule />
      <FeedActionItem icon={<Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />} label={isSaved ? "Saved" : "Save"} active={isSaved} onClick={() => toggleSaveMutation.mutate()} />
    </FeedActionCapsule>
  );

  return (
    <article
      className="relative rounded-[1.5rem] mb-5 overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid #D6E4FF", boxShadow: "0 10px 28px rgba(11, 63, 217, 0.10)" }}
    >
      {drop.media_url && (
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-3">
          <Link to={profileLink} className="flex min-w-0 items-center no-underline">
            <div className="shrink-0 w-10 h-10 rounded-full p-[2px] mr-2.5" style={{ background: isLeaderPost ? "linear-gradient(135deg, #FFD000, #FF9F1A)" : "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
              <img src={avatarThumb(authorProfile.profile_picture) || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt="" className="w-full h-full rounded-full object-cover bg-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[13px] font-black" style={{ color: "#0B1B3D" }}><span className="truncate">{getDisplayName(authorProfile)}</span><CountryFlag country={authorProfile.country} size="xs" /></div>
              <div className="text-[10px]" style={{ color: "#6B7FA0" }}>{drop.created_date ? formatDistanceToNow(new Date(drop.created_date.endsWith('Z') ? drop.created_date : drop.created_date + 'Z'), { addSuffix: true }) : ''}</div>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            {canFollowAuthor && <button onClick={() => followMutation?.mutate(drop.user_email)} className="rounded-full px-3 py-2 text-[10px] font-black text-white" style={{ background: "#0B3FD9" }}>Follow</button>}
          </div>
        </div>
      )}
      <div className={drop.media_url ? "relative overflow-hidden" : "relative rounded-[1.45rem] overflow-hidden"} style={{ aspectRatio: drop.media_url ? "auto" : "4 / 5", background: drop.media_url ? "#071A33" : usesDesignedPoster ? "#050814" : "linear-gradient(135deg, #EEF5FF 0%, #DCE8FF 100%)" }}>
        <div
          role="button"
          tabIndex={0}
          onClick={handlePostSurfaceClick}
          onKeyDown={(e) => { if (e.key === "Enter") navigate(postLink); }}
          className={drop.media_url ? "relative block no-underline cursor-pointer touch-manipulation" : "absolute inset-0 block no-underline cursor-pointer touch-manipulation"}
        >
          {drop.media_url ? (
            <img
              src={drop.media_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="relative block w-full max-h-[520px] object-cover object-center"
            />
          ) : isKeepIt100 ? (
            <KeepIt100Poster text={drop.reflection} verse={drop.verse} className="absolute inset-0 w-full h-full" />
          ) : isCodeOfTruth ? (
            <CodesOfTruthPoster text={drop.reflection} verse={drop.verse} className="absolute inset-0 w-full h-full" />
          ) : (
            <div className="absolute inset-0 px-6 pt-20 pb-24 flex flex-col items-center justify-center text-center" style={{ background: "linear-gradient(135deg, #EEF5FF 0%, #DCE8FF 100%)" }}>
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

        {!drop.media_url && <Link to={profileLink} className="absolute top-3 left-3 z-20 flex items-center rounded-full pr-4 py-1 pl-1 no-underline" style={{ background: "rgba(255,255,255,0.96)", border: "1px solid #E6ECF5", boxShadow: "0 4px 14px rgba(11, 27, 61, 0.12)" }}>
          <div className="shrink-0 w-9 h-9 rounded-full p-[2px] mr-2" style={{ background: isLeaderPost ? "linear-gradient(135deg, #FFD000, #FF9F1A)" : "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
            <img src={avatarThumb(authorProfile.profile_picture) || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt="" loading="lazy" decoding="async" className="w-full h-full rounded-full object-cover bg-white" />
          </div>
          <div className="min-w-0 max-w-[150px]">
            <div className="flex items-center gap-1 text-[12px] font-black" style={{ color: "#0B1B3D" }}><span className="truncate">{getDisplayName(authorProfile)}</span><CountryFlag country={authorProfile.country} size="xs" /></div>
            <div className="text-[10px] truncate" style={{ color: "#4A5878" }}>{drop.created_date ? formatDistanceToNow(new Date(drop.created_date.endsWith('Z') ? drop.created_date : drop.created_date + 'Z'), { addSuffix: true }) : ''}</div>
          </div>
        </Link>}

        {!drop.media_url && canFollowAuthor && (
          <button
            onClick={() => followMutation?.mutate(drop.user_email)}
            disabled={followMutation?.isPending}
            className="absolute top-3 right-3 z-20 h-10 px-3 rounded-full flex items-center gap-1.5 text-[11px] font-black active:scale-95 transition disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.28)", color: "#FFFFFF" }}
            aria-label={`Follow ${getDisplayName(authorProfile)}`}
          >
            <UserPlus className="w-4 h-4" />
            Follow
          </button>
        )}

      </div>

      <div className="px-3 pt-3">{actionBar}</div>

      <PostMusicEditor drop={drop} isOpen={musicEditorOpen} onClose={() => setMusicEditorOpen(false)} />

      {drop.repost && (
        <div className="px-3 pt-3 text-[11px] font-semibold" style={{ color: "#6B7FA0" }}>
          <span style={{ color: "#0B3FD9" }}>↻ Reposted by {drop.repost.reposter_name || "a member"}</span> · Originally by {getDisplayName(authorProfile)}
        </div>
      )}

      <PostAudioTrack audioUrl={drop.audio_url} audioTitle={drop.audio_title} />

      {showComments && <MobileDropComments drop={drop} user={user} />}

      {(drop.verse || reflectionText || drop.category || drop.hashtags) && (
        <div className="px-4 py-4" style={{ background: "#F8FAFC" }}>
          {drop.verse && (
            <Link to={postLink} className="block text-[15px] font-black mb-1.5 no-underline" style={{ color: "#0B1B3D" }}>{drop.verse}</Link>
          )}
          {reflectionText && (
            <p className="text-[13px] leading-relaxed line-clamp-3" style={{ color: "#5A6B85" }}>
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