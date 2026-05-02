import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, Globe, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import KeepIt100Poster from "@/components/keep-it-100/KeepIt100Poster";
import CodesOfTruthPoster from "@/components/codes-of-truth/CodesOfTruthPoster";

export default function GlowFeedCard({ drop, currentUser, dropUser, userLikes = [] }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const userHasLiked = userLikes.some(like => like.drop_id === drop.id);

  const { data: comments = [] } = useQuery({
    queryKey: ["glow_feed_comments", drop.id],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: drop.id }),
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }
      await base44.functions.invoke("handleLikeDrop", {
        drop_id: drop.id,
        author_email: drop.user_email,
        author_name: dropUser?.full_name,
        action: "toggle",
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["glowFeed"] });
      const prev = queryClient.getQueryData(["glowFeed"]);
      queryClient.setQueryData(["glowFeed"], (old = []) =>
        old.map(d =>
          d.id === drop.id
            ? { ...d, likes_count: userHasLiked ? Math.max(0, (d.likes_count || 1) - 1) : (d.likes_count || 0) + 1 }
            : d
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["glowFeed"], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["glowFeed"] });
      queryClient.invalidateQueries({ queryKey: ["glowFeedLikes"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content) => {
      if (!currentUser) { base44.auth.redirectToLogin(window.location.pathname); return; }
      if (!content.trim()) return;
      await base44.entities.GlowDropComment.create({ drop_id: drop.id, user_email: currentUser.email, content: content.trim() });
      if (drop.user_email !== currentUser.email) {
        base44.entities.Notification.create({
          user_email: drop.user_email,
          type: "reply",
          message: `${currentUser.full_name || "Someone"} commented on your Glow Drop.`,
          link: `/Post?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`,
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["glow_feed_comments", drop.id] });
      toast.success("Comment posted! ✨");
    },
  });

  const handleShare = async () => {
    const url = `${window.location.origin}/Post?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`;
    const text = `✨ "${drop.verse || ""}" — ${drop.reflection || ""}\n\n${url}`;
    if (navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied!");
    }
  };

  const territory = dropUser?.territory_name || dropUser?.country || null;
  const isKeepIt100 = !drop.media_url && (drop.category === "Keep It 100" || /keepit100/i.test(drop.hashtags || ""));
  const isCodeOfTruth = !drop.media_url && drop.category === "Code of Truth";

  return (
    <div className="bg-[#121826]/80 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden hover:border-[#00CFFF]/30 transition-all duration-300 shadow-xl">

      {/* Media */}
      {drop.media_url && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={drop.media_url} alt={drop.verse || "Glow Drop"} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </div>
      )}

      {/* Text-only card background */}
      {!drop.media_url && (
        isKeepIt100 ? (
          <KeepIt100Poster text={drop.reflection} verse={drop.verse} className="w-full aspect-[4/5]" />
        ) : isCodeOfTruth ? (
          <CodesOfTruthPoster text={drop.reflection} verse={drop.verse} className="w-full aspect-[4/5]" />
        ) : (
        <div className="bg-gradient-to-br from-[#0D1524] via-[#0B0F1A] to-[#1a103c] px-6 pt-6 pb-4 min-h-[120px] flex flex-col justify-center">
          {drop.verse && (
            <h3 className="text-[#00CFFF] font-bold text-base leading-snug mb-2">"{drop.verse}"</h3>
          )}
          {drop.reflection && (
            <p className="text-gray-300 text-sm leading-relaxed">{drop.reflection}</p>
          )}
        </div>
        )
      )}

      <div className="px-4 py-4 space-y-3">
        {/* If there was media, also show text below */}
        {drop.media_url && (drop.verse || drop.reflection) && (
          <div>
            {drop.verse && <div className="text-[#00CFFF] font-bold text-sm mb-1">"{drop.verse}"</div>}
            {drop.reflection && <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{drop.reflection}</p>}
          </div>
        )}

        {/* Author + Territory */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to={createPageUrl("Profile") + `?user=${encodeURIComponent(drop.user_email)}`}
            className="flex items-center gap-2.5 no-underline hover:opacity-80 transition min-w-0"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-[#0B0F1A] overflow-hidden">
                <img
                  src={dropUser?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-xs truncate">{dropUser?.full_name || drop.user_email?.split("@")[0]}</p>
              <p className="text-gray-500 text-[10px]">
                {drop.created_date
                  ? formatDistanceToNow(new Date(drop.created_date.endsWith("Z") ? drop.created_date : drop.created_date + "Z"), { addSuffix: true })
                  : "recently"}
              </p>
            </div>
          </Link>

          {territory && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#00CFFF] bg-[#00CFFF]/10 border border-[#00CFFF]/20 rounded-full px-2.5 py-1 shrink-0">
              <Globe className="w-3 h-3" />
              {territory}
            </div>
          )}
        </div>

        {/* Tags */}
        {(drop.category || drop.hashtags) && (
          <div className="flex flex-wrap gap-1.5">
            {drop.category && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#8A5CFF]/20 text-[#8A5CFF] border border-[#8A5CFF]/20 font-bold uppercase tracking-wide">
                {drop.category}
              </span>
            )}
            {drop.hashtags && (
              <span className="text-[10px] text-[#00CFFF]/80">
                {drop.hashtags.split(" ").map(t => (t.startsWith("#") ? t : `#${t}`)).join(" ")}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-1 border-t border-white/5">
          <button
            onClick={() => likeMutation.mutate()}
            className="flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105"
          >
            <Heart className={`w-4 h-4 transition-all ${userHasLiked ? "text-red-500 fill-red-500" : "text-gray-400 hover:text-red-400"}`} />
            <span className={userHasLiked ? "text-red-400" : "text-gray-400"}>{drop.likes_count || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(v => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#00CFFF] transition"
          >
            <MessageCircle className={`w-4 h-4 ${showComments ? "text-[#00CFFF]" : ""}`} />
            <span>{comments.length || 0}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition ml-auto"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="pt-2 space-y-3">
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {comments.length === 0 && <p className="text-xs text-gray-500 italic text-center py-3">No comments yet — be the first! 🔥</p>}
              {comments.map(c => (
                <div key={c.id} className="flex gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden shrink-0">
                    <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-[#0B0F1A] px-3 py-2 rounded-2xl rounded-tl-none border border-white/5 flex-1">
                    <span className="font-bold text-[#00CFFF]">{c.user_email?.split("@")[0]} </span>
                    <span className="text-gray-300">{c.content}</span>
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={e => { e.preventDefault(); if (newComment.trim()) commentMutation.mutate(newComment); }}
              className="flex gap-2"
            >
              <Input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder={currentUser ? "Add a comment…" : "Log in to comment"}
                disabled={!currentUser}
                className="bg-[#0B0F1A] border-white/10 text-white h-9 text-xs rounded-full"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || commentMutation.isPending || !currentUser}
                className="h-9 rounded-full bg-[#00CFFF] text-black font-bold text-xs px-4"
              >
                {commentMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}