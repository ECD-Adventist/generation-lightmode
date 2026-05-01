import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, Users, BookOpen, Award, Sparkles } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

const GLOW_RANKS = [
  { min: 0, name: "Spark", color: "#6B7FA0" },
  { min: 50, name: "Flame", color: "#FF9F1A" },
  { min: 150, name: "Torch", color: "#0B3FD9" },
  { min: 300, name: "Beacon", color: "#1FB8FF" },
  { min: 600, name: "Luminary", color: "#8A5CFF" },
  { min: 1000, name: "Lightbearer", color: "#FFD000" },
];

function getRank(score) {
  let rank = GLOW_RANKS[0];
  for (const r of GLOW_RANKS) {
    if (score >= r.min) rank = r;
  }
  return rank;
}

export default function ProfileHoverSummary({ dropUser }) {
  const email = dropUser?.email;

  const { data: drops = [] } = useQuery({
    queryKey: ["hoverDrops", email],
    queryFn: () => base44.entities.GlowDrop.filter({ user_email: email }),
    enabled: !!email,
    staleTime: 60000,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["hoverFollowers", email],
    queryFn: () => base44.entities.Follow.filter({ following_email: email }),
    enabled: !!email,
    staleTime: 60000,
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["hoverMemberships", email],
    queryFn: () => base44.entities.GlowGroupMember.filter({ user_email: email }),
    enabled: !!email,
    staleTime: 60000,
  });

  const { data: certs = [] } = useQuery({
    queryKey: ["hoverCerts", email],
    queryFn: () => base44.entities.Certificate.filter({ user_email: email }),
    enabled: !!email,
    staleTime: 60000,
  });

  const glowScore = dropUser?.glow_score || 0;
  const rank = getRank(glowScore);

  return (
    <div className="font-['Inter']">
      {/* Gradient header */}
      <div className="relative h-16 shrink-0" style={{ background: "linear-gradient(135deg, #0B1B3D 0%, #0B3FD9 50%, #1FB8FF 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 80% 40%, rgba(90,216,255,0.5), transparent 50%)" }} />
      </div>

      {/* Content */}
      <div className="bg-white px-4 pb-4 -mt-8 relative">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full p-[2px] bg-white mb-2 relative z-10" style={{ boxShadow: "0 4px 14px rgba(11, 63, 217, 0.2)" }}>
          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
            <img src={dropUser?.profile_picture_url || defaultAvatar} className="w-full h-full object-cover" alt="" />
          </div>
        </div>

        {/* Name + rank */}
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="font-bold text-sm truncate" style={{ color: "#0B1B3D" }}>{getDisplayName(dropUser)}</p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: `${rank.color}15`, color: rank.color, border: `1px solid ${rank.color}30` }}>
            <Sparkles className="w-2.5 h-2.5" /> {rank.name}
          </span>
        </div>

        {dropUser?.country && (
          <div className="text-[11px] mb-2" style={{ color: "#6B7FA0" }}>🌍 {dropUser.country}</div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-1 mb-3 py-2.5 px-1 rounded-xl" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
          {[
            { icon: <Zap className="w-3 h-3" style={{ color: "#FFD000" }} />, value: glowScore, label: "XP" },
            { icon: <BookOpen className="w-3 h-3" style={{ color: "#0B3FD9" }} />, value: drops.length, label: "Drops" },
            { icon: <Users className="w-3 h-3" style={{ color: "#1FB8FF" }} />, value: followers.length, label: "Fans" },
            { icon: <Award className="w-3 h-3" style={{ color: "#CC7A00" }} />, value: certs.length, label: "Badges" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 py-1">
              {s.icon}
              <span className="font-black text-xs" style={{ color: "#0B1B3D" }}>{s.value}</span>
              <span className="text-[9px]" style={{ color: "#6B7FA0" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Bio (clamped) */}
        {dropUser?.bio && (
          <p className="text-[11px] leading-relaxed mb-3 break-words" style={{ color: "#4A5878", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>{dropUser.bio}</p>
        )}

        {/* Groups badge */}
        {memberships.length > 0 && (
          <div className="text-[10px] font-bold mb-3 px-2 py-1 rounded-full inline-flex items-center gap-1" style={{ background: "rgba(31,184,255,0.1)", color: "#0B3FD9", border: "1px solid #D6E4FF" }}>
            <Users className="w-3 h-3" /> {memberships.length} GlowGroup{memberships.length > 1 ? "s" : ""}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "#F0F4FA" }}>
          <a href={createPageUrl("Profile") + `?user=${encodeURIComponent(dropUser?.email)}`} className="font-bold flex-1 text-center py-2 rounded-full text-xs transition no-underline" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11,63,217,0.2)" }}>
            View Profile
          </a>
          <a href={createPageUrl("Messages") + `?user=${encodeURIComponent(dropUser?.email)}`} className="font-bold flex-1 text-center py-2 rounded-full text-xs transition no-underline" style={{ background: "#FFFFFF", color: "#0B1B3D", border: "1.5px solid #E6ECF5" }}>
            Message
          </a>
        </div>
      </div>
    </div>
  );
}