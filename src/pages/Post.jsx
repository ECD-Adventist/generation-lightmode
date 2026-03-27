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
    mutationFn: async ({ id, likes, authorEmail }) => {
      if (!currentUser) { toast.error("Please log in to like"); return; }
      const alreadyLiked = userLikes.some((like) => like.drop_id === id);
      if (alreadyLiked) { toast.error("You already liked this!"); return; }
      await base44.entities.GlowDropLike.create({ drop_id: id, user_email: currentUser.email });
      await base44.entities.GlowDrop.update(id, { likes_count: (likes || 0) + 1 });
      const authorUser = allUsers.find((u) => u.email === authorEmail);
      if (authorEmail && authorEmail !== currentUser.email && isNotificationEnabled(authorUser, "likes")) {
        await base44.entities.Notification.create({
          user_email: authorEmail,
          type: "like",
          message: `${currentUser.full_name || "Someone"} liked your Glow Drop!`,
          link: `/Feed`,
        });
      }
      toast.success("❤️ Liked!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postDrop", dropId] });
      queryClient.invalidateQueries({ queryKey: ["userLikes", currentUser?.email] });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
    },
  });

  const handleShare = async (drop) => {
    const shareText = `✨ Generation LightMode\n\n"${drop.verse}"\n\n${drop.reflection}\n\nJoin the movement at ${window.location.origin}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Glow Drop", text: shareText }); } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  if (isLoading || !drop) {
    return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white px-4 py-6 md:py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to={backUrl} className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition">
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