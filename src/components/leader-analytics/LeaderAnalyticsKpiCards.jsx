import React from "react";
import { Users, Eye, Heart, MessageCircle, Pin, BarChart3 } from "lucide-react";

/**
 * KPI cards row for the Leader Analytics dashboard.
 * Each card is a small focused stat with an icon + accent color.
 */
export default function LeaderAnalyticsKpiCards({ totals }) {
  const cards = [
    { label: "Total Reach", value: totals.reach, icon: <Eye className="w-4 h-4" />, accent: "#0B3FD9", bg: "#EEF3FF" },
    { label: "Followers", value: totals.followers, icon: <Users className="w-4 h-4" />, accent: "#1FB8FF", bg: "#E0F4FF" },
    { label: "Posts Published", value: totals.posts, icon: <BarChart3 className="w-4 h-4" />, accent: "#0B1B3D", bg: "#F0F4FA" },
    { label: "Total Likes", value: totals.likes, icon: <Heart className="w-4 h-4" />, accent: "#EF4444", bg: "#FEE2E2" },
    { label: "Total Comments", value: totals.comments, icon: <MessageCircle className="w-4 h-4" />, accent: "#8B5CF6", bg: "#EDE9FE" },
    { label: "Pinned Posts", value: totals.pinned, icon: <Pin className="w-4 h-4" />, accent: "#CC7A00", bg: "#FFF8E6" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map(card => (
        <div key={card.label} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.04)" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: card.bg, color: card.accent }}>
              {card.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#6B7FA0" }}>{card.label}</span>
          </div>
          <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: card.accent }}>
            {(card.value || 0).toLocaleString()}
          </div>
        </div>
      ))}

      <div className="rounded-2xl p-4 col-span-2 sm:col-span-3 lg:col-span-6" style={{ background: "linear-gradient(135deg, #FFFCF0, #FFF8E6)", border: "1px solid #FFE4A0" }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#CC7A00" }}>Average engagement / post</span>
          <span className="text-base font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>
            {(totals.avgEngagement || 0).toFixed(1)}
          </span>
          <span className="text-xs" style={{ color: "#8B6914" }}>(likes + comments)</span>
        </div>
      </div>
    </div>
  );
}