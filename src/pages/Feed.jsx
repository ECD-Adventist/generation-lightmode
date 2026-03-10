import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Heart, MessageCircle, Share2, MoreHorizontal, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
            drops.map(drop => {
              const dropUser = getUserInfo(drop.user_email);
              return (
                <div key={drop.id} className="bg-[#121826]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-3 cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20 flex items-center justify-center font-bold text-sm uppercase">
                        {dropUser.full_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div className="font-bold font-['Inter'] text-sm flex items-center gap-1.5">
                          {dropUser.full_name} 
                          {drop.status === 'approved' && <span className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white" title="Approved Drop">✓</span>}
                        </div>
                        <div className="text-xs text-gray-500">{drop.created_date ? formatDistanceToNow(new Date(drop.created_date), {addSuffix: true}) : 'Recently'}</div>
                      </div>
                    </div>
                    <MoreHorizontal className="text-gray-400 w-5 h-5 cursor-pointer" />
                  </div>

                  {/* Content (Instagram image equivalent) */}
                  <div className="p-8 bg-gradient-to-br from-[#0B0F1A] to-[#121826] aspect-square flex flex-col justify-center items-center text-center relative group border-b border-white/5">
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 cursor-pointer" onDoubleClick={() => likeMutation.mutate({id: drop.id, likes: drop.likes_count || 0})}>
                      <Heart className="w-20 h-20 text-white drop-shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-['Space_Grotesk'] text-[#00CFFF] mb-6 relative z-0 leading-tight">
                      {drop.verse}
                    </h2>
                    <p className="text-base sm:text-lg text-white font-['Inter'] leading-relaxed relative z-0 max-w-sm">
                      "{drop.reflection}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex gap-4">
                        <button onClick={() => likeMutation.mutate({id: drop.id, likes: drop.likes_count || 0})} className="hover:scale-110 transition-transform focus:outline-none">
                          <Heart className={`w-6 h-6 ${drop.likes_count > 0 ? "text-red-500 fill-red-500" : "text-white"}`} />
                        </button>
                        <button className="hover:scale-110 transition-transform focus:outline-none">
                          <MessageCircle className="w-6 h-6 text-white" />
                        </button>
                        <button className="hover:scale-110 transition-transform focus:outline-none">
                          <Share2 className="w-6 h-6 text-white" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="font-bold text-sm mb-2">{drop.likes_count || 0} likes</div>
                    
                    <div className="text-sm text-gray-300">
                      <span className="font-bold mr-2 text-white">{dropUser.full_name}</span>
                      <span className="text-gray-400">Faith always on! Check out my reflection on today's verse.</span>
                    </div>
                    
                    {drop.hashtags && (
                      <div className="text-sm mt-2 text-[#00CFFF]">
                        {drop.hashtags.split(' ').map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}