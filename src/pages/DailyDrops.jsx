import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Home, Users, Bell, Zap, MessageCircle, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DropCard from "@/components/feed/DropCard";

export default function DailyDrops() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const me = await base44.auth.me();
          setUser(me);
        } else {
          base44.auth.redirectToLogin(window.location.pathname);
        }
      } catch (err) {}
    }
    checkAuth();
  }, []);

  const { data: dailyDrops = [], isLoading: dropsLoading } = useQuery({
    queryKey: ["dailySystemDrops"],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: "system@lightmode.com" }, '-created_date', 100),
    enabled: !!user
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsersDaily"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ["userLikesDaily", user?.email],
    queryFn: () => base44.entities.GlowDropLike.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const { data: savedDropRecords = [] } = useQuery({
    queryKey: ["savedDropsDaily", user?.email],
    queryFn: () => base44.entities.SavedDrop.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const systemUser = { email: "system@lightmode.com", full_name: "Generation LightMode", country: "Global" };

  const handleShare = (drop) => {
    const text = `"${drop.reflection || drop.verse}"\n\n— ${drop.category || "Daily Truth"}`;
    if (navigator.share) {
      navigator.share({ title: "Generation LightMode", text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  if (!user || dropsLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
              alt="LightMode"
              style={{ height: 56, width: "auto", filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to={createPageUrl("GlowGroups")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Users className="w-4 h-4" /><span className="hidden sm:inline">Groups</span>
            </Link>
            <Link to={createPageUrl("Notifications")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Bell className="w-4 h-4" /><span className="hidden sm:inline">Alerts</span>
            </Link>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Zap className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to={createPageUrl("Profile")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <MessageCircle className="w-4 h-4" /><span className="hidden sm:inline">Profile</span>
            </Link>
            <Link to={createPageUrl("Home")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-[#00CFFF] hover:bg-white/5 transition text-sm font-medium border border-white/5">
              <Globe className="w-4 h-4" /> Website
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold font-['Space_Grotesk'] mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF]">
            Daily Drops
          </h1>
          <p className="text-gray-400">The system posts here daily. Catch up on what you missed!</p>
        </div>

        {dailyDrops.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-[#121826]/50 rounded-2xl border border-white/5">
            <div className="text-4xl mb-4">✨</div>
            <p className="font-bold text-lg">No daily drops yet.</p>
            <p className="text-sm mt-1">Check back soon for daily Code of Truth and Keep It 100 posts!</p>
          </div>
        ) : (
          <div className="flex flex-col px-3 py-4 gap-8">
            {dailyDrops.map(drop => (
              <DropCard
                key={drop.id}
                drop={drop}
                user={user}
                dropUser={systemUser}
                likeMutation={{ mutate: () => {} }}
                handleShare={handleShare}
                userLikes={userLikes}
                allUsers={allUsers}
                savedDropRecords={savedDropRecords}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}