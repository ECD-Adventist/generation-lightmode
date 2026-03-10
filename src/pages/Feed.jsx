import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Heart, MessageCircle, Share2, MoreHorizontal, Bell, Plus, Home, Search, PlusSquare, PlaySquare, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import DropCard from "@/components/feed/DropCard";
import SubmitDropModal from "@/components/feed/SubmitDropModal";

export default function Feed() {
  const [user, setUser] = useState(null);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
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
    <div className="min-h-screen bg-[#0B0F1A] text-white pb-20 lg:pb-0 relative overflow-hidden font-['Inter']">
      <div className="max-w-6xl mx-auto min-h-screen relative z-10 bg-[#0B0F1A] grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar (Desktop) */}
        <div className="hidden lg:flex flex-col gap-8 py-8 px-6 sticky top-[72px] h-[calc(100vh-72px)] border-r border-white/10">
           <Link to={createPageUrl("Feed")} className="flex items-center gap-4 text-xl font-bold hover:text-[#00CFFF] transition"><Home className="w-7 h-7" /> Home</Link>
           <Link to={createPageUrl("GlowGroups")} className="flex items-center gap-4 text-xl font-bold hover:text-[#00CFFF] transition"><Search className="w-7 h-7" /> Explore</Link>
           <Link to={createPageUrl("Dashboard")} className="flex items-center gap-4 text-xl font-bold hover:text-[#00CFFF] transition"><PlusSquare className="w-7 h-7" /> Dashboard</Link>
           <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-4 text-xl font-bold hover:text-[#00CFFF] transition"><Globe className="w-7 h-7" /> Global Reach</Link>
           <Link to={createPageUrl("Resources")} className="flex items-center gap-4 text-xl font-bold hover:text-[#00CFFF] transition"><PlaySquare className="w-7 h-7" /> Resources</Link>
           <Link to={createPageUrl("Profile")} className="flex items-center gap-4 text-xl font-bold hover:text-[#00CFFF] transition">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs uppercase font-bold text-white overflow-hidden">
               {user?.profile_picture_url ? <img src={user.profile_picture_url} className="w-full h-full object-cover" /> : user?.full_name?.charAt(0)}
             </div>
             Profile
           </Link>
           <Button onClick={() => setIsDropModalOpen(true)} className="mt-4 bg-[#00CFFF] text-black font-bold rounded-full w-full py-6 text-lg hover:bg-white transition-colors">Post Drop</Button>
        </div>

        {/* Center Feed */}
        <div className="lg:col-span-2 sm:border-x border-white/10 min-h-screen lg:border-none">
          
          {/* Top Header Mobile */}
          <div className="flex justify-between items-center px-4 py-3 sticky top-0 z-50 bg-[#0B0F1A] border-b border-white/10 lg:hidden">
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
               <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-lg font-bold uppercase overflow-hidden">
                 {user?.profile_picture_url ? <img src={user.profile_picture_url} className="w-full h-full object-cover" /> : user?.full_name?.charAt(0)}
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

        {/* Filter Bar */}
        <div className="flex gap-2 px-4 py-3 border-b border-white/10 bg-[#0B0F1A] overflow-x-auto hide-scrollbar">
          {['All', 'Most Liked', 'Devotional', 'Testimony'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                activeFilter === filter 
                  ? 'bg-[#00CFFF] text-black' 
                  : 'bg-[#121826] text-gray-400 border border-white/10 hover:text-white hover:border-white/30'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="flex flex-col">
          {drops.filter(drop => {
            if (activeFilter === 'All') return true;
            if (activeFilter === 'Most Liked') return drop.likes_count >= 5;
            if (activeFilter === 'Devotional') return drop.category === 'Devotional';
            if (activeFilter === 'Testimony') return drop.category === 'Testimony';
            return drop.category === activeFilter;
          }).sort((a, b) => {
            if (activeFilter === 'Most Liked') return (b.likes_count || 0) - (a.likes_count || 0);
            return new Date(b.created_date) - new Date(a.created_date);
          }).length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="text-4xl mb-4">✨</div>
              <p>No drops found for this filter. Be the first to share your light!</p>
              <button onClick={() => setIsDropModalOpen(true)} className="inline-block mt-4 text-[#00CFFF] hover:underline">Submit a Drop</button>
            </div>
          ) : (
            drops.filter(drop => {
              if (activeFilter === 'All') return true;
              if (activeFilter === 'Most Liked') return drop.likes_count >= 1;
              if (activeFilter === 'Devotional') return drop.category === 'Devotional';
              if (activeFilter === 'Testimony') return drop.category === 'Testimony';
              return drop.category === activeFilter;
            }).sort((a, b) => {
              if (activeFilter === 'Most Liked') return (b.likes_count || 0) - (a.likes_count || 0);
              return new Date(b.created_date) - new Date(a.created_date);
            }).map(drop => (
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

        {/* Right Sidebar (Desktop) */}
        <div className="hidden lg:block py-8 px-6 sticky top-[72px] h-[calc(100vh-72px)] border-l border-white/10">
          <h3 className="font-bold text-lg mb-6 text-gray-400">Suggested Believers</h3>
          <div className="space-y-6">
            {users.filter(u => u.email !== user?.email).slice(0, 5).map(u => (
              <div key={u.id} className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center font-bold text-sm">
                      {u.profile_picture_url ? <img src={u.profile_picture_url} className="w-full h-full object-cover" /> : u.full_name?.charAt(0)}
                   </div>
                   <div className="text-sm">
                     <div className="font-bold text-white truncate max-w-[120px]">{u.full_name}</div>
                     <div className="text-gray-500 text-xs">{u.country || 'Global'}</div>
                   </div>
                 </div>
                 <button className="text-xs text-[#00CFFF] font-bold hover:text-white transition">Follow</button>
              </div>
            ))}
          </div>
          
          <div className="mt-10 p-5 bg-[#121826] rounded-2xl border border-white/5">
            <h4 className="font-bold text-white mb-2">Daily Verse 📖</h4>
            <p className="text-sm text-gray-400 italic">"I can do all things through Christ who strengthens me."</p>
            <p className="text-xs text-[#00CFFF] mt-2">- Philippians 4:13</p>
          </div>
        </div>
        
        <SubmitDropModal isOpen={isDropModalOpen} onClose={() => setIsDropModalOpen(false)} user={user} />

        {/* Bottom Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0B0F1A] border-t border-white/10 flex justify-around items-center py-3 px-6 z-50 pb-safe sm:max-w-xl sm:mx-auto sm:border-x lg:hidden">
          <Link to={createPageUrl("Feed")}><Home className="w-6 h-6 text-white" fill="white" /></Link>
          <Link to={createPageUrl("GlowGroups")}><Search className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("Dashboard")}><PlusSquare className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("GlobalReach")}><Globe className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("Resources")}><PlaySquare className="w-6 h-6 text-white" /></Link>
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