import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, Globe, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { buildShareText, getSharePreviewUrl } from "@/lib/sharePreview";
import { tryNativeShare } from "@/lib/shareActions";
import ShareFallbackDialog from "@/components/share/ShareFallbackDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import KeepIt100Poster from "@/components/keep-it-100/KeepIt100Poster";
import CodesOfTruthPoster from "@/components/codes-of-truth/CodesOfTruthPoster";
import RepostButton from "@/components/feed/RepostButton";
import useRequireAuth from "@/hooks/useRequireAuth";
import StandardPostImage from "@/components/feed/StandardPostImage";

export default function GlowFeedCard({ drop, currentUser, dropUser, userLikes = [], guestToken, likeIdentity }) {
  const [showComments, setShowComments] = useState(false);
  const [mediaFit, setMediaFit] = useState("pending");
  const [newComment, setNewComment] = useState("");
  const [shareFallback, setShareFallback] = useState(null);
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth(currentUser);

  const userHasLiked = userLikes.some(like => like.drop_id === drop.id);

  const { data: comments = [] } = useQuery({
    queryKey: ["glow_feed_comments", drop.id],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: drop.id }),
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke("handleLikeDrop", {
        drop_id: drop.id,
        author_email: drop.user_email,
        author_name: authorProfile.full_name,
        action: userHasLiked ? "unlike" : "like",
        ...(!currentUser ? { visitor_token: guestToken } : {}),
      });
      if (!currentUser) {
        const likes = new Set(JSON.parse(localStorage.getItem("lightmode_guest_likes") || "[]"));
        response.data.action === "unlike" ? likes.delete(drop.id) : likes.add(drop.id);
        localStorage.setItem("lightmode_guest_likes", JSON.stringify([...likes]));
      }
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["glowFeed"] });
      await queryClient.cancelQueries({ queryKey: ["glowFeedLikes", likeIdentity] });
      const prev = queryClient.getQueryData(["glowFeed"]);
      const prevLikes = queryClient.getQueryData(["glowFeedLikes", likeIdentity]) || [];
      queryClient.setQueryData(["glowFeed"], (old = []) =>
        old.map(d =>
          d.id === drop.id
            ? { ...d, likes_count: userHasLiked ? Math.max(0, (d.likes_count || 1) - 1) : (d.likes_count || 0) + 1 }
            : d
        )
      );
      queryClient.setQueryData(["glowFeedLikes", likeIdentity], userHasLiked
        ? prevLikes.filter(like => like.drop_id !== drop.id)
        : [...prevLikes, { drop_id: drop.id }]);
      return { prev, prevLikes };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["glowFeed"], ctx.prev);
      if (ctx?.prevLikes) queryClient.setQueryData(["glowFeedLikes", likeIdentity], ctx.prevLikes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["glowFeed"] });
      queryClient.invalidateQueries({ queryKey: ["glowFeedLikes", likeIdentity] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content) => {
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

  const submitComment = (event) => {
    event.preventDefault();
    if (!currentUser) { requireAuth(); return; }
    if (newComment.trim()) commentMutation.mutate(newComment);
  };

  const handleShare = async () => {
    if (!drop?.id) return toast.error("This post is no longer available");
    if (drop.hidden || drop.is_flagged || drop.status === "rejected") return toast.error("This post is restricted and cannot be shared");
    const author = drop?.author_name || drop?.author_username || "Generation LightMode";
    const title = drop?.verse || `Post by ${author}`;
    const url = getSharePreviewUrl("glowdrop", drop?.id || "post");
    const text = buildShareText(title, drop?.reflection, url);
    const share = { id: drop?.id, title, text, url };
    const result = await tryNativeShare(share, { contentType: "glowfeed", contentId: drop?.id });
    if (result.status === "failed" || result.status === "unavailable") setShareFallback(share);
  };

  const authorProfile = {
    ...(dropUser || {}),
    email: drop.user_email,
    username: drop.author_username || dropUser?.username || "",
    full_name: dropUser?.display_name || dropUser?.username || dropUser?.full_name || drop.author_name || drop.user_email?.split("@")[0] || "Glow Believer",
    profile_picture: drop.author_avatar || dropUser?.profile_picture || dropUser?.profile_picture_url || "",
    profile_picture_url: drop.author_avatar || dropUser?.profile_picture || dropUser?.profile_picture_url || "",
  };
  const territory = authorProfile?.territory_name || authorProfile?.country || null;
  const isKeepIt100 = !drop.media_url && (drop.category === "Keep It 100" || /keepit100/i.test(drop.hashtags || ""));
  const isCodeOfTruth = !drop.media_url && drop.category === "Code of Truth";

  return (
    <div className="bg-[#121826]/80 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden hover:border-[#00CFFF]/30 transition-all duration-300 shadow-xl">
      {drop.repost && <div className="px-4 py-2 text-xs font-bold text-[#00CFFF]">Reposted by {drop.repost.reposter_name || "a member"} · Originally posted by {authorProfile.full_name}</div>}
      <ShareFallbackDialog share={shareFallback} onClose={() => setShareFallback(null)} />

      {/* Media */}
      {drop.media_url && (
        <div className={`relative w-full overflow-hidden flex items-center justify-center bg-[#071A33] ${mediaFit === "contain" ? "" : "aspect-[4/5]"}`} style={{ maxHeight: 720 }}>
          <StandardPostImage src={drop.media_url} alt={drop.verse || "Glow Drop"} loading="lazy" onFitChange={setMediaFit} />
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
                  src={authorProfile.profile_picture || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-xs truncate">{authorProfile.username || authorProfile.full_name}</p>
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
            onClick={() => { if (!likeMutation.isPending) likeMutation.mutate(); }}
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
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition ml-auto"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <RepostButton drop={drop} user={currentUser} compact dark />
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
              onSubmit={submitComment}
              className="flex gap-2"
            >
              <Input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder={currentUser ? "Add a comment…" : "Sign in to comment…"}
                className="bg-[#0B0F1A] border-white/10 text-white h-9 text-xs rounded-full"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || commentMutation.isPending}
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