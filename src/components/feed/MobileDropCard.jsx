import React, { memo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, UserPlus, Repeat2 } from "lucide-react";
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
import StandardPostImage from "@/components/feed/StandardPostImage";
import MobileDropComments from "@/components/feed/MobileDropComments";
import useRequireAuth from "@/hooks/useRequireAuth";

/**
 * Mobile-only DropCard — LightMode brand (light canvas + gold).
 *
 * Card anatomy follows the "image-filled card" pattern Mobbin documents for
 * social feeds: large 4:5 thumbnail, author row above the media, one row of
 * actions, caption block below. No repeated CTA buttons inside the card
 * (Follow appears only when relevant). Behaviour and mutation signatures are
 * identical to the previous version.
 */

const C = {
  canvas: "#F6F8FC",
  surface: "#FFFFFF",
  surface2: "#EEF3FF",
  line: "#E2EAF5",
  text: "#0B1B3D",
  muted: "#6B7FA0",
  gold: "#FFD000",
  goldDeep: "#B88A00",
  blue: "#0B3FD9",
  goldGrad: "linear-gradient(135deg, #FFD000 0%, #FF9F1A 100%)",
  cyanGrad: "linear-gradient(135deg, #00CFFF 0%, #8A5CFF 100%)",
};

const DEFAULT_AVATAR = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

