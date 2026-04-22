import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Home, Bookmark, ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import DropCard from "@/components/feed/DropCard";

export default function Saved() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) { setUser(await base44.auth.me()); }
        else { base44.auth.redirectToLogin(window.location.pathname); }
      } catch (err) { console.error("Auth check failed:", err); }
      finally { setAuthChecked(true); }
    }
    checkAuth();
  }, []);

  const { data: savedRecords = [], isLoading: savedLoading } = useQuery({
    queryKey: ["mySavedDrops", user?.email],
    queryFn: () => base44.entities.SavedDrop.filter({ user_email: user?.email }),
    enabled: !!user
  });

  const { data: drops = [], isLoading: dropsLoading } = useQuery({
    queryKey: ["allGlowDrops"],
    queryFn: () => base44.entities.GlowDrop.list(),
    retry: 1
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => { const res = await base44.functions.invoke("listPublicUsers", {}); return res.data; },
    enabled: !!user,
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ["userLikes", user?.email],
    queryFn: () => base44.entities.GlowDropLike.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const likeMutation = useMutation({
    mutationFn: async ({ id, authorEmail, authorName }) => {
      if (!user) { toast.error("Please log in to like"); return; }
      const response = await base44.functions.invoke('handleLikeDrop', { drop_id: id, author_email: authorEmail, author_name: authorName, action: 'toggle' });
      toast.success(response.data.action === 'unlike' ? "❤️ Unliked!" : "❤️ Liked!");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      queryClient.invalidateQueries({ queryKey: ["userLikes", user?.email] });
    }
  });

  const handleShare = async (drop) => {
    const shareText = `✨ Generation LightMode\n\n"${drop.verse}"\n\n${drop.reflection}\n\nJoin the movement at ${window.location.origin}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Glow Drop', text: shareText }); } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  const getUserInfo = (email) => {
    if (user?.email === email) return user;
    return users.find(u => u.email === email) || { full_name: email?.split("@")[0] || "Glow Believer", email };
  };

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>;
  }

  if (authChecked && !user) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>Redirecting to login...</div>;
  }

  const savedDropIds = savedRecords.map(r => r.drop_id);
  const mySavedDrops = drops.filter(d => savedDropIds.includes(d.id));

  return (
    <div className="min-h-screen pb-20 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      {/* Top Nav */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-3 flex items-center gap-4" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E2E8F0" }}>
        <Link to={createPageUrl("Feed")} className="transition" style={{ color: "#4A5878" }}><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold" style={{ color: "#0B1B3D" }}>Saved Drops</h1>
        <div className="flex-1" />
        <Link to={createPageUrl("Feed")} className="text-sm font-bold" style={{ color: "#0B3FD9" }}>← Feed</Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {savedLoading || dropsLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>
        ) : mySavedDrops.length === 0 ? (
          <div className="text-center py-20 rounded-3xl" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
            <Bookmark className="w-10 h-10 mx-auto mb-3" style={{ color: "#8A97B5" }} />
            <p className="font-bold text-lg" style={{ color: "#0B1B3D" }}>No saved drops yet.</p>
            <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>Bookmark posts you love and they'll appear here.</p>
            <Link to={createPageUrl("Feed")} className="inline-block mt-4 font-bold" style={{ color: "#0B3FD9" }}>Explore Feed</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {mySavedDrops.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)).map(drop => (
              <DropCard
                key={drop.id}
                drop={drop}
                user={user}
                dropUser={getUserInfo(drop.user_email)}
                likeMutation={likeMutation}
                handleShare={handleShare}
                userLikes={userLikes}
                savedDropRecords={savedRecords}
                allUsers={users}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}