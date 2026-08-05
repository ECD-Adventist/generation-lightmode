import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { dualWriteSupabase } from "@/lib/dualWriteSupabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllFollowers, fetchAllFollowing } from "@/lib/follows";
import { Loader2, Heart, MessageCircle, Share2, MoreHorizontal, Bell, Plus, Home, Search as SearchIcon, SquarePlus, PlaySquare, Globe, MessageSquare, Settings, Zap, Menu, ChevronDown, ChevronUp, Compass, LayoutDashboard, User, Bot, BookOpen, ExternalLink, Trophy, Map as MapIcon, Target, Sparkles, Medal, Handshake, ChevronRight, Camera, X, Flame } from "lucide-react";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import DropCard from "@/components/feed/DropCard";
import SubmitDropModal from "@/components/feed/SubmitDropModal";
import DailyChallenges from "@/components/feed/DailyChallenges";
import useGlowDropsFeed from "@/hooks/useGlowDropsFeed";
import useFeedUserSearch from "@/hooks/useFeedUserSearch";
import AIContentSuggestions from "@/components/feed/AIContentSuggestions";
import { isNotificationEnabled } from "@/lib/notifications";
import useNetworkStatus from "@/hooks/useNetworkStatus";
import useOfflineSync from "@/hooks/useOfflineSync";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/mobile/PullToRefreshIndicator";
import OfflineBanner from "@/components/feed/OfflineBanner";
import StatusComposerModal from "@/components/feed/StatusComposerModal";
import StatusViewerModal from "@/components/feed/StatusViewerModal";
import OnboardingModal from "@/components/dashboard/OnboardingModal";
import ClaimInstitutionModal from "@/components/institution/ClaimInstitutionModal";
import MyGlowGroupsSidebar from "@/components/feed/MyGlowGroupsSidebar";
import MobileFeed from "@/components/feed/MobileFeed";
import FeedDropList from "@/components/feed/FeedDropList";
import PinnedLeaderPosts from "@/components/feed/PinnedLeaderPosts";
import { queueOfflineAction } from "@/lib/offlineCache";
import useDeferredMount from "@/hooks/useDeferredMount";
import GuestStickyBar from "@/components/pledge/GuestStickyBar";
import CountryFlag from "@/components/common/CountryFlag";
import UserAvatar from "@/components/common/UserAvatar";
import { getDisplayName } from "@/lib/displayName";
import { buildShareText, getSharePreviewUrl } from "@/lib/sharePreview";
import { tryNativeShare } from "@/lib/shareActions";
import ShareFallbackDialog from "@/components/share/ShareFallbackDialog";
import useRequireAuth from "@/hooks/useRequireAuth";

