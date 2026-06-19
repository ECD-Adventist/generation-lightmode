import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { isNotificationEnabled } from "@/lib/notifications";
import ReadMoreText from "@/components/feed/ReadMoreText";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { sanitizeRichHtml, containsHtml } from "@/lib/sanitizeHtml";
import ProfileHoverSummary from "@/components/feed/ProfileHoverSummary";
import { getDisplayName } from "@/lib/displayName";
import { useIsMobile } from "@/hooks/use-mobile";
import CountryFlag from "@/components/common/CountryFlag";
import KeepIt100Poster, { KEEP_IT_100_BACKGROUND_URL } from "@/components/keep-it-100/KeepIt100Poster";
import CodesOfTruthPoster from "@/components/codes-of-truth/CodesOfTruthPoster";

export default function DropCard({ drop, user, dropUser, likeMutation, handleShare, userLikes = [], allUsers = [], savedDropRecords = [], leaderAccounts = [], following = [], followMutation, commentsCount = 0 }) {
  const isMobile = useIsMobile();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [likeBurst, setLikeBurst] = useState(false);
  const [commentBounce, setCommentBounce] = useState(false);
  const [sharePulse, setSharePulse] = useState(false);
  const [saveBounce, setSaveBounce] = useState(false);
  const queryClient = useQueryClient();

  const userHasLiked = userLikes.some(like => like.drop_id === drop.id);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", drop.id],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: drop.id }),
    enabled: showComments
  });

  const isSuperCreator = (dropUser.drop_count || 0) >= 9;
  const users = allUsers;

  // Leader posts (created via "Post as leader") get a distinct premium treatment.
  const leaderForDrop = leaderAccounts.find(a => a.leader_email === drop.user_email);
  const isFollowingAuthor = following.some(f => f.following_email === drop.user_email);
  const canFollowAuthor = !!user && user.email !== drop.user_email && typeof followMutation?.mutate === "function";

  // Keep It 100 posts get a custom branded background image (cyan frame + golden splatter + logos baked in).
  const isKeepIt100 = !drop.media_url && (
    drop.category === "Keep It 100" ||
    (drop.hashtags && /keepit100/i.test(drop.hashtags))
  );
  const KEEP_IT_100_BG = KEEP_IT_100_BACKGROUND_URL;
  const isCodeOfTruth = !drop.media_url && drop.category === "Code of Truth";

  const getRepostOwner = (reflection) => {
    const matches = Array.from(reflection?.matchAll(/\[Reposted from (.+?)\]\s*/gi) || []);
    if (!matches.length) return null;
    const name = matches[matches.length - 1][1];
    if (name.toLowerCase() === "system") return "Generation LightMode";
    return name;
  };

  const cleanReflection = (reflection) => reflection?.replace(/^(\[Reposted from .+?\]\s*)+/i, "").trim() || "";
  const repostOwnerName = getRepostOwner(drop.reflection);
  const repostLeaderForDrop = repostOwnerName
    ? leaderAccounts.find(a => a.leader_name?.toLowerCase() === repostOwnerName.toLowerCase())
    : null;
  const displayLeaderForDrop = leaderForDrop || repostLeaderForDrop;
  const isLeaderPost = !!leaderForDrop;
  const isLeaderContent = !!displayLeaderForDrop;

  const savedForThisDrop = savedDropRecords.filter(s => s.drop_id === drop.id);
  const isSaved = savedForThisDrop.length > 0;
  const visibleComments = comments;

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
      queryClient.invalidateQueries({ queryKey: ["mySavedDrops"] });
      toast.success(isSaved ? "Removed from Saved" : "Saved to your bookmarks");
    }
  });

  const getCommentUser = (email) => {
    if (user?.email === email) return user;
    if (dropUser?.email === email) return dropUser;
    const found = users.find(u => u.email === email);
    if (found) return found;
    return { full_name: email?.split('@')[0] || "Glow Believer", email };
  };

  const commentMutation = useMutation({
    mutationFn: async (content) => {
      if (!user) { toast.error("Please log in to comment"); return; }
      if (!content.trim()) return;
      await base44.entities.GlowDropComment.create({
        drop_id: drop.id,
        user_email: user.email,
        content: content.trim()
      });
      
      const todayStr = new Date().toISOString().split('T')[0];
      const todayChallenges = await base44.entities.UserDailyChallenge.filter({ user_email: user.email, date_string: todayStr });
      if (!todayChallenges.some(c => c.challenge_id === 'comment')) {
        await base44.entities.UserDailyChallenge.create({ user_email: user.email, date_string: todayStr, challenge_id: 'comment' });
        await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + 5 });
      }

      if (dropUser?.id && drop.user_email && drop.user_email !== user.email && isNotificationEnabled(dropUser, "comments")) {
        base44.functions.invoke("createNotification", {
          user_id: dropUser.id,
          type: "reply",
          message: `${getDisplayName(user)} commented on your Glow Drop: "${content.trim().slice(0, 50)}${content.trim().length > 50 ? '...' : ''}"`,
          link: `/Post?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`
        }).catch(() => {});
      }
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ["comments", drop.id] });
      const previousComments = queryClient.getQueryData(["comments", drop.id]);
      
      const tempComment = {
        id: `temp-${Date.now()}`,
        drop_id: drop.id,
        user_email: user?.email,
        content: content.trim(),
        created_date: new Date().toISOString()
      };
      
      queryClient.setQueryData(["comments", drop.id], old => [...(old || []), tempComment]);
      setNewComment("");
      
      return { previousComments };
    },
    onError: (err, newComment, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(["comments", drop.id], context.previousComments);
      }
      toast.error("Failed to post comment. Try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", drop.id] });
    },
    onSuccess: () => {
      toast.success("Comment posted!");
    }
  });

  const submitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    commentMutation.mutate(newComment);
  };

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => { await base44.entities.GlowDropComment.delete(commentId); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", drop.id] });
      toast.success("Comment deleted");
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ id, content }) => { await base44.entities.GlowDropComment.update(id, { content }); },
    onSuccess: () => {
      setEditingCommentId(null);
      queryClient.invalidateQueries({ queryKey: ["comments", drop.id] });
      toast.success("Comment updated");
    }
  });

  const blockUserMutation = useMutation({
    mutationFn: async (blockedEmail) => {
      if (user?.email === blockedEmail) return toast.error("You cannot block yourself");
      await base44.entities.BlockedUser.create({ blocker_email: user.email, blocked_email: blockedEmail });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers", user?.email] });
      toast.success("User blocked");
    }
  });

  const reportCommentMutation = useMutation({
    mutationFn: async ({ commentId, reason }) => {
      await base44.entities.ReportedComment.create({ comment_id: commentId, reporter_email: user.email, reason });
    },
    onSuccess: () => { toast.success("Comment reported to moderators"); }
  });

  const deleteDropMutation = useMutation({
    mutationFn: async () => { await base44.entities.GlowDrop.delete(drop.id); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      toast.success("Post deleted");
    }
  });

  const repostMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GlowDrop.create({
        user_email: user.email,
        verse: drop.verse,
        reflection: `[Reposted from ${getDisplayName(dropUser)}]\n\n${drop.reflection || ""}`,
        media_url: drop.media_url,
        category: drop.category,
        hashtags: drop.hashtags,
        status: "approved"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      toast.success("Successfully reposted!");
    }
  });

  const handleLike = (e) => {
    e.stopPropagation();
    setLikeBurst(true);
    setTimeout(() => setLikeBurst(false), 600);
    likeMutation.mutate({ id: drop.id, authorEmail: drop.user_email, authorName: getDisplayName(dropUser) });
  };

  const handleCommentToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCommentBounce(true);
    setTimeout(() => setCommentBounce(false), 400);
    setShowComments(prev => !prev);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    setSharePulse(true);
    setTimeout(() => setSharePulse(false), 500);
    handleShare(drop);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    setSaveBounce(true);
    setTimeout(() => setSaveBounce(false), 400);
    toggleSaveMutation.mutate();
  };

  return (
    <div
      className="rounded-[1.75rem] sm:rounded-[2.25rem] mb-6 sm:mb-8 p-2 sm:p-3 transition-all duration-300 group hover:-translate-y-0.5 relative"
      style={isLeaderPost ? {
        background: "linear-gradient(135deg, #FFFFFF 0%, #F4F8FF 50%, #FFFCF0 100%)",
        border: "1px solid #FFE4A0",
        boxShadow: "0 1px 2px rgba(212, 184, 46, 0.06), 0 8px 24px rgba(11, 63, 217, 0.10), 0 16px 48px rgba(255, 208, 0, 0.10)"
      } : {
        background: "#FFFFFF",
        border: "1px solid #E0EAF5",
        boxShadow: "0 1px 2px rgba(11, 63, 217, 0.04), 0 8px 24px rgba(11, 63, 217, 0.08), 0 16px 48px rgba(11, 63, 217, 0.04)"
      }}
    >
      {isLeaderPost && (
        <div className="absolute -top-3 left-5 sm:left-6 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg"
          style={{ background: "linear-gradient(135deg, #0080FE 0%, #0040A0 40%, #1A6B3F 70%, #D4B82E 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35), 0 0 20px rgba(212, 184, 46, 0.4)" }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          {displayLeaderForDrop?.leader_title || (repostLeaderForDrop ? "Reposted Leader" : "Official Leader")}
        </div>
      )}
      <style>{`
        @keyframes dc-heart-burst {
          0% { transform: scale(1); }
          30% { transform: scale(1.35); }
          60% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        @keyframes dc-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes dc-pulse-ring {
          0% { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes dc-float-up {
          0% { transform: translate(-50%, 0) scale(0.6); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translate(-50%, -60px) scale(1.1); opacity: 0; }
        }
        .dc-anim-like { animation: dc-heart-burst 0.55s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .dc-anim-bounce { animation: dc-bounce 0.4s ease-out; }
        .dc-anim-pulse::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 2px solid #1FB8FF;
          animation: dc-pulse-ring 0.5s ease-out;
          pointer-events: none;
        }
        @keyframes dc-leader-spin {
          0%   { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes dc-leader-pulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(0,128,254,0.35), 0 2px 10px rgba(212,184,46,0.35); }
          50%      { box-shadow: 0 0 0 1px rgba(0,128,254,0.6), 0 4px 16px rgba(212,184,46,0.55); }
        }
        .dc-leader-avatar {
          position: relative;
          padding: 2px;
          border-radius: 9999px;
          overflow: hidden;
          background: #060912;
          animation: dc-leader-pulse 3s ease-in-out infinite;
          will-change: box-shadow;
        }
        .dc-leader-avatar::before {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          width: 300%; height: 300%;
          background: conic-gradient(from 0deg, transparent 55%, #4DA8FF 70%, #0080FE 82%, #FFD000 93%, transparent 100%);
          animation: dc-leader-spin 3s linear infinite;
          z-index: 0;
          pointer-events: none;
        }
        .dc-leader-avatar > * {
          position: relative;
          z-index: 1;
        }
      `}</style>

      <div
        className={`relative w-full rounded-xl sm:rounded-[1.5rem] overflow-hidden shadow-inner ${
          drop.media_url
            ? 'aspect-[4/5] sm:aspect-[3/4]'
            : isKeepIt100 || isCodeOfTruth
              ? 'aspect-[4/5] flex flex-col justify-center items-center text-center'
              : 'min-h-[360px] sm:min-h-[480px] lg:min-h-[520px] flex flex-col justify-center items-center text-center'
        }`}
        style={
          isKeepIt100
            ? { backgroundImage: `url(${KEEP_IT_100_BG})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#0B1733" }
            : isCodeOfTruth
              ? { background: "#000000" }
              : isLeaderContent && !drop.media_url
                ? { background: "linear-gradient(160deg, #070B18 0%, #0B1B3D 40%, #0B2870 80%, #0B1B3D 100%)" }
                : { background: drop.media_url ? "linear-gradient(135deg, #F0FAF3 0%, #E8F5C8 60%, #C8F2D4 100%)" : "linear-gradient(160deg, #F8FAFF 0%, #EEF3FF 30%, #E2EBFF 70%, #D8E4FF 100%)" }
        }
        onDoubleClick={() => {
          setLikeBurst(true);
          setTimeout(() => setLikeBurst(false), 600);
          likeMutation.mutate({ id: drop.id, authorEmail: drop.user_email, authorName: getDisplayName(dropUser) });
        }}
      >
        {drop.media_url && (
          <>
            <div className="absolute top-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-56 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none z-0" />
          </>
        )}

        {/* Leader text-only background image */}
        {isLeaderContent && !drop.media_url && !isKeepIt100 && !isCodeOfTruth && (
          <>
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/6a1c1025d_Gemini_Generated_Image_s3fvlrs3fvlrs3fv.png?v=2" alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover z-0" style={{ filter: "grayscale(100%) contrast(1.08) brightness(0.4)" }} />
            <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(180deg, rgba(8,12,28,0.45) 0%, rgba(8,12,28,0.20) 40%, rgba(8,12,28,0.92) 100%)" }} />
            <div className="absolute inset-0 z-0" style={{ background: "radial-gradient(ellipse at center, transparent 25%, rgba(8,12,28,0.65) 100%)" }} />
            <div className="absolute -top-10 -left-10 w-60 h-60 rounded-full blur-[80px] opacity-40 z-0 pointer-events-none" style={{ background: "rgba(0,128,254,0.6)" }} />
            <div className="absolute -bottom-12 -right-10 w-72 h-72 rounded-full blur-[80px] opacity-30 z-0 pointer-events-none" style={{ background: "rgba(212,184,46,0.6)" }} />
          </>
        )}

        {isLeaderPost && canFollowAuthor && !isFollowingAuthor && (
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-30" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => followMutation.mutate(drop.user_email)}
              className="rounded-full px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-black leading-none uppercase tracking-wider transition active:scale-95 backdrop-blur-md"
              style={{ background: "linear-gradient(90deg, #0080FE, #0040A0)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(0,128,254,0.4)", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              + Follow
            </button>
          </div>
        )}

        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20" onClick={(e) => e.stopPropagation()}>
          {(() => {
            const authorChip = (
              <Link
                to={drop.user_email === "system@lightmode.com" ? createPageUrl("GenerationLightMode") : createPageUrl("Profile") + `?user=${encodeURIComponent(dropUser.email)}`}
                className="inline-flex items-center gap-2 backdrop-blur-md rounded-full pr-2.5 sm:pr-3.5 pl-1 py-1 cursor-pointer transition no-underline max-w-[calc(100vw-1.5rem)] sm:max-w-none"
                style={{
                  background: (drop.media_url || isLeaderContent) ? "rgba(0,0,0,0.4)" : "#FFFFFF",
                  border: (drop.media_url || isLeaderContent) ? "none" : "1px solid #E2E8F0",
                  boxShadow: (drop.media_url || isLeaderContent) ? "none" : "0 2px 8px rgba(0,0,0,0.05)"
                }}
              >
                {leaderForDrop ? (
                  <div className="dc-leader-avatar w-7 h-7 sm:w-9 sm:h-9 shrink-0">
                    <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF" }}>
                      <img
                        src={dropUser?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                        alt=""
                        width="36"
                        height="36"
                        loading="eager"
                        decoding="async"
                        fetchpriority="high"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full p-[2px] shrink-0" style={{ background: drop.user_email === "system@lightmode.com" ? "linear-gradient(135deg, #FFD000 0%, #1FB8FF 50%, #0B3FD9 100%)" : "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)" }}>
                    <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-xs uppercase overflow-hidden" style={{ background: "#FFFFFF" }}>
                      <img
                        src={drop.user_email === "system@lightmode.com" ? "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg" : (dropUser?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png")}
                        alt=""
                        width="32"
                        height="32"
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-start justify-center min-w-0">
                  <span className={`font-bold font-['Inter'] text-[11px] sm:text-xs flex items-center gap-1 leading-none mb-0.5 ${(drop.media_url || isLeaderContent) ? "text-white" : ""}`} style={(drop.media_url || isLeaderContent) ? {} : { color: "#0B1B3D" }}>
                    <span className="whitespace-normal break-words max-w-[190px] sm:max-w-none sm:whitespace-nowrap leading-tight">
                      {drop.user_email === "system@lightmode.com" ? "Generation LightMode" : getDisplayName(dropUser)}
                    </span>
                    {drop.user_email !== "system@lightmode.com" && dropUser?.country && (
                      <CountryFlag country={dropUser.country} size="xs" />
                    )}
                    {leaderForDrop ? (
                      <span className="flex items-center justify-center w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shrink-0 shadow-[0_0_6px_rgba(0,128,254,0.45)]" style={{ background: "linear-gradient(135deg, #0080FE 0%, #0040A0 50%, #D4B82E 100%)", color: "#FFFFFF" }} title="Verified Leader">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-1.5 h-1.5 sm:w-2 sm:h-2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                    ) : drop.user_email === "system@lightmode.com" ? (
                       <span className="flex items-center justify-center w-3 h-3 rounded-full shrink-0" style={{ background: "#1FB8FF", color: "#FFFFFF" }}>
                         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                       </span>
                    ) : isSuperCreator && (
                      <span className="flex items-center justify-center w-3.5 h-3.5 rounded-sm rotate-45 shadow-[0_0_10px_rgba(31,184,255,0.6)] shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF, #FFD60A)" }}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 -rotate-45" style={{ color: "#0B1B3D" }}>
                          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
                        </svg>
                      </span>
                    )}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] font-medium leading-none whitespace-nowrap ${(drop.media_url || isLeaderContent) ? "text-white/80" : ""}`} style={(drop.media_url || isLeaderContent) ? {} : { color: "#6B7FA0" }}>{drop.created_date ? formatDistanceToNow(new Date(drop.created_date.endsWith('Z') ? drop.created_date : drop.created_date + 'Z'), { addSuffix: true }) : ''}</span>
                </div>
              </Link>
            );

            // Mobile / system account: no hover card (hover-on-tap on touch devices reveals an
            // unwanted floating profile summary). Desktop non-system accounts get the hover preview.
            if (isMobile || drop.user_email === "system@lightmode.com") {
              return authorChip;
            }

            return (
              <HoverCard>
                <HoverCardTrigger asChild>{authorChip}</HoverCardTrigger>
                <HoverCardContent
                  align="start"
                  sideOffset={8}
                  className="p-0 rounded-2xl overflow-hidden w-80 border-border shadow-xl z-[100] bg-card"
                  style={{ maxWidth: "90vw" }}
                >
                  <ProfileHoverSummary dropUser={dropUser} />
                </HoverCardContent>
              </HoverCard>
            );
          })()}
        </div>

        {drop.media_url && (
          <img src={drop.media_url} alt={drop.verse || "Glow Drop"} className="w-full h-full object-cover" loading="lazy" />
        )}

        {!drop.media_url && (
          <>

            
            {isCodeOfTruth && (
              <CodesOfTruthPoster text={drop.reflection} verse={drop.verse} className="absolute inset-0 w-full h-full" />
            )}
            <div className={isKeepIt100 ? "absolute z-10 top-[15.5%] bottom-[35%] left-[13%] right-[16%] flex items-center justify-center text-center overflow-hidden" : isCodeOfTruth ? "hidden" : `p-4 sm:p-8 pr-14 sm:pr-20 relative z-10 w-full h-full flex flex-col items-center justify-center ${isLeaderContent ? "py-10 sm:py-14" : ""}`}>
              {isKeepIt100 ? (
                <div className="w-full max-w-[76%] sm:max-w-[64%] flex flex-col items-center justify-center text-center">
                  {cleanReflection(drop.reflection) && (() => {
                    const cleaned = cleanReflection(drop.reflection);
                    const plain = containsHtml(cleaned)
                      ? cleaned.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
                      : cleaned;
                    if (!plain) return null;
                    const stripped = plain
                      .replace(/^\s*📌\s*/, "")
                      .replace(/^\s*keep\s*it\s*100\s*[:\-–]?\s*/i, "")
                      .replace(/^["“'']+|["”'']+$/g, "")
                      .trim();
                    return (
                      <p
                        className="font-['Space_Grotesk'] font-semibold leading-[1.18] line-clamp-4"
                        style={{
                          color: "#FFFFFF",
                          fontSize: "clamp(18px, 2.8vw, 30px)",
                          letterSpacing: "-0.035em",
                          textShadow: "0 4px 20px rgba(0,0,0,0.72), 0 0 18px rgba(0,207,255,0.22)",
                        }}
                      >
                        {stripped}
                      </p>
                    );
                  })()}

                  {drop.verse && (
                    <div className="mt-5 sm:mt-7 flex items-center justify-center gap-3">
                      <div className="h-px w-8 sm:w-14" style={{ background: "linear-gradient(90deg, transparent, rgba(255,208,0,0.85))" }} />
                      <span
                        className="font-['Space_Grotesk'] font-black uppercase whitespace-nowrap"
                        style={{
                          color: "#FFD000",
                          fontSize: "clamp(10px, 1.08vw, 13px)",
                          letterSpacing: "0.26em",
                          textShadow: "0 0 12px rgba(255,208,0,0.5), 0 2px 10px rgba(0,0,0,0.7)",
                        }}
                      >
                        {drop.verse}
                      </span>
                      <div className="h-px w-8 sm:w-14" style={{ background: "linear-gradient(90deg, rgba(255,208,0,0.85), transparent)" }} />
                    </div>
                  )}
                </div>
              ) : isLeaderContent ? (
                <div className="w-full max-w-2xl flex flex-col items-center text-center">
                  {/* Decorative open quote */}
                  <div
                    aria-hidden="true"
                    className="font-serif leading-none select-none mb-2 sm:mb-4"
                    style={{
                      fontSize: "clamp(64px, 9vw, 110px)",
                      background: "linear-gradient(135deg, #FFD000 0%, #D4B82E 60%, #4DA8FF 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      textShadow: "0 4px 30px rgba(212,184,46,0.25)",
                    }}
                  >
                    “
                  </div>

                  {drop.verse && (() => {
                    const cleaned = cleanReflection(drop.reflection || "");
                    const plain = containsHtml(cleaned)
                      ? cleaned.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
                      : cleaned;
                    const hasReflection = plain.length > 0;
                    return (
                      <h2
                        className={`font-['Space_Grotesk'] font-semibold leading-[1.35] tracking-[-0.005em] ${hasReflection ? "mb-5 sm:mb-7" : "mb-3"}`}
                        style={{
                          color: "#FFFFFF",
                          fontSize: "clamp(17px, 2.1vw, 26px)",
                          textShadow: "0 2px 16px rgba(0,0,0,0.55)",
                          maxWidth: "44ch",
                        }}
                      >
                        {drop.verse}
                      </h2>
                    );
                  })()}

                  {drop.reflection && (() => {
                    const cleaned = cleanReflection(drop.reflection);
                    const plain = containsHtml(cleaned)
                      ? cleaned.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
                      : cleaned;
                    if (!plain) return null;
                    return (
                      <p
                        className="font-['Inter'] leading-relaxed italic"
                        style={{
                          color: "rgba(232,238,255,0.88)",
                          fontSize: "clamp(13px, 1.2vw, 15px)",
                          textShadow: "0 1px 10px rgba(0,0,0,0.5)",
                          maxWidth: "52ch",
                        }}
                      >
                        {plain}
                      </p>
                    );
                  })()}

                  {/* Gold divider + attribution */}
                  <div className="mt-7 sm:mt-9 flex items-center gap-3 w-full justify-center">
                    <div className="h-px flex-1 max-w-[70px]" style={{ background: "linear-gradient(90deg, transparent, rgba(212,184,46,0.8))" }} />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-['Space_Grotesk'] text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#FFD000", textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>
                        — {repostLeaderForDrop ? repostOwnerName : getDisplayName(dropUser)}
                      </span>
                      {isLeaderPost && leaderForDrop?.leader_title && (
                        <span className="font-['Inter'] text-[9px] sm:text-[10px] tracking-[0.18em] uppercase" style={{ color: "rgba(220,228,245,0.7)" }}>
                          {leaderForDrop.leader_title}
                        </span>
                      )}
                    </div>
                    <div className="h-px flex-1 max-w-[70px]" style={{ background: "linear-gradient(90deg, rgba(212,184,46,0.8), transparent)" }} />
                  </div>
                </div>
              ) : (
                <>
                  {drop.verse && (
                    <h2 className="font-bold mb-3 sm:mb-6 leading-tight text-lg sm:text-3xl lg:text-4xl font-['Space_Grotesk'] line-clamp-4 text-blue-600 dark:text-blue-400">
                      {drop.verse}
                    </h2>
                  )}
                  {cleanReflection(drop.reflection) && (() => {
                    const cleaned = cleanReflection(drop.reflection);
                    const plain = containsHtml(cleaned)
                      ? cleaned.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
                      : cleaned;
                    if (!plain) return null;
                    return (
                      <p className="text-sm sm:text-lg lg:text-xl font-['Inter'] leading-relaxed max-w-md italic line-clamp-4 sm:line-clamp-none" style={{ color: "#3A4A6B" }}>
                        "{plain.length > 140 ? plain.slice(0, 140) + '…' : plain}"
                      </p>
                    );
                  })()}
                  <div className="mt-6 w-16 h-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
                </>
              )}
            </div>
          </>
        )}

        {likeBurst && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
            <Heart className="w-20 h-20 sm:w-28 sm:h-28 fill-red-500 text-red-500 drop-shadow-2xl" style={{ animation: "dc-float-up 0.6s ease-out forwards" }} />
          </div>
        )}

        {(() => {
          // Leader text posts share the dark glass treatment with media posts.
          const useGlass = drop.media_url || isLeaderContent || isKeepIt100 || isCodeOfTruth;
          return (
        <div className="absolute right-2 sm:right-3 bottom-4 sm:bottom-6 z-20 flex flex-col items-center gap-3 sm:gap-5">
          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <button
              onClick={handleLike}
              className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all focus:outline-none ${likeBurst ? 'dc-anim-pulse' : ''} ${useGlass ? "bg-[#06112b]/85 backdrop-blur-md border border-cyan-300/40 shadow-[0_0_16px_rgba(0,207,255,0.24)]" : "bg-white border border-[#E2E8F0] shadow-sm"}`}
              title={userHasLiked ? "Unlike this drop" : "Like this drop"}
            >
              <Heart className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${likeBurst ? 'dc-anim-like' : ''} ${userHasLiked ? "text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : useGlass ? "text-white hover:scale-110" : "text-blue-600 dark:text-blue-400 hover:scale-110"}`} />
            </button>
            <span className={`text-[11px] sm:text-xs font-bold ${useGlass ? "text-white drop-shadow-md" : "text-[#3A4A6B]"}`}>{drop.likes_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <button
              onClick={handleCommentToggle}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all focus:outline-none ${useGlass ? "bg-[#06112b]/85 backdrop-blur-md border border-cyan-300/40 shadow-[0_0_16px_rgba(0,207,255,0.24)]" : "bg-white border border-[#E2E8F0] shadow-sm"}`}
            >
              <MessageCircle className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform hover:scale-110 ${commentBounce ? 'dc-anim-bounce' : ''} ${showComments ? "text-cyan-500" : useGlass ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
            </button>
            <span className={`text-[11px] sm:text-xs font-bold ${useGlass ? "text-white drop-shadow-md" : "text-[#3A4A6B]"}`}>{showComments ? comments.length : commentsCount}</span>
          </div>

          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <button
              onClick={handleShareClick}
              className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all focus:outline-none ${sharePulse ? 'dc-anim-pulse' : ''} ${useGlass ? "bg-[#06112b]/85 backdrop-blur-md border border-cyan-300/40 shadow-[0_0_16px_rgba(0,207,255,0.24)]" : "bg-white border border-[#E2E8F0] shadow-sm"}`}
            >
              <Share2 className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform hover:scale-110 ${sharePulse ? 'dc-anim-bounce' : ''} ${useGlass ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
            </button>
            <span className={`text-[11px] sm:text-xs font-bold ${useGlass ? "text-white drop-shadow-md" : "text-[#3A4A6B]"}`}>{drop.shares_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <button
              onClick={handleSaveClick}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all focus:outline-none ${useGlass ? "bg-[#06112b]/85 backdrop-blur-md border border-cyan-300/40 shadow-[0_0_16px_rgba(0,207,255,0.24)]" : "bg-white border border-[#E2E8F0] shadow-sm"}`}
            >
              <Bookmark className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform hover:scale-110 ${saveBounce ? 'dc-anim-bounce' : ''} ${isSaved ? "fill-amber-400 text-amber-400" : useGlass ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-1 sm:gap-1.5 mt-1 sm:mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all focus:outline-none border ${useGlass ? "bg-[#06112b]/85 border-cyan-300/40 backdrop-blur-md shadow-[0_0_16px_rgba(0,207,255,0.24)]" : "bg-white border-[#E2E8F0] shadow-sm"}`}
                >
                  <MoreHorizontal className={`w-4 h-4 ${useGlass ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border border-border text-foreground w-40 z-50">
                {(() => {
                  // Managers of the leader account whose email matches the drop owner can also delete.
                  const leaderForDrop = leaderAccounts.find(a => a.leader_email === drop.user_email);
                  const isManagerOfLeader = !!leaderForDrop && Array.isArray(leaderForDrop.manager_emails) && leaderForDrop.manager_emails.includes(user?.email);
                  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
                  const canDelete = user?.email === drop.user_email || isManagerOfLeader || isAdmin;
                  return canDelete ? (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this post? This cannot be undone.")) deleteDropMutation.mutate(); }} className="text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600">
                      Delete Post
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      if(!user) return toast.error("Please login to report");
                      const reason = window.prompt("Why are you reporting this content?");
                      if(reason) {
                        base44.entities.ReportedDrop.create({ drop_id: drop.id, reporter_email: user.email, reason })
                          .then(() => toast.success("Content reported to moderators."));
                      }
                    }} className="hover:bg-muted cursor-pointer focus:bg-muted">
                      Report Post
                    </DropdownMenuItem>
                  );
                })()}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); repostMutation.mutate(); }} className="hover:bg-muted cursor-pointer focus:bg-muted">
                  Repost
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {drop.reposts_count > 0 && <span className="text-white text-[11px] sm:text-xs font-bold drop-shadow-md">{drop.reposts_count}</span>}
          </div>
        </div>
          );
        })()}
      </div>

      {/* Verse & Reflection */}
      {(drop.verse || drop.reflection) && (
        <div className="px-3 sm:px-4 pt-3 pb-1">
          {getRepostOwner(drop.reflection) && (
            <p className="text-xs mb-2" style={{ color: "#6B7FA0" }}>
              Reposted from <Link to={getRepostOwner(drop.reflection) === "Generation LightMode" ? createPageUrl("GenerationLightMode") : createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`} className="font-semibold hover:underline" style={{ color: "#0B3FD9" }}>{getRepostOwner(drop.reflection)}</Link>
            </p>
          )}
          {drop.verse && (
            <div className="font-bold text-sm mb-1 break-words" style={{ color: "#0B3FD9" }}>
              {drop.verse}
            </div>
          )}
          {cleanReflection(drop.reflection) && (
            containsHtml(cleanReflection(drop.reflection)) ? (
              <div
                className="text-sm leading-relaxed prose prose-sm max-w-none break-words prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-foreground prose-headings:text-foreground [&_iframe]:w-full [&_iframe]:rounded-lg [&_iframe]:aspect-video [&_img]:rounded-lg [&_img]:max-w-full [&_p]:break-words [&_a]:break-all text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(cleanReflection(drop.reflection)) }}
              />
            ) : (
              <ReadMoreText
                text={cleanReflection(drop.reflection)}
                lines={3}
                className="text-sm leading-relaxed break-words text-muted-foreground"
                toggleColor="#3b82f6"
              />
            )
          )}
        </div>
      )}

      {/* Tags Row */}
      {(drop.hashtags || drop.category) && (
        <div className="px-2 sm:px-3 pt-2 sm:pt-3 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            {drop.category && (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ background: "linear-gradient(90deg, rgba(31,184,255,0.15), rgba(127,224,138,0.15))", color: "#0B3FD9", border: "1px solid #B8E5FF" }}>
                {drop.category}
              </span>
            )}
            {drop.hashtags && (
              <div className="text-[12px] sm:text-[13px] font-medium opacity-90 break-words w-full" style={{ color: "#0B3FD9" }}>
                {drop.hashtags.split(' ').map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Repost counter only — primary engagement metrics are shown on the image action column to avoid duplication. */}
      {drop.reposts_count > 0 && (
        <div className="px-3 sm:px-4 pt-3 pb-1 flex items-center gap-1.5 text-xs text-amber-500">
          <span>⚡</span>
          <span className="font-semibold">{drop.reposts_count}</span>
          <span>Reposts</span>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 px-3 py-4 rounded-2xl space-y-4" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
            {visibleComments.map(c => (
              <div key={c.id} className="flex gap-3 text-sm group/comment">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 shadow-sm" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                  <img src={getCommentUser(c.user_email)?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none flex-1 shadow-sm relative" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>
                  <div className="flex justify-between items-start gap-2">
                    <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(c.user_email)}`} className="font-bold text-xs block mb-1 no-underline hover:underline" style={{ color: "#0B3FD9" }}>{getDisplayName(getCommentUser(c.user_email))}</Link>

                    {user && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover/comment:opacity-100 transition-opacity" style={{ color: "#8A97B5" }}>
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>
                          {c.user_email === user.email && (
                            <DropdownMenuItem onClick={() => { setEditingCommentId(c.id); setEditContent(c.content); }} className="cursor-pointer" style={{ color: "#0B1B3D" }}>
                              Edit
                            </DropdownMenuItem>
                          )}
                          {(c.user_email === user.email || drop.user_email === user.email) && (
                            <DropdownMenuItem onClick={() => deleteCommentMutation.mutate(c.id)} className="cursor-pointer" style={{ color: "#DC2626" }}>
                              Delete
                            </DropdownMenuItem>
                          )}
                          {c.user_email !== user.email && (
                            <>
                              <DropdownMenuItem onClick={() => blockUserMutation.mutate(c.user_email)} className="cursor-pointer" style={{ color: "#0B1B3D" }}>
                                Block User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const reason = window.prompt("Why are you reporting this comment?");
                                if (reason) reportCommentMutation.mutate({ commentId: c.id, reason });
                              }} className="cursor-pointer" style={{ color: "#0B1B3D" }}>
                                Report
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {editingCommentId === c.id ? (
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="h-8 text-xs"
                        style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
                      />
                      <Button size="sm" className="h-8 font-bold text-white" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)" }} onClick={() => updateCommentMutation.mutate({ id: c.id, content: editContent })}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-8" style={{ color: "#6B7FA0" }} onClick={() => setEditingCommentId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <ReadMoreText
                      text={c.content}
                      lines={4}
                      className="leading-snug"
                      style={{ color: "#0B1B3D" }}
                      toggleColor="#0B3FD9"
                    />
                  )}
                </div>
              </div>
            ))}
            {visibleComments.length === 0 && <div className="text-xs italic text-center py-6" style={{ color: "#8A97B5" }}>No comments yet. Ignite the conversation! 🔥</div>}
          </div>
          <form onSubmit={submitComment} className="flex gap-2 relative mt-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="h-12 pl-4 pr-20 rounded-full text-sm focus-visible:ring-2"
              style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}
            />
            <Button
              type="submit"
              disabled={!newComment.trim() || commentMutation.isPending}
              size="sm"
              className="absolute right-1 top-1 bottom-1 h-10 rounded-full font-bold hover:opacity-90 px-4 transition-all text-white"
              style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)" }}
            >
              Post
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}