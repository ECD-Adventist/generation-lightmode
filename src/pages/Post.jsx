import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { fetchAllUserGlowDropLikes } from "@/lib/glowDropLikes";
import { dualWriteSupabase } from "@/lib/dualWriteSupabase";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { isNotificationEnabled } from "@/lib/notifications";
import { buildShareText, getSharePreviewUrl } from "@/lib/sharePreview";
import { tryNativeShare } from "@/lib/shareActions";
import ShareFallbackDialog from "@/components/share/ShareFallbackDialog";
import DropCard from "@/components/feed/DropCard";
import { useAuth } from "@/lib/AuthContext";

export default function Post() {
  const { user: currentUser } = useAuth();
  const [shareFallback, setShareFallback] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const dropId = urlParams.get("id");
  const backUser = urlParams.get("user");

  const { data: drops = [], isLoading, isError: postError, refetch: refetchPost } = useQuery({
    queryKey: ["postDrop", dropId],
    queryFn: async () => [await base44.entities.GlowDrop.get(dropId)],
    enabled: !!dropId,
    placeholderData: () => {
      const cachedFeed = queryClient.getQueryData(["allGlowDrops"]);
      const cachedDrop = cachedFeed?.pages
        ?.flatMap(page => page?.items || [])
        .find(item => item?.id === dropId);
      return cachedDrop ? [cachedDrop] : undefined;
    },
  });

  const drop = drops[0];
  const authorEmail = drop?.user_email || backUser;

  const { data: allUsers = [] } = useQuery({
    queryKey: ["postAuthorIdentity", authorEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", { emails: [authorEmail], limit: 1 });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!authorEmail,
    staleTime: 1000 * 60 * 5,
  });

  const { data: leaderAccounts = [] } = useQuery({
    queryKey: ["postLeaderAccount", drop?.user_email],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicLeaderAccounts", { emails: [drop.user_email], limit: 1 });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!drop?.user_email,
    staleTime: 1000 * 60 * 5,
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ["userLikes", currentUser?.email],
    queryFn: () => fetchAllUserGlowDropLikes(base44.entities.GlowDropLike, currentUser?.email),
    enabled: !!currentUser,
  });

  const { data: savedDropRecords = [] } = useQuery({
    queryKey: ["savedDrops", currentUser?.email],
    queryFn: () => base44.entities.SavedDrop.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", currentUser?.id],
    queryFn: () => base44.entities.Follow.filter({ follower_id: currentUser?.id }),
    enabled: !!currentUser?.id,
  });

  const { data: postComments = [] } = useQuery({
    queryKey: ["postComments", dropId],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: dropId }),
    enabled: !!dropId,
  });

  // Follow records store user IDs only — resolve emails for email-based checks.
  const followingWithEmails = React.useMemo(() => {
    const emailById = new Map();
    allUsers.forEach(u => { if (u.id) emailById.set(u.id, u.email); });
    leaderAccounts.forEach(a => { if (a.id) emailById.set(a.id, a.leader_email); });
    return following.map(f => f.following_email ? f : { ...f, following_email: emailById.get(f.following_id) });
  }, [following, allUsers, leaderAccounts]);

  const fallbackUrl = backUser ? `${createPageUrl("Profile")}?user=${encodeURIComponent(backUser)}` : createPageUrl("Feed");

  // Go back to wherever the user actually came from. If there's no in-app
  // history (e.g. opened via a shared link), fall back to a sensible page.
  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallbackUrl);
  };

  const getUserInfo = (email) => {
    if (currentUser?.email === email) return currentUser;
    const found = allUsers.find((u) => u.email === email);
    if (found) return found;
    const leader = leaderAccounts.find(a => a.leader_email === email);
    if (leader) {
      return {
        id: leader.id,
        email: leader.leader_email,
        full_name: leader.leader_name,
        bio: leader.leader_bio,
        profile_picture: leader.leader_profile_picture_url,
        profile_picture_url: leader.leader_profile_picture_url,
        country: leader.leader_country,
        is_managed_leader: true,
      };
    }
    return { username: email?.split("@")[0] || "Glow Believer", email };
  };

  const likeMutation = useMutation({
    mutationFn: async ({ id, authorEmail, authorName, action }) => {
      if (!currentUser) { toast.error("Please log in to like"); return; }
      const response = await base44.functions.invoke('handleLikeDrop', {
        drop_id: id,
        author_email: authorEmail,
        author_name: authorName,
        action
      });
      toast.success(response.data.action === 'unlike' ? "❤️ Unliked!" : "❤️ Liked!");
      return response.data;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["postDrop", dropId] });
      await queryClient.cancelQueries({ queryKey: ["userLikes", currentUser?.email] });
      const prevDrop = queryClient.getQueryData(["postDrop", dropId]);
      const prevLikes = queryClient.getQueryData(["userLikes", currentUser?.email]) || [];
      const alreadyLiked = prevLikes.some(like => like.drop_id === id);
      queryClient.setQueryData(["postDrop", dropId], old => (old || []).map(item => item.id === id ? {
        ...item,
        likes_count: alreadyLiked ? Math.max(0, (item.likes_count || 1) - 1) : (item.likes_count || 0) + 1
      } : item));
      queryClient.setQueryData(["userLikes", currentUser?.email], old => alreadyLiked
        ? (old || []).filter(like => like.drop_id !== id)
        : [...(old || []), { drop_id: id, user_email: currentUser?.email }]
      );
      return { prevDrop, prevLikes };
    },
    onError: (err, vars, context) => {
      if (context?.prevDrop) queryClient.setQueryData(["postDrop", dropId], context.prevDrop);
      if (context?.prevLikes) queryClient.setQueryData(["userLikes", currentUser?.email], context.prevLikes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["postDrop", dropId] });
      queryClient.invalidateQueries({ queryKey: ["userLikes", currentUser?.email] });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
    },
  });

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      if (!currentUser) { toast.error("Please log in to follow"); return; }
      const targetUser = getUserInfo(targetEmail);
      const existing = followingWithEmails.find(f => f.following_email === targetEmail || (targetUser?.id && f.following_id === targetUser.id));
      if (existing) {
        await base44.entities.Follow.delete(existing.id);
        return "unfollow";
      }
      if (!targetUser?.id) { toast.error("Could not find that member."); return; }
      const followRec = await base44.entities.Follow.create({ follower_id: currentUser.id, following_id: targetUser.id });
      dualWriteSupabase("follows", followRec);
      if (isNotificationEnabled(targetUser, "follows")) {
        try {
          await base44.functions.invoke("createNotification", {
            user_id: targetUser.id,
            type: "follow",
            reference_id: `follow_${currentUser.id}`,
            message: `${currentUser.username || currentUser.full_name || "Someone"} started following you.`,
            link: createPageUrl("Profile") + `?user=${encodeURIComponent(currentUser.email)}`
          });
        } catch (notificationError) {
          console.error('[notification:error]', { type: 'follow', recipient: targetUser.id, action: 'follow_user', error: notificationError });
        }
      }
      return "follow";
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ["following", currentUser?.id] });
      toast.success(action === "unfollow" ? "Unfollowed" : "Following! ⚡");
    },
  });

  const handleShare = async (drop) => {
    if (!drop?.id) return toast.error("This post is no longer available");
    if (drop.hidden || drop.is_flagged || drop.status === "rejected") return toast.error("This post is restricted and cannot be shared");
    const author = drop?.author_name || drop?.author_username || "Generation LightMode";
    const title = drop?.verse || `Post by ${author}`;
    const shareUrl = getSharePreviewUrl("glowdrop", drop?.id || "post");
    const shareText = buildShareText(title, drop?.reflection, shareUrl);
    const share = { id: drop?.id, title, text: shareText, url: shareUrl };

    // If the device supports file sharing and the post has an image, attach the actual image
    if (typeof navigator.canShare === "function" && typeof navigator.share === "function" && drop.media_url) {
      try {
        const res = await fetch(drop.media_url, { mode: "cors" });
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], `post-${drop.id}.png`, { type: blob.type || "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: share.title || "Generation LightMode", text: share.text, files: [file] });
            return;
          }
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        // Fall through to text-based native share below
      }
    }

    const result = await tryNativeShare(share, { contentType: "post", contentId: drop?.id });
    if (result.status === "failed" || result.status === "unavailable") setShareFallback(share);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>;
  }

  if (postError || !drop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
        <p className="font-bold">This post could not be loaded.</p>
        <button type="button" onClick={() => refetchPost()} className="min-h-11 rounded-full px-5 text-sm font-bold text-white" style={{ background: "#0B3FD9" }}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <ShareFallbackDialog share={shareFallback} onClose={() => setShareFallback(null)} />
      {/* Sticky header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.85)", borderColor: "#E6ECF5" }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full transition active:scale-90"
            style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B3FD9", boxShadow: "0 1px 4px rgba(11, 63, 217, 0.06)" }}
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-bold" style={{ color: "#0B1B3D" }}>Post</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 md:py-7">
        <DropCard
          drop={drop}
          user={currentUser}
          isGuest={!currentUser}
          dropUser={getUserInfo(drop.user_email)}
          likeMutation={likeMutation}
          handleShare={handleShare}
          userLikes={userLikes}
          allUsers={allUsers}
          savedDropRecords={savedDropRecords}
          leaderAccounts={leaderAccounts}
          following={followingWithEmails}
          followMutation={followMutation}
          commentsCount={postComments.length}
        />
      </div>
    </div>
  );
}