import React, { useEffect, useMemo, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { dualWriteSupabase } from "@/lib/dualWriteSupabase";
import { dualDeleteSupabase } from "@/lib/dualDeleteSupabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, MessageCircle, Zap, Info, CheckCheck, Trash2, Loader2, Home, Users, User, Globe, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { getNotificationCategory, notificationCategoryLabels, isNotificationEnabled } from "@/lib/notifications";
import AppFooter from "@/components/AppFooter";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/mobile/PullToRefreshIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNotifications from "@/components/notifications/MobileNotifications";
import UserAvatar from "@/components/common/UserAvatar";

const typeIcon = {
  like: <Heart className="w-4 h-4" style={{ color: "#EF4444" }} />,
  comment: <MessageCircle className="w-4 h-4" style={{ color: "#1FB8FF" }} />,
  reply: <MessageCircle className="w-4 h-4" style={{ color: "#1FB8FF" }} />,
  message: <MessageCircle className="w-4 h-4" style={{ color: "#1FB8FF" }} />,
  dm: <MessageCircle className="w-4 h-4" style={{ color: "#1FB8FF" }} />,
  prayer: <Heart className="w-4 h-4" style={{ color: "#0B3FD9" }} />,
  repost: <Zap className="w-4 h-4" style={{ color: "#CC7A00" }} />,
  milestone: <Zap className="w-4 h-4" style={{ color: "#CC7A00" }} />,
  system: <Info className="w-4 h-4" style={{ color: "#0B3FD9" }} />,
  follow: <UserPlus className="w-4 h-4" style={{ color: "#22C55E" }} />,
};

const typeBgStyle = {
  like: { background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" },
  comment: { background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF" },
  reply: { background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF" },
  message: { background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF" },
  dm: { background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF" },
  prayer: { background: "rgba(11, 63, 217, 0.08)", border: "1px solid #D6E4FF" },
  repost: { background: "rgba(255, 208, 0, 0.12)", border: "1px solid #FFE4A0" },
  milestone: { background: "rgba(255, 208, 0, 0.12)", border: "1px solid #FFE4A0" },
  system: { background: "rgba(11, 63, 217, 0.08)", border: "1px solid #D6E4FF" },
  follow: { background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)" },
};

export default function Notifications() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(20);
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);

  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(scrollRef, async () => {
    await queryClient.invalidateQueries({ queryKey: ["allNotifications", user?.id] });
    await queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["allNotifications", user?.id],
    queryFn: () => base44.entities.Notification.filter({ user_id: user.id }, "-created_date", 100),
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  // Reset the visible window when the category filter changes.
  useEffect(() => { setVisibleCount(20); }, [activeCategory]);

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user?.email }),
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["notificationUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!user?.id) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_id === user.id) {
        queryClient.invalidateQueries({ queryKey: ["allNotifications", user.id] });
        queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
      }
    });
    return unsub;
  }, [user?.id, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allNotifications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      // The backend clears a bounded batch per call to respect rate limits.
      // Keep calling until nothing remains.
      const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      let safety = 100;
      let zeroProgress = 0;
      while (safety-- > 0) {
        const res = await base44.functions.invoke("markAllNotificationsRead", {});
        if (!res.data?.success) throw new Error(res.data?.error || "Failed to mark all read");
        if (!res.data.remaining) break;
        // Track stalls (rate-limited calls that cleared nothing) and back off.
        zeroProgress = res.data.updated > 0 ? 0 : zeroProgress + 1;
        if (zeroProgress >= 6) break; // give up gracefully; user can tap again
        await sleep(zeroProgress > 0 ? 1500 : 700);
        queryClient.invalidateQueries({ queryKey: ["allNotifications", user?.id] });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allNotifications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast.success("All notifications marked as read");
    },
    onError: () => toast.error("Couldn't mark all as read. Please try again.")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Notification.delete(id);
      dualDeleteSupabase("notifications", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allNotifications", user?.id] })
  });

  const togglePreferenceMutation = useMutation({
    mutationFn: async (field) => {
      const currentEnabled = user[field] !== false;
      await base44.auth.updateMe({ [field]: !currentEnabled });
      return await base44.auth.me();
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast.success("Notification preference updated");
    }
  });

  const followBackMutation = useMutation({
    mutationFn: async (targetEmail) => {
      const existingFollow = following.find(f => f.following_email === targetEmail);
      if (existingFollow) return "already_following";
      const followRec = await base44.entities.Follow.create({ follower_email: user.email, following_email: targetEmail });
      dualWriteSupabase("follows", followRec);
      const targetUser = allUsers.find(entry => entry.email === targetEmail);
      if (targetUser?.id && isNotificationEnabled(targetUser, "follows")) {
        await base44.functions.invoke("createNotification", {
          user_id: targetUser.id,
          type: "follow",
          message: `${user.full_name || 'Someone'} followed you back.`,
          link: createPageUrl("Profile") + `?user=${encodeURIComponent(user.email)}`
        });
      }
      return "followed";
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ["following", user?.email] });
      if (status === "followed") toast.success("Followed back");
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const sorted = [...notifications].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const allFilteredNotifications = activeCategory === "all"
    ? sorted
    : sorted.filter((notification) => getNotificationCategory(notification.type) === activeCategory);
  const filteredNotifications = allFilteredNotifications.slice(0, visibleCount);
  const hasMoreNotifications = visibleCount < allFilteredNotifications.length;

  const categoryCounts = useMemo(() => ({
    all: sorted.length,
    social: sorted.filter((item) => getNotificationCategory(item.type) === "social").length,
    community: sorted.filter((item) => getNotificationCategory(item.type) === "community").length,
    system: sorted.filter((item) => getNotificationCategory(item.type) === "system").length,
  }), [sorted]);

  const getNotificationUserEmail = (notification) => {
    if (notification?.actor_user_id) {
      const actor = allUsers.find(entry => entry.id === notification.actor_user_id);
      if (actor?.email) return actor.email;
    }
    if (!notification?.link) return null;
    const query = notification.link.split("?")[1];
    if (!query) return null;
    return new URLSearchParams(query).get("user");
  };

  const preferenceItems = [
    { field: "notify_likes", label: "Likes", description: "When someone lights up your drop." },
    { field: "notify_follows", label: "Follows", description: "When someone follows or follows back." },
    { field: "notify_comments", label: "Comments", description: "When someone comments on your drop." },
    { field: "notify_messages", label: "Messages", description: "When someone sends you a direct message." },
  ];

  if (!user) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>;

  if (isMobile) {
    return (
      <MobileNotifications
        isLoading={isLoading}
        filteredNotifications={filteredNotifications}
        unreadCount={unreadCount}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categoryCounts={categoryCounts}
        markReadMutation={markReadMutation}
        markAllReadMutation={markAllReadMutation}
        deleteMutation={deleteMutation}
        following={following}
        followBackMutation={followBackMutation}
        user={user}
        getNotificationUserEmail={getNotificationUserEmail}
        allUsers={allUsers}
        hasMore={hasMoreNotifications}
        onLoadMore={() => setVisibleCount(c => c + 20)}
      />
    );
  }

  const cardStyle = { background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" };

  return (
    <div ref={scrollRef} className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D", overflowY: "auto" }}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={threshold} />
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.9)", borderColor: "#E2E8F0" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" style={{ height: 48, width: "auto" }} />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
              { to: "GlowGroups", icon: <Users className="w-4 h-4" />, label: "Groups" },
              { to: "Dashboard", icon: <Zap className="w-4 h-4" />, label: "Dashboard" },
              { to: "Profile", icon: <User className="w-4 h-4" />, label: "Profile" },
            ].map(item => (
              <Link key={item.to} to={createPageUrl(item.to)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-sm font-semibold" style={{ color: "#4A5878" }}
                onMouseOver={e => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5878"; }}
              >
                {item.icon}<span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="rounded-[1.5rem] p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4" style={cardStyle}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-5 h-5" style={{ color: "#1FB8FF" }} />
              <h1 className="text-2xl font-black" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#0B1B3D" }}>Notification Center</h1>
              {unreadCount > 0 && (
                <span className="text-white text-xs font-bold rounded-full min-w-6 h-6 px-2 flex items-center justify-center" style={{ background: "#EF4444" }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: "#6B7FA0" }}>Manage what reaches you and browse alerts by category for a cleaner inbox.</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-2 text-xs font-bold transition px-4 py-2 rounded-full"
              style={{ background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF", color: "#0B3FD9" }}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <div className="space-y-4">
            <div className="rounded-[1.5rem] p-5" style={cardStyle}>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "#0B1B3D" }}>Alert Preferences</h2>
              <div className="space-y-3">
                {preferenceItems.map((item) => {
                  const enabled = user[item.field] !== false;
                  return (
                    <button
                      key={item.field}
                      onClick={() => togglePreferenceMutation.mutate(item.field)}
                      className="w-full rounded-[1.25rem] px-4 py-3 text-left transition"
                      style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-sm" style={{ color: "#0B1B3D" }}>{item.label}</div>
                          <div className="text-xs mt-1" style={{ color: "#6B7FA0" }}>{item.description}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={enabled ? { background: "rgba(31, 184, 255, 0.15)", color: "#0B3FD9" } : { background: "#EEF3FF", color: "#8A97B5" }}>
                          {enabled ? "On" : "Off"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.5rem] p-5" style={cardStyle}>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "#0B1B3D" }}>Categories</h2>
              <div className="space-y-2">
                {Object.keys(notificationCategoryLabels).map((categoryKey) => {
                  const isActive = activeCategory === categoryKey;
                  return (
                    <button
                      key={categoryKey}
                      onClick={() => setActiveCategory(categoryKey)}
                      className="w-full flex items-center justify-between rounded-[1.25rem] px-4 py-3 text-sm font-semibold transition"
                      style={isActive
                        ? { background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF", color: "#0B3FD9" }
                        : { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}
                    >
                      <span>{notificationCategoryLabels[categoryKey]}</span>
                      <span className="text-xs" style={{ color: isActive ? "#0B3FD9" : "#8A97B5" }}>{categoryCounts[categoryKey]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-24 rounded-[1.5rem]" style={{ ...cardStyle, color: "#8A97B5" }}>
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p className="font-bold text-lg" style={{ color: "#0B1B3D" }}>No {notificationCategoryLabels[activeCategory].toLowerCase()} alerts right now.</p>
                <p className="text-sm mt-1">Your inbox is looking clean.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((n) => {
                  const category = getNotificationCategory(n.type);
                  const targetEmail = getNotificationUserEmail(n);
                  const targetUser = allUsers.find(entry => entry.email === targetEmail);
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 p-4 rounded-[1.25rem] transition-all"
                      style={n.read
                        ? { background: "#FFFFFF", border: "1px solid #E6ECF5", opacity: 0.75 }
                        : { background: "#FFFFFF", border: "1px solid #D6E4FF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.06)" }}
                    >
                      {targetUser ? (
                        <UserAvatar user={targetUser} className="w-10 h-10 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={typeBgStyle[n.type] || { background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                          {typeIcon[n.type] || <Bell className="w-4 h-4" style={{ color: "#8A97B5" }} />}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm leading-snug" style={n.read ? { color: "#6B7FA0" } : { color: "#0B1B3D", fontWeight: 500 }}>{n.message}</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider" style={{ background: "#EEF3FF", color: "#6B7FA0" }}>{notificationCategoryLabels[category]}</span>
                        </div>
                        <p className="text-[11px] mt-1" style={{ color: "#8A97B5" }}>
                          {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : "just now"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {n.type === "follow" && targetEmail && targetEmail !== user?.email && (
                          following.some(f => f.following_email === targetEmail) ? (
                            <Link
                              to={n.link}
                              onClick={() => !n.read && markReadMutation.mutate(n.id)}
                              className="px-3 py-1.5 rounded-full text-[11px] font-bold transition"
                              style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}
                            >
                              Following
                            </Link>
                          ) : (
                            <button
                              onClick={() => followBackMutation.mutate(targetEmail)}
                              className="px-3 py-1.5 rounded-full text-[11px] font-bold transition"
                              style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.25)" }}
                            >
                              Follow back
                            </button>
                          )
                        )}
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => !n.read && markReadMutation.mutate(n.id)}
                            className="text-[11px] font-bold transition hover:underline"
                            style={{ color: "#0B3FD9" }}
                          >
                            View
                          </Link>
                        )}
                        <div className="flex items-center gap-1">
                          {!n.read && (
                            <button
                              onClick={() => markReadMutation.mutate(n.id)}
                              title="Mark as read"
                              className="w-7 h-7 rounded-full flex items-center justify-center transition"
                              style={{ color: "#8A97B5" }}
                              onMouseOver={e => { e.currentTarget.style.background = "rgba(31, 184, 255, 0.1)"; e.currentTarget.style.color = "#0B3FD9"; }}
                              onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8A97B5"; }}
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(n.id)}
                            title="Delete"
                            className="w-7 h-7 rounded-full flex items-center justify-center transition"
                            style={{ color: "#8A97B5" }}
                            onMouseOver={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.color = "#EF4444"; }}
                            onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8A97B5"; }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {hasMoreNotifications && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setVisibleCount(c => c + 20)}
                      className="px-6 py-3 rounded-full text-sm font-bold transition"
                      style={{ background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF", color: "#0B3FD9" }}
                    >
                      Load More
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}