import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Heart, MessageCircle, Share2, MoreHorizontal, Bell, Plus, Home, Search as SearchIcon, PlusSquare, PlaySquare, Globe, Bookmark, MessageSquare, Settings, Zap, BookOpen, Trophy } from "lucide-react";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";
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
import useGlowDropsFeed from "@/hooks/useGlowDropsFeed";
import { isNotificationEnabled } from "@/lib/notifications";
import StatusComposerModal from "@/components/feed/StatusComposerModal";
import StatusViewerModal from "@/components/feed/StatusViewerModal";

export default function Feed() {
  const [user, setUser] = useState(null);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const queryClient = useQueryClient();

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
      }
    }
    checkAuth();
  }, []);

  const {
    data: drops = [],
    isLoading: dropsLoading,
    isError: dropsError,
  } = useGlowDropsFeed();

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke('listPublicUsers', {});
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: false
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user
  });

  const { data: stories = [] } = useQuery({
    queryKey: ["activeStories"],
    queryFn: () => base44.entities.Story.list("-created_date", 50),
    enabled: !!user
  });

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      if (!user) { toast.error("Please log in to follow"); throw new Error("Not logged in"); }
      const isFollowing = following.some(f => f.following_email === targetEmail);
      if (isFollowing) {
        const followRecord = following.find(f => f.following_email === targetEmail);
        await base44.entities.Follow.delete(followRecord.id);
        return true;
      } else {
        await base44.entities.Follow.create({ follower_email: user.email, following_email: targetEmail });
        const targetUser = users.find(u => u.email === targetEmail);
        if (isNotificationEnabled(targetUser, "follows")) {
          await base44.entities.Notification.create({
            user_email: targetEmail,
            type: "follow",
            message: `${user.full_name || 'Someone'} started following you.`,
            link: createPageUrl("Profile") + `?user=${encodeURIComponent(user.email)}`
          });
        }
        await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + 5 });
        return false;
      }
    },
    onSuccess: (wasFollowing) => {
      queryClient.invalidateQueries({ queryKey: ["following", user?.email] });
      if (!wasFollowing) {
        toast.success("Followed! +5 XP ⚡");
      }
    }
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ["userLikes", user?.email],
    queryFn: () => base44.entities.GlowDropLike.filter({ user_email: user?.email }),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const { data: savedDropRecords = [] } = useQuery({
    queryKey: ["savedDrops", user?.email],
    queryFn: () => base44.entities.SavedDrop.filter({ user_email: user?.email }),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const likeMutation = useMutation({
    mutationFn: async ({ id, likes, authorEmail }) => {
      if (!user) { toast.error("Please log in to like drops"); return; }
      const alreadyLiked = userLikes.some(like => like.drop_id === id);
      if (alreadyLiked) { toast.error("You already liked this drop!"); return; }
      
      // Do the like
      await base44.entities.GlowDropLike.create({ drop_id: id, user_email: user.email });
      await base44.entities.GlowDrop.update(id, { likes_count: (likes || 0) + 1 });
      
      // Fire and forget notification
      if (authorEmail && authorEmail !== user.email) {
        const authorUser = users.find(entry => entry.email === authorEmail);
        if (isNotificationEnabled(authorUser, "likes")) {
          base44.entities.Notification.create({
            user_email: authorEmail, type: "like",
            message: `${user.full_name || 'Someone'} liked your Glow Drop!`,
            link: `/Post?id=${encodeURIComponent(id)}&user=${encodeURIComponent(authorEmail)}`
          }).catch(() => {});
        }
      }
      toast.success("❤️ Liked!");
    },
    // Optimistic update
    onMutate: async ({ id, likes }) => {
      await queryClient.cancelQueries({ queryKey: ["allGlowDrops"] });
      await queryClient.cancelQueries({ queryKey: ["userLikes", user?.email] });
      
      const prevDrops = queryClient.getQueryData(["allGlowDrops"]);
      const prevLikes = queryClient.getQueryData(["userLikes", user?.email]);
      
      queryClient.setQueryData(["allGlowDrops"], old => 
        (old || []).map(d => d.id === id ? { ...d, likes_count: (d.likes_count || 0) + 1 } : d)
      );
      queryClient.setQueryData(["userLikes", user?.email], old => 
        [...(old || []), { drop_id: id, user_email: user?.email }]
      );
      
      return { prevDrops, prevLikes };
    },
    onError: (err, vars, context) => {
      if (context?.prevDrops) queryClient.setQueryData(["allGlowDrops"], context.prevDrops);
      if (context?.prevLikes) queryClient.setQueryData(["userLikes", user?.email], context.prevLikes);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
      queryClient.invalidateQueries({ queryKey: ["userLikes", user?.email] });
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
    const unsubNotifs = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data.user_email === user.email && !event.data.read) {
        toast(event.data.message, { icon: '🔔' });
        queryClient.invalidateQueries({ queryKey: ["notifications", user.email] });
      }
    });
    // Real-time DM alerts
    const unsubDMs = base44.entities.DirectMessage.subscribe((event) => {
      if (event.type === 'create' && event.data.recipient_email === user.email) {
        const senderName = users.find(u => u.email === event.data.sender_email)?.full_name || event.data.sender_email?.split('@')[0];
        toast(`New message from ${senderName}`, { icon: '💬' });
      }
    });
    return () => { unsubNotifs(); unsubDMs(); };
  }, [user?.email, queryClient]);

  const handleShare = async (drop) => {
    const postUrl = `${window.location.origin}/Post?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`;
    const shareText = `✨ Generation LightMode\n\n"${drop.verse || ''}"\n\n${drop.reflection || ''}\n\nJoin the movement!\n${postUrl}`;
    
    if (navigator.share) {
      try {
        // Share as text only (not url separately) so platforms show the text for social sharing
        await navigator.share({
          text: shareText,
        });
        base44.entities.GlowDrop.update(drop.id, { shares_count: (drop.shares_count || 0) + 1 }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
        toast.success("Shared successfully!");
      } catch (err) {
        if (err.name !== 'AbortError') console.log('Share cancelled');
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        base44.entities.GlowDrop.update(drop.id, { shares_count: (drop.shares_count || 0) + 1 }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
        toast.success("Link copied to clipboard! Share it anywhere.");
      } catch {
        toast.error("Could not copy link");
      }
    }
  };

  const getUserInfo = (email) => {
    if (user?.email === email) return user;
    const found = users.find(u => u.email === email);
    if (found) return found;
    return { full_name: email?.split('@')[0] || "Glow Believer", email };
  };

  const activeStories = useMemo(() => {
    const now = Date.now();
    const latestByUser = new Map();

    stories
      .filter((story) => story.expires_at && new Date(story.expires_at).getTime() > now)
      .forEach((story) => {
        if (!latestByUser.has(story.user_email)) {
          latestByUser.set(story.user_email, story);
        }
      });

    return Array.from(latestByUser.values());
  }, [stories]);

  const followingEmails = useMemo(() => new Set(following.map(f => f.following_email)), [following]);

  const filteredDrops = useMemo(() => {
    return [...drops]
      .filter((drop) => {
        const matchesFilter = activeFilter === 'All' || 
          (activeFilter === 'Following' && followingEmails.has(drop.user_email)) ||
          (activeFilter === 'Most Liked' && (drop.likes_count || 0) >= 1) ||
          (activeFilter === 'Devotional' && drop.category === 'Devotional') ||
          (activeFilter === 'Testimony' && drop.category === 'Testimony');

        const matchesSearch = !searchQuery || 
          drop.verse?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          drop.reflection?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          drop.hashtags?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        if (activeFilter === 'Most Liked') return (b.likes_count || 0) - (a.likes_count || 0);
        return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      });
  }, [drops, activeFilter, searchQuery, followingEmails]);

  const trendingTopics = useMemo(() => {
    const counts = new Map();

    drops.forEach((drop) => {
      const tags = (drop.hashtags || "")
        .split(/[\s,]+/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.startsWith("#") && tag.length > 1);

      tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => ({ tag, count }));
  }, [drops]);

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
               src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
               alt="LightMode"
               className="h-14 w-auto object-contain drop-shadow-[0_0_12px_rgba(0,207,255,0.4)]"
             />
           </Link>

           <div className="flex flex-col gap-2 flex-1">
             <Link to={createPageUrl("Feed")} className="flex items-center gap-4 text-lg font-bold bg-[#121826] text-[#00CFFF] px-4 py-3.5 rounded-2xl border border-white/5"><Home className="w-6 h-6" /> Home</Link>
             <button onClick={() => setIsSearchOpen(true)} className="w-full flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><SearchIcon className="w-6 h-6" /> Search</button>
             <Link to={createPageUrl("GlowGroups")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Globe className="w-6 h-6" /> Explore</Link>
             <Link to={createPageUrl("Discover")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Zap className="w-6 h-6" /> Discover</Link>
             <Link to={createPageUrl("Saved")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Bookmark className="w-6 h-6" /> Saved</Link>
             <Link to={createPageUrl("DailyDevotion")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><BookOpen className="w-6 h-6" /> Daily Devotion</Link>
             <Link to={createPageUrl("Notifications")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition relative">
               <Bell className="w-6 h-6" /> Notifications
               {notifications.length > 0 && <span className="ml-auto bg-red-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{notifications.length}</span>}
             </Link>
             <Link to={createPageUrl("Dashboard")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Zap className="w-6 h-6" /> Dashboard</Link>
             <Link to={createPageUrl("Milestones")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Zap className="w-6 h-6" /> Milestones</Link>
             <Link to={createPageUrl("Leaderboard")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Trophy className="w-6 h-6" /> Leaderboard</Link>
             <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><Globe className="w-6 h-6" /> Global Reach</Link>
             <Link to={createPageUrl("Challenges")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><PlaySquare className="w-6 h-6" /> Challenges</Link>
             <Link to={createPageUrl("Assistant")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><MessageSquare className="w-6 h-6" /> AI Assistant</Link>
             <Link to={createPageUrl("LightReflections")} className="flex items-center gap-4 text-lg font-bold text-gray-400 hover:bg-white/5 hover:text-white px-4 py-3.5 rounded-2xl transition"><span className="text-lg">✨</span> Light Reflections</Link>
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

           <Link to={createPageUrl("Profile")} className="mt-6 flex items-center justify-between bg-[#121826] p-3 rounded-2xl border border-white/5 hover:border-white/10 transition no-underline">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[2px]">
                   <div className="w-full h-full rounded-full bg-[#0B0F1A] flex items-center justify-center text-xs uppercase font-bold text-white overflow-hidden">
                     <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                   </div>
                 </div>
                 <div className="text-sm">
                   <div className="font-bold text-white truncate max-w-[120px]">{user?.full_name}</div>
                   <div className="text-gray-500 text-[10px]">⚡ {user?.glow_score || 0} XP</div>
                 </div>
              </div>
              <Settings className="w-5 h-5 text-gray-400" />
           </Link>
        </div>

        {/* Center Feed */}
        <div className="lg:col-span-2 sm:border-x border-white/10 h-[100dvh] lg:border-none flex flex-col overflow-y-auto min-h-0 pt-0 lg:pt-8">
          
          {/* Top Header Mobile */}
          <div className="flex justify-between items-center px-4 py-3 sticky top-0 z-50 bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-white/10 lg:hidden">
          <img
            src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
            alt="Generation LightMode"
            className="h-14 object-contain drop-shadow-[0_0_8px_rgba(0,207,255,0.4)]"
          />
          <div className="flex gap-4 items-center shrink-0">
            <Link to={createPageUrl("Notifications")} className="relative">
              <Heart className="w-6 h-6 text-white" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Link>
            <Link to={createPageUrl("Messages")}>
              <MessageCircle className="w-6 h-6 text-white" />
            </Link>
          </div>
        </div>

        {/* Center Header (Desktop) */}
        <div className="hidden lg:flex items-center justify-between px-4 mb-6 shrink-0">
           <h2 className="text-xl font-bold text-white">For You</h2>
           <button
             onClick={() => setIsSearchOpen(true)}
             className="relative w-64 flex items-center gap-2 bg-[#121826] border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-sm text-gray-500 hover:border-[#00CFFF]/30 transition cursor-pointer text-left"
           >
             <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
             Search people, drops, groups...
           </button>
        </div>

        {/* Stories / Status Row */}
        <div className="flex gap-4 px-4 mb-8 overflow-x-auto hide-scrollbar pb-2 shrink-0 items-start">
          <button
            onClick={() => user ? setIsStatusModalOpen(true) : base44.auth.redirectToLogin(window.location.pathname)}
            className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0"
          >
             <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF]">
                <div className="w-full h-full rounded-full border-[2px] border-[#0B0F1A] overflow-hidden bg-[#121826] flex items-center justify-center">
                  <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00CFFF] text-black text-sm font-black flex items-center justify-center border-2 border-[#0B0F1A]">+</div>
             </div>
             <span className="text-[10px] font-bold text-[#00CFFF] uppercase tracking-wider">ADD STATUS</span>
          </button>

          {activeStories.map((story) => {
            const storyUser = getUserInfo(story.user_email);
            const themeClass = story.background_theme === "violet"
              ? "from-[#8A5CFF] to-[#3B1E70]"
              : story.background_theme === "sunrise"
              ? "from-[#FFD000] to-[#F97316]"
              : story.background_theme === "midnight"
              ? "from-[#121826] to-[#0B0F1A]"
              : "from-[#00CFFF] to-[#1DA1FF]";

            return (
              <button
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity"
              >
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-[#FFD000] to-[#00CFFF]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#121826] flex items-center justify-center">
                    {story.story_type === "image" && story.media_url ? (
                      <img src={story.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full rounded-full bg-gradient-to-br ${themeClass} flex items-center justify-center text-white font-black text-lg`}>
                        Aa
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-gray-400 truncate w-16 text-center">{storyUser?.email === user?.email ? "You" : storyUser?.full_name?.split(' ')[0] || "Status"}</span>
              </button>
            );
          })}

          {activeStories.length === 0 && (
            <div className="flex items-center h-16 px-3 text-xs text-gray-500 whitespace-nowrap">No statuses yet. Be the first to post one.</div>
          )}
        </div>

        <div className="flex gap-3 px-4 mb-6 overflow-x-auto hide-scrollbar shrink-0">
          <button onClick={() => user ? setIsDropModalOpen(true) : base44.auth.redirectToLogin(window.location.pathname)} className="px-4 py-2 rounded-full bg-gradient-to-r from-[#00CFFF]/20 to-[#8A5CFF]/20 border border-[#00CFFF]/30 text-sm font-semibold text-[#00CFFF] hover:from-[#00CFFF]/30 hover:to-[#8A5CFF]/30 transition whitespace-nowrap flex items-center gap-1.5"><Plus className="w-4 h-4" />Post</button>
          <Link to={createPageUrl("Messages")} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-white hover:bg-white/10 transition whitespace-nowrap">Messages</Link>
          <Link to={createPageUrl("PrayerWall")} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-white hover:bg-white/10 transition whitespace-nowrap">Prayer Wall</Link>
          <Link to={createPageUrl("Live")} className="px-4 py-2 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 text-sm font-semibold text-[#00CFFF] hover:bg-[#00CFFF]/20 transition whitespace-nowrap">Live</Link>
          <Link to="/DailyTruthFeed" className="px-4 py-2 rounded-full bg-gradient-to-r from-[#8A5CFF]/20 to-[#FFD000]/20 border border-[#00CFFF]/30 text-sm font-semibold text-[#00CFFF] hover:from-[#8A5CFF]/30 hover:to-[#FFD000]/30 transition whitespace-nowrap flex items-center gap-1.5">⚡ Daily Drops</Link>
          </div>

        {/* Filter Bar */}
        <div className="flex gap-2 px-4 mb-6 overflow-x-auto hide-scrollbar shrink-0">
          {['All', 'Following', 'Most Liked', 'Devotional', 'Testimony'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                activeFilter === filter 
                  ? filter === 'Following' ? 'bg-[#00CFFF]/20 text-[#00CFFF] border border-[#00CFFF]/30' : 'bg-white/10 text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="flex flex-col px-3 sm:px-4 py-4 pb-24 lg:pb-6 max-w-2xl mx-auto w-full flex-none">
          {dropsLoading && drops.length === 0 ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>
          ) : dropsError && filteredDrops.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="text-4xl mb-4">↻</div>
              <p>We’re refreshing the feed. Please try again in a moment.</p>
              <button onClick={() => queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] })} className="inline-block mt-4 text-[#00CFFF] hover:underline">Refresh feed</button>
            </div>
          ) : filteredDrops.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="text-4xl mb-4">{activeFilter === 'Following' ? '👥' : '✨'}</div>
              <p>{activeFilter === 'Following' 
                ? 'No posts from people you follow yet. Start following creators to see their content here!'
                : searchQuery ? 'No Lights found matching your search. Try different keywords!' 
                : 'No Lights found for this filter. Be the first to share your light!'}</p>
              {activeFilter === 'Following' ? (
                <button onClick={() => setActiveFilter('All')} className="inline-block mt-4 text-[#00CFFF] hover:underline">Explore all posts</button>
              ) : (
                <button onClick={() => setIsDropModalOpen(true)} className="inline-block mt-4 text-[#00CFFF] hover:underline">Submit a Light</button>
              )}
            </div>
          ) : (
            filteredDrops.map(drop => (
              <DropCard 
                key={drop.id} 
                drop={drop} 
                user={user} 
                dropUser={getUserInfo(drop.user_email)}
                likeMutation={likeMutation}
                handleShare={handleShare}
                userLikes={userLikes}
                allUsers={users}
                savedDropRecords={savedDropRecords}
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
              {trendingTopics.length === 0 ? (
                <p className="text-xs text-gray-500">No live hashtags yet.</p>
              ) : trendingTopics.map((topic) => (
                <button
                  key={topic.tag}
                  onClick={() => { setSearchQuery(topic.tag); setActiveFilter("All"); }}
                  className="group text-left w-full"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Live hashtag</span>
                    <MoreHorizontal className="w-3 h-3 text-gray-600" />
                  </div>
                  <h4 className="font-bold text-sm text-white group-hover:text-[#00CFFF] transition">{topic.tag}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">{topic.count} drop{topic.count === 1 ? '' : 's'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* People to Connect */}
          <div className="bg-[#121826] rounded-[24px] p-5 border border-white/5">
            <h3 className="font-black text-xs text-[#FFD000] mb-4 tracking-widest uppercase">People to Connect</h3>
            
            <div className="space-y-4">
              {users.filter(u => u.email !== user?.email).map((u, i) => {
                const isFollowing = following.some(f => f.following_email === u.email);
                return (
                <div key={u.id} className="flex items-center gap-2">
                  <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`} className="flex items-center gap-2 flex-1 min-w-0 no-underline hover:opacity-80 transition">
                    <div className="w-9 h-9 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center font-bold text-xs text-white border border-white/10 shrink-0">
                       <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-white text-xs truncate">{u.full_name}</span>
                      <span className="text-gray-500 text-[9px] truncate">{u.country || "Global Believer"}</span>
                    </div>
                  </Link>
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
        <StatusComposerModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} user={user} />
        <StatusViewerModal
          story={selectedStory}
          storyUser={selectedStory ? getUserInfo(selectedStory.user_email) : null}
          isOpen={!!selectedStory}
          onClose={() => setSelectedStory(null)}
          allStories={stories}
          allUsers={users}
          getUserInfo={getUserInfo}
        />
        {isSearchOpen && <GlobalSearchBar onClose={() => setIsSearchOpen(false)} />}

        {/* Bottom Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0B0F1A]/90 backdrop-blur-xl border-t border-white/10 flex justify-around items-center py-3 px-6 z-50 pb-6 sm:max-w-xl sm:mx-auto sm:border-x lg:hidden">
          <Link to={createPageUrl("Feed")}><Home className="w-6 h-6 text-white" fill="white" /></Link>
          <button onClick={() => setIsSearchOpen(true)}><SearchIcon className="w-6 h-6 text-white" /></button>
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