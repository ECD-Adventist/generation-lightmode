import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Heart, MessageCircle, Share2, MoreHorizontal, Bell, Plus, Home, Search, PlusSquare, PlaySquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import DropCard from "@/components/feed/DropCard";

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

  const { data: stories = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: () => base44.entities.Story.list('-created_date', 20)
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
    <div className="min-h-screen bg-[#0B0F1A] text-white pb-20 relative overflow-hidden font-['Inter']">
      <div className="max-w-xl mx-auto sm:border-x border-white/10 min-h-screen relative z-10 bg-[#0B0F1A]">
        
        {/* Top Header */}
        <div className="flex justify-between items-center px-4 py-3 sticky top-0 z-50 bg-[#0B0F1A] border-b border-white/10">
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white" style={{ fontFamily: 'var(--font-cursive, cursive)'}}>LightMode</h1>
          <div className="flex gap-4 items-center">
            <div className="relative cursor-pointer">
              <Heart className="w-6 h-6 text-white" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </div>
            <MessageCircle className="w-6 h-6 text-white cursor-pointer" />
          </div>
        </div>

        {/* Stories Bar */}
        <div className="flex gap-4 overflow-x-auto px-4 py-3 border-b border-white/10 hide-scrollbar bg-[#0B0F1A]">
          <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
            <div className="w-16 h-16 rounded-full border border-gray-600 flex items-center justify-center relative p-[2px]">
               <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-lg font-bold uppercase">
                 {user?.full_name?.charAt(0)}
               </div>
               <div className="absolute bottom-0 right-0 bg-[#00CFFF] rounded-full p-0.5 border-2 border-[#0B0F1A]">
                 <Plus className="w-3 h-3 text-black" />
               </div>
            </div>
            <span className="text-xs text-gray-400">Your story</span>
          </div>
          
          {/* Mock stories to replicate UI */}
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FFD000] via-[#F50057] to-[#8A5CFF] p-[2px]">
                 <div className="w-full h-full rounded-full bg-[#0B0F1A] p-[2px]">
                   <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-sm font-bold uppercase">
                     G{i}
                   </div>
                 </div>
              </div>
              <span className="text-xs text-white">glow_{i}</span>
            </div>
          ))}
        </div>

        {/* Feed */}
        <div className="flex flex-col">
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
        
        {/* Bottom Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0B0F1A] border-t border-white/10 flex justify-around items-center py-3 px-6 z-50 pb-safe sm:max-w-xl sm:mx-auto sm:border-x">
          <Link to={createPageUrl("Feed")}><Home className="w-6 h-6 text-white" fill="white" /></Link>
          <Link to={createPageUrl("GlowGroups")}><Search className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("Dashboard")}><PlusSquare className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("Resources")}><PlaySquare className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("Profile")}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20 flex items-center justify-center text-[10px] uppercase font-bold text-white">
              {user?.full_name?.charAt(0)}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}