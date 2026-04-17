import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Heart, MessageCircle, Share2, MoreHorizontal, Bell, Plus, Home, Search as SearchIcon, SquarePlus, PlaySquare, Globe, MessageSquare, Settings, Zap, Menu, ChevronDown, ChevronUp, Compass, LayoutDashboard, User, Bot, BookOpen, ExternalLink, Trophy, Map as MapIcon, Target, Sparkles, Medal, Handshake, ChevronRight, Camera, X } from "lucide-react";
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
// DailyCodeWidget removed - moved to Settings
import useGlowDropsFeed from "@/hooks/useGlowDropsFeed";
import AIContentSuggestions from "@/components/feed/AIContentSuggestions";
import { isNotificationEnabled } from "@/lib/notifications";
import useNetworkStatus from "@/hooks/useNetworkStatus";
import useOfflineSync from "@/hooks/useOfflineSync";
import OfflineBanner from "@/components/feed/OfflineBanner";
import StatusComposerModal from "@/components/feed/StatusComposerModal";
import StatusViewerModal from "@/components/feed/StatusViewerModal";
import OnboardingModal from "@/components/dashboard/OnboardingModal";
import ClaimInstitutionModal from "@/components/institution/ClaimInstitutionModal";

function SidebarLink({ to, icon, label, active, badge, accent }) {
  const baseStyle = active
    ? { background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", border: "none", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.35)" }
    : accent
    ? { color: "#0B3FD9", background: "transparent" }
    : { color: "#3A4A6B", background: "transparent" };
  // Icon box: white bg w/ cyan→royal-blue gradient icon (via text color) — matches +Post button family
  const iconBoxStyle = active
    ? { background: "rgba(255,255,255,0.25)", color: "#FFFFFF" }
    : { background: "#FFFFFF", color: "#0B3FD9", border: "1px solid #D6E4FF", boxShadow: "0 2px 6px rgba(11, 63, 217, 0.08)" };
  return (
    <Link
      to={to}
      className="group flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-200 hover:bg-[#F0F4FA]"
      style={baseStyle}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition" style={iconBoxStyle}>
        {icon}
      </div>
      <span className="text-[13px] font-semibold flex-1">{label}</span>
      {badge && (
        <span className="font-bold text-[9px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1" style={{ background: active ? "rgba(255,255,255,0.3)" : "#FF5A5A", color: "#FFFFFF" }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function Feed() {
  const [user, setUser] = useState(null);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isClaimInstitutionOpen, setIsClaimInstitutionOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(10);
  const queryClient = useQueryClient();
  const feedEndRef = useRef(null);
  const feedScrollRef = useRef(null);

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
      }
    }
    checkAuth();
  }, []);

  const isOnline = useNetworkStatus();

  const {
    data: liveDrops = [],
    isLoading: dropsLoading,
    isError: dropsError,
  } = useGlowDropsFeed();

  const { drops, lastCached, syncing, syncQueue } = useOfflineSync(liveDrops, isOnline);

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
    mutationFn: async ({ id, likes, authorEmail, authorName, action = 'like' }) => {
      if (!user) { toast.error("Please log in to like drops"); return; }
      
      // Call backend function for atomic like operation
      const response = await base44.functions.invoke('handleLikeDrop', {
        drop_id: id,
        author_email: authorEmail,
        author_name: authorName,
        action: 'toggle'
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to ' + action + ' drop');
      }

      toast.success(response.data.action === 'unlike' ? "❤️ Unliked!" : "❤️ Liked!");
      return response.data;
    },
    // Optimistic update
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["allGlowDrops"] });
      await queryClient.cancelQueries({ queryKey: ["userLikes", user?.email] });
      
      const prevDrops = queryClient.getQueryData(["allGlowDrops"]);
      const prevLikes = queryClient.getQueryData(["userLikes", user?.email]) || [];
      
      const alreadyLiked = prevLikes.some(like => like.drop_id === id);
      
      if (alreadyLiked) {
        // Optimistic unlike
        queryClient.setQueryData(["allGlowDrops"], old => 
          (old || []).map(d => d.id === id ? { ...d, likes_count: Math.max(0, (d.likes_count || 1) - 1) } : d)
        );
        queryClient.setQueryData(["userLikes", user?.email], old => 
          (old || []).filter(like => like.drop_id !== id)
        );
      } else {
        // Optimistic like
        queryClient.setQueryData(["allGlowDrops"], old => 
          (old || []).map(d => d.id === id ? { ...d, likes_count: (d.likes_count || 0) + 1 } : d)
        );
        queryClient.setQueryData(["userLikes", user?.email], old => 
          [...(old || []), { drop_id: id, user_email: user?.email }]
        );
      }
      
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
        queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
        toast.success("Shared successfully!");
      } catch (err) {
        if (err.name !== 'AbortError') console.log('Share cancelled');
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
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

        const q = searchQuery.toLowerCase();
        const dropAuthor = getUserInfo(drop.user_email);
        const matchesSearch = !searchQuery || 
          drop.verse?.toLowerCase().includes(q) ||
          drop.reflection?.toLowerCase().includes(q) ||
          drop.hashtags?.toLowerCase().includes(q) ||
          drop.category?.toLowerCase().includes(q) ||
          dropAuthor?.full_name?.toLowerCase().includes(q);

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

  // Infinite scroll handled via onScroll on the container instead

  // Show loading while auth is being checked
  if (!user) {
    return (
      <div className="h-[100dvh] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C8F2D4 0%, #E8F5C8 100%)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] relative overflow-hidden font-['Inter']" style={{ background: "linear-gradient(135deg, #D8F5E0 0%, #EAF6D0 100%)", color: "#0A1A3D" }}>
      <OnboardingModal
        isOpen={!!user && (!user.privacy_consent_given || !user.country || !user.gender || !user.date_of_birth || !user.city || !user.address || !user.postal_code)}
        onCompleted={(updates) => setUser(prev => ({ ...prev, ...updates, privacy_consent_given: true }))}
      />
      <style>{`
        @keyframes float-light {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.35; }
        }
        /* Custom scrollbar for Feed — blue palette */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #F0F4FA; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #1E5AFF, #5AC8FF); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #1E5AFF; }
        * { scrollbar-width: thin; scrollbar-color: #1E5AFF #F0F4FA; }
      `}</style>
      
      {/* Soft accent lights */}
      <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] rounded-full blur-[120px] z-0 opacity-30 pointer-events-none animate-[float-light_8s_ease-in-out_infinite]" style={{ background: "#7FE08A" }}></div>
      <div className="absolute top-[50%] left-[70%] w-[400px] h-[400px] rounded-full blur-[140px] z-0 opacity-25 pointer-events-none animate-[float-light_12s_ease-in-out_infinite_2s]" style={{ background: "#5AC8FF" }}></div>

      <div className="h-full relative z-10 grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-0 backdrop-blur-[2px]">
        
        {/* Left Sidebar (Desktop) */}
        <div className="hidden lg:flex flex-col py-6 px-4 sticky top-0 h-[100dvh] border-r backdrop-blur-md overflow-y-auto hide-scrollbar relative" style={{ background: "linear-gradient(165deg, #FFFEF9 0%, #FFF7DE 35%, #FFEFC7 70%, #FFE9B5 100%)", borderColor: "#F0DFA0", backgroundImage: "radial-gradient(circle at 15% 85%, rgba(255,208,0,0.14) 0%, transparent 55%), radial-gradient(circle at 85% 15%, rgba(255,159,26,0.1) 0%, transparent 55%), radial-gradient(circle at 50% 50%, rgba(255,220,120,0.05) 0%, transparent 70%)", boxShadow: "inset -1px 0 0 rgba(255, 208, 0, 0.15)" }}>
           {/* Logo — BLUE */}
           <Link to={createPageUrl("Home")} className="flex items-center mb-8 px-2">
             <img
               src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png"
               alt="LightMode"
               style={{ height: 56, width: "auto", objectFit: "contain" }}
             />
           </Link>

           {/* Main Nav */}
           <nav className="flex flex-col gap-1 flex-1">
           {/* Section: Main */}
           <p className="text-[10px] font-black uppercase tracking-[0.18em] px-3 mb-1.5" style={{ color: "#8A97B5" }}>Main</p>

           <SidebarLink to={createPageUrl("Feed")} icon={<Home className="w-[18px] h-[18px]" />} label="Home" active />
             <SidebarLink to={createPageUrl("GlowGroups")} icon={<Globe className="w-[18px] h-[18px]" />} label="Explore" />
             <SidebarLink to={createPageUrl("Discover")} icon={<Compass className="w-[18px] h-[18px]" />} label="Discover" />
             <SidebarLink to={createPageUrl("Notifications")} icon={<Bell className="w-[18px] h-[18px]" />} label="Notifications" badge={notifications.length > 0 ? notifications.length : null} />
             <SidebarLink to={createPageUrl("Dashboard")} icon={<LayoutDashboard className="w-[18px] h-[18px]" />} label="Dashboard" />
             <SidebarLink to={createPageUrl("Profile")} icon={
               <div className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0" style={{ border: "1px solid #D5E3F0" }}>
                 <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
               </div>
             } label="Profile" />

             {/* Section: Tools */}
             <p className="text-[10px] font-black uppercase tracking-[0.18em] px-3 mt-4 mb-1.5" style={{ color: "#8A97B5" }}>Tools</p>

             <SidebarLink to={createPageUrl("Assistant")} icon={<Bot className="w-[18px] h-[18px]" />} label="AI Assistant" accent />

             {/* Resources dropdown */}
             <button
               onClick={() => setIsResourcesOpen(v => !v)}
               className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left hover:bg-[#F0F4FA]"
               style={{ color: "#3A4A6B" }}
             >
               <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" style={{ background: "#F0F4FA" }}>📚</div>
               <span className="text-sm font-semibold flex-1">Resources</span>
               <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isResourcesOpen ? "rotate-90" : ""}`} style={{ color: "#8A97B5" }} />
             </button>
             {isResourcesOpen && (
               <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l" style={{ borderColor: "#E0EAF5" }}>
                 <Link to={createPageUrl("KeepIt100")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><span>💯</span> Keep It 100</Link>
                 <Link to={createPageUrl("CodesOfTruth")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><span>🔐</span> Codes of Truth</Link>
                 <Link to={createPageUrl("Resources")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><span>🌍</span> Other Resources</Link>
               </div>
             )}

             <SidebarLink to={createPageUrl("DailyDevotion")} icon={<BookOpen className="w-[18px] h-[18px]" />} label="Bible School" />
             <SidebarLink to={createPageUrl("Home")} icon={<ExternalLink className="w-[18px] h-[18px]" />} label="Back to Website" />

             {/* Section: More */}
             <button
               onClick={() => setIsMoreOpen(v => !v)}
               className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left mt-4 hover:bg-[#F0F4FA]"
               style={{ color: "#3A4A6B" }}
             >
               <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#F0F4FA", color: "#5A6A8A" }}>
                 <Settings className="w-[16px] h-[16px]" />
               </div>
               <span className="text-sm font-semibold flex-1">More</span>
               <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? "rotate-90" : ""}`} style={{ color: "#8A97B5" }} />
             </button>
             {isMoreOpen && (
               <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l" style={{ borderColor: "#E0EAF5" }}>
                 <Link to={createPageUrl("Milestones")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><Trophy className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} /> Milestones</Link>
                 <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><MapIcon className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Global Reach</Link>
                 <Link to={createPageUrl("Challenges")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><Target className="w-3.5 h-3.5" style={{ color: "#5AC8FF" }} /> Challenges</Link>
                 <Link to={createPageUrl("LightReflections")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><Sparkles className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} /> Light Reflections</Link>
                 <Link to={createPageUrl("FaithQuiz")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><Medal className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Faith Quiz</Link>
                 <Link to={createPageUrl("PrayerWall")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><Handshake className="w-3.5 h-3.5" style={{ color: "#5AC8FF" }} /> Prayer Wall</Link>
                 <Link to="/TerritoryPhotos" className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><Camera className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Territory Moments</Link>
                 <Link to="/Settings" className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><Settings className="w-3.5 h-3.5" /> Settings</Link>
                 <button onClick={() => setIsClaimInstitutionOpen(true)} className="w-full text-left flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#F0F4FA]" style={{ color: "#3A4A6B" }}><Zap className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} /> Claim Institution Dashboard</button>
               </div>
             )}
           </nav>
           
           <button
             onClick={() => setIsDropModalOpen(true)}
             className="mt-6 shrink-0 flex items-center justify-center gap-2 font-black rounded-2xl w-full py-3.5 text-sm transition-all hover:shadow-lg hover:scale-[1.02]"
             style={{ background: "linear-gradient(90deg, #FFD000 0%, #FF9F1A 100%)", color: "#0A1A3D", boxShadow: "0 4px 18px rgba(255, 159, 26, 0.35)" }}
           >
             <Plus className="w-4 h-4" /> NEW DROP
           </button>
        </div>

        {/* Center Feed — LIGHT MODE */}
        <div 
          ref={feedScrollRef} 
          className="h-[100dvh] flex flex-col overflow-y-auto min-h-0 pt-0 lg:pt-8"
          style={{ color: "#0B1B3D", background: "#F6F8FC" }}
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            if (scrollHeight - scrollTop <= clientHeight + 150) {
              if (displayCount < filteredDrops.length) {
                setDisplayCount(prev => prev + 10);
              }
            }
          }}
        >
          
          {/* Top Header Mobile — LIGHT */}
          <div className="flex justify-between items-center px-3 sm:px-4 py-3 sticky top-0 z-50 backdrop-blur-xl border-b lg:hidden gap-3" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E2E8F0" }}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png"
              alt="Generation LightMode"
              className="h-12 sm:h-14 w-auto object-contain max-w-[180px] sm:max-w-[220px]"
            />
          </div>
          <div className="flex gap-3 items-center shrink-0">
            <Link to={createPageUrl("Notifications")} className="relative shrink-0" style={{ color: "#0B1B3D" }}>
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full" style={{ background: "#FF9F1A" }}></span>
              )}
            </Link>
            <Link to={createPageUrl("Messages")} className="shrink-0" style={{ color: "#0B1B3D" }}>
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <button onClick={() => setIsMobileNavOpen(true)} className="transition shrink-0" style={{ color: "#4A5878" }}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Center Header (Desktop) — LIGHT */}
        <div className="hidden lg:flex items-center justify-between px-4 mb-6 shrink-0 gap-4">
           <h2 className="text-xl font-bold shrink-0" style={{ color: "#0B1B3D" }}>For You</h2>
           <div className="relative w-80">
             <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#1FB8FF" }} />
             <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search drops by verse, reflection, hashtag..."
               className="w-full rounded-full py-2.5 pl-9 pr-9 text-sm focus:outline-none transition"
               style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
             />
             {searchQuery && (
               <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 transition" style={{ color: "#8A97B5" }}>
                 <X className="w-4 h-4" />
               </button>
             )}
           </div>
        </div>

        {/* Mobile Search Bar — LIGHT */}
        <div className="lg:hidden px-3 sm:px-4 mb-3 shrink-0">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#1FB8FF" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drops..."
              className="w-full rounded-full py-2.5 pl-9 pr-9 text-sm focus:outline-none transition shadow-sm"
              style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 transition" style={{ color: "#8A97B5" }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <OfflineBanner isOnline={isOnline} lastCached={lastCached} syncing={syncing} onSync={syncQueue} />

        {/* Stories / Status Row */}
        <div className="flex gap-3 sm:gap-4 px-3 sm:px-4 mb-6 sm:mb-8 overflow-x-auto hide-scrollbar pb-2 shrink-0 items-start">
          <button
            onClick={() => user ? setIsStatusModalOpen(true) : base44.auth.redirectToLogin(window.location.pathname)}
            className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0"
          >
             <div className="relative w-16 h-16 rounded-full p-[2px]" style={{ background: "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)" }}>
                <div className="w-full h-full rounded-full border-[2px] overflow-hidden flex items-center justify-center" style={{ borderColor: "#F0FAF3", background: "#FFFFFF" }}>
                  <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-sm font-black flex items-center justify-center border-2" style={{ background: "#FFD60A", color: "#0B1B3D", borderColor: "#F0FAF3" }}>+</div>
             </div>
             <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#0B3FD9" }}>ADD STATUS</span>
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
                <div className="w-16 h-16 rounded-full p-[2px]" style={{ background: "linear-gradient(135deg, #FFD60A 0%, #1FB8FF 100%)" }}>
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center" style={{ background: "#FFFFFF" }}>
                    {story.story_type === "image" && story.media_url ? (
                      <img src={story.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full rounded-full bg-gradient-to-br ${themeClass} flex items-center justify-center text-white font-black text-lg`}>
                        Aa
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-medium truncate w-16 text-center" style={{ color: "#4A5878" }}>{storyUser?.email === user?.email ? "You" : storyUser?.full_name?.split(' ')[0] || "Status"}</span>
              </button>
            );
          })}

          {activeStories.length === 0 && (
            <div className="flex items-center h-16 px-3 text-xs whitespace-nowrap" style={{ color: "#8A97B5" }}>No statuses yet. Be the first to post one.</div>
          )}
        </div>

        <div className="flex gap-2 sm:gap-3 px-3 sm:px-4 mb-5 sm:mb-6 overflow-x-auto hide-scrollbar shrink-0">
          <button onClick={() => user ? setIsDropModalOpen(true) : base44.auth.redirectToLogin(window.location.pathname)} className="px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.25)" }}><Plus className="w-4 h-4" />Post</button>
          <Link to={createPageUrl("Messages")} className="px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap" style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", color: "#0B1B3D" }}>Messages</Link>
          <Link to={createPageUrl("PrayerWall")} className="px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap" style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", color: "#0B1B3D" }}>Prayer Wall</Link>
          <Link to={createPageUrl("Live")} className="px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap" style={{ background: "rgba(31, 184, 255, 0.12)", border: "1px solid #B8E5FF", color: "#0B3FD9" }}>Live</Link>
          <Link to="/DailyTruthFeed" className="px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5" style={{ background: "linear-gradient(90deg, #FFD60A 0%, #FF9F1A 100%)", color: "#0B1B3D", boxShadow: "0 4px 12px rgba(255, 159, 26, 0.3)" }}>⚡ Daily Drops</Link>
          </div>

        {/* Filter Bar — LIGHT */}
        <div className="flex gap-2 px-3 sm:px-4 mb-5 sm:mb-6 overflow-x-auto hide-scrollbar shrink-0">
          {['All', 'Following', 'Most Liked', 'Devotional', 'Testimony'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300"
              style={activeFilter === filter
                ? { background: "#0B3FD9", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.3)" }
                : { background: "rgba(255,255,255,0.6)", color: "#4A5878", border: "1px solid #E0EAF5" }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="flex flex-col px-3 sm:px-4 py-4 pb-24 lg:pb-6 max-w-2xl mx-auto w-full flex-none">
          {dropsLoading && drops.length === 0 ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>
          ) : dropsError && filteredDrops.length === 0 ? (
            <div className="text-center py-20" style={{ color: "#4A5878" }}>
              <div className="text-4xl mb-4">↻</div>
              <p>We're refreshing the feed. Please try again in a moment.</p>
              <button onClick={() => queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] })} className="inline-block mt-4 hover:underline font-semibold" style={{ color: "#0B3FD9" }}>Refresh feed</button>
            </div>
          ) : filteredDrops.length === 0 ? (
            <div className="text-center py-20" style={{ color: "#4A5878" }}>
              <div className="text-4xl mb-4">{activeFilter === 'Following' ? '👥' : '✨'}</div>
              <p>{activeFilter === 'Following' 
                ? 'No posts from people you follow yet. Start following creators to see their content here!'
                : searchQuery ? 'No Lights found matching your search. Try different keywords!' 
                : 'No Lights found for this filter. Be the first to share your light!'}</p>
              {activeFilter === 'Following' ? (
                <button onClick={() => setActiveFilter('All')} className="inline-block mt-4 hover:underline font-semibold" style={{ color: "#0B3FD9" }}>Explore all posts</button>
              ) : (
                <button onClick={() => setIsDropModalOpen(true)} className="inline-block mt-4 hover:underline font-semibold" style={{ color: "#0B3FD9" }}>Submit a Light</button>
              )}
            </div>
          ) : (
            <>
              {filteredDrops.slice(0, displayCount).map(drop => (
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
              ))}
              <div ref={feedEndRef} className="py-6 text-center text-sm" style={{ color: "#8A97B5" }}>
                {displayCount < filteredDrops.length ? "Loading more..." : filteredDrops.length === 0 ? "" : `Showing ${filteredDrops.length} posts`}
              </div>
            </>
          )}
        </div>
        
        </div>

        {/* Right Sidebar (Desktop) — LIGHT */}
        <div className="hidden lg:block py-8 px-6 sticky top-0 h-[100dvh] border-l backdrop-blur-md overflow-y-auto hide-scrollbar" style={{ borderColor: "#EAEEF5", background: "linear-gradient(180deg, #FBFCFE 0%, #F6F9FD 100%)" }}>
          
          <DailyChallenges user={user} />

          <AIContentSuggestions
            user={user}
            drops={drops}
            following={following}
            userLikes={userLikes}
            savedDropRecords={savedDropRecords}
            onSearchTag={(topic) => { setSearchQuery(topic); setActiveFilter("All"); }}
          />

          {/* Trending Vibes — PREMIUM GLASS */}
          <div className="rounded-[24px] p-5 mb-6 relative overflow-hidden" style={{ background: "linear-gradient(145deg, #FFFFFF 0%, #F4F7FE 100%)", border: "1px solid #E2EAFC", boxShadow: "0 8px 32px rgba(30, 90, 255, 0.08), 0 2px 4px rgba(0,0,0,0.02)" }}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle, #5AC8FF, transparent)" }} />
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #1E5AFF, #5AC8FF)" }} />
              <h3 className="font-black text-xs tracking-widest uppercase" style={{ color: "#1E5AFF" }}>Trending Vibes</h3>
            </div>
            
            <div className="space-y-1">
              {trendingTopics.length === 0 ? (
                <p className="text-xs" style={{ color: "#8A97B5" }}>No live hashtags yet.</p>
              ) : trendingTopics.map((topic, idx) => (
                <button
                  key={topic.tag}
                  onClick={() => { setSearchQuery(topic.tag); setActiveFilter("All"); }}
                  className="group text-left w-full rounded-xl px-3 py-3 transition-all hover:bg-[#EEF3FF]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0" style={{ background: idx === 0 ? "linear-gradient(135deg, #1E5AFF, #5AC8FF)" : "linear-gradient(135deg, #E2EAFC, #F0F4FF)", color: idx === 0 ? "#FFFFFF" : "#1E5AFF" }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm transition truncate" style={{ color: "#0B1B3D" }}>{topic.tag}</h4>
                      <p className="text-[10px] mt-0.5" style={{ color: "#8A97B5" }}>{topic.count} drop{topic.count === 1 ? '' : 's'}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#1E5AFF" }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* People to Connect — LIGHT */}
          <div className="rounded-[24px] p-5" style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
            <h3 className="font-black text-xs mb-4 tracking-widest uppercase" style={{ color: "#FF9F1A" }}>People to Connect</h3>
            
            <div className="space-y-4">
              {users.filter(u => u.email !== user?.email && !following.some(f => f.following_email === u.email)).map((u, i) => {
                return (
                <div key={u.id} className="flex items-center gap-2">
                  <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`} className="flex items-center gap-2 flex-1 min-w-0 no-underline hover:opacity-80 transition">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs shrink-0" style={{ background: "#E0EAF5", border: "1px solid #E0EAF5" }}>
                       <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-xs truncate" style={{ color: "#0B1B3D" }}>{u.full_name}</span>
                      <span className="text-[9px] truncate" style={{ color: "#8A97B5" }}>{u.country || "Global Believer"}</span>
                    </div>
                  </Link>
                   <button 
                     onClick={() => followMutation.mutate(u.email)}
                     className="text-[9px] font-bold px-3 py-1.5 rounded-full transition shrink-0"
                     style={{ border: "1px solid #1FB8FF", color: "#0B3FD9", background: "rgba(31, 184, 255, 0.08)" }}
                   >
                     CONNECT
                   </button>
                </div>
              )})}
              {users.filter(u => u.email !== user?.email).length === 0 && (
                <p className="text-xs text-center py-2" style={{ color: "#8A97B5" }}>No other members yet. Invite friends!</p>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-[9px] flex flex-col gap-1" style={{ color: "#8A97B5" }}>
             <p>© 2026 GENERATION LIGHTMODE. ALL RIGHTS RESERVED.</p>
             <div className="flex gap-2">
               <a href="#" className="hover:underline">Privacy</a>
               <a href="#" className="hover:underline">Terms</a>
               <a href="#" className="hover:underline">Nexus Guide</a>
             </div>
          </div>
        </div>
        
        <SubmitDropModal isOpen={isDropModalOpen} onClose={() => setIsDropModalOpen(false)} user={user} />
        <StatusComposerModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} user={user} />
        <ClaimInstitutionModal isOpen={isClaimInstitutionOpen} onClose={() => setIsClaimInstitutionOpen(false)} user={user} />
        <StatusViewerModal
          story={selectedStory}
          storyUser={selectedStory ? getUserInfo(selectedStory.user_email) : null}
          isOpen={!!selectedStory}
          onClose={() => setSelectedStory(null)}
          allStories={stories}
          allUsers={users}
          getUserInfo={getUserInfo}
          currentUser={user}
        />
        {isSearchOpen && <GlobalSearchBar onClose={() => setIsSearchOpen(false)} />}

        {/* Mobile Sidebar Drawer — LIGHT */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(10, 26, 61, 0.4)" }} onClick={() => setIsMobileNavOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 border-r flex flex-col py-8 px-6 overflow-y-auto" style={{ background: "#FFFFFF", borderColor: "#E0EAF5" }}>
              <Link to={createPageUrl("Home")} className="flex items-center mb-10">
                <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" style={{ height: 56, width: "auto", objectFit: "contain" }} />
              </Link>
              <nav className="flex flex-col gap-1 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] px-3 mb-1.5" style={{ color: "#8A97B5" }}>Main</p>
                <SidebarLink to={createPageUrl("Feed")} icon={<Home className="w-[18px] h-[18px]" />} label="Home" active />
                <SidebarLink to={createPageUrl("GlowGroups")} icon={<Globe className="w-[18px] h-[18px]" />} label="Explore" />
                <SidebarLink to={createPageUrl("Discover")} icon={<Compass className="w-[18px] h-[18px]" />} label="Discover" />
                <SidebarLink to={createPageUrl("Notifications")} icon={<Bell className="w-[18px] h-[18px]" />} label="Notifications" badge={notifications.length > 0 ? notifications.length : null} />
                <SidebarLink to={createPageUrl("Dashboard")} icon={<LayoutDashboard className="w-[18px] h-[18px]" />} label="Dashboard" />
                <SidebarLink to={createPageUrl("Profile")} icon={
                  <div className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0" style={{ border: "1px solid #D5E3F0" }}>
                    <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                  </div>
                } label="Profile" />

                <p className="text-[10px] font-black uppercase tracking-[0.18em] px-3 mt-4 mb-1.5" style={{ color: "#8A97B5" }}>Tools</p>
                <SidebarLink to={createPageUrl("Assistant")} icon={<Bot className="w-[18px] h-[18px]" />} label="AI Assistant" accent />

                {/* Resources dropdown */}
                <button onClick={() => setIsResourcesOpen(v => !v)} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition w-full text-left hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" style={{ background: "#F0F5FB" }}>📚</div>
                  <span className="text-sm font-semibold flex-1">Resources</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isResourcesOpen ? "rotate-90" : ""}`} style={{ color: "#8A97B5" }} />
                </button>
                {isResourcesOpen && (
                  <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l" style={{ borderColor: "#D5E3F0" }}>
                    <Link to={createPageUrl("KeepIt100")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}><span>💯</span> Keep It 100</Link>
                    <Link to={createPageUrl("CodesOfTruth")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}><span>🔐</span> Codes of Truth</Link>
                    <Link to={createPageUrl("Resources")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}><span>🌍</span> Other Resources</Link>
                  </div>
                )}
                <SidebarLink to={createPageUrl("DailyDevotion")} icon={<BookOpen className="w-[18px] h-[18px]" />} label="Bible School" />
                <SidebarLink to={createPageUrl("Home")} icon={<ExternalLink className="w-[18px] h-[18px]" />} label="Back to Website" />

                {/* More toggle */}
                <button onClick={() => setIsMoreOpen(v => !v)} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition w-full text-left mt-4 hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#F0F5FB" }}>
                    <Settings className="w-[16px] h-[16px]" />
                  </div>
                  <span className="text-sm font-semibold flex-1">More</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? "rotate-90" : ""}`} style={{ color: "#8A97B5" }} />
                </button>
                {isMoreOpen && (
                  <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l" style={{ borderColor: "#D5E3F0" }}>
                    <Link to={createPageUrl("Milestones")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}><Trophy className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} /> Milestones</Link>
                    <Link to={createPageUrl("GlobalReach")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}><MapIcon className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Global Reach</Link>
                    <Link to={createPageUrl("Challenges")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}><Target className="w-3.5 h-3.5" style={{ color: "#5AC8FF" }} /> Challenges</Link>
                    <Link to={createPageUrl("LightReflections")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}><Sparkles className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} /> Light Reflections</Link>
                    <Link to={createPageUrl("FaithQuiz")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}><Medal className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Faith Quiz</Link>
                    <Link to={createPageUrl("PrayerWall")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}><Handshake className="w-3.5 h-3.5" style={{ color: "#5AC8FF" }} /> Prayer Wall</Link>
                    <Link to="/TerritoryPhotos" onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}><Camera className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Territory Moments</Link>
                    <Link to="/Settings" onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-[#E8F0FF]" style={{ color: "#4A5878" }}><Settings className="w-3.5 h-3.5" /> Settings</Link>
                  </div>
                )}
              </nav>
              <button onClick={() => { setIsDropModalOpen(true); setIsMobileNavOpen(false); }} className="mt-6 shrink-0 flex items-center justify-center gap-2 font-black rounded-2xl w-full py-4 text-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(90deg, #1E5AFF 0%, #5AC8FF 100%)", color: "#FFFFFF", boxShadow: "0 4px 18px rgba(30, 90, 255, 0.35)" }}>
                <Plus className="w-4 h-4" /> NEW DROP
              </button>
            </div>
          </div>
        )}

        {/* Bottom Mobile Navigation — LIGHT */}
        <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t flex justify-around items-center py-2.5 px-3 sm:px-6 z-50 pb-4 sm:pb-5 sm:max-w-xl sm:mx-auto sm:border-x lg:hidden" style={{ background: "rgba(246, 248, 252, 0.98)", borderColor: "#E2E8F0", boxShadow: "0 -8px 24px rgba(15, 23, 42, 0.08)" }}>
          <Link to={createPageUrl("Feed")} className="flex h-11 w-11 items-center justify-center rounded-full" title="Home">
            <Home className="w-5 h-5" fill="#0B3FD9" style={{ color: "#0B3FD9" }} />
          </Link>
          <button onClick={() => setIsSearchOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full" title="Search">
            <SearchIcon className="w-5 h-5" style={{ color: "#0B1B3D" }} />
          </button>
          <button onClick={() => setIsDropModalOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full" title="Create post">
            <SquarePlus className="w-5 h-5" style={{ color: "#0B1B3D" }} />
          </button>
          <Link to={createPageUrl("GlobalReach")} className="flex h-11 w-11 items-center justify-center rounded-full" title="Global Reach">
            <Globe className="w-5 h-5" style={{ color: "#0B1B3D" }} />
          </Link>
          <Link to={createPageUrl("DailyTruthFeed")} className="flex h-11 w-11 items-center justify-center rounded-full" title="Daily Drops">
            <PlaySquare className="w-5 h-5" style={{ color: "#0B1B3D" }} />
          </Link>
          <Link to={createPageUrl("Profile")} className="flex h-11 w-11 items-center justify-center rounded-full" title="Profile">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] uppercase font-bold overflow-hidden" style={{ border: "2px solid #1FB8FF" }}>
              <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}