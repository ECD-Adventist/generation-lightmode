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

export default function DropCard({ drop, user, dropUser, likeMutation, handleShare, userLikes = [], allUsers = [], savedDropRecords = [] }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  // Animation triggers
  const [likeBurst, setLikeBurst] = useState(false);
  const [commentBounce, setCommentBounce] = useState(false);
  const [sharePulse, setSharePulse] = useState(false);
  const [saveBounce, setSaveBounce] = useState(false);
  const queryClient = useQueryClient();

  const userHasLiked = userLikes.some(like => like.drop_id === drop.id);

  // Only fetch comments when the comment section is opened
  const { data: comments = [] } = useQuery({
    queryKey: ["comments", drop.id],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: drop.id }),
    enabled: showComments
  });

  const isSuperCreator = (dropUser.drop_count || 0) >= 9;
  const users = allUsers;

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
      if (drop.user_email && drop.user_email !== user.email && isNotificationEnabled(dropUser, "comments")) {
        base44.entities.Notification.create({
          user_email: drop.user_email,
          type: "reply",
          message: `${user.full_name || 'Someone'} commented on your Glow Drop: "${content.trim().slice(0, 50)}${content.trim().length > 50 ? '...' : ''}"`,
          link: `/Post?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", drop.id] });
      toast.success("Comment posted!");
    },
    onError: () => {
      toast.error("Failed to post comment. Try again.");
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
        reflection: `[Reposted from ${dropUser.full_name}]\n\n${drop.reflection || ""}`,
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

  // Action handlers with animations
  const handleLike = (e) => {
    e.stopPropagation();
    setLikeBurst(true);
    setTimeout(() => setLikeBurst(false), 600);
    likeMutation.mutate({ id: drop.id, authorEmail: drop.user_email, authorName: dropUser.full_name });
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
      className="rounded-2xl sm:rounded-[2rem] mb-6 sm:mb-8 p-2 sm:p-3 transition-all duration-300 group"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E0EAF5",
        boxShadow: "0 4px 20px rgba(11, 63, 217, 0.06)"
      }}
    >
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
      `}</style>

      {/* Media / Content Area — RESPONSIVE */}
      <div
        className={`relative w-full rounded-xl sm:rounded-[1.5rem] overflow-hidden shadow-inner ${
          drop.media_url
            ? 'aspect-[4/5] sm:aspect-[3/4]'
            : 'min-h-[360px] sm:min-h-[480px] lg:min-h-[520px] flex flex-col justify-center items-center text-center'
        }`}
        style={{ background: drop.media_url ? "linear-gradient(135deg, #F0FAF3 0%, #E8F5C8 60%, #C8F2D4 100%)" : "linear-gradient(135deg, #0B1B3D 0%, #1E2D50 60%, #0D2247 100%)" }}
        onDoubleClick={() => {
          setLikeBurst(true);
          setTimeout(() => setLikeBurst(false), 600);
          likeMutation.mutate({ id: drop.id, authorEmail: drop.user_email, authorName: dropUser.full_name });
        }}
      >
        {/* Gradient Overlays for readability (only when media present) */}
        {drop.media_url && (
          <>
            <div className="absolute top-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-0" />
            <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-56 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none z-0" />
          </>
        )}

        {/* User Pill (Top Left) */}
        {drop.user_email === "system@lightmode.com" ? (
          <div
            className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex items-center gap-2 backdrop-blur-md rounded-full pr-3 sm:pr-4 pl-1 py-1"
            style={{
              background: drop.media_url ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.75)",
              border: `1px solid ${drop.media_url ? "rgba(255, 208, 0, 0.4)" : "#FFD60A"}`
            }}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 overflow-hidden" style={{ background: "#FFFFFF" }}>
              <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-start justify-center">
              <span className="font-bold font-['Inter'] text-[11px] sm:text-xs leading-none mb-0.5" style={{ color: drop.media_url ? "#FFD60A" : "#0B3FD9" }}>Generation LightMode</span>
              <span className="text-[9px] sm:text-[10px] font-medium leading-none" style={{ color: drop.media_url ? "#E0EAF5" : "#4A5878" }}>{drop.created_date ? formatDistanceToNow(new Date(drop.created_date.endsWith('Z') ? drop.created_date : drop.created_date + 'Z'), { addSuffix: true }) : ''}</span>
            </div>
          </div>
        ) : (
          <Link
            to={createPageUrl("Profile") + `?user=${encodeURIComponent(dropUser.email)}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex items-center gap-2 backdrop-blur-md rounded-full pr-3 sm:pr-4 pl-1 py-1 cursor-pointer transition no-underline"
            style={{
              background: drop.media_url ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.12)",
              border: `1px solid ${drop.media_url ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.2)"}`
            }}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full p-[2px] shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)" }}>
              <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-xs uppercase overflow-hidden" style={{ background: "#FFFFFF" }}>
                <img src={dropUser?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex flex-col items-start justify-center min-w-0">
              <span className="font-bold font-['Inter'] text-[11px] sm:text-xs flex items-center gap-1 leading-none mb-0.5 truncate max-w-[140px] sm:max-w-none" style={{ color: "#FFFFFF" }}>
                {dropUser.full_name || dropUser.email?.split('@')[0] || "Glow Believer"}
                {isSuperCreator && (
                  <span className="flex items-center justify-center w-3.5 h-3.5 rounded-sm rotate-45 shadow-[0_0_10px_rgba(31,184,255,0.6)] ml-0.5" style={{ background: "linear-gradient(135deg, #1FB8FF, #FFD60A)" }}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 -rotate-45" style={{ color: "#0B1B3D" }}>
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
                    </svg>
                  </span>
                )}
              </span>
              <span className="text-[9px] sm:text-[10px] font-medium leading-none" style={{ color: "#B0C4E0" }}>{drop.created_date ? formatDistanceToNow(new Date(drop.created_date.endsWith('Z') ? drop.created_date : drop.created_date + 'Z'), { addSuffix: true }) : ''}</span>
            </div>
          </Link>
        )}

        {/* Media Image */}
        {drop.media_url && (
          <img src={drop.media_url} alt={drop.verse || "Glow Drop"} className="w-full h-full object-cover" loading="lazy" />
        )}

        {/* Text Content (if no media) — DARK BLUE */}
        {!drop.media_url && (
          <div className="p-5 sm:p-8 pr-16 sm:pr-20 relative z-10 w-full h-full flex flex-col items-center justify-center">
            {drop.verse && (
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold font-['Space_Grotesk'] text-transparent bg-clip-text mb-4 sm:mb-6 leading-tight" style={{ backgroundImage: "linear-gradient(90deg, #5AC8FF 0%, #FFD000 100%)" }}>
                {drop.verse}
              </h2>
            )}
            {drop.reflection && (
              <p className="text-base sm:text-lg lg:text-xl font-['Inter'] leading-relaxed max-w-md" style={{ color: "#C8D8F0" }}>
                "{drop.reflection.length > 180 ? drop.reflection.slice(0, 180) + '…' : drop.reflection}"
              </p>
            )}
          </div>
        )}

        {/* Double-tap floating heart */}
        {likeBurst && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
            <Heart className="w-20 h-20 sm:w-28 sm:h-28 fill-red-500 text-red-500 drop-shadow-2xl" style={{ animation: "dc-float-up 0.6s ease-out forwards" }} />
          </div>
        )}

        {/* Floating Actions (Right Side Stack) — RESPONSIVE */}
        <div className="absolute right-2 sm:right-3 bottom-4 sm:bottom-6 z-20 flex flex-col items-center gap-3 sm:gap-5">
          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <button
              onClick={handleLike}
              className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all focus:outline-none ${likeBurst ? 'dc-anim-pulse' : ''}`}
              style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.25)" }}
              title={userHasLiked ? "Unlike this drop" : "Like this drop"}
            >
              <Heart className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${likeBurst ? 'dc-anim-like' : ''} ${userHasLiked ? "text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "text-white hover:scale-110"}`} />
            </button>
            <span className="text-white text-[11px] sm:text-xs font-bold drop-shadow-md">{drop.likes_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <button
              onClick={handleCommentToggle}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all focus:outline-none"
              style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <MessageCircle className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform hover:scale-110 ${commentBounce ? 'dc-anim-bounce' : ''}`} style={{ color: showComments ? "#1FB8FF" : "#FFFFFF" }} />
            </button>
            <span className="text-white text-[11px] sm:text-xs font-bold drop-shadow-md">{comments.length}</span>
          </div>

          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <button
              onClick={handleShareClick}
              className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all focus:outline-none ${sharePulse ? 'dc-anim-pulse' : ''}`}
              style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <Share2 className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform hover:scale-110 ${sharePulse ? 'dc-anim-bounce' : ''}`} style={{ color: "#FFFFFF" }} />
            </button>
            <span className="text-white text-[11px] sm:text-xs font-bold drop-shadow-md">{drop.shares_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1 sm:gap-1.5">
            <button
              onClick={handleSaveClick}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all focus:outline-none"
              style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <Bookmark className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform hover:scale-110 ${saveBounce ? 'dc-anim-bounce' : ''} ${isSaved ? "fill-[#FFD60A]" : ""}`} style={{ color: isSaved ? "#FFD60A" : "#FFFFFF" }} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-1 sm:gap-1.5 mt-1 sm:mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur-xl flex items-center justify-center transition-all focus:outline-none"
                  style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.25)" }}
                >
                  <MoreHorizontal className="w-4 h-4 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border text-[#0B1B3D] w-40 z-50" style={{ borderColor: "#E0EAF5" }}>
                {user?.email === drop.user_email ? (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteDropMutation.mutate(); }} className="text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600">
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
                  }} className="hover:bg-slate-100 cursor-pointer focus:bg-slate-100">
                    Report Post
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); repostMutation.mutate(); }} className="hover:bg-slate-100 cursor-pointer focus:bg-slate-100">
                  Repost
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {drop.reposts_count > 0 && <span className="text-white text-[11px] sm:text-xs font-bold drop-shadow-md">{drop.reposts_count}</span>}
          </div>
        </div>
      </div>

      {/* Verse & Reflection — BELOW the image, LIGHT with READ MORE */}
      {(drop.verse || drop.reflection) && (
        <div className="px-3 sm:px-4 pt-3 pb-1">
          {drop.verse && (
            <div className="font-bold text-sm mb-1" style={{ color: "#0B3FD9" }}>
              {drop.verse}
            </div>
          )}
          {drop.reflection && (
            <ReadMoreText
              text={drop.reflection}
              lines={3}
              className="text-sm leading-relaxed"
              toggleColor="#0B3FD9"
            />
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
              <div className="text-[13px] font-medium opacity-90" style={{ color: "#0B3FD9" }}>
                {drop.hashtags.split(' ').map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Engagement Metrics — LIGHT */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 flex items-center gap-4 sm:gap-6 text-xs border-t flex-wrap" style={{ color: "#4A5878", borderColor: "#E0EAF5" }}>
        <div className="flex items-center gap-1.5 transition cursor-default">
          <Heart className="w-4 h-4" fill="currentColor" />
          <span className="font-semibold">{drop.likes_count || 0}</span>
          <span className="hidden sm:inline">Lights</span>
        </div>
        <div className="flex items-center gap-1.5 transition cursor-default">
          <MessageCircle className="w-4 h-4" />
          <span className="font-semibold">{comments.length}</span>
          <span className="hidden sm:inline">Comments</span>
        </div>
        <div className="flex items-center gap-1.5 transition cursor-default">
          <Share2 className="w-4 h-4" />
          <span className="font-semibold">{drop.shares_count || 0}</span>
          <span className="hidden sm:inline">Shares</span>
        </div>
        {drop.reposts_count > 0 && (
          <div className="flex items-center gap-1.5 transition cursor-default sm:ml-auto" style={{ color: "#FF9F1A" }}>
            <span>⚡</span>
            <span className="font-semibold">{drop.reposts_count}</span>
            <span className="hidden sm:inline">Reposts</span>
          </div>
        )}
      </div>

      {/* Comments Section — LIGHT */}
      {showComments && (
        <div className="mt-3 px-3 py-4 rounded-2xl space-y-4" style={{ background: "#F0FAF3", border: "1px solid #E0EAF5" }}>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
            {visibleComments.map(c => (
              <div key={c.id} className="flex gap-3 text-sm group/comment">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 shadow-sm" style={{ background: "#E0EAF5" }}>
                  <img src={getCommentUser(c.user_email)?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none flex-1 shadow-sm relative" style={{ background: "#FFFFFF", border: "1px solid #E0EAF5" }}>
                  <div className="flex justify-between items-start gap-2">
                    <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(c.user_email)}`} className="font-bold text-xs block mb-1 no-underline hover:underline" style={{ color: "#0B3FD9" }}>{getCommentUser(c.user_email).full_name}</Link>

                    {user && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover/comment:opacity-100 transition-opacity" style={{ color: "#8A97B5" }}>
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white border text-[#0B1B3D]" style={{ borderColor: "#E0EAF5" }}>
                          {c.user_email === user.email && (
                            <DropdownMenuItem onClick={() => { setEditingCommentId(c.id); setEditContent(c.content); }} className="hover:bg-slate-100 cursor-pointer">
                              Edit
                            </DropdownMenuItem>
                          )}
                          {(c.user_email === user.email || drop.user_email === user.email) && (
                            <DropdownMenuItem onClick={() => deleteCommentMutation.mutate(c.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer">
                              Delete
                            </DropdownMenuItem>
                          )}
                          {c.user_email !== user.email && (
                            <>
                              <DropdownMenuItem onClick={() => blockUserMutation.mutate(c.user_email)} className="hover:bg-slate-100 cursor-pointer">
                                Block User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const reason = window.prompt("Why are you reporting this comment?");
                                if (reason) reportCommentMutation.mutate({ commentId: c.id, reason });
                              }} className="hover:bg-slate-100 cursor-pointer">
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
                        style={{ background: "#F0FAF3", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
                      />
                      <Button size="sm" className="h-8 font-bold" style={{ background: "#1FB8FF", color: "#FFFFFF" }} onClick={() => updateCommentMutation.mutate({ id: c.id, content: editContent })}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <ReadMoreText
                      text={c.content}
                      lines={4}
                      className="leading-snug"
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
              className="h-12 pl-4 pr-20 rounded-full text-sm focus-visible:ring-[#1FB8FF]/50"
              style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
            />
            <Button
              type="submit"
              disabled={!newComment.trim() || commentMutation.isPending}
              size="sm"
              className="absolute right-1 top-1 bottom-1 h-10 rounded-full font-bold hover:opacity-90 px-4 transition-all"
              style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF" }}
            >
              Post
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}