import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { isNotificationEnabled } from "@/lib/notifications";
import DropCard from "@/components/feed/DropCard";

export default function Post() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    enabled: !!currentUser,
  });

  const { data: leaderAccounts = [] } = useQuery({
    queryKey: ["allLeaderAccounts"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicLeaderAccounts", { limit: 200 });
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: managedLeaderAccounts = [] } = useQuery({
    queryKey: ["managedLeaderAccountsForPost", currentUser?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke("listManagedLeaderAccounts", {});
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!currentUser?.email,
    staleTime: 1000 * 60 * 5,
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ["userLikes", currentUser?.email],
    queryFn: () => base44.entities.GlowDropLike.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser,
  });

  const { data: savedDropRecords = [] } = useQuery({
    queryKey: ["savedDrops", currentUser?.email],
    queryFn: () => base44.entities.SavedDrop.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", currentUser?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: currentUser?.email }),
    enabled: !!currentUser,
  });

  const { data: postComments = [] } = useQuery({
    queryKey: ["postComments", dropId],
    queryFn: () => base44.entities.GlowDropComment.filter({ drop_id: dropId }),
    enabled: !!dropId,
  });

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
        email: leader.leader_email,
        full_name: leader.leader_name,
        bio: leader.leader_bio,
        profile_picture_url: leader.leader_profile_picture_url,
        country: leader.leader_country,
        is_managed_leader: true,
      };
    }
    return { full_name: email?.split("@")[0] || "Glow Believer", email };
  };

  const likeMutation = useMutation({
    mutationFn: async ({ id, authorEmail, authorName }) => {
      if (!currentUser) { toast.error("Please log in to like"); return; }
      const response = await base44.functions.invoke('handleLikeDrop', {
        drop_id: id,
        author_email: authorEmail,
        author_name: authorName,
        action: 'toggle'
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
      const existing = following.find(f => f.following_email === targetEmail);
      if (existing) {
        await base44.entities.Follow.delete(existing.id);
        return "unfollow";
      }
      await base44.entities.Follow.create({ follower_email: currentUser.email, following_email: targetEmail });
      const targetUser = getUserInfo(targetEmail);
      if (isNotificationEnabled(targetUser, "follows")) {
        await base44.entities.Notification.create({
          user_email: targetEmail,
          type: "follow",
          message: `${currentUser.full_name || "Someone"} started following you.`,
          link: createPageUrl("Profile") + `?user=${encodeURIComponent(currentUser.email)}`
        });
      }
      return "follow";
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ["following", currentUser?.email] });
      toast.success(action === "unfollow" ? "Unfollowed" : "Following! ⚡");
    },
  });

  const handleShare = async (drop) => {
    const response = await base44.functions.invoke('generateSharePreview', { drop_id: drop.id });
    const shareUrl = response.data.share_url;
    const shareText = `✨ Generation LightMode\n\n"${drop.verse || ''}"\n\n${drop.reflection || ''}\n\n${shareUrl}`;

    document.title = response.data.title || 'Glow Drop';

    const setMeta = (property, content, attr = 'property') => {
      let tag = document.head.querySelector(`meta[${attr}="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content || '');
    };

    setMeta('og:title', response.data.title);
    setMeta('og:description', response.data.description);
    setMeta('og:image', response.data.image_url);
    setMeta('og:url', response.data.share_url);
    setMeta('twitter:title', response.data.title, 'name');
    setMeta('twitter:description', response.data.description, 'name');
    setMeta('twitter:image', response.data.image_url, 'name');
    setMeta('twitter:card', 'summary_large_image', 'name');

    if (navigator.share) {
      try {
        await navigator.share({ title: response.data.title || 'Glow Drop', text: shareText, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Copied to clipboard!');
    }
  };

  if (isLoading || !drop) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>;
  }

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "linear-gradient(90deg, #F6F8FC 0%, #EEF3FF 18%, #F8FAFC 50%, #EEF3FF 82%, #F6F8FC 100%)", color: "#0B1B3D" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.85)", borderColor: "#E6ECF5" }}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
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

      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-5 md:py-7">
        <DropCard
          drop={drop}
          user={currentUser}
          dropUser={getUserInfo(drop.user_email)}
          likeMutation={likeMutation}
          handleShare={handleShare}
          userLikes={userLikes}
          allUsers={allUsers}
          savedDropRecords={savedDropRecords}
          leaderAccounts={leaderAccounts}
          managedLeaderAccounts={managedLeaderAccounts}
          following={following}
          followMutation={followMutation}
          commentsCount={postComments.length}
        />
      </div>
    </div>
  );
}