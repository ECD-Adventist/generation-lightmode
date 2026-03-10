import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Heart, MessageCircle, Share2, MoreHorizontal, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function Feed() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

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

  const { data: drops = [], isLoading: dropsLoading } = useQuery({
    queryKey: ["allGlowDrops"],
    queryFn: () => base44.entities.GlowDrop.list('-created_date', 50)
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list()
  });

  const likeMutation = useMutation({
    mutationFn: async ({ id, likes, authorEmail, authorName }) => {
      await base44.entities.GlowDrop.update(id, { likes_count: likes + 1 });
      if (authorEmail && authorEmail !== user?.email) {
        await base44.entities.Notification.create({
          user_email: authorEmail,
          type: "like",
          message: `${user?.full_name || 'Someone'} liked your Glow Drop!`,
          link: `/Feed`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
    }
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email, read: false }),
    enabled: !!user
  });

  // Real-time subscription for notifications
  useEffect(() => {
    if (!user?.email) return;
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data.user_email === user.email && !event.data.read) {
        toast(event.data.message, { icon: '🔔' });
        queryClient.invalidateQueries({ queryKey: ["notifications", user.email] });
      }
    });
    return unsubscribe;
  }, [user?.email, queryClient]);

  const handleShare = async (drop) => {
    const shareText = `✨ Generation LightMode\n\n"${drop.verse}"\n\n${drop.reflection}\n\nJoin the movement at ${window.location.origin}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Glow Drop',
          text: shareText,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  const getUserInfo = (email) => {
    return users.find(u => u.email === email) || { full_name: "Glow Believer" };
  };

  if (dropsLoading || usersLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white pt-8 pb-20 relative overflow-hidden">
      <div style={{ position: "absolute", top: "0%", left: "50%", transform: "translateX(-50%)", width: "80%", height: "40%", background: "radial-gradient(circle, rgba(0,207,255,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
      
      <div className="max-w-xl mx-auto px-4 relative z-10">
        <div className="flex justify-between items-center mb-8 sticky top-0 z-50 bg-[#0B0F1A]/80 backdrop-blur-md py-4 border-b border-white/5">
          <h1 className="text-3xl font-bold font-['Space_Grotesk'] text-transparent bg-clip-text bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF]">Light Feed</h1>
          <div className="flex gap-3 items-center">
            <div className="relative">
              <button className="w-10 h-10 rounded-full bg-[#121826] border border-white/10 flex items-center justify-center hover:bg-white/5 transition relative">
                <Bell className="w-5 h-5 text-gray-300" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0B0F1A] rounded-full"></span>
                )}
              </button>
            </div>
            <Link to={createPageUrl("Dashboard")} className="w-10 h-10 rounded-full bg-[#121826] border border-white/10 flex items-center justify-center hover:bg-white/5 transition" title="Dashboard">
              📊
            </Link>
            <Link to={createPageUrl("Profile")} className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00CFFF] to-[#8A5CFF] p-[2px]" title="Profile">
              <div className="w-full h-full rounded-full bg-[#0B0F1A] flex items-center justify-center text-xs font-bold uppercase overflow-hidden">
                {user.full_name?.charAt(0) || "U"}
              </div>
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          {drops.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="text-4xl mb-4">✨</div>
              <p>The feed is empty. Be the first to share your light!</p>
              <Link to={createPageUrl("Dashboard")} className="inline-block mt-4 text-[#00CFFF] hover:underline">Submit a Drop</Link>
            </div>
          ) : (
            drops.map(drop => (
              <DropCard 
                key={drop.id} 
                drop={drop} 
                user={user} 
                dropUser={getUserInfo(drop.user_email)}
                likeMutation={likeMutation}
                handleShare={handleShare}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}