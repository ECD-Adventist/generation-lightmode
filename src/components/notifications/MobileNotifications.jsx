import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Bell, Heart, MessageCircle, Zap, Info, CheckCheck, Trash2, Loader2, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { notificationCategoryLabels, getNotificationCategory } from "@/lib/notifications";
import MobilePageHeader from "@/components/mobile/MobilePageHeader";
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

const typeBg = {
  like: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" },
  comment: { background: "rgba(31,184,255,0.1)", border: "1px solid #B8E5FF" },
  reply: { background: "rgba(31,184,255,0.1)", border: "1px solid #B8E5FF" },
  message: { background: "rgba(31,184,255,0.1)", border: "1px solid #B8E5FF" },
  dm: { background: "rgba(31,184,255,0.1)", border: "1px solid #B8E5FF" },
  prayer: { background: "rgba(11,63,217,0.08)", border: "1px solid #D6E4FF" },
  repost: { background: "rgba(255,208,0,0.12)", border: "1px solid #FFE4A0" },
  milestone: { background: "rgba(255,208,0,0.12)", border: "1px solid #FFE4A0" },
  system: { background: "rgba(11,63,217,0.08)", border: "1px solid #D6E4FF" },
  follow: { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" },
};

export default function MobileNotifications({
  isLoading, filteredNotifications, unreadCount, activeCategory, setActiveCategory,
  categoryCounts, markReadMutation, markAllReadMutation, deleteMutation,
  following, followBackMutation, user, getNotificationUserEmail, allUsers = [],
  hasMore, onLoadMore
}) {
  return (
    <div className="min-h-screen pb-24 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <MobilePageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        action={unreadCount > 0 && (
          <button onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: "rgba(31,184,255,0.1)", border: "1px solid #B8E5FF", color: "#0B3FD9" }}>
            <CheckCheck className="w-3 h-3" /> Read all
          </button>
        )}
      />

      <div className="px-3 py-4 space-y-3">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {Object.keys(notificationCategoryLabels).map((key) => {
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition"
                style={isActive
                  ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 10px rgba(11,63,217,0.25)" }
                  : { background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}
              >
                {notificationCategoryLabels[key]}
                <span className="ml-0.5 opacity-70">{categoryCounts[key]}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin" style={{ color: "#1FB8FF" }} /></div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
            <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "#EEF3FF" }}>
              <Bell className="w-7 h-7" style={{ color: "#0B3FD9" }} />
            </div>
            <p className="font-black text-base" style={{ color: "#0B1B3D" }}>No alerts</p>
            <p className="text-[13px] mt-1" style={{ color: "#6B7FA0" }}>Your inbox is clean.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((n) => {
              const targetEmail = getNotificationUserEmail(n);
              const targetUser = allUsers.find(entry => entry.email === targetEmail);
              const category = getNotificationCategory(n.type);
              const isFollowing = following.some((f) => f.following_email === targetEmail);
              return (
                <div
                  key={n.id}
                  className="flex items-start gap-2.5 p-3 rounded-2xl"
                  style={n.read
                    ? { background: "#FFFFFF", border: "1px solid #E6ECF5", opacity: 0.75 }
                    : { background: "#FFFFFF", border: "1px solid #D6E4FF", boxShadow: "0 2px 8px rgba(11,63,217,0.05)" }}
                >
                  {targetUser ? (
                    <UserAvatar user={targetUser} className="w-9 h-9 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={typeBg[n.type] || { background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                      {typeIcon[n.type] || <Bell className="w-4 h-4" style={{ color: "#8A97B5" }} />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-snug" style={n.read ? { color: "#6B7FA0" } : { color: "#0B1B3D", fontWeight: 500 }}>{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px]" style={{ color: "#8A97B5" }}>
                        {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : "just now"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider" style={{ background: "#EEF3FF", color: "#6B7FA0" }}>{notificationCategoryLabels[category]}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {n.type === "follow" && targetEmail && targetEmail !== user?.email && (
                        isFollowing ? (
                          <Link to={n.link} onClick={() => !n.read && markReadMutation.mutate(n.id)} className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}>Following</Link>
                        ) : (
                          <button onClick={() => followBackMutation.mutate(targetEmail)} className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>Follow back</button>
                        )
                      )}
                      {n.link && (
                        <Link to={n.link} onClick={() => !n.read && markReadMutation.mutate(n.id)} className="text-[11px] font-bold" style={{ color: "#0B3FD9" }}>View</Link>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!n.read && (
                      <button onClick={() => markReadMutation.mutate(n.id)} title="Mark read" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(31,184,255,0.08)", color: "#0B3FD9" }}>
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteMutation.mutate(n.id)} title="Delete" className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <button onClick={onLoadMore} className="w-full py-3 rounded-2xl font-bold text-sm" style={{ background: "#FFFFFF", border: "1px solid #D6E4FF", color: "#0B3FD9" }}>
                Load More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}