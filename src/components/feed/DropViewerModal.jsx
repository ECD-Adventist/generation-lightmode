import React, { useState, useRef, useEffect } from "react";
import { X, Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, Bookmark, MoreHorizontal, Trash2, Flag, Send, Copy } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import KeepIt100Poster from "@/components/keep-it-100/KeepIt100Poster";
import CodesOfTruthPoster from "@/components/codes-of-truth/CodesOfTruthPoster";
import useRequireAuth from "@/hooks/useRequireAuth";
import StandardPostImage from "@/components/feed/StandardPostImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DropViewerModal({ drop, drops, user, likeMutation, userLikes = [], onClose, onNavigate }) {
  const [newComment, setNewComment] = useState("");
  const [replyToComment, setReplyToComment] = useState(null);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth(user);
  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentIndex = drops?.findIndex(d => d.id === drop.id) ?? -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < (drops?.length ?? 0) - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(drops[currentIndex - 1]);
      if (e.key === "ArrowRight" && hasNext) onNavigate(drops[currentIndex + 1]);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [drop.id, hasPrev, hasNext]);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", drop.id],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: drop.id }),
    enabled: !!drop.id
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["dropViewerPublicUsersDefaultPage"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    }
  });

  const { data: savedDrops = [] } = useQuery({
    queryKey: ["savedDrops", drop.id, user?.email],
    queryFn: () => base44.entities.SavedDrop.filter({ drop_id: drop.id, user_email: user?.email }),
    enabled: !!user
  });

  const isSaved = savedDrops.length > 0;
  const liked = userLikes.some(like => like.drop_id === drop.id);

  const getCommentUser = (email) => {
    if (user?.email === email) return user;
    return allUsers.find(u => u.email === email) || { full_name: "Glow Believer" };
  };

  const commentMutation = useMutation({
    mutationFn: async (content) => {
      await base44.functions.invoke("createGlowDropComment", { drop_id: drop.id, content, parent_comment_id: replyToComment?.id || undefined });
    },
    onSuccess: () => {
      setNewComment("");
      setReplyToComment(null);
      queryClient.invalidateQueries({ queryKey: ["comments", drop.id] });
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    }
  });

  const deleteDropMutation = useMutation({
    mutationFn: async () => { await base44.entities.GlowDrop.delete(drop.id); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGlowDropsProfile"] });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      toast.success("Post deleted");
      onClose();
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => { await base44.entities.GlowDropComment.delete(commentId); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", drop.id] });
      toast.success("Comment deleted");
    }
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) { await base44.entities.SavedDrop.delete(savedDrops[0].id); }
      else { await base44.entities.SavedDrop.create({ drop_id: drop.id, user_email: user.email }); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedDrops", drop.id, user?.email] });
      queryClient.invalidateQueries({ queryKey: ["mySavedDrops"] });
      toast.success(isSaved ? "Removed from saved" : "Saved!");
    }
  });

  const handleShare = async () => {
    const shareText = `✨ "${drop.verse}"\n\n${drop.reflection || ""}\n\n— Generation LightMode`;
    if (navigator.share) {
      try { await navigator.share({ title: "Glow Drop", text: shareText }); } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  const triggerLike = () => {
    if (!likeMutation || likeMutation.isPending) return;
    likeMutation.mutate({
      id: drop.id,
      authorEmail: drop.user_email,
      authorName: drop.author_name || drop.author_username || "Glow Believer",
      action: liked ? "unlike" : "like",
    });
  };

  const handleDoubleTap = () => {
    setShowHeartAnim(true);
    triggerLike();
    setTimeout(() => setShowHeartAnim(false), 800);
  };

  const submitComment = (e) => {
    e.preventDefault();
    if (!user) { requireAuth(); return; }
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment);
  };

  const handleSave = () => requireAuth(() => toggleSaveMutation.mutate());

  const isOwner = user?.email === drop.user_email;
  const dropAuthor = getCommentUser(drop.user_email);
  const isKeepIt100 = !drop.media_url && (drop.category === "Keep It 100" || /keepit100/i.test(drop.hashtags || ""));
  const isCodeOfTruth = !drop.media_url && drop.category === "Code of Truth";
  const cleanReflection = (r) => r?.replace(/^(\[Reposted from .+?\]\s*)+/i, "").trim() || "";

  const renderCommentContent = (text) => {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9_.]{1,40})/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        let slug = part.slice(1).toLowerCase();
        let trailing = "";
        while(slug.endsWith('.')) { trailing += "."; slug = slug.slice(0, -1); }
        
        const u = allUsers.find(user => {
           if (!user.full_name) return false;
           const s = user.full_name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_.]/g, "");
           return s === slug;
        });

        if (u) {
          return (
            <React.Fragment key={i}>
              <Link
                to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`}
                onClick={(e) => e.stopPropagation()}
                className="font-bold hover:underline"
                style={{ color: "#0B3FD9" }}
              >
                @{u.full_name}
              </Link>
              {trailing}
            </React.Fragment>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1B3D]/80 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Close */}
      <button onClick={onClose} className="absolute top-3 right-3 z-[110] w-9 h-9 rounded-full bg-white shadow-lg border border-[#E6ECF5] hover:bg-[#F6F8FC] flex items-center justify-center transition">
        <X className="w-5 h-5 text-[#0B1B3D]" />
      </button>

      {/* Nav Arrows */}
      {hasPrev && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(drops[currentIndex - 1]); }}
          className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-50 w-9 h-9 rounded-full bg-white hover:bg-[#F6F8FC] flex items-center justify-center transition shadow-lg border border-[#E6ECF5]">
          <ChevronLeft className="w-5 h-5 text-[#0B1B3D]" />
        </button>
      )}
      {hasNext && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(drops[currentIndex + 1]); }}
          className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-50 w-9 h-9 rounded-full bg-white hover:bg-[#F6F8FC] flex items-center justify-center transition shadow-lg border border-[#E6ECF5]">
          <ChevronRight className="w-5 h-5 text-[#0B1B3D]" />
        </button>
      )}

      {/* Modal Container */}
      <div className="w-full max-w-5xl max-h-[92vh] mx-2 sm:mx-4 bg-white border border-[#E6ECF5] rounded-xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* LEFT — Full Image / Content */}
        <div className="md:w-[55%] flex-shrink-0 relative bg-[#F6F8FC] flex items-center justify-center overflow-hidden"
          onDoubleClick={handleDoubleTap}
          style={{ minHeight: 280 }}>

          {drop.media_url ? (
            <div className="w-full aspect-[4/5] max-h-[720px] flex items-center justify-center overflow-hidden bg-[#071A33]">
              <StandardPostImage src={drop.media_url} alt="Drop" />
            </div>
          ) : isKeepIt100 ? (
            <KeepIt100Poster text={drop.reflection} verse={drop.verse} className="w-full max-w-[520px] aspect-[4/5]" />
          ) : isCodeOfTruth ? (
            <CodesOfTruthPoster text={drop.reflection} verse={drop.verse} className="w-full max-w-[520px] aspect-[4/5]" />
          ) : (
            <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-[#EEF3FF] via-[#F6F8FC] to-[#DDE7FB] flex flex-col items-center justify-center p-10 text-center">
              {drop.verse && (
                <h2 className="text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] text-transparent bg-clip-text bg-gradient-to-r from-[#0B3FD9] to-[#1FB8FF] leading-tight mb-5">
                  {drop.verse}
                </h2>
              )}
              {cleanReflection(drop.reflection) && (
                <p className="text-lg text-[#3A4A6B] font-['Inter'] leading-relaxed max-w-md">"{cleanReflection(drop.reflection)}"</p>
              )}
            </div>
          )}

          {/* Double-tap heart animation */}
          {showHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              <Heart className="w-24 h-24 text-red-500 fill-red-500 animate-ping" />
            </div>
          )}
        </div>

        {/* RIGHT — Details Panel */}
        <div className="md:w-[45%] flex flex-col bg-white border-l border-[#E6ECF5] max-h-[92vh]">

          {/* Author Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6ECF5] shrink-0">
            <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`} onClick={onClose} className="flex items-center gap-3 no-underline hover:opacity-80 transition">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1FB8FF] to-[#0B3FD9] p-[2px] shrink-0">
                <div className="w-full h-full rounded-full bg-white overflow-hidden">
                  <img src={dropAuthor?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <div className="font-bold text-[#0B1B3D] text-sm leading-tight">{dropAuthor?.full_name || "Unknown"}</div>
                {drop.category && <span className="text-[10px] text-[#6B7FA0] font-medium">{drop.category}</span>}
              </div>
            </Link>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full hover:bg-[#F0F4FA] flex items-center justify-center transition" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="w-5 h-5 text-[#6B7FA0]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-[#E6ECF5] text-[#0B1B3D] w-48 z-[120] shadow-lg" onClick={(e) => e.stopPropagation()}>
                {isOwner && (
                  <DropdownMenuItem onSelect={() => deleteDropMutation.mutate()} className="text-red-500 hover:bg-red-50 cursor-pointer gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Post
                  </DropdownMenuItem>
                )}
                {!isOwner && (
                  <DropdownMenuItem onSelect={() => requireAuth(() => {
                    const reason = window.prompt("Why are you reporting this content?");
                    if (reason) {
                      base44.entities.ReportedDrop.create({ drop_id: drop.id, reporter_email: user.email, reason })
                        .then(() => toast.success("Reported to moderators."));
                    }
                  })} className="hover:bg-[#F0F4FA] cursor-pointer gap-2">
                    <Flag className="w-4 h-4" /> Report Post
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => {
                  navigator.clipboard.writeText(`${drop.verse || ""} ${drop.reflection || ""}`);
                  toast.success("Text copied!");
                }} className="hover:bg-[#F0F4FA] cursor-pointer gap-2">
                  <Copy className="w-4 h-4" /> Copy Text
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleShare} className="hover:bg-[#F0F4FA] cursor-pointer gap-2">
                  <Share2 className="w-4 h-4" /> Share
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSave} className="hover:bg-[#F0F4FA] cursor-pointer gap-2">
                  <Bookmark className="w-4 h-4" /> {isSaved ? "Unsave" : "Save"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Caption / Verse + Reflection */}
          <div className="px-4 py-3 border-b border-[#E6ECF5] shrink-0">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden mt-0.5">
                <img src={dropAuthor?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
              </div>
              <div className="text-sm leading-relaxed">
                <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`} onClick={onClose} className="font-bold text-[#0B1B3D] mr-1.5 no-underline hover:underline">{dropAuthor?.full_name}</Link>
                {drop.verse && <span className="text-[#0B3FD9] font-semibold">{drop.verse} </span>}
                {cleanReflection(drop.reflection) && <span className="text-[#3A4A6B]">{cleanReflection(drop.reflection)}</span>}
                {drop.hashtags && (
                  <div className="text-[#0B3FD9] text-xs mt-1.5 font-medium">
                    {drop.hashtags.split(" ").map(t => t.startsWith("#") ? t : `#${t}`).join(" ")}
                  </div>
                )}
                <div className="text-[11px] text-[#8A97B5] mt-1.5">
                  {drop.created_date ? formatDistanceToNow(new Date(drop.created_date), { addSuffix: true }) : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
            {comments.length === 0 && (
              <div className="text-center py-12 text-[#8A97B5] text-sm">No comments yet.</div>
            )}
            {comments.map(c => {
              const cu = getCommentUser(c.user_email);
              const isCommentOwner = user?.email === c.user_email;
              const canDelete = isCommentOwner || isOwner;
              const canReport = !isCommentOwner;
              return (
                <div key={c.id} className="flex gap-3 group/c">
                  <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden mt-0.5">
                    <img src={cu?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(c.user_email)}`} onClick={onClose} className="font-bold text-[#0B1B3D] mr-1.5 no-underline hover:underline">{cu.full_name}</Link>
                      <span className="text-[#3A4A6B] whitespace-pre-line">{renderCommentContent(c.content)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-[#8A97B5]">
                        {c.created_date ? formatDistanceToNow(new Date(c.created_date), { addSuffix: true }) : ""}
                      </span>
                      {!isCommentOwner && <button onClick={() => requireAuth(() => setReplyToComment(c))} className="text-[11px] font-semibold text-[#0B3FD9]">Reply</button>}
                      {canDelete && (
                        <button onClick={() => deleteCommentMutation.mutate(c.id)}
                          className="text-[11px] text-[#8A97B5] hover:text-red-500 opacity-0 group-hover/c:opacity-100 transition font-semibold">
                          Delete
                        </button>
                      )}
                      {canReport && (
                        <button onClick={() => requireAuth(() => {
                          const reason = window.prompt("Why are you reporting this comment?");
                          if (reason) {
                            base44.entities.ReportedComment.create({ comment_id: c.id, reporter_email: user.email, reason })
                              .then(() => toast.success("Comment reported to moderators."));
                          }
                        })}
                          className="text-[11px] text-[#8A97B5] hover:text-red-500 opacity-0 group-hover/c:opacity-100 transition font-semibold">
                          Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={commentsEndRef} />
          </div>

          {/* Action Bar */}
          <div className="border-t border-[#E6ECF5] px-4 py-2.5 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-4">
                <button onClick={triggerLike} className="hover:scale-110 transition-transform active:scale-95">
                  <Heart className={`w-6 h-6 transition-colors ${liked || (drop.likes_count || 0) > 0 ? "text-red-500 fill-red-500" : "text-[#0B1B3D] hover:text-[#4A5878]"}`} />
                </button>
                <button onClick={() => inputRef.current?.focus()} className="hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6 text-[#0B1B3D] hover:text-[#4A5878]" />
                </button>
                <button onClick={handleShare} className="hover:scale-110 transition-transform">
                  <Send className="w-6 h-6 text-[#0B1B3D] hover:text-[#4A5878]" />
                </button>
              </div>
              <button onClick={handleSave} className="hover:scale-110 transition-transform">
                <Bookmark className={`w-6 h-6 transition-colors ${isSaved ? "text-[#0B1B3D] fill-[#0B1B3D]" : "text-[#0B1B3D] hover:text-[#4A5878]"}`} />
              </button>
            </div>
            <div className="text-sm font-bold text-[#0B1B3D]">{drop.likes_count || 0} likes</div>
            <div className="text-[11px] text-[#8A97B5] mt-0.5">
              {drop.created_date ? formatDistanceToNow(new Date(drop.created_date), { addSuffix: true }).toUpperCase() : ""}
            </div>
          </div>

          {/* Comment Input */}
          <form onSubmit={submitComment} className="border-t border-[#E6ECF5] px-4 py-3 flex items-center gap-2 shrink-0">
              {replyToComment && <button type="button" onClick={() => setReplyToComment(null)} className="text-[10px] font-bold text-[#0B3FD9]">Cancel reply</button>}
              <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden">
                <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
              </div>
              <input
                ref={inputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? "Add a comment..." : "Sign in to comment..."}
                className="flex-1 bg-transparent text-[#0B1B3D] text-sm h-9 focus:outline-none placeholder:text-[#8A97B5]"
              />
              <button type="submit" disabled={!newComment.trim()} className="text-[#0B3FD9] font-bold text-sm disabled:opacity-30 hover:text-[#1FB8FF] transition">
                Post
              </button>
            </form>
        </div>
      </div>
    </div>
  );
}