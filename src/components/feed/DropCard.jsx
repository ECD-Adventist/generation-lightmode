import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Flag } from "lucide-react";
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

  const { data: savedDrops = [] } = useQuery({
    queryKey: ["savedDrops", drop.id, user?.email],
    queryFn: () => base44.entities.SavedDrop.filter({ drop_id: drop.id, user_email: user?.email }),
    enabled: !!user
  });

  const isSaved = savedDrops.length > 0;

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await base44.entities.SavedDrop.delete(savedDrops[0].id);
      } else {
        await base44.entities.SavedDrop.create({ drop_id: drop.id, user_email: user.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedDrops", drop.id, user?.email] });
      queryClient.invalidateQueries({ queryKey: ["mySavedDrops"] });
      toast.success(isSaved ? "Removed from Saved" : "Saved to your bookmarks");
    }
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
      
      const today = new Date().toISOString().split('T')[0];
      const challenges = await base44.entities.UserDailyChallenge.filter({ user_email: user.email, date_string: today });
      if (!challenges.some(c => c.challenge_id === 'comment')) {
        await base44.entities.UserDailyChallenge.create({ user_email: user.email, date_string: today, challenge_id: 'comment' });
        await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + 5 });
        toast.success("Challenge Completed: Encourage Someone! +5 XP ⚡");
        queryClient.invalidateQueries({ queryKey: ["dailyChallenges"] });
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
    <div className="bg-[#121826]/80 backdrop-blur-sm border border-white/10 rounded-[2rem] mb-8 p-3 shadow-2xl hover:border-[#00CFFF]/40 transition-all duration-300 group">
      {/* Media / Content Area */}
      <div 
        className={`relative w-full rounded-[1.5rem] overflow-hidden ${drop.media_url ? 'aspect-[4/5] sm:aspect-[3/4]' : 'aspect-square sm:aspect-[4/5]'} bg-gradient-to-br from-[#1a1b26] via-[#0B0F1A] to-[#1a103c] flex flex-col justify-center items-center text-center shadow-inner`}
        style={drop.media_url ? { backgroundImage: `url(${drop.media_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        onDoubleClick={() => likeMutation.mutate({id: drop.id, likes: drop.likes_count || 0, authorEmail: drop.user_email, authorName: dropUser.full_name})}
      >
        {/* Gradient Overlays for readability */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-0" />

        {/* User Pill (Top Left) */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-full pr-4 pl-1 py-1 cursor-pointer hover:bg-black/50 transition">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[2px] shrink-0">
            <div className="w-full h-full rounded-full bg-[#0B0F1A] flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
              {dropUser.profile_picture_url ? <img src={dropUser.profile_picture_url} className="w-full h-full object-cover" /> : (dropUser.full_name?.charAt(0) || "?")}
            </div>
          </div>
          <div className="flex flex-col items-start justify-center">
            <span className="font-bold font-['Inter'] text-xs text-white flex items-center gap-1 leading-none mb-0.5">
              {dropUser.full_name}
              {drop.status === 'approved' && <span className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-[7px] text-white shadow-[0_0_8px_rgba(59,130,246,0.8)]">✓</span>}
            </span>
            <span className="text-[10px] text-gray-300 font-medium leading-none">{drop.created_date ? formatDistanceToNow(new Date(drop.created_date), { addSuffix: true }) : ''}</span>
          </div>
        </div>

        {/* Text Content (if no media) */}
        {!drop.media_url && (
          <div className="p-8 relative z-10 w-full h-full flex flex-col items-center justify-center">
            {drop.verse && (
              <h2 className="text-2xl sm:text-4xl font-bold font-['Space_Grotesk'] text-transparent bg-clip-text bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] mb-6 leading-tight drop-shadow-lg">
                {drop.verse}
              </h2>
            )}
            {drop.reflection && (
              <p className="text-lg sm:text-xl text-white font-['Inter'] leading-relaxed max-w-md drop-shadow-md">
                "{drop.reflection}"
              </p>
            )}
          </div>
        )}

        {/* Double Tap Heart */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
          <Heart className="w-24 h-24 text-white/40 drop-shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300" />
        </div>

        {/* Floating Actions (Right Side Stack) */}
        <div className="absolute right-3 bottom-6 z-20 flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-1.5">
            <button 
              onClick={(e) => { e.stopPropagation(); likeMutation.mutate({id: drop.id, likes: drop.likes_count || 0, authorEmail: drop.user_email, authorName: dropUser.full_name}); }} 
              className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-black/50 hover:border-[#00CFFF] transition-all focus:outline-none"
            >
              <Heart className={`w-6 h-6 transition-all ${drop.likes_count > 0 ? "text-red-500 fill-red-500 scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "text-white hover:scale-110"}`} />
            </button>
            <span className="text-white text-xs font-bold drop-shadow-md">{drop.likes_count || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }} 
              className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-black/50 hover:border-[#00CFFF] transition-all focus:outline-none"
            >
              <MessageCircle className="w-6 h-6 text-white hover:scale-110 transition-transform" />
            </button>
            <span className="text-white text-xs font-bold drop-shadow-md">{comments.length || 0}</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <button 
              onClick={(e) => { e.stopPropagation(); handleShare(drop); }} 
              className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-black/50 hover:border-[#00CFFF] transition-all focus:outline-none"
            >
              <Share2 className="w-6 h-6 text-white hover:scale-110 transition-transform" />
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-1.5">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleSaveMutation.mutate(); }}
              className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-black/50 hover:border-[#00CFFF] transition-all focus:outline-none"
            >
              <Bookmark className={`w-6 h-6 transition-transform hover:scale-110 ${isSaved ? "text-[#00CFFF] fill-[#00CFFF]" : "text-white"}`} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <button 
              onClick={(e) => { 
                e.stopPropagation();
                if(!user) return toast.error("Please login to report");
                const reason = window.prompt("Why are you reporting this content?");
                if(reason) {
                  base44.entities.ReportedDrop.create({ drop_id: drop.id, reporter_email: user.email, reason })
                    .then(() => toast.success("Content reported to moderators."));
                }
              }}
              className="w-10 h-10 mt-2 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-black/50 hover:border-red-500 transition-all focus:outline-none"
            >
              <Flag className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </button>
          </div>
        </div>

      </div>

      {/* Verse & Reflection — always shown BELOW the image */}
      {(drop.verse || drop.reflection) && (
        <div className="px-4 pt-3 pb-1">
          {drop.verse && <div className="font-bold text-[#00CFFF] text-sm mb-1">{drop.verse}</div>}
          {drop.reflection && <p className="text-gray-200 text-sm leading-relaxed">{drop.reflection}</p>}
        </div>
      )}

      {/* Tags Row */}
      {(drop.hashtags || drop.category) && (
        <div className="px-2 pt-3 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            {drop.category && (
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#8A5CFF]/20 to-[#00CFFF]/20 text-white text-[11px] font-bold border border-white/10 backdrop-blur-sm uppercase tracking-wider">
                {drop.category}
              </span>
            )}
            {drop.hashtags && (
              <div className="text-[13px] text-[#00CFFF] font-medium opacity-90">
                {drop.hashtags.split(' ').map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments Drawer/Section */}
      {showComments && (
        <div className="mt-3 px-3 py-4 bg-[#0B0F1A]/60 rounded-2xl border border-white/5 space-y-4 shadow-inner">
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3 text-sm">
                <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center shrink-0 font-bold text-[10px] uppercase text-white shadow-md">
                  {getCommentUser(c.user_email).profile_picture_url ? <img src={getCommentUser(c.user_email).profile_picture_url} className="w-full h-full rounded-full object-cover" /> : getCommentUser(c.user_email).full_name.charAt(0)}
                </div>
                <div className="bg-[#121826]/80 backdrop-blur-md px-3.5 py-2.5 rounded-2xl rounded-tl-none border border-white/5 flex-1 shadow-sm">
                  <span className="font-bold text-[#00CFFF] text-xs block mb-1">{getCommentUser(c.user_email).full_name}</span>
                  <span className="text-gray-200 leading-snug">{c.content}</span>
                </div>
              </div>
            ))}
            {comments.length === 0 && <div className="text-xs text-gray-500 italic text-center py-6">No comments yet. Ignite the conversation! 🔥</div>}
          </div>
          <form onSubmit={submitComment} className="flex gap-2 relative mt-2">
            <Input 
              value={newComment} 
              onChange={(e) => setNewComment(e.target.value)} 
              placeholder="Add a comment..." 
              className="bg-[#121826] border-white/10 text-white h-12 pl-4 pr-20 rounded-full text-sm focus-visible:ring-[#00CFFF]/50 shadow-inner"
            />
            <Button 
              type="submit" 
              disabled={!newComment.trim() || commentMutation.isPending} 
              size="sm" 
              className="absolute right-1 top-1 bottom-1 h-10 rounded-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold hover:opacity-90 px-4 transition-all"
            >
              Post
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}