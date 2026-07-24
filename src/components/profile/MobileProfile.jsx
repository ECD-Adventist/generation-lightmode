import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, Settings, Share2, Grid, Bookmark, Target, Award, Building2, Heart, Sparkles, Zap, Edit3, MessageCircle, UserPlus, UserCheck, Globe, X, BadgeCheck, Users } from "lucide-react";
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
    <div className="min-h-screen font-['Inter']" style={{ background: "#FFFFFF", color: "#0B1B3D" }}>
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
            <Link
              to={createPageUrl("Feed")}
              className="w-10 h-10 flex items-center justify-center active:scale-95 transition"
              style={{ color: "#081A3A" }}
              aria-label="Back to feed"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </Link>
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

          <button
            type="button"
            onClick={() => user.cover_picture_url && setViewerImage({ url: user.cover_picture_url, alt: "Cover photo" })}
            className="relative block w-full h-20 overflow-hidden"
            style={{ background: user.cover_picture_url ? `url(${user.cover_picture_url}) center/cover` : "#F1F4F8" }}
          >
            {!user.cover_picture_url && <span className="sr-only">No Cover Photo</span>}
          </button>
          <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={onCoverImageSelect} disabled={uploadingImage} />

          <div className="relative px-5 pb-6 text-center">
            <button
              type="button"
              onClick={() => setViewerImage({ url: user.profile_picture_url || defaultAvatar, alt: "Profile photo" })}
              className="relative -mt-14 w-28 h-28 rounded-full overflow-hidden active:scale-95 transition"
              style={{ background: "#E4E8EE", border: "3px solid #FFFFFF", boxShadow: "0 0 0 1px #D7DCE5" }}
            >
              <img src={user.profile_picture_url || defaultAvatar} alt={displayName} className="w-full h-full object-cover" />
            </button>
            <input type="file" ref={profileInputRef} accept="image/*" className="hidden" onChange={onProfileImageSelect} disabled={uploadingImage} />

            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              <h1 className="text-[22px] leading-tight font-black font-['Space_Grotesk'] flex items-center gap-1.5" style={{ color: "#081A3A" }}>
                {displayName}
                <CountryFlag country={user?.country} size="sm" />
              </h1>
              {user?.role === "super_admin" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium" style={{ background: "#DDF7FA", color: "#081A3A" }}>
                  <BadgeCheck className="w-3.5 h-3.5" style={{ color: "#11B7C5" }} /> Super Admin
                </span>
              )}
              {isLeader && leaderTitle && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium" style={{ background: "#FFF4C8", color: "#745B00" }}>{leaderTitle}</span>
              )}
            </div>

            {!isLeader && (
              <div className="mt-2 flex items-center justify-center gap-2 text-[15px]">
                <span style={{ color: "#081A3A" }}>{glowRank.name}</span>
                <span style={{ color: "#A2A9B5" }}>•</span>
                <span style={{ color: "#7B8493" }}>{user.glow_score || 0} XP</span>
              </div>
            )}

            {user.bio && <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "#4B5565" }}>{user.bio}</p>}

            <div className="mt-6 mx-auto grid grid-cols-2 gap-3 max-w-sm">
              {isOwnProfile ? (
                <>
                  {!isLeader && (
                    <div className="h-12 rounded-lg flex items-center justify-center gap-2 text-[14px] font-bold" style={{ border: "2px solid #13B8C3", color: "#13AEB9" }}>
                      <Users className="w-5 h-5" /> {myMemberships.length} Group{myMemberships.length === 1 ? "" : "s"}
                    </div>
                  )}
                  <button
                    onClick={isLeader && onEditLeader ? onEditLeader : onEditProfile}
                    className={`${isLeader ? "col-span-2" : ""} h-12 rounded-lg flex items-center justify-center gap-2 text-[14px] font-bold active:scale-[0.98] transition`}
                    style={{ border: "2px solid #13B8C3", color: "#13AEB9" }}
                  >
                    <Edit3 className="w-5 h-5" /> Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onFollowToggle}
                    className="h-12 rounded-lg flex items-center justify-center gap-2 text-[14px] font-bold active:scale-[0.98] transition"
                    style={isFollowingThisUser ? { border: "2px solid #D7DCE5", color: "#4B5565" } : { background: "#13B8C3", border: "2px solid #13B8C3", color: "#FFFFFF" }}
                  >
                    {isFollowingThisUser ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    {isFollowingThisUser ? "Following" : "Follow"}
                  </button>
                  <Link
                    to={createPageUrl("Messages") + `?user=${encodeURIComponent(profileEmail)}`}
                    className="h-12 rounded-lg flex items-center justify-center gap-2 text-[14px] font-bold active:scale-[0.98] transition"
                    style={{ border: "2px solid #13B8C3", color: "#13AEB9" }}
                  >
                    <MessageCircle className="w-5 h-5" /> Message
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

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