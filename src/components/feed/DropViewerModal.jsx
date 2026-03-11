import React, { useState } from "react";
import { X, Heart, MessageCircle, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DropViewerModal({ drop, drops, user, onClose, onNavigate }) {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const currentIndex = drops?.findIndex(d => d.id === drop.id) ?? -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < (drops?.length ?? 0) - 1;

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", drop.id],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: drop.id }),
    enabled: !!drop.id
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    }
  });

  const getCommentUser = (email) => {
    if (user?.email === email) return user;
    return users.find(u => u.email === email) || { full_name: "Glow Believer" };
  };

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) { toast.error("Please log in"); return; }
      await base44.entities.GlowDrop.update(drop.id, { likes_count: (drop.likes_count || 0) + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGlowDropsProfile"] });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (content) => {
      await base44.entities.GlowDropComment.create({
        drop_id: drop.id,
        user_email: user.email,
        content
      });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", drop.id] });
    }
  });

  const submitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    commentMutation.mutate(newComment);
  };

  const handleShare = async () => {
    const shareText = `✨ "${drop.verse}"\n\n${drop.reflection || ""}\n\n— Generation LightMode`;
    if (navigator.share) {
      try { await navigator.share({ title: "Glow Drop", text: shareText }); } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md" onClick={onClose}>
      {/* Close Button */}
      <button onClick={onClose} className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Nav Arrows */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(drops[currentIndex - 1]); }}
          className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(drops[currentIndex + 1]); }}
          className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Main Content */}
      <div
        className="w-full max-w-4xl max-h-[90vh] mx-4 bg-[#121826] border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left — Media / Text */}
        <div
          className={`md:w-1/2 flex-shrink-0 relative flex items-center justify-center ${drop.media_url ? "" : "bg-gradient-to-br from-[#1a1b26] via-[#0B0F1A] to-[#1a103c]"}`}
          style={drop.media_url ? { backgroundImage: `url(${drop.media_url})`, backgroundSize: "cover", backgroundPosition: "center", minHeight: 300 } : { minHeight: 300 }}
          onDoubleClick={() => likeMutation.mutate()}
        >
          {!drop.media_url && (
            <div className="p-8 text-center">
              {drop.verse && (
                <h2 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] text-transparent bg-clip-text bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] leading-tight mb-4">
                  {drop.verse}
                </h2>
              )}
              {drop.reflection && (
                <p className="text-base text-white/80 font-['Inter'] leading-relaxed">"{drop.reflection}"</p>
              )}
            </div>
          )}
          {drop.media_url && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              {drop.verse && <p className="text-sm font-bold text-[#00CFFF]">{drop.verse}</p>}
            </div>
          )}
        </div>

        {/* Right — Details & Comments */}
        <div className="md:w-1/2 flex flex-col bg-[#0B0F1A] max-h-[90vh] md:max-h-none">
          {/* Author Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-[#0B0F1A] overflow-hidden">
                <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <div className="font-bold text-white text-sm">{user?.full_name || "You"}</div>
              <div className="text-xs text-gray-500">{drop.created_date ? formatDistanceToNow(new Date(drop.created_date), { addSuffix: true }) : ""}</div>
            </div>
          </div>

          {/* Caption */}
          {(drop.reflection || drop.verse) && (
            <div className="px-4 py-3 border-b border-white/5 text-sm text-gray-200">
              {drop.media_url && drop.verse && <span className="text-[#00CFFF] font-bold mr-1">{drop.verse}</span>}
              {drop.reflection && <span>{drop.reflection}</span>}
            </div>
          )}

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {comments.length === 0 && (
              <div className="text-center py-10 text-gray-600 text-sm">No comments yet. Start the conversation!</div>
            )}
            {comments.map(c => (
              <div key={c.id} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gray-800 shrink-0 overflow-hidden">
                  <img src={getCommentUser(c.user_email)?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                </div>
                <div className="text-sm">
                  <span className="font-bold text-white mr-1.5">{getCommentUser(c.user_email).full_name}</span>
                  <span className="text-gray-300">{c.content}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-5 mb-3">
              <button onClick={() => likeMutation.mutate()} className="hover:scale-110 transition-transform">
                <Heart className={`w-6 h-6 ${(drop.likes_count || 0) > 0 ? "text-red-500 fill-red-500" : "text-white"}`} />
              </button>
              <button className="hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-white" />
              </button>
              <button onClick={handleShare} className="hover:scale-110 transition-transform">
                <Share2 className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="text-sm font-bold text-white mb-2">{drop.likes_count || 0} likes</div>
          </div>

          {/* Comment Input */}
          {user && (
            <form onSubmit={submitComment} className="border-t border-white/10 px-4 py-3 flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="bg-transparent border-none text-white text-sm h-10 focus-visible:ring-0 placeholder:text-gray-500"
              />
              <Button
                type="submit"
                disabled={!newComment.trim()}
                variant="ghost"
                className="text-[#00CFFF] font-bold text-sm hover:text-white disabled:opacity-30"
              >
                Post
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}