import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DropCard({ drop, user, dropUser, likeMutation, handleShare }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", drop.id],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: drop.id }),
    enabled: showComments
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list()
  });

  const getCommentUser = (email) => users.find(u => u.email === email) || { full_name: "User" };

  const commentMutation = useMutation({
    mutationFn: async (content) => {
      await base44.entities.GlowDropComment.create({
        drop_id: drop.id,
        user_email: user.email,
        content
      });
      if (drop.user_email && drop.user_email !== user.email) {
        await base44.entities.Notification.create({
          user_email: drop.user_email,
          type: "reply",
          message: `${user.full_name} commented on your Glow Drop!`,
          link: `/Feed`
        });
      }
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", drop.id] });
    }
  });

  const submitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment);
  };

  return (
    <div className="bg-[#0B0F1A] border-b border-white/10 sm:border sm:rounded-2xl sm:mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
            {dropUser.profile_picture_url ? <img src={dropUser.profile_picture_url} className="w-full h-full object-cover" /> : (dropUser.full_name?.charAt(0) || "?")}
          </div>
          <div>
            <div className="font-bold font-['Inter'] text-sm flex items-center gap-1.5 text-white">
              {dropUser.full_name}
              {drop.status === 'approved' && <span className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white" title="Approved Drop">✓</span>}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">♫ Faith Always On • Original Audio</div>
          </div>
        </div>
        <MoreHorizontal className="text-white w-5 h-5 cursor-pointer" />
      </div>

      {/* Content Image / Video area */}
      <div 
        className="w-full aspect-[4/5] bg-gradient-to-br from-[#121826] to-[#0B0F1A] flex flex-col justify-center items-center text-center relative group"
        style={drop.media_url ? { backgroundImage: `url(${drop.media_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        onDoubleClick={() => likeMutation.mutate({id: drop.id, likes: drop.likes_count || 0, authorEmail: drop.user_email, authorName: dropUser.full_name})}
      >
        {!drop.media_url && (
          <div className="p-8 relative z-0">
            <h2 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] text-[#00CFFF] mb-6 leading-tight">
              {drop.verse}
            </h2>
            <p className="text-base sm:text-lg text-white font-['Inter'] leading-relaxed max-w-sm">
              "{drop.reflection}"
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
          <Heart className="w-24 h-24 text-white drop-shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300" />
        </div>
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-4 items-center">
            <button onClick={() => likeMutation.mutate({id: drop.id, likes: drop.likes_count || 0, authorEmail: drop.user_email, authorName: dropUser.full_name})} className="hover:opacity-70 transition-opacity focus:outline-none">
              <Heart className={`w-6 h-6 ${drop.likes_count > 0 ? "text-red-500 fill-red-500" : "text-white"}`} />
            </button>
            <button onClick={() => setShowComments(!showComments)} className="hover:opacity-70 transition-opacity focus:outline-none">
              <MessageCircle className="w-6 h-6 text-white" />
            </button>
            <button onClick={() => handleShare(drop)} className="hover:opacity-70 transition-opacity focus:outline-none">
              <Share2 className="w-6 h-6 text-white" />
            </button>
          </div>
          <button className="hover:opacity-70 transition-opacity focus:outline-none">
            <Bookmark className="w-6 h-6 text-white" />
          </button>
        </div>
        
        <div className="font-bold text-sm text-white mb-1">{drop.likes_count || 0} likes</div>
        
        <div className="text-sm text-white">
          <span className="font-bold mr-2">{dropUser.full_name}</span>
          {drop.media_url ? (
            <span>{drop.verse} - {drop.reflection}</span>
          ) : (
            <span>#FaithAlwaysOn</span>
          )}
        </div>
        
        {drop.hashtags && (
          <div className="text-sm mt-1 text-[#00CFFF]">
            {drop.hashtags.split(' ').map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
          </div>
        )}

        {showComments && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {comments.map(c => (
                <div key={c.id} className="text-sm">
                  <span className="font-bold text-white mr-2">{getCommentUser(c.user_email).full_name}</span>
                  <span className="text-gray-300">{c.content}</span>
                </div>
              ))}
              {comments.length === 0 && <div className="text-xs text-gray-500 italic">No comments yet. Be the first!</div>}
            </div>
            <form onSubmit={submitComment} className="flex gap-2">
              <Input 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                placeholder="Add a comment..." 
                className="bg-black/20 border-white/10 text-white h-9 text-sm"
              />
              <Button type="submit" disabled={!newComment.trim() || commentMutation.isPending} size="sm" className="bg-[#00CFFF] text-black hover:bg-white h-9">
                Post
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}