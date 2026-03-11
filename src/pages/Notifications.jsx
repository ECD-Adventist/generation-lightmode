import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, MessageCircle, Zap, Info, CheckCheck, Trash2, Loader2, Home, Users, User, Globe, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const typeIcon = {
  like: <Heart className="w-4 h-4 text-red-400" />,
  reply: <MessageCircle className="w-4 h-4 text-[#00CFFF]" />,
  milestone: <Zap className="w-4 h-4 text-[#FFD000]" />,
  system: <Info className="w-4 h-4 text-[#8A5CFF]" />,
  follow: <UserPlus className="w-4 h-4 text-green-400" />,
};

const typeBg = {
  like: "bg-red-500/10 border-red-500/20",
  reply: "bg-[#00CFFF]/10 border-[#00CFFF]/20",
  milestone: "bg-[#FFD000]/10 border-[#FFD000]/20",
  system: "bg-[#8A5CFF]/10 border-[#8A5CFF]/20",
  follow: "bg-green-500/10 border-green-500/20",
};

export default function Notifications() {
  const [user, setUser] = useState(null);
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

  // Real-time
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

  const unreadCount = notifications.filter(n => !n.read).length;
  const sorted = [...notifications].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Top Nav Bar */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_692b64307296ee339e64b660/c20e0f05a_GENERATIONLIGHTMODE-LOGO.png"
              alt="LightMode"
              style={{ height: 32, width: "auto", filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
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

      {/* Header */}
      <div className="bg-[#0B0F1A] border-b border-white/10 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#00CFFF]" />
            <h1 className="text-xl font-black" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-2 text-xs font-bold text-[#00CFFF] hover:text-white transition px-3 py-1.5 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 hover:bg-[#00CFFF]/20"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg">You're all caught up!</p>
            <p className="text-sm mt-1">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                  n.read
                    ? "bg-[#121826]/50 border-white/5 opacity-60"
                    : "bg-[#121826] border-white/10 hover:border-white/20"
                }`}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${typeBg[n.type] || "bg-white/5 border-white/10"}`}>
                  {typeIcon[n.type] || <Bell className="w-4 h-4 text-gray-400" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${n.read ? "text-gray-400" : "text-white font-medium"}`}>
                    {n.message}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-1">
                    {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : "just now"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}