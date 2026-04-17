import React, { useEffect, useRef, useState } from "react";
import { X, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReadMoreText from "@/components/feed/ReadMoreText";
import { sanitizeRichHtml, containsHtml } from "@/lib/sanitizeHtml";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function PostItem({ drop, currentUser, dropUser, likeMutation, handleShare, userLikes, savedDropRecords, allUsers }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const userHasLiked = (userLikes || []).some(l => l.drop_id === drop.id);
  const savedForThis = (savedDropRecords || []).filter(s => s.drop_id === drop.id);
  const isSaved = savedForThis.length > 0;

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", drop.id],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: drop.id }),
    enabled: showComments,
  });

  const getCommentUser = (email) => {
    if (currentUser?.email === email) return currentUser;
    if (dropUser?.email === email) return dropUser;
    return (allUsers || []).find(u => u.email === email) || { full_name: email?.split("@")[0], email };
  };

  const handleLike = () => {
    likeMutation.mutate({ id: drop.id, authorEmail: drop.user_email, authorName: dropUser?.full_name });
  };

  const handleSave = async () => {
    if (isSaved) {
      await base44.entities.SavedDrop.delete(savedForThis[0].id);
    } else {
      await base44.entities.SavedDrop.create({ drop_id: drop.id, user_email: currentUser.email });
    }
    queryClient.invalidateQueries({ queryKey: ["savedDrops", currentUser?.email] });
    queryClient.invalidateQueries({ queryKey: ["profileSavedDrops", currentUser?.email] });
    queryClient.invalidateQueries({ queryKey: ["mySavedDropsProfile"] });
    toast.success(isSaved ? "Removed from saved" : "Saved");
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await base44.entities.GlowDropComment.create({ drop_id: drop.id, user_email: currentUser.email, content: newComment.trim() });
    setNewComment("");
    queryClient.invalidateQueries({ queryKey: ["comments", drop.id] });
    toast.success("Comment posted");
  };

  const timeAgo = drop.created_date
    ? formatDistanceToNow(new Date(drop.created_date.endsWith("Z") ? drop.created_date : drop.created_date + "Z"), { addSuffix: true })
    : "";

  const hasMedia = !!drop.media_url;
  const reflectionPlain = drop.reflection && containsHtml(drop.reflection)
    ? drop.reflection.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : drop.reflection;

  return (
    <div className="bg-white rounded-sm border" style={{ borderColor: "#DBDBDB" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(dropUser?.email)}`}>
          <div className="w-8 h-8 rounded-full overflow-hidden" style={{ border: "2px solid #E8E8E8" }}>
            <img src={dropUser?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" alt="" />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(dropUser?.email)}`} className="no-underline">
            <span className="font-semibold text-sm" style={{ color: "#262626" }}>{dropUser?.full_name || "User"}</span>
          </Link>
          {drop.category && <span className="text-xs ml-2" style={{ color: "#8E8E8E" }}>• {drop.category}</span>}
        </div>
        <button className="p-1" style={{ color: "#262626" }}>
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Media / Content */}
      {hasMedia ? (
        <div className="w-full aspect-square bg-black" onDoubleClick={handleLike}>
          <img src={drop.media_url} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="w-full aspect-square flex items-center justify-center p-8 text-center"
          style={{ background: "linear-gradient(145deg, #F0F5FF 0%, #E8EEFF 100%)" }}
          onDoubleClick={handleLike}
        >
          <div>
            {drop.verse && (
              <p className="text-xl md:text-2xl font-bold leading-snug mb-4" style={{ color: "#1a1a2e", fontFamily: "Georgia, serif" }}>
                "{drop.verse}"
              </p>
            )}
            {reflectionPlain && (
              <p className="text-sm italic leading-relaxed max-w-sm mx-auto" style={{ color: "#555" }}>
                {reflectionPlain.length > 150 ? reflectionPlain.slice(0, 150) + "…" : reflectionPlain}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="transition hover:opacity-60">
              <Heart className={`w-6 h-6 ${userHasLiked ? "fill-red-500 text-red-500" : ""}`} style={{ color: userHasLiked ? "#ED4956" : "#262626" }} />
            </button>
            <button onClick={() => setShowComments(v => !v)} className="transition hover:opacity-60">
              <MessageCircle className="w-6 h-6" style={{ color: "#262626" }} />
            </button>
            <button onClick={() => handleShare(drop)} className="transition hover:opacity-60">
              <Share2 className="w-6 h-6" style={{ color: "#262626" }} />
            </button>
          </div>
          <button onClick={handleSave} className="transition hover:opacity-60">
            <Bookmark className={`w-6 h-6 ${isSaved ? "fill-black" : ""}`} style={{ color: "#262626" }} />
          </button>
        </div>

        {/* Likes */}
        <div className="font-semibold text-sm mb-1" style={{ color: "#262626" }}>
          {drop.likes_count || 0} like{(drop.likes_count || 0) !== 1 ? "s" : ""}
        </div>

        {/* Caption */}
        {(drop.verse || drop.reflection) && (
          <div className="text-sm mb-1" style={{ color: "#262626" }}>
            <span className="font-semibold mr-1.5">{dropUser?.full_name?.split(" ")[0]}</span>
            {hasMedia && drop.verse && <span className="font-medium">{drop.verse} </span>}
            {drop.reflection && !containsHtml(drop.reflection) && (
              <ReadMoreText text={drop.reflection} lines={2} className="inline" toggleColor="#8E8E8E" />
            )}
          </div>
        )}

        {/* Hashtags */}
        {drop.hashtags && (
          <div className="text-sm mb-1" style={{ color: "#00376B" }}>
            {drop.hashtags}
          </div>
        )}

        {/* View comments link */}
        {!showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-sm mb-1 cursor-pointer bg-transparent border-none p-0"
            style={{ color: "#8E8E8E" }}
          >
            View comments
          </button>
        )}

        {/* Timestamp */}
        <div className="text-[10px] uppercase tracking-wide mt-1 mb-2" style={{ color: "#8E8E8E" }}>
          {timeAgo}
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t px-4 py-3" style={{ borderColor: "#EFEFEF" }}>
          <div className="space-y-2.5 max-h-48 overflow-y-auto mb-3">
            {comments.length === 0 && (
              <p className="text-sm py-4 text-center" style={{ color: "#8E8E8E" }}>No comments yet</p>
            )}
            {comments.map(c => {
              const cu = getCommentUser(c.user_email);
              return (
                <div key={c.id} className="text-sm" style={{ color: "#262626" }}>
                  <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(c.user_email)}`} className="font-semibold mr-1.5 no-underline" style={{ color: "#262626" }}>
                    {cu?.full_name?.split(" ")[0]}
                  </Link>
                  {c.content}
                </div>
              );
            })}
          </div>
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 border-t pt-3" style={{ borderColor: "#EFEFEF" }}>
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-sm border-none outline-none bg-transparent"
              style={{ color: "#262626" }}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="text-sm font-semibold disabled:opacity-30 bg-transparent border-none cursor-pointer"
              style={{ color: "#0095F6" }}
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function PostViewerModal({
  isOpen, onClose, drops, initialDropId,
  user, currentUser, allUsers,
  likeMutation, handleShare, userLikes, savedDropRecords
}) {
  const scrollRef = useRef(null);
  const initialRef = useRef(null);

  useEffect(() => {
    if (isOpen && initialDropId && initialRef.current) {
      setTimeout(() => {
        initialRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
      }, 80);
    }
  }, [isOpen, initialDropId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  if (!isOpen || drops.length === 0) return null;

  const getUserInfo = (email) => {
    if (currentUser?.email === email) return currentUser;
    if (user?.email === email) return user;
    const found = (allUsers || []).find(u => u.email === email);
    return found || { full_name: email?.split("@")[0] || "User", email };
  };

  return (
    <div className="fixed inset-0 z-[100]" style={{ animation: "pvm-fadein 0.15s ease-out" }}>
      <style>{`
        @keyframes pvm-fadein { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[110] w-10 h-10 flex items-center justify-center text-white hover:opacity-70 transition"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="max-w-[470px] mx-auto py-10 md:py-16 px-4 space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          {drops.map((drop) => (
            <div
              key={drop.id}
              ref={drop.id === initialDropId ? initialRef : undefined}
            >
              <PostItem
                drop={drop}
                currentUser={currentUser}
                dropUser={getUserInfo(drop.user_email)}
                likeMutation={likeMutation}
                handleShare={handleShare}
                userLikes={userLikes}
                savedDropRecords={savedDropRecords}
                allUsers={allUsers}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}