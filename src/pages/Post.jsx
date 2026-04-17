import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  const { data: userLikes = [] } = useQuery({
    queryKey: ["userLikes", currentUser?.email],
    queryFn: () => base44.entities.GlowDropLike.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser,
  });

  const backUrl = backUser ? `${createPageUrl("Profile")}?user=${encodeURIComponent(backUser)}` : createPageUrl("Feed");

  const getUserInfo = (email) => {
    if (currentUser?.email === email) return currentUser;
    const found = allUsers.find((u) => u.email === email);
    if (found) return found;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postDrop", dropId] });
      queryClient.invalidateQueries({ queryKey: ["userLikes", currentUser?.email] });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
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
    <div className="min-h-screen px-4 py-6 md:py-8 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to={backUrl} className="inline-flex items-center gap-2 transition" style={{ color: "#4A5878" }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        <DropCard
          drop={drop}
          user={currentUser}
          dropUser={getUserInfo(drop.user_email)}
          likeMutation={likeMutation}
          handleShare={handleShare}
          userLikes={userLikes}
        />
      </div>
    </div>
  );
}