import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, Copy, Flag, Heart, MessageCircle, MoreHorizontal, Send, Share2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function Post() {
  const [currentUser, setCurrentUser] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const commentsEndRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const dropId = urlParams.get("id");
  const backUser = urlParams.get("user");

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) {
        base44.auth.me().then(setCurrentUser);
      } else {
        base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      }
    });
  }, []);

  const { data: drops = [], isLoading } = useQuery({
    queryKey: ["postDrop", dropId],
    queryFn: () => base44.entities.GlowDrop.filter({ id: dropId }),
    enabled: !!dropId,
  });

  const drop = drops[0];

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", dropId],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: dropId }),
    enabled: !!dropId,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    enabled: !!currentUser,
  });

  const { data: savedDrops = [] } = useQuery({
    queryKey: ["savedDrops", dropId, currentUser?.email],
    queryFn: () => base44.entities.SavedDrop.filter({ drop_id: dropId, user_email: currentUser?.email }),
    enabled: !!currentUser && !!dropId,
  });

  const isSaved = savedDrops.length > 0;
  const isOwner = currentUser?.email === drop?.user_email;
  const backUrl = backUser ? `${createPageUrl("Profile")}?user=${encodeURIComponent(backUser)}` : createPageUrl("Feed");

  const getCommentUser = (email) => {
    if (currentUser?.email === email) return currentUser;
    return allUsers.find((u) => u.email === email) || { full_name: "Glow Believer" };
  };

  const dropAuthor = drop ? getCommentUser(drop.user_email) : null;

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !drop) return;
      setLiked(true);
      await base44.entities.GlowDrop.update(drop.id, { likes_count: (drop.likes_count || 0) + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postDrop", dropId] });
      queryClient.invalidateQueries({ queryKey: ["myGlowDropsProfile"] });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content) => {
      await base44.entities.GlowDropComment.create({ drop_id: drop.id, user_email: currentUser.email, content });
      if (drop.user_email && drop.user_email !== currentUser.email) {
        await base44.entities.Notification.create({
          user_email: drop.user_email,
          type: "reply",
          message: `${currentUser.full_name} commented on your Glow Drop!`,
          link: `/Feed`,
        });
      }
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", dropId] });
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    },
  });

  const deleteDropMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GlowDrop.delete(drop.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGlowDropsProfile"] });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      toast.success("Post deleted");
      window.location.href = backUrl;
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      await base44.entities.GlowDropComment.delete(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", dropId] });
      toast.success("Comment deleted");
    },
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await base44.entities.SavedDrop.delete(savedDrops[0].id);
      } else {
        await base44.entities.SavedDrop.create({ drop_id: drop.id, user_email: currentUser.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedDrops", dropId, currentUser?.email] });
      queryClient.invalidateQueries({ queryKey: ["mySavedDrops"] });
      toast.success(isSaved ? "Removed from saved" : "Saved!");
    },
  });

  const handleShare = async () => {
    const shareText = `✨ "${drop?.verse || ""}"\n\n${drop?.reflection || ""}\n\n— Generation LightMode`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Glow Drop", text: shareText });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  const submitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || !drop) return;
    commentMutation.mutate(newComment);
  };

  if (isLoading || !drop) {
    return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">Loading post...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white px-4 py-6 md:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to={backUrl} className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        <div className="bg-[#0F1524] border border-white/10 rounded-3xl overflow-hidden shadow-2xl grid lg:grid-cols-[minmax(0,1.15fr)_420px]">
          <div className="bg-black min-h-[420px] lg:min-h-[78vh] flex items-center justify-center p-3 md:p-6">
            {drop.media_url ? (
              <img src={drop.media_url} alt={drop.verse || "Glow Drop"} className="w-full h-full max-h-[75vh] object-contain rounded-2xl" />
            ) : (
              <div className="w-full h-full min-h-[420px] rounded-2xl bg-gradient-to-br from-[#1a1b26] via-[#0B0F1A] to-[#1a103c] flex flex-col items-center justify-center p-10 text-center">
                {drop.verse && (
                  <h2 className="text-3xl sm:text-4xl font-bold font-['Space_Grotesk'] text-transparent bg-clip-text bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] leading-tight mb-5">
                    {drop.verse}
                  </h2>
                )}
                {drop.reflection && <p className="text-lg text-white/80 leading-relaxed max-w-md">{drop.reflection}</p>}
              </div>
            )}
          </div>

          <div className="flex flex-col min-h-[60vh] lg:min-h-[78vh]">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition">
                <img src={dropAuthor?.profile_picture_url || defaultAvatar} alt={dropAuthor?.full_name || "User"} className="w-11 h-11 rounded-full object-cover border border-white/10" />
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">{dropAuthor?.full_name || "Unknown"}</div>
                  {drop.category && <div className="text-xs text-gray-500">{drop.category}</div>}
                </div>
              </Link>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#121826] border-white/10 text-white w-48">
                  {isOwner && (
                    <DropdownMenuItem onSelect={() => deleteDropMutation.mutate()} className="text-red-400 hover:bg-red-500/10 hover:text-red-400 cursor-pointer gap-2">
                      <Trash2 className="w-4 h-4" /> Delete Post
                    </DropdownMenuItem>
                  )}
                  {!isOwner && currentUser && (
                    <DropdownMenuItem onSelect={() => {
                      const reason = window.prompt("Why are you reporting this content?");
                      if (reason) {
                        base44.entities.ReportedDrop.create({ drop_id: drop.id, reporter_email: currentUser.email, reason })
                          .then(() => toast.success("Reported to moderators."));
                      }
                    }} className="hover:bg-white/10 cursor-pointer gap-2">
                      <Flag className="w-4 h-4" /> Report Post
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => {
                    navigator.clipboard.writeText(`${drop.verse || ""} ${drop.reflection || ""}`);
                    toast.success("Text copied!");
                  }} className="hover:bg-white/10 cursor-pointer gap-2">
                    <Copy className="w-4 h-4" /> Copy Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleShare} className="hover:bg-white/10 cursor-pointer gap-2">
                    <Share2 className="w-4 h-4" /> Share
                  </DropdownMenuItem>
                  {currentUser && (
                    <DropdownMenuItem onSelect={() => toggleSaveMutation.mutate()} className="hover:bg-white/10 cursor-pointer gap-2">
                      <Bookmark className="w-4 h-4" /> {isSaved ? "Unsave" : "Save"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="px-4 py-4 border-b border-white/5">
              <div className="text-sm leading-relaxed">
                <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`} className="font-bold text-white mr-1.5 hover:underline">{dropAuthor?.full_name}</Link>
                {drop.verse && <span className="text-[#00CFFF] font-semibold">{drop.verse} </span>}
                {drop.reflection && <span className="text-gray-300">{drop.reflection}</span>}
                {drop.hashtags && (
                  <div className="text-[#00CFFF] text-xs mt-2 font-medium">
                    {drop.hashtags.split(" ").map((tag) => tag.startsWith("#") ? tag : `#${tag}`).join(" ")}
                  </div>
                )}
                <div className="text-[11px] text-gray-600 mt-2">
                  {drop.created_date ? formatDistanceToNow(new Date(drop.created_date), { addSuffix: true }) : ""}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {comments.length === 0 && <div className="text-center py-12 text-gray-600 text-sm">No comments yet.</div>}
              {comments.map((comment) => {
                const commentUser = getCommentUser(comment.user_email);
                const isCommentOwner = currentUser?.email === comment.user_email;
                const canDelete = isCommentOwner || isOwner;
                const canReport = currentUser && !isCommentOwner;

                return (
                  <div key={comment.id} className="flex gap-3 group/comment">
                    <img src={commentUser?.profile_picture_url || defaultAvatar} alt={commentUser?.full_name || "User"} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(comment.user_email)}`} className="font-bold text-white mr-1.5 hover:underline">{commentUser.full_name}</Link>
                        <span className="text-gray-300">{comment.content}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-gray-600">{comment.created_date ? formatDistanceToNow(new Date(comment.created_date), { addSuffix: true }) : ""}</span>
                        {canDelete && (
                          <button onClick={() => deleteCommentMutation.mutate(comment.id)} className="text-[11px] text-gray-600 hover:text-red-400 opacity-0 group-hover/comment:opacity-100 transition font-semibold">
                            Delete
                          </button>
                        )}
                        {canReport && (
                          <button onClick={() => {
                            const reason = window.prompt("Why are you reporting this comment?");
                            if (reason) {
                              base44.entities.ReportedComment.create({ comment_id: comment.id, reporter_email: currentUser.email, reason })
                                .then(() => toast.success("Comment reported to moderators."));
                            }
                          }} className="text-[11px] text-gray-600 hover:text-red-400 opacity-0 group-hover/comment:opacity-100 transition font-semibold">
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

            <div className="border-t border-white/10 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-4">
                  <button onClick={() => likeMutation.mutate()} className="hover:scale-110 transition-transform active:scale-95">
                    <Heart className={`w-6 h-6 transition-colors ${liked || (drop.likes_count || 0) > 0 ? "text-red-500 fill-red-500" : "text-white hover:text-gray-300"}`} />
                  </button>
                  <button onClick={() => inputRef.current?.focus()} className="hover:scale-110 transition-transform">
                    <MessageCircle className="w-6 h-6 text-white hover:text-gray-300" />
                  </button>
                  <button onClick={handleShare} className="hover:scale-110 transition-transform">
                    <Send className="w-6 h-6 text-white hover:text-gray-300" />
                  </button>
                </div>
                <button onClick={() => currentUser && toggleSaveMutation.mutate()} className="hover:scale-110 transition-transform">
                  <Bookmark className={`w-6 h-6 transition-colors ${isSaved ? "text-white fill-white" : "text-white hover:text-gray-300"}`} />
                </button>
              </div>
              <div className="text-sm font-bold text-white">{drop.likes_count || 0} likes</div>
              <div className="text-[11px] text-gray-600 mt-0.5">
                {drop.created_date ? formatDistanceToNow(new Date(drop.created_date), { addSuffix: true }).toUpperCase() : ""}
              </div>
            </div>

            {currentUser && (
              <form onSubmit={submitComment} className="border-t border-white/10 px-4 py-3 flex items-center gap-3">
                <img src={currentUser?.profile_picture_url || defaultAvatar} alt="You" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <input
                  ref={inputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent text-white text-sm h-9 focus:outline-none placeholder:text-gray-600"
                />
                <button type="submit" disabled={!newComment.trim()} className="text-[#00CFFF] font-bold text-sm disabled:opacity-30 hover:text-white transition">
                  Post
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}