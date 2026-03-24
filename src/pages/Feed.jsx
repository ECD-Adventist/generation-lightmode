import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Heart, MessageCircle, Share2, MoreHorizontal, Bell, Plus, Home, Search, PlusSquare, PlaySquare, Globe, Bookmark, MessageSquare, Settings, Zap, BookOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import DropCard from "@/components/feed/DropCard";
import SubmitDropModal from "@/components/feed/SubmitDropModal";
import DailyChallenges from "@/components/feed/DailyChallenges";
import DailyCodeWidget from "@/components/feed/DailyCodeWidget";

export default function Feed() {
  const [user, setUser] = useState(null);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
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
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, []);

  const { data: drops = [], isLoading: dropsLoading } = useQuery({
    queryKey: ["allGlowDrops"],
    queryFn: () => base44.entities.GlowDrop.list('-created_date', 50),
    retry: 1
  });

  const { data: stories = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: () => base44.entities.Story.list('-created_date', 20),
    retry: 1
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke('listPublicUsers', {});
      return res.data;
    },
    retry: false
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user
  });

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      if (!user) { toast.error("Please log in to follow"); throw new Error("Not logged in"); }
      const isFollowing = following.some(f => f.following_email === targetEmail);
      if (isFollowing) {
        const followRecord = following.find(f => f.following_email === targetEmail);
        await base44.entities.Follow.delete(followRecord.id);
      } else {
        await base44.entities.Follow.create({ follower_email: user.email, following_email: targetEmail });
        await base44.entities.Notification.create({
          user_email: targetEmail,
          type: "follow",
          message: `${user.full_name || 'Someone'} started following you.`,
          link: createPageUrl("Profile") + `?user=${encodeURIComponent(user.email)}`
        });
        await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + 5 });
      }
      return isFollowing;
    },
    onSuccess: (wasFollowing) => {
      queryClient.invalidateQueries({ queryKey: ["following", user?.email] });
      if (!wasFollowing) {
        toast.success("Followed! +5 XP ⚡");
      }
    }
  });

  const likeMutation = useMutation({
    mutationFn: async ({ id, likes, authorEmail, authorName }) => {
      if (!user) { toast.error("Please log in to like drops"); return; }
      await base44.entities.GlowDrop.update(id, { likes_count: likes + 1 });
      if (authorEmail && authorEmail !== user.email) {
        await base44.entities.Notification.create({
          user_email: authorEmail,
          type: "like",
          message: `${user.full_name || 'Someone'} liked your Glow Drop!`,
          link: `/Feed`
        });
      }
      
      const today = new Date().toISOString().split('T')[0];
      const challenges = await base44.entities.UserDailyChallenge.filter({ user_email: user.email, date_string: today });
      if (!challenges.some(c => c.challenge_id === 'like_drops')) {
        await base44.entities.UserDailyChallenge.create({ user_email: user.email, date_string: today, challenge_id: 'like_drops' });
        await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + 5 });
        toast.success("Challenge Completed: Spread the Light! +5 XP ⚡");
        queryClient.invalidateQueries({ queryKey: ["dailyChallenges"] });
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
        await base44.entities.GlowDrop.update(drop.id, { shares_count: (drop.shares_count || 0) + 1 });
        queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      await base44.entities.GlowDrop.update(drop.id, { shares_count: (drop.shares_count || 0) + 1 });
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      toast.success("Copied to clipboard!");
    }
  };

  const getUserInfo = (email) => {
    if (user?.email === email) return user;
    return users.find(u => u.email === email) || { full_name: "Glow Believer" };
  };

  // No blocking loading state — render feed immediately, user loads in background

  return (
    <div className="h-[100dvh] bg-[#0B0F1A] text-white relative overflow-hidden font-['Inter']">
      <style>{`
        @keyframes pan-map {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float-light {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.35; }
        }
      `}</style>
      
      {/* Wireframe Map Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none w-[200vw] flex" style={{ animation: "pan-map 180s linear infinite" }}>
        <div className="h-full w-[100vw] bg-cover bg-center flex-shrink-0" style={{ backgroundImage: "url('https://media.base44.com/images/public/69a6fca6155ae283f1b55144/7dea9e31b_digital-world-map-hologram-blue-background.jpg')", filter: "grayscale(1) brightness(0.5) contrast(1.3)" }} />
        <div className="h-full w-[100vw] bg-cover bg-center flex-shrink-0" style={{ backgroundImage: "url('https://media.base44.com/images/public/69a6fca6155ae283f1b55144/7dea9e31b_digital-world-map-hologram-blue-background.jpg')", filter: "grayscale(1) brightness(0.5) contrast(1.3)" }} />
      </div>
      
      {/* Subtle dim accent lights */}
      <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-[#00CFFF] rounded-full blur-[120px] z-0 opacity-[0.08] pointer-events-none animate-[float-light_8s_ease-in-out_infinite]"></div>
      <div className="absolute top-[50%] left-[70%] w-[400px] h-[400px] bg-[#00CFFF] rounded-full blur-[140px] z-0 opacity-[0.06] pointer-events-none animate-[float-light_12s_ease-in-out_infinite_2s]"></div>

      <div className="h-full relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-[#0B0F1A]/70 backdrop-blur-[2px]">
        
        {/* Left Sidebar (Desktop) */}
        <div className="hidden lg:flex flex-col py-8 px-6 sticky top-0 h-[100dvh] border-r border-white/5 bg-transparent backdrop-blur-md overflow-y-auto hide-scrollbar pb-24">
           {/* Logo */}
           <Link to={createPageUrl("Home")} className="flex items-center mb-10 pl-2">
             <img
               src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/f58fb7f4b_LOGO02ALL.png"
               alt="LightMode"
               className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(0,207,255,0.4)]"
             />
           </Link>

           <div className="flex flex-col gap-2 flex-1">
             <Link to={createPageUrl("Feed")} className="flex items-center gap-4 text-lg font-bold bg-[#121826] text-[#00CFFF] px-4 py-3.5 rounded-2xl border border-white/5"><Home className="w-6 h-6" /> Home</Link>
             <Link to={createPageUrl("GlowGroups")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Search className="w-6 h-6" /> Explore</Link>
             <Link to={createPageUrl("Saved")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Bookmark className="w-6 h-6" /> Saved</Link>
             <Link to={createPageUrl("Notifications")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition relative">
               <Bell className="w-6 h-6" /> Notifications
               {notifications.length > 0 && <span className="ml-auto bg-red-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{notifications.length}</span>}
             </Link>
             <Link to={createPageUrl("Dashboard")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Zap className="w-6 h-6" /> Dashboard</Link>
             <Link to={createPageUrl("Milestones")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Zap className="w-6 h-6" /> Milestones</Link>
             <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Globe className="w-6 h-6" /> Global Reach</Link>
             <Link to={createPageUrl("Challenges")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><PlaySquare className="w-6 h-6" /> Challenges</Link>
             <Link to={createPageUrl("Assistant")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><MessageSquare className="w-6 h-6" /> AI Assistant</Link>
             <Link to={createPageUrl("FaithQuiz")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><span className="text-lg">🏆</span> Faith Quiz</Link>
             <div className="flex flex-col">
               <button onClick={() => setIsResourcesOpen(!isResourcesOpen)} className="flex items-center justify-between w-full text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition cursor-pointer">
                 <div className="flex items-center gap-4"><Globe className="w-6 h-6" /> Resources</div>
                 <span className="text-sm opacity-50">{isResourcesOpen ? "▲" : "▼"}</span>
               </button>
               {isResourcesOpen && (
                 <div className="flex flex-col ml-12 mt-1 gap-3 border-l border-white/10 pl-4 py-2">
                   <Link to={createPageUrl("KeepIt100")} className="text-sm font-bold text-gray-400 hover:text-white transition">💯 Keep It 100</Link>
                   <Link to={createPageUrl("CodesOfTruth")} className="text-sm font-bold text-gray-400 hover:text-white transition">🔐 Codes of Truth</Link>
                   <Link to={createPageUrl("Resources")} className="text-sm font-bold text-gray-400 hover:text-white transition">🌍 Other Resources</Link>
                 </div>
               )}
             </div>
             <Link to={createPageUrl("Profile")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition">
               <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] uppercase text-white overflow-hidden">
                 <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
               </div>
               Profile
             </Link>
             <a href="https://bible-school.base44.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition">
               <BookOpen className="w-6 h-6" /> Bible School
             </a>
             <Link to={createPageUrl("Home")} className="flex items-center gap-4 text-sm font-bold text-gray-500 hover:bg-white/5 hover:text-[#00CFFF] px-4 py-3 rounded-2xl transition border border-white/5 mt-2">
               <Globe className="w-5 h-5" /> Back to Website
             </Link>
           </div>
           
           <Button onClick={() => setIsDropModalOpen(true)} className="mt-8 shrink-0 bg-[#00CFFF] text-black font-black rounded-2xl w-full py-6 text-lg hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,207,255,0.3)]">
             <Plus className="w-5 h-5 mr-2" /> NEW VIBE
           </Button>

           <DailyCodeWidget />

           <div className="mt-6 flex items-center justify-between bg-[#121826] p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[2px]">
                   <div className="w-full h-full rounded-full bg-[#0B0F1A] flex items-center justify-center text-xs uppercase font-bold text-white overflow-hidden">
                     <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
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
        <div className="lg:col-span-2 sm:border-x border-white/10 h-[100dvh] lg:border-none flex flex-col overflow-y-auto min-h-0 pt-0 lg:pt-8">
          
          {/* Top Header Mobile */}
          <div className="flex justify-between items-center px-4 py-3 sticky top-0 z-50 bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-white/10 lg:hidden">
          <img
            src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/f58fb7f4b_LOGO02ALL.png"
            alt="Generation LightMode"
            className="h-8 sm:h-9 object-contain drop-shadow-[0_0_8px_rgba(0,207,255,0.4)]"
          />
          <div className="flex gap-4 items-center shrink-0">
            <div className="relative cursor-pointer">
              <Heart className="w-6 h-6 text-white" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </div>
            <MessageCircle className="w-6 h-6 text-white cursor-pointer" />
          </div>
        </div>

        {/* Center Header (Desktop) */}
        <div className="hidden lg:flex items-center justify-between px-4 mb-6 shrink-0">
           <h2 className="text-xl font-bold text-white">For You</h2>
           <div className="relative w-64">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
             <input type="text" placeholder="Search the nexus..." className="w-full bg-[#121826] border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00CFFF]/50" />
           </div>
        </div>

        {/* Stories / Vibes Row */}
        <div className="flex gap-4 px-4 mb-8 overflow-x-auto hide-scrollbar pb-2 shrink-0">
          {/* Own Story / Live */}
          <div className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0">
             <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-b from-[#00CFFF] to-transparent">
                <div className="w-full h-full rounded-full border-[2px] border-[#0B0F1A] overflow-hidden bg-gray-800">
                  <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                </div>
             </div>
             <span className="text-[10px] font-bold text-[#00CFFF] uppercase tracking-wider">LIVE</span>
          </div>

          {/* Other users mock stories */}
          {users.filter(u => u.email !== user?.email).slice(0, 5).map(u => (
            <div key={u.id} className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity">
               <div className="w-16 h-16 rounded-full bg-[#121826] border border-white/10 overflow-hidden p-1">
                  <div className="w-full h-full rounded-full bg-gray-800 overflow-hidden">
                    <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                  </div>
               </div>
               <span className="text-[10px] font-medium text-gray-400 truncate w-16 text-center">{u.full_name?.split(' ')[0]}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 px-4 mb-6 overflow-x-auto hide-scrollbar shrink-0">
          <Link to={createPageUrl("Messages")} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-white hover:bg-white/10 transition whitespace-nowrap">Messages</Link>
          <Link to={createPageUrl("PrayerWall")} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-white hover:bg-white/10 transition whitespace-nowrap">Prayer Wall</Link>
          <Link to={createPageUrl("Live")} className="px-4 py-2 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 text-sm font-semibold text-[#00CFFF] hover:bg-[#00CFFF]/20 transition whitespace-nowrap">Live</Link>
          </div>

        {/* Filter Bar (kept for functionality but styled subtler) */}
        <div className="flex gap-2 px-4 mb-6 overflow-x-auto hide-scrollbar shrink-0">
          {['All', 'Most Liked', 'Devotional', 'Testimony'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                activeFilter === filter 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="flex flex-col px-3 sm:px-4 py-4 pb-24 lg:pb-6 max-w-2xl mx-auto w-full flex-none">
          {dropsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>
          ) : drops.filter(drop => {
            if (activeFilter === 'All') return true;
            if (activeFilter === 'Most Liked') return drop.likes_count >= 5;
            if (activeFilter === 'Devotional') return drop.category === 'Devotional';
            if (activeFilter === 'Testimony') return drop.category === 'Testimony';
            return drop.category === activeFilter;
          }).sort((a, b) => {
            if (activeFilter === 'Most Liked') return (b.likes_count || 0) - (a.likes_count || 0);
            return new Date(b.created_date || 0) - new Date(a.created_date || 0);
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
              return new Date(b.created_date || 0) - new Date(a.created_date || 0);
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
        <div className="hidden lg:block py-8 px-6 sticky top-0 h-[100dvh] border-l border-white/5 bg-transparent backdrop-blur-md overflow-y-auto hide-scrollbar">
          
          <DailyChallenges user={user} />

          {/* Trending Vibes */}
          <div className="bg-[#121826] rounded-[24px] p-5 mb-6 border border-white/5">
            <h3 className="font-black text-xs text-[#00CFFF] mb-4 tracking-widest uppercase">Trending Vibes</h3>
            
            <div className="space-y-4">
              <div className="group cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Faith + Trending</span>
                  <MoreHorizontal className="w-3 h-3 text-gray-600" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-[#00CFFF] transition">#MorningDevotional</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">42.5k Vibes</p>
              </div>

              <div className="group cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Testimony + Trending</span>
                  <MoreHorizontal className="w-3 h-3 text-gray-600" />
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-[#00CFFF] transition">#HeHeals</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">18.2k Vibes</p>
              </div>

              <div className="group cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Worship + Trending</span>
                  <span className="w-1 h-1 bg-[#00CFFF] rounded-full shadow-[0_0_5px_#00CFFF]"></span>
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-[#00CFFF] transition">#SundayServiceLive</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">105k Vibes</p>
              </div>
            </div>
            
            <button className="text-xs font-bold text-[#00CFFF] mt-5 hover:text-white transition">View More</button>
          </div>

          {/* People to Connect */}
          <div className="bg-[#121826] rounded-[24px] p-5 border border-white/5">
            <h3 className="font-black text-xs text-[#FFD000] mb-4 tracking-widest uppercase">People to Connect</h3>
            
            <div className="space-y-4">
              {users.filter(u => u.email !== user?.email).map((u, i) => {
                const isFollowing = following.some(f => f.following_email === u.email);
                return (
                <div key={u.id} className="flex items-center gap-2">
                   <div className="flex items-center gap-2 flex-1 min-w-0">
                     <div className="w-9 h-9 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center font-bold text-xs text-white border border-white/10 shrink-0">
                        <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex flex-col min-w-0 flex-1">
                       <span className="font-bold text-white text-xs truncate">{u.full_name}</span>
                       <span className="text-gray-500 text-[9px] truncate">{u.country || "Global Believer"}</span>
                     </div>
                   </div>
                   <button 
                     onClick={() => followMutation.mutate(u.email)}
                     className={`text-[9px] font-bold px-3 py-1.5 rounded-full border transition shrink-0 ${isFollowing ? "border-gray-500 text-gray-400 hover:border-red-500 hover:text-red-500" : "border-[#00CFFF] text-[#00CFFF] hover:bg-[#00CFFF]/10"}`}
                   >
                     {isFollowing ? "UNFOLLOW" : "CONNECT"}
                   </button>
                </div>
              )})}
              {users.filter(u => u.email !== user?.email).length === 0 && (
                <p className="text-xs text-gray-500 text-center py-2">No other members yet. Invite friends!</p>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-[9px] text-gray-600 flex flex-col gap-1">
             <p>© 2026 GENERATION LIGHTMODE. ALL RIGHTS RESERVED.</p>
             <div className="flex gap-2">
               <a href="#" className="hover:text-gray-400">Privacy</a>
               <a href="#" className="hover:text-gray-400">Terms</a>
               <a href="#" className="hover:text-gray-400">Nexus Guide</a>
             </div>
          </div>
        </div>
        
        <SubmitDropModal isOpen={isDropModalOpen} onClose={() => setIsDropModalOpen(false)} user={user} />

        {/* Bottom Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0B0F1A]/90 backdrop-blur-xl border-t border-white/10 flex justify-around items-center py-3 px-6 z-50 pb-6 sm:max-w-xl sm:mx-auto sm:border-x lg:hidden">
          <Link to={createPageUrl("Feed")}><Home className="w-6 h-6 text-white" fill="white" /></Link>
          <Link to={createPageUrl("GlowGroups")}><Search className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("Dashboard")}><PlusSquare className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("GlobalReach")}><Globe className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("Resources")}><PlaySquare className="w-6 h-6 text-white" /></Link>
          <Link to={createPageUrl("Profile")}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20 flex items-center justify-center text-[10px] uppercase font-bold text-white overflow-hidden">
              <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}