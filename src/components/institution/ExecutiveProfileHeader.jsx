import React, { useRef, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Camera, Shield, MapPin, ExternalLink, Building2, Crown, Sparkles, Upload, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function ExecutiveProfileHeader({
  user,
  isOwnProfile,
  profileEmail,
  myDrops,
  myFollowers,
  myFollowing,
  onSetConnectionsView,
  onEditProfile,
  onFollowToggle,
  isFollowingThisUser,
  currentUser,
  onProfileImageSelect,
  onCoverImageSelect,
  uploadingImage,
  institutionApps,
}) {
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const orgMapInputRef = useRef(null);
  const [uploadingMap, setUploadingMap] = useState(false);
  const queryClient = useQueryClient();
  const primaryApp = institutionApps[0];

  // Fetch the institution page for logo display
  const { data: institutionPages = [] } = useQuery({
    queryKey: ["allInstitutionPages"],
    queryFn: () => base44.entities.InstitutionPage.list("-created_date", 100),
  });

  const primaryPage = useMemo(() => {
    return institutionPages.find(
      p => p.owner_email === profileEmail && p.name?.toLowerCase() === primaryApp?.institution_name?.toLowerCase()
    ) || institutionPages.find(p => p.owner_email === profileEmail);
  }, [institutionPages, profileEmail, primaryApp]);

  return (
    <>
      <style>{`
        @keyframes executive-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes gold-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,208,0,0.2), 0 0 60px rgba(255,208,0,0.05); }
          50% { box-shadow: 0 0 40px rgba(255,208,0,0.35), 0 0 80px rgba(255,208,0,0.1); }
        }
        @keyframes crown-float {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-4px) rotate(3deg); }
        }
      `}</style>

      {/* Executive Cover Banner */}
      <div className="relative mb-0">
        <div
          className={`w-full h-56 sm:h-72 relative overflow-hidden ${isOwnProfile ? "cursor-pointer" : ""}`}
          onClick={() => isOwnProfile && coverInputRef.current?.click()}
          style={{ borderRadius: "0 0 24px 24px" }}
        >
          {/* Dark premium background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0f1628] to-[#0a0e1a]" />

          {/* Cover image */}
          {user.cover_picture_url && (
            <img src={user.cover_picture_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFD000]/5 via-transparent to-[#00CFFF]/5" />

          {/* Gold shimmer line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
            background: "linear-gradient(90deg, transparent 20%, #FFD000 50%, transparent 80%)",
            backgroundSize: "200% 100%",
            animation: "executive-shimmer 3s linear infinite",
          }} />

          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle at 25% 25%, #FFD000 1px, transparent 1px), radial-gradient(circle at 75% 75%, #00CFFF 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />

          {/* Institution branding strip */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 flex items-end justify-between z-10">
            <div className="flex items-center gap-3">
              {primaryPage?.logo_url && (
                <img src={primaryPage.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#FFD000]/30 shadow-lg" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD000]/80">Verified Institution</span>
                  <Shield className="w-3 h-3 text-[#FFD000]" />
                </div>
                <span className="text-sm font-bold text-white/90">{primaryApp?.institution_name}</span>
              </div>
            </div>
            {institutionApps.length > 1 && (
              <span className="text-[10px] text-[#FFD000]/60 font-bold">+{institutionApps.length - 1} more</span>
            )}
          </div>

          {isOwnProfile && (
            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-20">
              <div className="flex items-center gap-2 text-white font-bold bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                <Camera className="w-5 h-5" /> Change Cover
              </div>
            </div>
          )}
        </div>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={onCoverImageSelect} disabled={uploadingImage} />
      </div>

      {/* Executive Profile Card */}
      <div className="px-4 -mt-16 relative z-20">
        <div
          className="rounded-3xl p-[1px] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #FFD000 0%, #00CFFF 50%, #FFD000 100%)",
            animation: "gold-pulse 3s ease-in-out infinite",
          }}
        >
          <div className="bg-[#0c1020] rounded-3xl px-6 py-8 sm:px-8">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Premium Avatar */}
              <div className="relative shrink-0">
                <div
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl p-[3px] ${isOwnProfile ? "cursor-pointer" : ""}`}
                  style={{ background: "linear-gradient(135deg, #FFD000, #00CFFF, #FFD000)" }}
                  onClick={() => isOwnProfile && profileInputRef.current?.click()}
                >
                  <div className="w-full h-full rounded-[13px] bg-[#0c1020] overflow-hidden relative group">
                    <img
                      src={user.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                    {isOwnProfile && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                        <Camera className="w-5 h-5 text-white mb-1" />
                        <span className="text-[9px] text-white font-bold uppercase">Change</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Crown icon */}
                <div
                  className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-[#FFD000] to-[#F5A623] flex items-center justify-center shadow-lg border-2 border-[#0c1020]"
                  style={{ animation: "crown-float 3s ease-in-out infinite" }}
                >
                  <Crown className="w-4 h-4 text-[#0B0F1A]" />
                </div>
                <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={onProfileImageSelect} disabled={uploadingImage} />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 justify-center sm:justify-start">
                  <h1 className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    {user.full_name}
                  </h1>
                  <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FFD000]/40" style={{ background: "linear-gradient(90deg, rgba(255,208,0,0.12), rgba(0,207,255,0.08))" }}>
                      <Building2 className="w-3 h-3 text-[#FFD000]" />
                      <span className="text-[10px] font-black text-[#FFD000] uppercase tracking-wider">Institution Leader</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20">
                      <Shield className="w-3 h-3 text-[#00CFFF]" />
                      <span className="text-[10px] font-bold text-[#00CFFF]">Verified</span>
                    </div>
                  </div>
                </div>

                {/* Bio & location */}
                <p className="text-sm text-gray-300 leading-relaxed mb-3 max-w-lg whitespace-pre-line">
                  {user.bio || "Leading with faith and purpose. Building community through the power of light."}
                </p>
                <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start mb-5">
                  {user.country && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" /> {user.country}
                    </span>
                  )}
                  {user.website_url && (
                    <a href={user.website_url.startsWith("http") ? user.website_url : `https://${user.website_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#00CFFF] font-semibold hover:underline">
                      <ExternalLink className="w-3 h-3" /> {user.website_url.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  <span className="text-[10px] text-gray-600">Joined {user.created_date ? new Date(user.created_date).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "recently"}</span>
                </div>

                {/* Stats Row - Executive style */}
                <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-5">
                  {[
                    { val: myDrops.length, label: "Posts", color: "#FFFFFF" },
                    { val: myFollowers.length, label: "Followers", color: "#00CFFF", onClick: () => onSetConnectionsView("Followers") },
                    { val: myFollowing.length, label: "Following", color: "#00CFFF", onClick: () => onSetConnectionsView("Following") },
                    { val: user.glow_score || 0, label: "XP", color: "#FFD000" },
                    { val: user.faith_streak_count || 0, label: "Streak", color: "#8A5CFF" },
                  ].map((stat, i) => (
                    <button
                      key={i}
                      onClick={stat.onClick}
                      disabled={!stat.onClick}
                      className={`text-center px-2 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 ${stat.onClick ? "hover:bg-white/[0.06] cursor-pointer" : "cursor-default"} transition`}
                    >
                      <div className="text-lg sm:text-xl font-black" style={{ color: stat.color, fontFamily: "Space Grotesk, sans-serif" }}>{stat.val}</div>
                      <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">{stat.label}</div>
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                  {isOwnProfile && (
                    <>
                      <button onClick={onEditProfile} className="px-5 py-2.5 rounded-xl text-sm font-bold transition border border-[#FFD000]/30 bg-[#FFD000]/10 text-[#FFD000] hover:bg-[#FFD000]/20">
                        Edit Profile
                      </button>
                      {primaryPage && (
                        <Link to={`/InstitutionDashboard?id=${primaryPage.id}`} className="px-5 py-2.5 rounded-xl text-sm font-bold transition border border-[#00CFFF]/30 bg-[#00CFFF]/10 text-[#00CFFF] hover:bg-[#00CFFF]/20 flex items-center gap-2">
                          <Building2 className="w-4 h-4" /> Manage Institution
                        </Link>
                      )}
                    </>
                  )}
                  {!isOwnProfile && currentUser && (
                    <>
                      <button
                        onClick={onFollowToggle}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition border ${
                          isFollowingThisUser
                            ? "bg-white/5 border-white/10 text-gray-300 hover:border-red-500/50 hover:text-red-400"
                            : "border-[#FFD000]/40 text-[#0B0F1A] hover:opacity-90"
                        }`}
                        style={!isFollowingThisUser ? { background: "linear-gradient(90deg, #FFD000, #00CFFF)" } : {}}
                      >
                        {isFollowingThisUser ? "Following" : "Follow"}
                      </button>
                      <Link to={createPageUrl("Messages") + `?user=${encodeURIComponent(profileEmail)}`} className="px-6 py-2.5 rounded-xl text-sm font-bold transition border border-white/10 bg-white/5 text-white hover:bg-white/10">
                        Message
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Organization Map */}
            {(institutionApps.some(app => app.organization_map_url) || isOwnProfile) && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-[#FFD000]" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFD000]/80">Organization Map</h3>
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => orgMapInputRef.current?.click()}
                        disabled={uploadingMap}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-400 hover:text-[#FFD000] bg-white/5 hover:bg-white/10 border border-white/5 transition"
                      >
                        {uploadingMap ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {institutionApps.some(app => app.organization_map_url) ? "Replace" : "Upload"}
                      </button>
                      <input
                        ref={orgMapInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          e.target.value = null;
                          setUploadingMap(true);
                          try {
                            const { file_url } = await base44.integrations.Core.UploadFile({ file });
                            const appWithMap = institutionApps.find(a => a.organization_map_url) || primaryApp;
                            await base44.entities.InstitutionApplication.update(appWithMap.id, { organization_map_url: file_url });
                            queryClient.invalidateQueries({ queryKey: ["myInstitutionApps"] });
                            queryClient.invalidateQueries({ queryKey: ["institutionApps"] });
                            toast.success("Organization map updated!");
                          } catch (err) {
                            toast.error("Failed to upload map");
                          } finally {
                            setUploadingMap(false);
                          }
                        }}
                      />
                    </>
                  )}
                </div>
                {institutionApps.some(app => app.organization_map_url) ? (
                  <div className="rounded-xl overflow-hidden border border-[#FFD000]/10 bg-white/[0.02]">
                    <img
                      src={institutionApps.find(app => app.organization_map_url)?.organization_map_url}
                      alt="Organization Map"
                      className="w-full h-auto object-contain max-h-[400px]"
                    />
                  </div>
                ) : isOwnProfile ? (
                  <button
                    onClick={() => orgMapInputRef.current?.click()}
                    disabled={uploadingMap}
                    className="w-full border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-[#FFD000]/30 transition text-center"
                  >
                    <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Upload your organization map / structure</p>
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}