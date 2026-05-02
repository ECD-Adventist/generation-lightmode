import React from "react";
import { Camera, BadgeCheck, Globe, MessageCircle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getDisplayName } from "@/lib/displayName";
import CountryFlag from "@/components/common/CountryFlag";

/**
 * Premium leader profile header — visually distinct from regular user profiles.
 * Used when viewing a ManagedLeaderAccount profile (or when a manager has
 * switched into leader view).
 *
 * Distinct treatment vs regular profile:
 * - Cinematic dark navy + gold gradient cover
 * - Animated rotating-border avatar (matches leader-post avatar in Feed)
 * - "Verified Leader" badge with leader title
 * - Premium gold/cyan accent typography
 * - No glow score, faith streak, profile completion — those are personal-only
 */
export default function LeaderProfileHeader({
  leaderUser,
  leaderTitle,
  followersCount,
  followingCount,
  postsCount,
  isOwnProfile,
  canEditLeader,
  canFollow,
  isFollowingThisUser,
  onEditLeader,
  onFollowToggle,
  onProfileImageSelect,
  onCoverImageSelect,
  onShareProfile,
  uploadingImage,
  profileEmail,
}) {
  const profileInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);

  return (
    <div className="px-4">
      <style>{`
        @keyframes lph-spin-border {
          0%   { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes lph-pulse-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(0,128,254,0.35), 0 8px 28px rgba(212,184,46,0.35); }
          50%      { box-shadow: 0 0 0 1px rgba(0,128,254,0.65), 0 12px 36px rgba(212,184,46,0.55); }
        }
        @keyframes lph-shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(300%) skewX(-20deg); }
        }
      `}</style>

      {/* Cover photo with cinematic dark overlay */}
      <div
        className={`w-full h-56 sm:h-72 rounded-[1.75rem] mb-1 relative group p-[2px] overflow-hidden ${canEditLeader ? "cursor-pointer" : ""}`}
        style={{ boxShadow: "0 14px 40px rgba(11, 27, 61, 0.25), 0 0 0 1px rgba(212, 184, 46, 0.18)" }}
        onClick={() => canEditLeader && coverInputRef.current?.click()}
      >
        {/* Rotating border light — gold + royal blue */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", width: "200%", height: "200%",
          background: "conic-gradient(from 0deg, transparent 60%, #4DA8FF 76%, #0080FE 86%, #FFD000 96%, transparent 100%)",
          animation: "lph-spin-border 6s linear infinite",
          zIndex: 0,
        }} />

        <div className="w-full h-full rounded-[1.6rem] overflow-hidden relative z-10"
          style={{
            background: leaderUser.cover_picture_url
              ? `url(${leaderUser.cover_picture_url}) center/cover`
              : "linear-gradient(135deg, #0A1A3A 0%, #0F2D6B 50%, #1A4FA0 100%)",
          }}
        >
          {/* Cinematic dark gradient overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none" style={{
            background: "linear-gradient(180deg, rgba(8,12,28,0.35) 0%, rgba(8,12,28,0.15) 40%, rgba(8,12,28,0.65) 100%)",
          }} />
          {/* Gold ambient glow */}
          <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full blur-[80px] opacity-30 z-10 pointer-events-none" style={{ background: "#FFD000" }} />
          <div className="absolute -bottom-12 -left-10 w-80 h-80 rounded-full blur-[90px] opacity-25 z-10 pointer-events-none" style={{ background: "#0080FE" }} />

          {/* Sweep shimmer */}
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            <div style={{
              position: "absolute", top: 0, bottom: 0, left: 0, width: "30%",
              background: "linear-gradient(90deg, transparent, rgba(255,208,0,0.18), rgba(255,255,255,0.25), rgba(255,208,0,0.18), transparent)",
              animation: "lph-shimmer 8s infinite ease-in-out",
            }} />
          </div>

          {/* Verified Leader badge — top-right */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{ background: "linear-gradient(135deg, rgba(0,128,254,0.92) 0%, rgba(0,64,160,0.92) 50%, rgba(212,184,46,0.92) 100%)", boxShadow: "0 4px 14px rgba(0,128,254,0.45)" }}>
            <BadgeCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white">Verified Leader</span>
          </div>

          {canEditLeader && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20" style={{ background: "rgba(11, 27, 61, 0.55)" }}>
              <div className="flex items-center gap-2 font-bold px-4 py-2 rounded-lg backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.95)", color: "#0B3FD9" }}>
                <Camera className="w-5 h-5" /> Change Cover
              </div>
            </div>
          )}
        </div>
      </div>
      <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={onCoverImageSelect} disabled={uploadingImage} />

      {/* Header — avatar + identity */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-5 mb-6 pb-6 relative z-10 px-4 -mt-16 md:-mt-16">
        {/* Animated rotating-border avatar */}
        <div
          className={`relative w-36 h-36 rounded-full p-[3px] flex-shrink-0 overflow-hidden group ${canEditLeader ? "cursor-pointer" : ""}`}
          style={{ background: "#060912", animation: "lph-pulse-glow 3s ease-in-out infinite" }}
          onClick={() => canEditLeader && profileInputRef.current?.click()}
        >
          {/* Rotating conic border */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", width: "300%", height: "300%",
            background: "conic-gradient(from 0deg, transparent 55%, #4DA8FF 70%, #0080FE 82%, #FFD000 93%, transparent 100%)",
            animation: "lph-spin-border 4s linear infinite",
            zIndex: 0,
          }} />
          <div className="relative z-10 w-full h-full rounded-full flex items-center justify-center overflow-hidden" style={{ background: "#FFFFFF", border: "4px solid #FFFFFF" }}>
            <img
              src={leaderUser.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
              alt={leaderUser.full_name}
              className="w-full h-full object-cover"
            />
            {canEditLeader && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10" style={{ background: "rgba(11, 27, 61, 0.5)" }}>
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
              </div>
            )}
          </div>
        </div>
        <input type="file" ref={profileInputRef} accept="image/*" className="hidden" onChange={onProfileImageSelect} disabled={uploadingImage} />

        <div className="flex-1 text-center md:text-left mt-2 md:mt-20">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-3xl font-black font-['Space_Grotesk'] flex items-center gap-2 justify-center md:justify-start" style={{ color: "#0B1B3D" }}>
                {getDisplayName(leaderUser)}
                <CountryFlag country={leaderUser.country} size="md" />
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 shadow-[0_0_12px_rgba(0,128,254,0.55)]"
                  style={{ background: "linear-gradient(135deg, #0080FE 0%, #0040A0 50%, #D4B82E 100%)" }}>
                  <BadgeCheck className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </span>
              </h1>
            </div>
            {leaderTitle && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full w-fit mx-auto md:mx-0"
                style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFEFC2 100%)", border: "1px solid #FFD000", boxShadow: "0 2px 8px rgba(255, 159, 26, 0.18)" }}>
                <span className="text-xs font-black uppercase tracking-wider font-['Space_Grotesk']" style={{ color: "#8B6914" }}>{leaderTitle}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-5 justify-center md:justify-start">
            {canEditLeader && (
              <button onClick={onEditLeader} className="px-5 py-2 rounded-full text-sm font-black transition flex items-center gap-1.5"
                style={{ background: "linear-gradient(135deg, #FFD000 0%, #FF9F1A 100%)", border: "none", color: "#0B1B3D", boxShadow: "0 4px 14px rgba(255, 159, 26, 0.35)" }}>
                ✏️ Edit Leader Profile
              </button>
            )}
            {canFollow && (
              <button
                onClick={onFollowToggle}
                className="px-6 py-2 rounded-full text-sm font-bold transition"
                style={isFollowingThisUser
                  ? { background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }
                  : { background: "linear-gradient(90deg, #0080FE 0%, #0040A0 100%)", color: "#FFFFFF", border: "none", boxShadow: "0 4px 14px rgba(0, 128, 254, 0.4)" }}
              >
                {isFollowingThisUser ? "Following" : "+ Follow"}
              </button>
            )}
            {!isOwnProfile && profileEmail && (
              <Link to={createPageUrl("Messages") + `?user=${encodeURIComponent(profileEmail)}`}
                className="px-5 py-2 rounded-full text-sm font-bold transition flex items-center gap-1.5"
                style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>
                <MessageCircle className="w-4 h-4" /> Message
              </Link>
            )}
            <button onClick={onShareProfile} className="px-4 py-2 rounded-full text-sm font-bold transition flex items-center gap-1.5"
              style={{ background: "rgba(0, 128, 254, 0.08)", border: "1px solid #B8DCFF", color: "#0B3FD9" }}>
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>

          {/* Stats — only counts that matter for leaders */}
          <div className="flex flex-wrap gap-6 justify-center md:justify-start mb-5">
            <div className="text-center md:text-left">
              <span className="font-black text-2xl font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{postsCount}</span>
              <span className="text-sm block md:inline ml-1" style={{ color: "#6B7FA0" }}>posts</span>
            </div>
            <div className="text-center md:text-left">
              <span className="font-black text-2xl font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{followersCount}</span>
              <span className="text-sm block md:inline ml-1" style={{ color: "#6B7FA0" }}>followers</span>
            </div>
            {typeof followingCount === "number" && (
              <div className="text-center md:text-left">
                <span className="font-black text-2xl font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{followingCount}</span>
                <span className="text-sm block md:inline ml-1" style={{ color: "#6B7FA0" }}>following</span>
              </div>
            )}
          </div>

          {/* Country + bio */}
          <div className="text-sm max-w-2xl mx-auto md:mx-0 space-y-3" style={{ color: "#3A4A6B" }}>
            {leaderUser.country && (
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #EEF3FF 0%, #DDE7FB 100%)", border: "1px solid #D6E4FF", color: "#0B3FD9" }}>
                  <CountryFlag country={leaderUser.country} size="xs" /> {leaderUser.country}
                </span>
              </div>
            )}
            {leaderUser.bio && (
              <p className="leading-relaxed whitespace-pre-line text-[15px]" style={{ color: "#3A4A6B" }}>
                {leaderUser.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Premium leader banner strip */}
      <div className="mb-6 rounded-[1.25rem] px-5 py-4 flex items-center gap-3 flex-wrap relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0A1A3A 0%, #0F2D6B 60%, #1A4FA0 100%)",
          boxShadow: "0 8px 28px rgba(11, 27, 61, 0.25)",
        }}>
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-2xl opacity-40 pointer-events-none" style={{ background: "#FFD000" }} />
        <div className="relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: "linear-gradient(135deg, #FFD000 0%, #D4B82E 100%)" }}>
          <BadgeCheck className="w-5 h-5" style={{ color: "#0B1B3D" }} strokeWidth={2.5} />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#FFD000" }}>Official Leader Account</div>
          <div className="text-sm font-bold mt-0.5 text-white">Posts and announcements from this account are verified by Generation LightMode.</div>
        </div>
      </div>
    </div>
  );
}