function SidebarLink({ to, icon, label, active, badge, accent }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/30"
      style={active
        ? { background: "linear-gradient(90deg, #2979FF 0%, #1565C0 100%)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(41, 121, 255, 0.35)" }
        : { color: accent ? "#1565C0" : "#37474F", background: "transparent" }}
    >
      <span className="w-5 h-5 flex items-center justify-center shrink-0">{icon}</span>
      <span className="text-[13px] font-medium flex-1">{label}</span>
      {badge && (
        <span className="font-bold text-[10px] rounded-full min-w-[22px] h-[18px] flex items-center justify-center px-1.5" style={{ background: active ? "rgba(255,255,255,0.3)" : "#E53935", color: "#FFFFFF" }}>
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
  const [shareFallback, setShareFallback] = useState(null);
  // Mobile starts at 4 cards to minimize initial GPU/decoding cost; desktop bumps to 10 once mounted.
  const isMobileViewport = typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;
  const [displayCount, setDisplayCount] = useState(isMobileViewport ? 4 : 10);
  const queryClient = useQueryClient();
  const feedEndRef = useRef(null);
  const feedScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);
  // Defer non-critical queries (stories, suggestedUsers, leaderAccounts) until after first paint.
  const deferredReady = useDeferredMount(700);

  const [authChecked, setAuthChecked] = useState(false);
  const requireAuth = useRequireAuth(user);
  // Guests can browse the public feed freely; interactions are gated by requireAuth.
  const isGuest = !user && authChecked;

  // Reset paginated display when the search query changes so newly-fetched
  // matching drops are visible from the top of the list.
  useEffect(() => { setDisplayCount(isMobileViewport ? 4 : 10); }, [searchQuery, isMobileViewport]);

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

  // Open the post composer when arriving via the bottom-nav "+" button (?compose=1)
  // or when tapping Drop while already on the Feed tab.
  useEffect(() => {
    const openComposer = () => {
      if (user) setIsDropModalOpen(true);
      else base44.auth.redirectToLogin(window.location.pathname);
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get("compose") === "1") {
      openComposer();
      params.delete("compose");
      const newSearch = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (newSearch ? `?${newSearch}` : ""));
    }

    window.addEventListener("openDropComposer", openComposer);
    return () => window.removeEventListener("openDropComposer", openComposer);
  }, [user]);

  const isOnline = useNetworkStatus();

  const {
    data: liveDrops = [],
    isLoading: dropsLoading,
    isError: dropsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchDrops,
  } = useGlowDropsFeed();

  const { drops, lastCached, syncing, syncQueue } = useOfflineSync(liveDrops, isOnline);

  // Global user-by-name/email search. Fetches matched users + their recent drops
  // when the local feed cache doesn't already contain them.
  const userSearch = useFeedUserSearch(searchQuery);

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(feedScrollRef, async () => {
    await queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
    await queryClient.invalidateQueries({ queryKey: ["activeStories"] });
  });

  const mobilePull = usePullToRefresh(mobileScrollRef, async () => {
    await queryClient.invalidateQueries({ queryKey: ["allGlowDrops"] });
    await queryClient.invalidateQueries({ queryKey: ["activeStories"] });
  });

  const authorEmails = useMemo(() => {
    return Array.from(new Set(drops.map(drop => drop.user_email).filter(Boolean)));
  }, [drops]);

  const { data: users = [] } = useQuery({
    queryKey: ["feedVisibleUsers", authorEmails.join("|")],
    queryFn: async () => {
      const res = await base44.functions.invoke('listPublicUsers', { emails: authorEmails, limit: 80 });
      return res.data || [];
    },
    enabled: authorEmails.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: false
  });

  const { data: suggestedUsers = [] } = useQuery({
    queryKey: ["feedSuggestedUsers", user?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke('listPublicUsers', {});
      return (res.data || [])
        .filter(u => u.email !== user?.email)
        .slice(0, 8);
    },
    // Deferred — only fetch after first paint to keep initial feed render fast.
    enabled: !!user?.email && deferredReady,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: false
  });

  // Managed leader accounts — used to resolve leader profile photo/name on posts
  // and to authorize managers to delete posts under their leader's identity.
  // Deferred: not critical to the very first post render.
  const { data: leaderAccounts = [] } = useQuery({
    queryKey: ["allLeaderAccounts"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicLeaderAccounts", { limit: 200 });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: deferredReady,
    staleTime: 1000 * 60 * 5,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.id, user?.email],
    queryFn: () => fetchAllFollowing(user?.id, user?.email),
    enabled: !!user?.id || !!user?.email
  });

  // Deferred — stories are a secondary section above the feed.
  // Stories expire within 24h, so the most recent 100 always covers all active ones.
  const { data: stories = [] } = useQuery({
    queryKey: ["activeStories"],
    queryFn: () => base44.entities.Story.list("-created_date", 100),
    enabled: !!user && deferredReady
  });

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      if (!user) { requireAuth(); throw new Error("Not logged in"); }
      const targetUser = [...users, ...suggestedUsers].find(u => u.email === targetEmail);
      if (!targetUser?.id) throw new Error("Could not find that member.");
      const isFollowing = following.some(f => f.following_id === targetUser.id || f.following_email === targetEmail);
      if (isFollowing) {
        const followRecord = following.find(f => f.following_id === targetUser.id || f.following_email === targetEmail);
        await base44.entities.Follow.delete(followRecord.id);
        return true;
      } else {
        const followRec = await base44.entities.Follow.create({ follower_id: user.id, following_id: targetUser.id });
        dualWriteSupabase("follows", followRec);
        if (targetUser?.id && isNotificationEnabled(targetUser, "follows")) {
          await base44.functions.invoke("createNotification", {
            user_id: targetUser.id,
            type: "follow",
            reference_id: `follow_${user.id}`,
            message: `${getDisplayName(user)} started following you.`,
            link: createPageUrl("Profile") + `?user=${encodeURIComponent(user.email)}`
          });
        }
        await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + 5 });
        return false;
      }
    },
    onSuccess: (wasFollowing) => {
      queryClient.invalidateQueries({ queryKey: ["following", user?.id, user?.email] });
      if (!wasFollowing) {
        toast.success("Followed! +5 XP ⚡");
      }
    }
  });

  // Recent 500 likes/saves are enough to mark visible feed posts — avoids
  // unbounded pagination for very active users.
  const { data: userLikes = [] } = useQuery({
    queryKey: ["userLikes", user?.email],
    queryFn: () => base44.entities.GlowDropLike.filter({ user_email: user?.email }, "-created_date", 500),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const { data: savedDropRecords = [] } = useQuery({
    queryKey: ["savedDrops", user?.email],
    queryFn: () => base44.entities.SavedDrop.filter({ user_email: user?.email }, "-created_date", 500),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const updateDropsCache = (updater) => {
    queryClient.setQueryData(["allGlowDrops"], old => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          items: (page.items || []).map(updater)
        }))
      };
    });
  };

  const likeMutation = useMutation({
    mutationFn: async ({ id, likes, authorEmail, authorName, action = 'like' }) => {
      if (!user) { requireAuth(); return; }
      const payload = {
        drop_id: id,
        author_email: authorEmail,
        author_name: authorName,
        action: 'toggle'
      };
      if (!isOnline || !navigator.onLine) {
        await queueOfflineAction("likeDrop", payload);
        toast.success("You're offline. Like queued and will sync when internet returns.");
        return { success: true, action: 'like', queued: true };
      }
      const response = await base44.functions.invoke('handleLikeDrop', payload);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to ' + action + ' drop');
      }
      toast.success(response.data.action === 'unlike' ? "❤️ Unliked!" : "❤️ Liked!");
      return response.data;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["allGlowDrops"] });
      await queryClient.cancelQueries({ queryKey: ["userLikes", user?.email] });
      const prevDrops = queryClient.getQueryData(["allGlowDrops"]);
      const prevLikes = queryClient.getQueryData(["userLikes", user?.email]) || [];
      const alreadyLiked = prevLikes.some(like => like.drop_id === id);
      if (alreadyLiked) {
        updateDropsCache(d => d.id === id ? { ...d, likes_count: Math.max(0, (d.likes_count || 1) - 1) } : d);
        queryClient.setQueryData(["userLikes", user?.email], old => (old || []).filter(like => like.drop_id !== id));
      } else {
        updateDropsCache(d => d.id === id ? { ...d, likes_count: (d.likes_count || 0) + 1 } : d);
        queryClient.setQueryData(["userLikes", user?.email], old => [...(old || []), { drop_id: id, user_email: user?.email }]);
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
    queryKey: ["notifications", user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user.id, read: false }),
    enabled: !!user?.id
  });

  useEffect(() => {
    if (!user?.id) return;
    const unsubNotifs = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data.user_id === user.id && !event.data.read) {
        toast(event.data.message, { icon: '🔔' });
        queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
      }
    });
    const unsubDMs = base44.entities.DirectMessage.subscribe((event) => {
      if (event.type === 'create' && event.data.recipient_id === user.id) {
        const senderName = getDisplayName(users.find(u => u.id === event.data.sender_id) || {});
        toast(`New message from ${senderName}`, { icon: '💬' });
      }
    });
    return () => { unsubNotifs(); unsubDMs(); };
  }, [user?.id, user?.email, queryClient]);

  const handleShare = async (drop) => {
    if (!drop?.id) return toast.error("This post is no longer available");
    if (drop.hidden || drop.is_flagged || drop.status === "rejected") return toast.error("This post is restricted and cannot be shared");
    const author = drop?.author_name || drop?.author_username || "Generation LightMode";
    const title = drop?.verse || `Post by ${author}`;
    const shareUrl = getSharePreviewUrl("glowdrop", drop?.id || "post");
    const shareText = buildShareText(title, drop?.reflection, shareUrl);
    const share = { id: drop?.id, title, text: shareText, url: shareUrl };

    // If the device supports file sharing and the post has an image, attach the actual image
    if (typeof navigator.canShare === "function" && typeof navigator.share === "function" && drop.media_url) {
      try {
        const res = await fetch(drop.media_url, { mode: "cors" });
        if (res.ok) {
          const blob = await res.blob();
          const file = new File([blob], `post-${drop.id}.png`, { type: blob.type || "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: share.title || "Generation LightMode", text: share.text, files: [file] });
            toast.success("Shared successfully");
            return;
          }
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        // Fall through to text-based native share below
      }
    }

    const result = await tryNativeShare(share, { contentType: "glowdrop", contentId: drop?.id });
    if (result.status === "shared") toast.success("Shared successfully");
    if (result.status === "failed" || result.status === "unavailable") setShareFallback(share);
  };

  const getUserInfo = (email) => {
    if (email === "system@lightmode.com") {
      return {
        email: "system@lightmode.com",
        full_name: "Generation LightMode",
        bio: "Official Generation LightMode account sharing daily drops, updates, and movement highlights.",
        profile_picture: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg",
        profile_picture_url: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg",
        country: "Global",
      };
    }
    if (user?.email === email) return user;
    const found = (userSearch.isActive ? usersWithSearch : users).find(u => u.email === email);
    if (found) return found;
    // Resolve managed leader identity (posts created via "Post as leader")
    const leader = leaderAccounts.find(a => a.leader_email === email);
    if (leader) {
      return {
        id: leader.id,
        email: leader.leader_email,
        full_name: leader.leader_name,
        bio: leader.leader_bio,
        profile_picture: leader.leader_profile_picture_url,
        profile_picture_url: leader.leader_profile_picture_url,
        country: leader.leader_country,
        is_managed_leader: true,
      };
    }
    return { username: email?.split('@')[0] || "Glow Believer", email };
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

  // Follow records store user IDs only (no emails). Resolve emails client-side
  // for components that match follows by email.
  const followingWithEmails = useMemo(() => {
    const emailById = new Map();
    users.forEach(u => { if (u.id) emailById.set(u.id, u.email); });
    suggestedUsers.forEach(u => { if (u.id) emailById.set(u.id, u.email); });
    leaderAccounts.forEach(a => { if (a.id) emailById.set(a.id, a.leader_email); });
    return following.map(f => f.following_email ? f : { ...f, following_email: emailById.get(f.following_id) });
  }, [following, users, suggestedUsers, leaderAccounts]);

  const followingTargets = useMemo(() => ({
    ids: new Set(followingWithEmails.map(f => f.following_id).filter(Boolean)),
    emails: new Set(followingWithEmails.map(f => f.following_email).filter(Boolean)),
  }), [followingWithEmails]);

  // When the user is searching, merge in any drops fetched from global user search
  // (de-duplicated by id). This lets searches find creators whose posts aren't
  // yet in the local feed cache.
  const dropsWithSearch = useMemo(() => {
    if (!userSearch.isActive || userSearch.matchedDrops.length === 0) return drops;
    const seen = new Set(drops.map(d => d.id));
    const extras = userSearch.matchedDrops.filter(d => d?.id && !seen.has(d.id));
    return [...drops, ...extras];
  }, [drops, userSearch.isActive, userSearch.matchedDrops]);

  // Merge matched users into the resolution pool so author chips show name/photo.
  const usersWithSearch = useMemo(() => {
    if (!userSearch.isActive || userSearch.matchedUsers.length === 0) return users;
    const byEmail = new Map(users.map(u => [u.email, u]));
    userSearch.matchedUsers.forEach(u => { if (u?.email && !byEmail.has(u.email)) byEmail.set(u.email, u); });
    return Array.from(byEmail.values());
  }, [users, userSearch.isActive, userSearch.matchedUsers]);

  const isAdminViewer = user?.role === "admin" || user?.role === "super_admin" || user?.role === "moderator";

  const filteredDrops = useMemo(() => {
    return [...dropsWithSearch]
      .filter((drop) => {
        // Flagged/hidden content is removed from public feeds — only moderators/admins can see it.
        if ((drop.is_flagged || drop.hidden) && !isAdminViewer) return false;

        // Pinned drops are already rendered in the PinnedLeaderPosts ribbon — exclude them here
        // so they don't appear twice. Only excluded on "All" filter so users can still find
        // pinned posts via Following / Most Liked / category filters.
        if (drop.pinned && activeFilter === "All" && !searchQuery) return false;

        const matchesFilter = activeFilter === 'All' ||
          (activeFilter === 'Following' && (followingTargets.emails.has(drop.user_email) || followingTargets.ids.has(getUserInfo(drop.user_email)?.id))) ||
          (activeFilter === 'Most Liked' && (drop.likes_count || 0) >= 1) ||
          (activeFilter === 'Devotional' && drop.category === 'Devotional') ||
          (activeFilter === 'Testimony' && drop.category === 'Testimony');

        const q = searchQuery.toLowerCase();
        const dropAuthor = getUserInfo(drop.user_email);
        const dropAuthorEmail = (drop.user_email || "").toLowerCase();
        const matchesSearch = !searchQuery ||
          drop.verse?.toLowerCase().includes(q) ||
          drop.reflection?.toLowerCase().includes(q) ||
          drop.hashtags?.toLowerCase().includes(q) ||
          drop.category?.toLowerCase().includes(q) ||
          getDisplayName(dropAuthor).toLowerCase().includes(q);

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        if (activeFilter === 'Most Liked') return (b.likes_count || 0) - (a.likes_count || 0);
        return new Date(b.feed_date || b.created_date || 0) - new Date(a.feed_date || a.created_date || 0);
      });
  }, [dropsWithSearch, activeFilter, searchQuery, followingTargets, usersWithSearch, leaderAccounts, user?.email, isAdminViewer]);

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

  // Show spinner only while the lightweight auth check resolves.
  if (!authChecked) {
    return (
      <div className="h-[100dvh] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C8F2D4 0%, #E8F5C8 100%)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] relative overflow-hidden font-['Inter'] flex flex-col" style={{ background: "linear-gradient(135deg, #D4F5D4 0%, #F5F99A 100%)", color: "#0B1B3D" }}>
      <ShareFallbackDialog share={shareFallback} onClose={() => setShareFallback(null)} />
      {isGuest && <GuestStickyBar />}
      <OnboardingModal
        isOpen={!!user && (!user.privacy_consent_given || !user.country || !user.gender || !user.date_of_birth || !user.city || !user.address || !user.postal_code)}
        onCompleted={(updates) => setUser(prev => ({ ...prev, ...updates, privacy_consent_given: true }))}
      />
      <style>{`
        @keyframes float-light {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.15; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.35; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #F0F4FA; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #1E5AFF, #5AC8FF); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #1E5AFF; }
        * { scrollbar-width: thin; scrollbar-color: #1E5AFF #F0F4FA; }
      `}</style>

      {/* Soft accent lights */}
      <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] rounded-full blur-[120px] z-0 opacity-30 pointer-events-none animate-[float-light_8s_ease-in-out_infinite]" style={{ background: "#7FE08A" }}></div>
      <div className="absolute top-[50%] left-[70%] w-[400px] h-[400px] rounded-full blur-[140px] z-0 opacity-25 pointer-events-none animate-[float-light_12s_ease-in-out_infinite_2s]" style={{ background: "#5AC8FF" }}></div>

      {/* MOBILE: branded redesign */}
      <div
        ref={mobileScrollRef}
        className="lg:hidden flex-1 min-h-0 overflow-y-auto overscroll-y-contain"
      >
        <MobileFeed
          pullDistance={mobilePull.pullDistance}
          isRefreshing={mobilePull.isRefreshing}
          pullThreshold={mobilePull.threshold}
          user={user}
          isGuest={isGuest}
          notifications={notifications}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          stories={activeStories}
          getUserInfo={getUserInfo}
          onOpenStatus={(s) => setSelectedStory(s)}
          onOpenStatusComposer={() => requireAuth(() => setIsStatusModalOpen(true))}
          onOpenDropModal={() => requireAuth(() => setIsDropModalOpen(true))}
          filteredDrops={filteredDrops}
          displayCount={displayCount}
          drops={drops}
          likeMutation={likeMutation}
          handleShare={handleShare}
          userLikes={userLikes}
          allUsers={usersWithSearch}
          savedDropRecords={savedDropRecords}
          isLoading={dropsLoading || (userSearch.isActive && userSearch.isLoading)}
          isError={dropsError && isOnline}
          onRefetch={() => refetchDrops()}
          leaderAccounts={leaderAccounts}
          following={followingWithEmails}
          followMutation={followMutation}
          hasMore={displayCount < filteredDrops.length || hasNextPage}
          isLoadingMore={isFetchingNextPage}
          onLoadMore={() => {
            if (displayCount < filteredDrops.length) setDisplayCount(prev => prev + 4);
            else if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
        />
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
          currentUser={user}
        />
      </div>

      <div className="hidden lg:grid flex-1 min-h-0 relative z-10 grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-0 backdrop-blur-[2px]">
        
        {/* Left Sidebar (Desktop) */}
        <div className="hidden lg:flex flex-col py-6 px-4 sticky top-0 h-[100dvh] overflow-y-auto hide-scrollbar relative"
          style={{ background: "#DCEDC8" }}
        >
           <Link to={createPageUrl("Home")} className="flex items-center mb-8 px-2">
             <img
               src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png"
               alt="LightMode"
               style={{ height: 56, width: "auto", objectFit: "contain" }}
             />
           </Link>

           <nav className="flex flex-col gap-1 flex-1">
             <p className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-2" style={{ color: "#90A4AE" }}>Main</p>

             <SidebarLink to={createPageUrl("Feed")} icon={<Home className="w-[18px] h-[18px]" />} label="Home" active />
             <SidebarLink to={createPageUrl("GlowGroups")} icon={<Globe className="w-[18px] h-[18px]" />} label="Explore" />
             <SidebarLink to={createPageUrl("Discover")} icon={<Compass className="w-[18px] h-[18px]" />} label="Discover" />
             {!isGuest && (
               <>
                 <SidebarLink to={createPageUrl("Notifications")} icon={<Bell className="w-[18px] h-[18px]" />} label="Notifications" badge={notifications.length > 0 ? notifications.length : null} />
                 <SidebarLink to={createPageUrl("Dashboard")} icon={<LayoutDashboard className="w-[18px] h-[18px]" />} label="Dashboard" />
                 <SidebarLink to={createPageUrl("Profile")} icon={
                   <div className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0" style={{ border: "1px solid #D5E3F0" }}>
                     <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                   </div>
                 } label="Profile" />
               </>
             )}

             <p className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 mt-5 mb-2" style={{ color: "#90A4AE" }}>Tools</p>

             <SidebarLink to={createPageUrl("Assistant")} icon={<Bot className="w-[18px] h-[18px]" />} label="AI Assistant" accent />

             <button
               onClick={() => setIsResourcesOpen(v => !v)}
               className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left hover:bg-white/30"
               style={{ color: "#37474F" }}
             >
               <span className="w-5 h-5 flex items-center justify-center shrink-0 text-sm">📚</span>
               <span className="text-[13px] font-medium flex-1">Resources</span>
               <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isResourcesOpen ? "rotate-90" : ""}`} style={{ color: "#8A97B5" }} />
             </button>
             {isResourcesOpen && (
               <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l" style={{ borderColor: "#A0E0B0" }}>
                 <Link to={createPageUrl("KeepIt100")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><span>💯</span> Keep It 100</Link>
                 <Link to={createPageUrl("CodesOfTruth")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><span>🔐</span> Codes of Truth</Link>
                 <Link to={createPageUrl("Resources")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><span>🌍</span> Other Resources</Link>
                 <Link to="/ContentHub" className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><span>🎬</span> All Things New</Link>
               </div>
             )}

             <a href="https://bible-school.base44.app/website/Home" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/30" style={{ color: "#37474F" }}>
               <span className="w-5 h-5 flex items-center justify-center shrink-0"><BookOpen className="w-[18px] h-[18px]" /></span>
               <span className="text-[13px] font-medium flex-1">Bible School</span>
             </a>
             <SidebarLink to={createPageUrl("Home")} icon={<ExternalLink className="w-[18px] h-[18px]" />} label="Back to Website" />

             <MyGlowGroupsSidebar userEmail={user?.email} />

             <button
               onClick={() => setIsMoreOpen(v => !v)}
               className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left mt-4 hover:bg-white/30"
               style={{ color: "#37474F" }}
             >
               <span className="w-5 h-5 flex items-center justify-center shrink-0">
                 <Settings className="w-[18px] h-[18px]" />
               </span>
               <span className="text-[13px] font-medium flex-1">More</span>
               <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? "rotate-90" : ""}`} style={{ color: "#8A97B5" }} />
             </button>
             {isMoreOpen && (
               <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l" style={{ borderColor: "#A0E0B0" }}>
                 <Link to={createPageUrl("Milestones")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><Trophy className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} /> Milestones</Link>
                 <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><MapIcon className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Global Reach</Link>
                 <Link to={createPageUrl("Challenges")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><Target className="w-3.5 h-3.5" style={{ color: "#5AC8FF" }} /> Challenges</Link>
                 <Link to={createPageUrl("LightReflections")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><Sparkles className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} /> Light Reflections</Link>
                 <Link to={createPageUrl("FaithQuiz")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><Medal className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Faith Quiz</Link>
                 <Link to={createPageUrl("PrayerWall")} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><Handshake className="w-3.5 h-3.5" style={{ color: "#5AC8FF" }} /> Prayer Wall</Link>
                 <Link to="/TerritoryPhotos" className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><Camera className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Territory Moments</Link>
                 <Link to="/Settings" className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><Settings className="w-3.5 h-3.5" /> Settings</Link>
                 <button onClick={() => setIsClaimInstitutionOpen(true)} className="w-full text-left flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#3A4A6B" }}><Zap className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} /> Claim Institution Dashboard</button>
               </div>
             )}
           </nav>
           
           {!isGuest && (
             <button
                onClick={() => requireAuth(() => setIsDropModalOpen(true))}
                className="mt-6 shrink-0 flex items-center justify-center gap-2 font-black rounded-full w-full py-3.5 text-sm transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: "linear-gradient(90deg, #FFC107 0%, #FF9800 100%)", color: "#0D1B3D", boxShadow: "0 4px 14px rgba(255, 152, 0, 0.35)" }}
              >
                <Plus className="w-4 h-4" /> NEW DROP
              </button>
           )}
        </div>

        {/* Center Feed */}
        <div 
        ref={feedScrollRef} 
        className="h-[100dvh] flex flex-col overflow-y-auto min-h-0 pt-0 lg:pt-8 overscroll-y-none"
        style={{ background: "#F8FAFC" }}
        >
          {/* Top Header Mobile */}
          <div className="flex justify-between items-center px-3 sm:px-4 py-3 sticky top-0 z-50 backdrop-blur-xl border-b lg:hidden gap-3" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E2E8F0" }}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <img
                src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png"
                alt="Generation LightMode"
                className="h-10 sm:h-12 w-auto object-contain max-w-[165px] sm:max-w-[200px]"
              />
            </div>
            <div className="flex gap-3 items-center shrink-0">
              {!isGuest && (
                <>
                  <Link to={createPageUrl("Notifications")} className="relative shrink-0" style={{ color: "#0B1B3D" }}>
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 w-2 h-2 rounded-full" style={{ background: "#FF9F1A" }}></span>
                    )}
                  </Link>
                  <Link to={createPageUrl("Messages")} className="shrink-0" style={{ color: "#0B1B3D" }}>
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Link>
                </>
              )}
              <button onClick={() => setIsMobileNavOpen(true)} className="transition shrink-0" style={{ color: "#4A5878" }}>
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Center Header (Desktop) */}
          <div className="hidden lg:flex items-center justify-between px-4 mb-6 shrink-0 gap-4">
             <h2 className="text-xl font-bold shrink-0" style={{ color: "#0B1B3D" }}>For You</h2>
             <div className="relative w-80">
               <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#1FB8FF" }} />
               <input
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search drops, people, hashtags..."
                 className="w-full rounded-full py-2.5 pl-9 pr-9 text-sm focus:outline-none transition"
                 style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
               />
               {searchQuery && (
                 <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 transition" style={{ color: "#8A97B5" }}>
                   <X className="w-4 h-4" />
                 </button>
               )}
               {userSearch.isActive && userSearch.isLoading && (
                 <div className="absolute -bottom-5 left-3 flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: "#1FB8FF" }}>
                   <Loader2 className="w-3 h-3 animate-spin" /> Searching people…
                 </div>
               )}
             </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden px-3 sm:px-4 mb-3 shrink-0 mt-3">
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

          <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={threshold} />

          <OfflineBanner isOnline={isOnline} lastCached={lastCached} syncing={syncing} onSync={syncQueue} />

          {/* Stories / Status Row */}
          <div className="flex gap-3 sm:gap-4 px-3 sm:px-4 mb-6 sm:mb-5 overflow-x-auto hide-scrollbar pb-2 shrink-0 items-start">
            {!isGuest && (
            <button
              onClick={() => requireAuth(() => setIsStatusModalOpen(true))}
              className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0"
            >
               <div className="relative w-16 h-16 rounded-full p-[2px]" style={{ background: "#1E5AFF" }}>
                  <div className="w-full h-full rounded-full border-[2px] overflow-hidden flex items-center justify-center" style={{ borderColor: "#F8FAFC", background: "#FFFFFF" }}>
                    <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-sm font-black flex items-center justify-center border-2" style={{ background: "#FFD60A", color: "#0B1B3D", borderColor: "#F8FAFC" }}>+</div>
               </div>
               <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#1E5AFF" }}>ADD STATUS</span>
            </button>
            )}

            {activeStories.map((story) => {
              const storyUser = getUserInfo(story.user_email);
              const themeClass = story.background_theme === "violet"
                ? "from-[#8A5CFF] to-[#3B1E70]"
                : story.background_theme === "sunrise"
                ? "from-[#FFD60A] to-[#F97316]"
                : story.background_theme === "midnight"
                ? "from-[#121826] to-[#0B0F1A]"
                : "from-[#00CFFF] to-[#1DA1FF]";

              return (
                <button
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity"
                >
                  <div className="w-16 h-16 rounded-full p-[2px]" style={{ background: "#E2E8F0" }}>
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
                  <span className="text-[11px] font-semibold truncate w-16 text-center" style={{ color: "#0B1B3D" }}>{storyUser?.email === user?.email ? "You" : getDisplayName(storyUser).split(' ')[0]}</span>
                </button>
              );
            })}

            {activeStories.length === 0 && (
              <div className="flex items-center h-16 px-3 text-xs whitespace-nowrap" style={{ color: "#8A97B5" }}>No statuses yet. Be the first to post one.</div>
            )}
          </div>

          <div className="flex gap-2 sm:gap-3 px-3 sm:px-4 mb-5 sm:mb-6 overflow-x-auto hide-scrollbar shrink-0">
            {!isGuest && <button onClick={() => requireAuth(() => setIsDropModalOpen(true))} className="px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5" style={{ background: "#2979FF", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(41, 121, 255, 0.3)" }}><Plus className="w-4 h-4" />Post</button>}
            {isGuest ? (
              <button onClick={() => requireAuth()} className="px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap" style={{ background: "#FFFFFF", border: "1px solid #E0E4EB", color: "#263238" }}>Messages</button>
            ) : (
              <Link to={createPageUrl("Messages")} className="px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap" style={{ background: "#FFFFFF", border: "1px solid #E0E4EB", color: "#263238" }}>Messages</Link>
            )}
            <Link to={createPageUrl("PrayerWall")} className="px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap" style={{ background: "#FFFFFF", border: "1px solid #E0E4EB", color: "#263238" }}>Prayer Wall</Link>
            <Link to={createPageUrl("Live")} className="px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap" style={{ background: "#E3F2FD", color: "#1565C0" }}>Live</Link>
            <Link to="/DailyTruthFeed" className="px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5" style={{ background: "#FFC107", color: "#0D1B3D", boxShadow: "0 4px 12px rgba(255, 193, 7, 0.3)" }}>⚡ Daily Drops</Link>
          </div>

          {/* Pinned Leader Announcements — desktop only, sits above filters */}
          <PinnedLeaderPosts leaderAccounts={leaderAccounts} />

          {/* Filter Bar */}
          <div className="flex gap-2 px-3 sm:px-4 mb-5 sm:mb-6 overflow-x-auto hide-scrollbar shrink-0">
            {['All', 'Following', 'Most Liked', 'Devotional', 'Testimony'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300"
                style={activeFilter === filter
                  ? { background: "#2979FF", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(41, 121, 255, 0.3)" }
                  : { background: "#FFFFFF", color: "#546E7A", border: "1px solid #E0E4EB" }}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="flex flex-col px-3 sm:px-4 py-2 pb-24 lg:pb-6 max-w-2xl mx-auto w-full flex-none">
            {dropsLoading && drops.length === 0 ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>
            ) : dropsError && filteredDrops.length === 0 && isOnline ? (
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
                  <button onClick={() => requireAuth(() => setIsDropModalOpen(true))} className="inline-block mt-4 hover:underline font-semibold" style={{ color: "#0B3FD9" }}>Submit a Light</button>
                )}
              </div>
            ) : (
              <>
                <FeedDropList
                  drops={filteredDrops}
                  displayCount={displayCount}
                  getUserInfo={getUserInfo}
                  user={user}
                  isGuest={isGuest}
                  likeMutation={likeMutation}
                  handleShare={handleShare}
                  userLikes={userLikes}
                  allUsers={usersWithSearch}
                  savedDropRecords={savedDropRecords}
                  leaderAccounts={leaderAccounts}
                  following={followingWithEmails}
                  followMutation={followMutation}
                  hasMore={displayCount < filteredDrops.length || hasNextPage}
                  isLoadingMore={isFetchingNextPage}
                  onLoadMore={() => {
                    if (displayCount < filteredDrops.length) setDisplayCount(prev => prev + 10);
                    else if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                  }}
                />
              </>
            )}
          </div>
        
        </div>

        {/* Right Sidebar (Desktop) */}
        <div className="hidden lg:block py-8 px-6 sticky top-0 h-[100dvh] overflow-y-auto hide-scrollbar" style={{ background: "#FFFFFF" }}>
          
          <DailyChallenges user={user} />

          <AIContentSuggestions
            user={user}
            drops={drops}
            following={followingWithEmails}
            userLikes={userLikes}
            savedDropRecords={savedDropRecords}
            onSearchTag={(topic) => { setSearchQuery(topic); setActiveFilter("All"); }}
          />

          {/* Trending Vibes */}
          <div className="rounded-[24px] p-5 mb-6 relative overflow-hidden" style={{ background: "linear-gradient(145deg, #FFFFFF 0%, #F4F7FE 100%)", border: "1px solid #E2EAFC", boxShadow: "0 8px 32px rgba(30, 90, 255, 0.08), 0 2px 4px rgba(0,0,0,0.02)", minHeight: 162 }}>
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

          {/* People to Connect */}
          <div className="rounded-[24px] p-5" style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)", minHeight: 292 }}>
            <h3 className="font-black text-xs mb-4 tracking-widest uppercase" style={{ color: "#FF9F1A" }}>People to Connect</h3>
            
            <div className="space-y-4">
              {suggestedUsers.filter(u => u.email && u.email !== user?.email && !following.some(f => f.following_email === u.email || f.following_id === u.id)).map((u, i) => {
                return (
                <div key={u.id} className="flex items-center gap-2">
                  <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`} className="flex items-center gap-2 flex-1 min-w-0 no-underline hover:opacity-80 transition">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs shrink-0" style={{ background: "#E0EAF5", border: "1px solid #E0EAF5" }}>
                       <UserAvatar user={u} className="w-full h-full" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-xs truncate flex items-center gap-1" style={{ color: "#0B1B3D" }}>
                        <span className="truncate">{getDisplayName(u)}</span>
                        <CountryFlag country={u.country} size="xs" />
                      </span>
                      <span className="text-[9px] truncate" style={{ color: "#8A97B5" }}>{u.country || "Global Believer"}</span>
                    </div>
                  </Link>
                   <button 
                     onClick={() => followMutation.mutate(u.email)}
                     className="text-[9px] font-bold px-3 py-1.5 rounded-full transition shrink-0"
                     style={{ border: "1px solid #0B3FD9", color: "#0B3FD9", background: "#FFFFFF" }}
                   >
                     CONNECT
                   </button>
                </div>
              )})}
              {suggestedUsers.filter(u => u.email && u.email !== user?.email).length === 0 && (
                <p className="text-xs text-center py-2" style={{ color: "#8A97B5" }}>No other members yet. Invite friends!</p>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-[9px] flex flex-col gap-1" style={{ color: "#8A97B5" }}>
             <p>© 2026 GENERATION LIGHTMODE. ALL RIGHTS RESERVED.</p>
             <div className="flex gap-2">
               <Link to="/Privacy" className="hover:underline">Privacy</Link>
               <Link to="/Terms" className="hover:underline">Terms</Link>
               <Link to="/CommunityGuidelines" className="hover:underline">Community Guidelines</Link>
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

        {/* Mobile Sidebar Drawer */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(10, 26, 61, 0.4)" }} onClick={() => setIsMobileNavOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col py-8 px-6 overflow-y-auto" style={{ background: "#DCEDC8" }}>
              <Link to={createPageUrl("Home")} className="flex items-center mb-10">
                <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" style={{ height: 56, width: "auto", objectFit: "contain" }} />
              </Link>
              <nav className="flex flex-col gap-1 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 mb-2" style={{ color: "#90A4AE" }}>Main</p>
                <SidebarLink to={createPageUrl("Feed")} icon={<Home className="w-[18px] h-[18px]" />} label="Home" active />
                <SidebarLink to={createPageUrl("GlowGroups")} icon={<Globe className="w-[18px] h-[18px]" />} label="Explore" />
                <SidebarLink to={createPageUrl("Discover")} icon={<Compass className="w-[18px] h-[18px]" />} label="Discover" />
                {!isGuest && (
                  <>
                    <SidebarLink to={createPageUrl("Notifications")} icon={<Bell className="w-[18px] h-[18px]" />} label="Notifications" badge={notifications.length > 0 ? notifications.length : null} />
                    <SidebarLink to={createPageUrl("Dashboard")} icon={<LayoutDashboard className="w-[18px] h-[18px]" />} label="Dashboard" />
                    <SidebarLink to={createPageUrl("Profile")} icon={
                      <div className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0" style={{ border: "1px solid #D5E3F0" }}>
                        <UserAvatar user={user} className="w-full h-full" />
                      </div>
                    } label="Profile" />
                  </>
                )}

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 mt-5 mb-2" style={{ color: "#90A4AE" }}>Tools</p>
                <SidebarLink to={createPageUrl("Assistant")} icon={<Bot className="w-[18px] h-[18px]" />} label="AI Assistant" accent />

                <button onClick={() => setIsResourcesOpen(v => !v)} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition w-full text-left hover:bg-white/30" style={{ color: "#37474F" }}>
                  <span className="w-5 h-5 flex items-center justify-center shrink-0 text-sm">📚</span>
                  <span className="text-[13px] font-medium flex-1">Resources</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isResourcesOpen ? "rotate-90" : ""}`} style={{ color: "#8A97B5" }} />
                </button>
                {isResourcesOpen && (
                  <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l" style={{ borderColor: "#A0E0B0" }}>
                    <Link to={createPageUrl("KeepIt100")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#4A5878" }}><span>💯</span> Keep It 100</Link>
                    <Link to={createPageUrl("CodesOfTruth")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#4A5878" }}><span>🔐</span> Codes of Truth</Link>
                    <Link to={createPageUrl("Resources")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#4A5878" }}><span>🌍</span> Other Resources</Link>
                    <Link to="/ContentHub" onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#4A5878" }}><span>🎬</span> All Things New</Link>
                  </div>
                )}
                <a href="https://bible-school.base44.app/website/Home" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileNavOpen(false)} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-white/30" style={{ color: "#37474F" }}>
                  <span className="w-5 h-5 flex items-center justify-center shrink-0"><BookOpen className="w-[18px] h-[18px]" /></span>
                  <span className="text-[13px] font-medium flex-1">Bible School</span>
                </a>
                <SidebarLink to={createPageUrl("Home")} icon={<ExternalLink className="w-[18px] h-[18px]" />} label="Back to Website" />

                <button onClick={() => setIsMoreOpen(v => !v)} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition w-full text-left mt-4 hover:bg-white/30" style={{ color: "#37474F" }}>
                  <span className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Settings className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-[13px] font-medium flex-1">More</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? "rotate-90" : ""}`} style={{ color: "#8A97B5" }} />
                </button>
                {isMoreOpen && (
                  <div className="flex flex-col gap-0.5 ml-3 pl-3 border-l" style={{ borderColor: "#A0E0B0" }}>
                    <Link to={createPageUrl("Milestones")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#4A5878" }}><Trophy className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} /> Milestones</Link>
                    <Link to={createPageUrl("GlobalReach")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#4A5878" }}><MapIcon className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Global Reach</Link>
                    <Link to={createPageUrl("Challenges")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#4A5878" }}><Target className="w-3.5 h-3.5" style={{ color: "#5AC8FF" }} /> Challenges</Link>
                    <Link to={createPageUrl("LightReflections")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#4A5878" }}><Sparkles className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} /> Light Reflections</Link>
                    <Link to={createPageUrl("FaithQuiz")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#4A5878" }}><Medal className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Faith Quiz</Link>
                    <Link to={createPageUrl("PrayerWall")} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#4A5878" }}><Handshake className="w-3.5 h-3.5" style={{ color: "#5AC8FF" }} /> Prayer Wall</Link>
                    <Link to="/TerritoryPhotos" onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#4A5878" }}><Camera className="w-3.5 h-3.5" style={{ color: "#1E5AFF" }} /> Territory Moments</Link>
                    <Link to="/Settings" onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-2.5 text-xs font-semibold px-3 py-2 rounded-lg transition hover:bg-white/40" style={{ color: "#4A5878" }}><Settings className="w-3.5 h-3.5" /> Settings</Link>
                  </div>
                )}
              </nav>
              <button onClick={() => { setIsMobileNavOpen(false); requireAuth(() => setIsDropModalOpen(true)); }} className="mt-6 shrink-0 flex items-center justify-center gap-2 font-black rounded-full w-full py-3.5 text-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(90deg, #FFC107 0%, #FF9800 100%)", color: "#0D1B3D", boxShadow: "0 4px 14px rgba(255, 152, 0, 0.35)" }}>
                <Plus className="w-4 h-4" /> NEW DROP
              </button>
            </div>
          </div>
        )}

        {/* Bottom Mobile Navigation — hidden for guests (sticky sign-in bar replaces it) */}
        <div className={`fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t justify-around items-center py-2.5 px-3 sm:px-6 z-50 pb-4 sm:pb-5 sm:max-w-xl sm:mx-auto sm:border-x lg:hidden ${isGuest ? "hidden" : "flex"}`} style={{ background: "rgba(246, 248, 252, 0.98)", borderColor: "#E2E8F0", boxShadow: "0 -8px 24px rgba(15, 23, 42, 0.08)" }}>
          <Link to={createPageUrl("Feed")} className="flex h-11 w-11 items-center justify-center rounded-full" title="Home">
            <Home className="w-5 h-5" fill="#0B3FD9" style={{ color: "#0B3FD9" }} />
          </Link>
          <button onClick={() => setIsSearchOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full" title="Search">
            <SearchIcon className="w-5 h-5" style={{ color: "#0B1B3D" }} />
          </button>
          {!isGuest && (
            <button onClick={() => requireAuth(() => setIsDropModalOpen(true))} className="flex h-11 w-11 items-center justify-center rounded-full" title="Create post">
              <SquarePlus className="w-5 h-5" style={{ color: "#0B1B3D" }} />
            </button>
          )}
          <Link to={createPageUrl("GlobalReach")} className="flex h-11 w-11 items-center justify-center rounded-full" title="Global Reach">
            <Globe className="w-5 h-5" style={{ color: "#0B1B3D" }} />
          </Link>
          <Link to={createPageUrl("DailyTruthFeed")} className="flex h-11 w-11 items-center justify-center rounded-full" title="Daily Drops">
            <PlaySquare className="w-5 h-5" style={{ color: "#0B1B3D" }} />
          </Link>
          {!isGuest && (
            <Link to={createPageUrl("Profile")} className="flex h-11 w-11 items-center justify-center rounded-full" title="Profile">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] uppercase font-bold overflow-hidden" style={{ border: "2px solid #1FB8FF" }}>
                <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}