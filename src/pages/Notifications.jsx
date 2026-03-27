import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, MessageCircle, Zap, Info, CheckCheck, Trash2, Loader2, Home, Users, User, Globe, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { getNotificationCategory, notificationCategoryLabels, isNotificationEnabled } from "@/lib/notifications";

const typeIcon = {
  like: <Heart className="w-4 h-4 text-red-400" />,
  reply: <MessageCircle className="w-4 h-4 text-[#00CFFF]" />,
  message: <MessageCircle className="w-4 h-4 text-[#00CFFF]" />,
  milestone: <Zap className="w-4 h-4 text-[#FFD000]" />,
  system: <Info className="w-4 h-4 text-[#8A5CFF]" />,
  follow: <UserPlus className="w-4 h-4 text-green-400" />,
};

const typeBg = {
  like: "bg-red-500/10 border-red-500/20",
  reply: "bg-[#00CFFF]/10 border-[#00CFFF]/20",
  message: "bg-[#00CFFF]/10 border-[#00CFFF]/20",
  milestone: "bg-[#FFD000]/10 border-[#FFD000]/20",
  system: "bg-[#8A5CFF]/10 border-[#8A5CFF]/20",
  follow: "bg-green-500/10 border-green-500/20",
};

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["allNotifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }),
    enabled: !!user,
    refetchInterval: 15000,
  });

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
    if (!user?.email) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === user.email) {
        queryClient.invalidateQueries({ queryKey: ["allNotifications", user.email] });
        queryClient.invalidateQueries({ queryKey: ["notifications", user.email] });
      }
    });
    return unsub;
  }, [user?.email, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allNotifications", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allNotifications", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allNotifications", user?.email] })
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

      await base44.entities.Follow.create({ follower_email: user.email, following_email: targetEmail });
      const targetUser = allUsers.find(entry => entry.email === targetEmail);
      if (isNotificationEnabled(targetUser, "follows")) {
        await base44.entities.Notification.create({
          user_email: targetEmail,
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
  const filteredNotifications = activeCategory === "all"
    ? sorted
    : sorted.filter((notification) => getNotificationCategory(notification.type) === activeCategory);

  const categoryCounts = useMemo(() => ({
    all: sorted.length,
    social: sorted.filter((item) => getNotificationCategory(item.type) === "social").length,
    community: sorted.filter((item) => getNotificationCategory(item.type) === "community").length,
    system: sorted.filter((item) => getNotificationCategory(item.type) === "system").length,
  }), [sorted]);

  const getNotificationUserEmail = (notification) => {
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

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
              alt="LightMode"
              style={{ height: 56, width: "auto", filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to={createPageUrl("GlowGroups")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Users className="w-4 h-4" /><span className="hidden sm:inline">Groups</span>
            </Link>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Zap className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to={createPageUrl("Profile")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <User className="w-4 h-4" /><span className="hidden sm:inline">Profile</span>
            </Link>
            <Link to={createPageUrl("Home")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-[#00CFFF] hover:bg-white/5 transition text-sm font-medium border border-white/5">
              <Globe className="w-4 h-4" /> Website
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-[#121826] border border-white/10 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-5 h-5 text-[#00CFFF]" />
              <h1 className="text-2xl font-black" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Notification Center</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-6 h-6 px-2 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">Manage what reaches you and browse alerts by category for a cleaner inbox.</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-2 text-xs font-bold text-[#00CFFF] hover:text-white transition px-4 py-2 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 hover:bg-[#00CFFF]/20"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <div className="space-y-4">
            <div className="bg-[#121826] border border-white/10 rounded-3xl p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-4">Alert Preferences</h2>
              <div className="space-y-3">
                {preferenceItems.map((item) => {
                  const enabled = user[item.field] !== false;
                  return (
                    <button
                      key={item.field}
                      onClick={() => togglePreferenceMutation.mutate(item.field)}
                      className="w-full rounded-2xl border border-white/10 bg-[#0B0F1A] px-4 py-3 text-left hover:border-white/20 transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-white text-sm">{item.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${enabled ? "bg-[#00CFFF]/20 text-[#00CFFF]" : "bg-white/5 text-gray-400"}`}>
                          {enabled ? "On" : "Off"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#121826] border border-white/10 rounded-3xl p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-300 mb-4">Categories</h2>
              <div className="space-y-2">
                {Object.keys(notificationCategoryLabels).map((categoryKey) => (
                  <button
                    key={categoryKey}
                    onClick={() => setActiveCategory(categoryKey)}
                    className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${activeCategory === categoryKey ? "bg-[#00CFFF]/10 border border-[#00CFFF]/20 text-[#00CFFF]" : "bg-[#0B0F1A] border border-white/10 text-gray-300 hover:border-white/20"}`}
                  >
                    <span>{notificationCategoryLabels[categoryKey]}</span>
                    <span className="text-xs text-gray-500">{categoryCounts[categoryKey]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-24 text-gray-500 bg-[#121826] border border-white/10 rounded-3xl">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-bold text-lg">No {notificationCategoryLabels[activeCategory].toLowerCase()} alerts right now.</p>
                <p className="text-sm mt-1">Your inbox is looking clean.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((n) => {
                  const category = getNotificationCategory(n.type);
                  const targetEmail = getNotificationUserEmail(n);
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${n.read ? "bg-[#121826]/50 border-white/5 opacity-70" : "bg-[#121826] border-white/10 hover:border-white/20"}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${typeBg[n.type] || "bg-white/5 border-white/10"}`}>
                        {typeIcon[n.type] || <Bell className="w-4 h-4 text-gray-400" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className={`text-sm leading-snug ${n.read ? "text-gray-400" : "text-white font-medium"}`}>{n.message}</p>
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] uppercase tracking-wider text-gray-400">{notificationCategoryLabels[category]}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1">
                          {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : "just now"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {n.type === "follow" && targetEmail && targetEmail !== user?.email && (
                          following.some(f => f.following_email === targetEmail) ? (
                            <Link
                              to={n.link}
                              onClick={() => !n.read && markReadMutation.mutate(n.id)}
                              className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/10 text-gray-300 hover:bg-white/15 transition"
                            >
                              Following
                            </Link>
                          ) : (
                            <button
                              onClick={() => followBackMutation.mutate(targetEmail)}
                              className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#00CFFF] text-black hover:bg-[#00CFFF]/80 transition"
                            >
                              Follow back
                            </button>
                          )
                        )}
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => !n.read && markReadMutation.mutate(n.id)}
                            className="text-[11px] font-bold text-[#00CFFF] hover:text-white transition"
                          >
                            View
                          </Link>
                        )}
                        <div className="flex items-center gap-1">
                          {!n.read && (
                            <button
                              onClick={() => markReadMutation.mutate(n.id)}
                              title="Mark as read"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-[#00CFFF] hover:bg-[#00CFFF]/10 transition"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(n.id)}
                            title="Delete"
                            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}