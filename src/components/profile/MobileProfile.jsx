import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, Settings, Share2, Grid, Bookmark, Target, Award, Building2, Heart, Sparkles, Zap, Edit3, MessageCircle, UserPlus, UserCheck, Globe, X, BadgeCheck } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import { getGlowRank } from "@/components/profile/ProfileHighlights";
import CountryFlag from "@/components/common/CountryFlag";

/**
 * Mobile-only profile redesign — LightMode branded.
 * Keeps all business logic in parent — pure presentation.
 */
export default function MobileProfile({
  user,
  currentUser,
  isOwnProfile,
  profileEmail,
  myDrops,
  myFollowers,
  myFollowing,
  myMemberships,
  certificates,
  onEditProfile,
  onShareProfile,
  onFollowToggle,
  isFollowingThisUser,
  onProfileImageSelect,
  onCoverImageSelect,
  uploadingImage,
  onSetConnectionsView,
  onOpenDrop,
  activeTab,
  onTabChange,
  children, // tab content rendered by parent
  userInstitutionApps = [],
  isLeader = false,
  leaderTitle,
  onEditLeader,
}) {
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [viewerImage, setViewerImage] = useState(null); // { url, alt }

  const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

  const glowRank = getGlowRank(user?.glow_score || 0);
  const displayName = getDisplayName(user);

  const stats = isLeader ? [
    { value: myDrops.length, label: "Posts" },
    { value: myFollowers.length, label: "Followers", onClick: () => onSetConnectionsView("Followers") },
  ] : [
    { value: myDrops.length, label: "Drops" },
    { value: myFollowers.length, label: "Followers", onClick: () => onSetConnectionsView("Followers") },
    { value: myFollowing.length, label: "Following", onClick: () => onSetConnectionsView("Following") },
  ];

  const tabs = isLeader ? [
    { key: "drops", icon: Grid, label: "Posts" },
  ] : [
    { key: "drops", icon: Grid, label: "Drops" },
    ...(isOwnProfile ? [{ key: "saved", icon: Bookmark, label: "Saved" }] : []),
    { key: "missions", icon: Target, label: "Missions" },
    { key: "badges", icon: Award, label: "Badges" },
    ...(userInstitutionApps.length > 0 ? [{ key: "institutions", icon: Building2, label: "Inst." }] : []),
  ];

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "linear-gradient(180deg, #F6F8FC 0%, #EEF3FF 50%, #E2EBFF 100%)", color: "#0B1B3D" }}>
      <style>{`
        @keyframes mp-float { 0%,100% { transform: translateY(0) scale(1); opacity: 0.2 } 50% { transform: translateY(-14px) scale(1.06); opacity: 0.35 } }
        @keyframes mp-sweep-light {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(300%) skewX(-20deg); }
        }
        @keyframes mp-spin-border {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>

      {/* Compact social-style profile header */}
      <section className="bg-white">
        <div className="safe-pt">
          <div className="flex items-center justify-between px-5 pt-4 pb-4">
            {isOwnProfile ? (
              <div className="w-10 h-10" aria-hidden="true" />
            ) : (
              <Link
                to={createPageUrl("Feed")}
                className="w-10 h-10 flex items-center justify-center active:scale-95 transition"
                style={{ color: "#081A3A" }}
                aria-label="Back to feed"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </Link>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={onShareProfile}
                className="w-10 h-10 flex items-center justify-center active:scale-95 transition"
                style={{ color: "#081A3A" }}
                aria-label="Share profile"
              >
                <Share2 className="w-6 h-6" />
              </button>
              {isOwnProfile && (
                <Link
                  to={createPageUrl("Settings")}
                  className="w-10 h-10 flex items-center justify-center active:scale-95 transition"
                  style={{ color: "#081A3A" }}
                  aria-label="Profile settings"
                >
                  <Settings className="w-6 h-6" />
                </Link>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* COVER — branded rounded card with rotating conic border + sweeping shimmer (mobile port of desktop effect) */}
      <div className="px-4 pb-1">
        <button
          type="button"
          onClick={() => user.cover_picture_url && setViewerImage({ url: user.cover_picture_url, alt: "Cover photo" })}
          className="relative w-full h-32 rounded-[1.5rem] p-[2px] overflow-hidden block"
          style={{ boxShadow: "0 8px 24px rgba(11, 63, 217, 0.15)" }}
        >
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            width: "200%", height: "200%",
            background: "conic-gradient(from 0deg, transparent 60%, #1FB8FF 78%, #0B3FD9 90%, #FFD000 100%)",
            animation: "mp-spin-border 4s linear infinite",
            zIndex: 0,
          }} />

          <div
            className="relative w-full h-full rounded-[1.4rem] overflow-hidden z-10"
            style={{
              background: user.cover_picture_url
                ? `url(${user.cover_picture_url}) center/cover`
                : isLeader
                ? "linear-gradient(135deg, #0A1A3A 0%, #0F2D6B 50%, #1A4FA0 100%)"
                : "linear-gradient(135deg, #EEF3FF 0%, #DDE7FB 100%)",
            }}
          >
            {isLeader && (
              <>
                <div className="absolute inset-0 z-[5] pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(8,12,28,0.30) 0%, rgba(8,12,28,0.10) 40%, rgba(8,12,28,0.55) 100%)" }} />
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md"
                  style={{ background: "linear-gradient(135deg, rgba(0,128,254,0.95) 0%, rgba(0,64,160,0.95) 50%, rgba(212,184,46,0.95) 100%)", boxShadow: "0 4px 12px rgba(0,128,254,0.4)" }}>
                  <BadgeCheck className="w-3 h-3 text-white" strokeWidth={2.5} />
                  <span className="text-[9px] font-black uppercase tracking-wider text-white">Verified</span>
                </div>
              </>
            )}
            <div style={{
              position: "absolute", top: 0, bottom: 0, left: 0, width: "30%",
              background: "linear-gradient(90deg, transparent, rgba(31,184,255,0.18), rgba(255,255,255,0.45), rgba(31,184,255,0.18), transparent)",
              animation: "mp-sweep-light 4s infinite ease-in-out",
              zIndex: 2, pointerEvents: "none",
            }} />

            {!user.cover_picture_url && (
              <>
                <div className="absolute -top-6 -right-8 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: "#FFD000", opacity: 0.25, animation: "mp-float 8s ease-in-out infinite" }} />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "#1FB8FF", opacity: 0.3, animation: "mp-float 10s ease-in-out infinite 1.5s" }} />
              </>
            )}

            {!user.cover_picture_url && (
              <div className="absolute inset-0 flex items-center justify-center z-10" style={{ color: "#8A97B5" }}>
                <div className="text-center">
                  <Camera className="w-7 h-7 mx-auto mb-1 opacity-50" />
                  <div className="text-xs font-semibold">No Cover Photo</div>
                </div>
              </div>
            )}
          </div>
        </button>
        <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={onCoverImageSelect} disabled={uploadingImage} />
      </div>

      {/* Avatar + name block, floating over cover */}
      <div className="relative z-10">
        <div className="relative -mt-8 px-4">
          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={() => setViewerImage({ url: user.profile_picture_url || defaultAvatar, alt: "Profile photo" })}
              className="relative w-20 h-20 rounded-full p-[3px] active:scale-95 transition"
              style={{
                background: isLeader
                  ? "linear-gradient(135deg, #0080FE 0%, #0040A0 50%, #FFD000 100%)"
                  : "linear-gradient(135deg, #1FB8FF, #0B3FD9, #FFD000)",
                boxShadow: isLeader
                  ? "0 10px 28px rgba(0, 128, 254, 0.4), 0 0 0 1px rgba(255, 208, 0, 0.3)"
                  : "0 10px 28px rgba(11, 63, 217, 0.35)",
              }}
            >
              <div className="w-full h-full rounded-full overflow-hidden relative" style={{ background: "#FFFFFF", border: "3px solid #FFFFFF" }}>
                <img src={user.profile_picture_url || defaultAvatar} className="w-full h-full object-cover" />
              </div>
              {isLeader && (
                <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #0080FE 0%, #0040A0 50%, #D4B82E 100%)", border: "2px solid #FFFFFF" }}>
                  <BadgeCheck className="w-4 h-4 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
            <input type="file" ref={profileInputRef} accept="image/*" className="hidden" onChange={onProfileImageSelect} disabled={uploadingImage} />

            <div className="flex-1 min-w-0 pb-1.5">
              <h1 className="text-base font-black font-['Space_Grotesk'] truncate flex items-center gap-1.5" style={{ color: "#0B1B3D" }}>
                <span className="truncate">{displayName}</span>
                <CountryFlag country={user?.country} size="sm" />
              </h1>
              {isLeader ? (
                leaderTitle && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-1" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFEFC2 100%)", border: "1px solid #FFD000" }}>
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#8B6914" }}>{leaderTitle}</span>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3 h-3" style={{ color: glowRank.color }} />
                  <span className="text-[11px] font-black" style={{ color: glowRank.color }}>{glowRank.name}</span>
                  <span className="text-[11px]" style={{ color: "#8A97B5" }}>·</span>
                  <span className="text-[11px] font-bold flex items-center gap-0.5" style={{ color: "#0B1B3D" }}>
                    <Zap className="w-2.5 h-2.5" style={{ color: "#FFD000" }} /> {user.glow_score || 0}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {user.bio && (
              <p className="text-[13px] leading-relaxed" style={{ color: "#3A4A6B" }}>{user.bio}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {user.country && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black" style={{ background: "#EEF3FF", color: "#0B3FD9", border: "1px solid #D6E4FF" }}>
                  <CountryFlag country={user.country} size="xs" /> {user.country}
                </span>
              )}
              {!isLeader && myMemberships.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black" style={{ background: "rgba(31, 184, 255, 0.12)", color: "#0B3FD9", border: "1px solid #B8E5FF" }}>
                  {myMemberships.length} Group{myMemberships.length > 1 ? "s" : ""}
                </span>
              )}
              {!isLeader && certificates.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black" style={{ background: "#FFF8E6", color: "#CC7A00", border: "1px solid #FFE4A0" }}>
                  🏆 {certificates.length}
                </span>
              )}
            </div>
          </div>

          {isLeader && (
            <div className="mt-3 rounded-2xl px-3 py-2.5 flex items-center gap-2 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0A1A3A 0%, #0F2D6B 60%, #1A4FA0 100%)", boxShadow: "0 4px 14px rgba(11, 27, 61, 0.2)" }}>
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-40 pointer-events-none" style={{ background: "#FFD000" }} />
              <div className="relative w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #FFD000 0%, #D4B82E 100%)" }}>
                <BadgeCheck className="w-3.5 h-3.5" style={{ color: "#0B1B3D" }} strokeWidth={2.5} />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="text-[8px] font-black uppercase tracking-widest" style={{ color: "#FFD000" }}>Administrator Account</div>
                <div className="text-[10px] font-bold text-white">Verified by Generation LightMode</div>
              </div>
            </div>
          )}

          <div className={`mt-4 grid gap-2 ${isLeader ? "grid-cols-2" : "grid-cols-3"}`}>
            {stats.map((s, i) => {
              const Tag = s.onClick ? "button" : "div";
              return (
                <Tag key={i} onClick={s.onClick} className="rounded-2xl py-3 text-center transition active:scale-95" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}>
                  <div className="text-lg font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{s.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6B7FA0" }}>{s.label}</div>
                </Tag>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            {isOwnProfile ? (
              <>
                <button onClick={isLeader && onEditLeader ? onEditLeader : onEditProfile} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[12px] font-black active:scale-95 transition" style={isLeader
                  ? { background: "linear-gradient(135deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 4px 12px rgba(255, 159, 26, 0.35)" }
                  : { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.3)" }}>
                  <Edit3 className="w-3.5 h-3.5" /> {isLeader ? "Edit Leader Profile" : "Edit Profile"}
                </button>

              </>
            ) : (
              <>
                <button onClick={onFollowToggle} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[12px] font-black active:scale-95 transition" style={isFollowingThisUser
                  ? { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }
                  : { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.3)" }
                }>
                  {isFollowingThisUser ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {isFollowingThisUser ? "Following" : "Follow"}
                </button>
                <Link to={createPageUrl("Messages") + `?user=${encodeURIComponent(profileEmail)}`} className="flex items-center justify-center px-5 py-2.5 rounded-full text-[12px] font-black active:scale-95 transition no-underline" style={{ background: "#FFD000", color: "#0B1B3D", boxShadow: "0 4px 12px rgba(255, 208, 0, 0.35)" }}>
                  <MessageCircle className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="sticky top-0 z-20 mt-5 px-3 py-2.5 backdrop-blur-xl" style={{ background: "rgba(246, 248, 252, 0.92)", borderBottom: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black whitespace-nowrap transition active:scale-95"
                style={isActive
                  ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 3px 10px rgba(11, 63, 217, 0.3)" }
                  : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="px-3 pb-24 pt-3">
        {children}
      </div>

      {/* IMAGE VIEWER LIGHTBOX */}
      {viewerImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(5, 10, 25, 0.92)", backdropFilter: "blur(10px)" }}
          onClick={() => setViewerImage(null)}
        >
          <button
            onClick={() => setViewerImage(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
            style={{ background: "rgba(255,255,255,0.15)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={viewerImage.url}
            alt={viewerImage.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
          />
        </div>
      )}
    </div>
  );
}