function timeAgo(createdDate) {
  if (!createdDate) return "";
  const iso = createdDate.endsWith("Z") ? createdDate : createdDate + "Z";
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

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
  const requireAuth = useRequireAuth(user);
  const navigate = useNavigate();
  const clickTimerRef = useRef(null);
  const userHasLiked = userLikes.some(like => like.drop_id === drop.id);

  const authorProfile = {
    ...(dropUser || {}),
    email: drop.user_email,
    username: drop.author_username || dropUser?.username || "",
    full_name: dropUser?.display_name || dropUser?.username || dropUser?.full_name || drop.author_name || drop.user_email?.split("@")[0] || "Glow Believer",
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
  const isFollowingAuthor = following.some(follow =>
    follow.following_id === dropUser?.id || follow.following_email === drop.user_email
  );
  // Leader accounts and the official account are followed implicitly by everyone — no button.
  const canFollowAuthor = !!user && user.email !== drop.user_email && drop.user_email !== "system@lightmode.com" && !isLeaderPost && !isFollowingAuthor;

  const savedForThisDrop = savedDropRecords.filter(s => s.drop_id === drop.id);
  const isSaved = savedForThisDrop.length > 0;

  const cleanReflection = (reflection) =>
    reflection?.replace(/^(\[Reposted from .+?\]\s*)+/i, "").trim() || "";

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await base44.entities.SavedDrop.delete(savedForThisDrop[0].id);
      } else {
        await base44.entities.SavedDrop.create({ drop_id: drop.id, user_email: user.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedDrops", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["feedViewerState"] });
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

  const handleSave = () => {
    if (!user) { requireAuth(); return; }
    toggleSaveMutation.mutate();
  };

  const handleLike = () => {
    if (likeMutation.isPending) return;
    likeMutation.mutate({
      id: drop.id,
      authorEmail: drop.user_email,
      authorName: getDisplayName(authorProfile),
      action: userHasLiked ? "unlike" : "like",
    });
  };

  const [likeBurst, setLikeBurst] = useState(false);
  const handlePostSurfaceClick = () => {
    if (clickTimerRef.current) {
      // double-tap → like (with a brief heart burst, Instagram-style)
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      if (!userHasLiked) {
        setLikeBurst(true);
        setTimeout(() => setLikeBurst(false), 650);
      }
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
  const postLink = createPageUrl("Feed") + `?post=${encodeURIComponent(drop.id)}`;

  const [showComments, setShowComments] = useState(false);
  const [mediaFit, setMediaFit] = useState("pending");
  const [musicEditorOpen, setMusicEditorOpen] = useState(false);
  const canEditMusic = user?.email === drop.user_email || isManagerOfLeader;

  const authorRow = (
    <div className="flex items-center justify-between gap-3 px-3.5 pt-3 pb-3">
      <Link to={profileLink} className="flex min-w-0 items-center no-underline">
        <div className="shrink-0 w-10 h-10 rounded-full p-[2px] mr-2.5" style={{ background: isLeaderPost ? C.goldGrad : C.cyanGrad }}>
          <img
            src={avatarThumb(authorProfile.profile_picture) || DEFAULT_AVATAR}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full rounded-full object-cover"
            style={{ background: C.surface2, border: `2px solid ${C.surface}` }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[13.5px] font-bold leading-tight" style={{ color: C.text }}>
            <span className="truncate">{getDisplayName(authorProfile)}</span>
            {isLeaderPost && (
              <span className="shrink-0 inline-flex items-center justify-center w-[15px] h-[15px] rounded-full" style={{ background: C.gold }} aria-label="Leader">
                <svg viewBox="0 0 12 12" width="9" height="9" aria-hidden="true"><path d="M2.5 6.4l2.2 2.1L9.6 3.6" fill="none" stroke="#0B0F1A" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            )}
            <CountryFlag country={authorProfile.country} size="xs" />
          </div>
          <div className="text-[11px] mt-0.5 truncate" style={{ color: C.muted }}>
            {authorProfile.username ? `@${authorProfile.username} · ` : ""}{timeAgo(drop.created_date)}
          </div>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-1.5">
        {canFollowAuthor && (
          <button
            type="button"
            onClick={() => followMutation?.mutate(drop.user_email)}
            disabled={followMutation?.isPending}
            className="h-8 px-3 rounded-full inline-flex items-center gap-1 text-[11px] font-black active:scale-95 transition disabled:opacity-60"
            style={{ background: "rgba(255,208,0,0.18)", color: C.goldDeep, border: "1px solid rgba(255,208,0,0.45)" }}
            aria-label={`Follow ${getDisplayName(authorProfile)}`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Follow
          </button>
        )}
      </div>
    </div>
  );

  const actionBar = (
    <FeedActionCapsule
      inline
      more={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="w-[44px] h-[44px] rounded-full flex items-center justify-center bg-[#08111F] border border-white/10 text-[#18C8FF]" aria-label="Post options">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {canEditMusic && <DropdownMenuItem onClick={() => setMusicEditorOpen(true)}>{drop.audio_url ? "Change Music" : "Add Music"}</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${postLink}`).then(() => toast.success("Link copied")); }}>Copy Link</DropdownMenuItem>
            {canDelete
              ? <DropdownMenuItem className="text-red-500" onClick={() => { if (window.confirm("Delete this post? This cannot be undone.")) deleteDropMutation.mutate(); }}>Delete Post</DropdownMenuItem>
              : <DropdownMenuItem onClick={() => { if (!user) { requireAuth(); return; } const reason = window.prompt("Why are you reporting this content?"); if (reason) base44.entities.ReportedDrop.create({ drop_id: drop.id, reporter_email: user.email, reason }).then(() => toast.success("Reported")); }}>Report Post</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      <FeedActionItem icon={<Heart className={`w-4 h-4 ${userHasLiked ? "fill-[#F4C84A]" : ""}`} />} label="Like" value={drop.likes_count || 0} active={userHasLiked} onClick={handleLike} />
      <FeedActionItem icon={<MessageCircle className="w-4 h-4" />} label="Comment" active={showComments} onClick={() => setShowComments(v => !v)} />
      <FeedActionItem icon={<Share2 className="w-4 h-4" />} label="Share" value={drop.shares_count || 0} onClick={(event) => { event.stopPropagation(); handleShare(drop); }} />
      <RepostButton drop={drop} user={user} capsule />
      <FeedActionItem icon={<Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />} label={isSaved ? "Saved" : "Save"} active={isSaved} onClick={handleSave} />
    </FeedActionCapsule>
  );

  const mediaBackground = drop.media_url ? "#071A33" : usesDesignedPoster ? "#050814" : "linear-gradient(160deg, #EEF5FF 0%, #DCE8FF 100%)";

  return (
    <article
      className="relative rounded-[22px] mb-4 overflow-hidden"
      style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: "0 10px 28px rgba(11,63,217,0.10)" }}
    >
      <style>{`
        @keyframes mdc-like-burst { 0% { transform: scale(0.4); opacity: 0 } 30% { transform: scale(1.15); opacity: 1 } 100% { transform: scale(1); opacity: 0 } }
      `}</style>

      {drop.repost && (
        <div className="flex items-center gap-1.5 px-4 pt-3 -mb-1 text-[11px] font-semibold" style={{ color: C.muted }}>
          <Repeat2 className="w-3.5 h-3.5" style={{ color: C.blue }} />
          <span className="truncate">Reposted by <span style={{ color: C.text }}>{drop.repost.reposter_name || "a member"}</span></span>
        </div>
      )}

      {authorRow}

      {/* MEDIA / POSTER */}
      <div
        className={drop.media_url ? `relative w-full overflow-hidden flex items-center justify-center ${mediaFit === "contain" ? "" : "aspect-[4/5]"}` : "relative w-full overflow-hidden aspect-[4/5]"}
        style={{ maxHeight: 720, background: mediaBackground }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={handlePostSurfaceClick}
          onKeyDown={(e) => { if (e.key === "Enter") navigate(postLink); }}
          className={`${drop.media_url && mediaFit === "contain" ? "relative" : "absolute inset-0"} block no-underline cursor-pointer touch-manipulation`}
        >
          {drop.media_url ? (
            <StandardPostImage
              src={drop.media_url}
              alt=""
              loading="lazy"
              decoding="async"
              onFitChange={setMediaFit}
            />
          ) : isKeepIt100 ? (
            <KeepIt100Poster text={drop.reflection} verse={drop.verse} className="absolute inset-0 w-full h-full" />
          ) : isCodeOfTruth ? (
            <CodesOfTruthPoster text={drop.reflection} verse={drop.verse} className="absolute inset-0 w-full h-full" />
          ) : (
            <div className="absolute inset-0 px-7 py-10 flex flex-col items-center justify-center text-center">
              <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,208,0,0.28), rgba(255,208,0,0) 70%)" }} />
              <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(31,184,255,0.22), rgba(31,184,255,0) 70%)" }} />
              <div className="relative">
                <div className="mx-auto mb-5 w-10 h-[3px] rounded-full" style={{ background: C.goldGrad }} />
                {drop.verse && (
                  <p className="text-[22px] font-black leading-[1.2] mb-4 line-clamp-7" style={{ color: C.blue, fontFamily: "Space Grotesk, Inter, sans-serif" }}>
                    {drop.verse}
                  </p>
                )}
                {reflectionText ? (
                  <p className="text-[15px] leading-relaxed line-clamp-6" style={{ color: "#344B73" }}>
                    “{reflectionText.length > 220 ? reflectionText.slice(0, 220) + "…" : reflectionText}”
                  </p>
                ) : !drop.verse ? (
                  <p className="text-[15px] italic" style={{ color: C.muted }}>Tap to view post</p>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {likeBurst && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <Heart className="w-24 h-24" style={{ color: C.gold, fill: C.gold, filter: "drop-shadow(0 8px 24px rgba(255,208,0,0.55))", animation: "mdc-like-burst 650ms cubic-bezier(0.22,1,0.36,1) forwards" }} />
          </div>
        )}

        <PostAudioTrack postId={drop.id} audioUrl={drop.audio_url} audioTitle={drop.audio_title} />
      </div>

      <div className="px-3 pt-3">{actionBar}</div>

      <PostMusicEditor drop={drop} isOpen={musicEditorOpen} onClose={() => setMusicEditorOpen(false)} />

      {showComments && <MobileDropComments drop={drop} user={user} />}

      {/* CAPTION */}
      {(drop.verse || reflectionText || drop.category || drop.hashtags) && (
        <div className="px-4 pt-3 pb-4">
          {drop.verse && (
            <Link to={postLink} className="block text-[15px] font-black leading-snug mb-1.5 no-underline" style={{ color: C.text, fontFamily: "Space Grotesk, Inter, sans-serif" }}>{drop.verse}</Link>
          )}
          {reflectionText && (
            <p className="text-[13.5px] leading-relaxed line-clamp-3" style={{ color: "#44536E" }}>
              {reflectionText}
            </p>
          )}
          {(drop.category || drop.hashtags) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              {drop.category && (
                <span className="inline-flex h-6 items-center px-2.5 rounded-full text-[10px] font-black uppercase tracking-wide" style={{ background: "rgba(255,208,0,0.18)", border: "1px solid rgba(255,208,0,0.45)", color: C.goldDeep }}>
                  {drop.category}
                </span>
              )}
              {drop.hashtags && (
                <span className="text-[12px] font-semibold leading-relaxed" style={{ color: C.blue }}>{drop.hashtags}</span>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default memo(MobileDropCard);
