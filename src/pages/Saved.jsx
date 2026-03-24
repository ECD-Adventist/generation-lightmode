import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Heart, MessageCircle, Share2, MoreHorizontal, Bell, Plus, Home, Search, PlusSquare, PlaySquare, Globe, Bookmark, MessageSquare, Settings, Zap, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
        if (isAuth) {
          try {
            const me = await base44.auth.me();
            setUser(me);
          } catch (e) {
            console.error("Failed to fetch user:", e);
          }
        } else {
          base44.auth.redirectToLogin(window.location.pathname);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthChecked(true);
      }
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

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
    retry: false
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

  const handleShare = async (drop) => {
    const shareText = `✨ Generation LightMode\n\n"${drop.verse}"\n\n${drop.reflection}\n\nJoin the movement at ${window.location.origin}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Glow Drop',
          text: shareText,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  const getUserInfo = (email) => {
    return users.find(u => u.email === email) || { full_name: "Glow Believer" };
  };

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  if (authChecked && !user) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] text-white">Redirecting to login...</div>;
  }

  // Filter drops to only those saved by the user
  const savedDropIds = savedRecords.map(r => r.drop_id);
  const mySavedDrops = drops.filter(d => savedDropIds.includes(d.id));

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white pb-20 lg:pb-0 relative overflow-hidden font-['Inter']">
      <div className="max-w-6xl mx-auto min-h-screen relative z-10 bg-[#0B0F1A] grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar (Desktop) */}
        <div className="hidden lg:flex flex-col py-8 px-6 sticky top-0 h-screen border-r border-white/5 bg-[#0B0F1A]">
           {/* Logo */}
           <Link to={createPageUrl("Home")} className="flex items-center mb-10 pl-2">
             <img
               src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/f58fb7f4b_LOGO02ALL.png"
               alt="LightMode"
               className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(0,207,255,0.4)]"
             />
           </Link>

           <div className="flex flex-col gap-2 flex-1">
             <Link to={createPageUrl("Feed")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Home className="w-6 h-6" /> Home</Link>
             <Link to={createPageUrl("GlowGroups")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Search className="w-6 h-6" /> Explore</Link>
             <Link to={createPageUrl("Saved")} className="flex items-center gap-4 text-lg font-bold bg-[#121826] text-[#00CFFF] px-4 py-3.5 rounded-2xl border border-white/5"><Bookmark className="w-6 h-6" /> Saved</Link>
             <Link to={createPageUrl("Dashboard")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Bell className="w-6 h-6" /> Notifications</Link>
             <Link to={createPageUrl("Profile")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><MessageSquare className="w-6 h-6" /> Messages</Link>
             <Link to={createPageUrl("Profile")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition">
               <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] uppercase text-white overflow-hidden">
                 {user?.profile_picture_url ? <img src={user.profile_picture_url} className="w-full h-full object-cover" /> : user?.full_name?.charAt(0)}
               </div>
               Profile
             </Link>
           </div>
           
           <div className="mt-6 flex items-center justify-between bg-[#121826] p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[2px]">
                   <div className="w-full h-full rounded-full bg-[#0B0F1A] flex items-center justify-center text-xs uppercase font-bold text-white overflow-hidden">
                     {user?.profile_picture_url ? <img src={user.profile_picture_url} className="w-full h-full object-cover" /> : user?.full_name?.charAt(0)}
                   </div>
                 </div>
                 <div className="text-sm">
                   <div className="font-bold text-white truncate max-w-[120px]">{user?.full_name}</div>
                   <div className="text-gray-500 text-[10px]">Pro Creator</div>
                 </div>
              </div>
              <button className="text-gray-400 hover:text-white"><Settings className="w-5 h-5" /></button>
           </div>
        </div>

        {/* Center Feed */}
        <div className="lg:col-span-2 sm:border-x border-white/10 min-h-screen lg:border-none flex flex-col pt-8">
          
          {/* Top Header Mobile */}
          <div className="flex justify-between items-center px-4 py-3 sticky top-0 z-50 bg-[#0B0F1A] border-b border-white/10 lg:hidden">
            <Link to={createPageUrl("Feed")}><ArrowLeft className="w-6 h-6 text-white" /></Link>
            <h1 className="text-xl font-bold text-white">Saved Vibes</h1>
            <div className="w-6"></div>
          </div>

          {/* Center Header (Desktop) */}
          <div className="hidden lg:flex items-center justify-between px-4 mb-6">
             <div className="flex items-center gap-3">
               <Link to={createPageUrl("Feed")} className="p-2 bg-[#121826] rounded-full hover:bg-white/10 transition"><ArrowLeft className="w-5 h-5 text-gray-400" /></Link>
               <h2 className="text-xl font-bold text-white">Saved Vibes</h2>
             </div>
          </div>

          {/* Feed */}
          <div className="flex flex-col px-0 sm:px-4 py-4 max-w-2xl mx-auto w-full">
            {savedLoading || dropsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>
            ) : mySavedDrops.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-4xl mb-4">🔖</div>
                <p>No saved vibes yet. Bookmark posts you want to keep here!</p>
                <Link to={createPageUrl("Feed")} className="inline-block mt-4 text-[#00CFFF] font-bold hover:underline">Explore Feed</Link>
              </div>
            ) : (
              mySavedDrops.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)).map(drop => (
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

        {/* Right Sidebar Placeholder for balance */}
        <div className="hidden lg:block py-8 px-6 sticky top-0 h-screen border-l border-white/5 bg-[#0B0F1A]">
            <div className="bg-[#121826] rounded-[24px] p-5 mb-6 border border-white/5 text-center">
               <Bookmark className="w-8 h-8 text-[#00CFFF] mx-auto mb-3" />
               <h3 className="font-bold text-white mb-2">Your Collection</h3>
               <p className="text-xs text-gray-500">All the drops you've saved are stored here privately for your inspiration.</p>
            </div>
        </div>

        {/* Bottom Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0B0F1A] border-t border-white/10 flex justify-around items-center py-3 px-6 z-50 pb-safe sm:max-w-xl sm:mx-auto sm:border-x lg:hidden">
          <Link to={createPageUrl("Feed")}><Home className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("GlowGroups")}><Search className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("Saved")}><Bookmark className="w-6 h-6 text-[#00CFFF]" fill="#00CFFF" /></Link>
          <Link to={createPageUrl("Profile")}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20 flex items-center justify-center text-[10px] uppercase font-bold text-white overflow-hidden">
              {user?.profile_picture_url ? <img src={user.profile_picture_url} className="w-full h-full object-cover" /> : user?.full_name?.charAt(0)}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}