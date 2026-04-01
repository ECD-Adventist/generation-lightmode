import React, { useRef, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Camera, Shield, MapPin, ExternalLink, Building2, Crown, Sparkles, Upload, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import TerritoryMapVisual from "@/components/institution/TerritoryMapVisual";

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
  const [mapUploadProgress, setMapUploadProgress] = useState(null);
  const queryClient = useQueryClient();
  const primaryApp = institutionApps[0];

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
        @keyframes gold-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255,208,0,0.2), 0 0 60px rgba(255,208,0,0.05); }
          50% { box-shadow: 0 0 40px rgba(255,208,0,0.35), 0 0 80px rgba(255,208,0,0.1); }
        }
        @keyframes crown-float {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-4px) rotate(3deg); }
        }
        @keyframes shimmer-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div className="px-4 mt-6 relative z-20">
        <div
          className="rounded-3xl p-[1px] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #FFD000 0%, #00CFFF 50%, #FFD000 100%)",
            animation: "gold-pulse 3s ease-in-out infinite",
          }}
        >
          <div className="bg-[#0c1020] rounded-3xl overflow-hidden">

            {/* Cover Banner */}
            <div
              className={`w-full h-48 sm:h-56 relative overflow-hidden ${isOwnProfile ? "cursor-pointer" : ""}`}
              onClick={() => isOwnProfile && coverInputRef.current?.click()}
            >
              {user.cover_picture_url ? (
                <img src={user.cover_picture_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a2740] via-[#0f1628] to-[#0a1025]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1020]/80 via-transparent to-transparent" />
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <div className="flex items-center gap-2 text-white font-bold bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <Camera className="w-5 h-5" /> Change Cover
                  </div>
                </div>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={onCoverImageSelect} disabled={uploadingImage} />

            {/* Animated shimmer line after cover */}
            <div className="relative h-[2px] overflow-hidden" style={{ background: "rgba(255,208,0,0.08)" }}>
              <div
                className="absolute inset-y-0 w-1/2"
                style={{
                  background: "linear-gradient(90deg, transparent, #FFD000, #00CFFF, transparent)",
                  animation: "shimmer-line 2.5s linear infinite",
                }}
              />
            </div>

            {/* Profile Info */}
            <div className="px-6 py-5 sm:px-8">
              {/* Avatar + Name row */}
              <div className="flex flex-row gap-5 items-end -mt-20">
                {/* Avatar */}
                <div className="relative shrink-0 z-10">
                  <div
                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] ${isOwnProfile ? "cursor-pointer" : ""}`}
                    style={{ background: "linear-gradient(135deg, #FFD000, #00CFFF, #FFD000)" }}
                    onClick={() => isOwnProfile && profileInputRef.current?.click()}
                  >
                    <div className="w-full h-full rounded-full bg-[#0c1020] overflow-hidden relative group">
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
                  <div
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-[#FFD000] to-[#F5A623] flex items-center justify-center shadow-lg border-2 border-[#0c1020]"
                    style={{ animation: "crown-float 3s ease-in-out infinite" }}
                  >
                    <Crown className="w-4 h-4 text-[#0B0F1A]" />
                  </div>
                  <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={onProfileImageSelect} disabled={uploadingImage} />
                </div>

                {/* Name + badges inline */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                      {user.full_name}
                    </h1>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#FFD000]/40" style={{ background: "linear-gradient(90deg, rgba(255,208,0,0.12), rgba(0,207,255,0.08))" }}>
                      <Building2 className="w-3 h-3 text-[#FFD000]" />
                      <span className="text-[10px] font-black text-[#FFD000] uppercase tracking-wider">Institution Profile</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20">
                      <Shield className="w-3 h-3 text-[#00CFFF]" />
                      <span className="text-[10px] font-bold text-[#00CFFF]">Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p className="text-sm text-gray-300 leading-relaxed mt-4 mb-2 whitespace-pre-line">
                {user.bio || "Leading with faith and purpose. Building community through the power of light."}
              </p>

              {/* Location + joined */}
              <div className="flex flex-wrap gap-3 items-center mb-4 mt-1">
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
                <span className="text-xs text-gray-500">
                  Joined {user.created_date ? new Date(user.created_date).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "recently"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {isOwnProfile && (
                  <>
                    <button onClick={onEditProfile} className="px-5 py-2 rounded-xl text-sm font-bold transition border border-[#FFD000]/30 bg-[#FFD000]/10 text-[#FFD000] hover:bg-[#FFD000]/20">
                      Edit Profile
                    </button>
                    {primaryPage && (
                      <Link to={`/InstitutionDashboard?id=${primaryPage.id}`} className="px-5 py-2 rounded-xl text-sm font-bold transition border border-[#00CFFF]/30 bg-[#00CFFF]/10 text-[#00CFFF] hover:bg-[#00CFFF]/20 flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Manage Institution
                      </Link>
                    )}
                    <Link to="/InstitutionControlCenter" className="px-5 py-2 rounded-xl text-sm font-bold transition border border-[#8A5CFF]/30 bg-[#8A5CFF]/10 text-[#8A5CFF] hover:bg-[#8A5CFF]/20 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Control Center
                    </Link>
                  </>
                )}
                {!isOwnProfile && currentUser && (
                  <>
                    <button
                      onClick={onFollowToggle}
                      className={`px-6 py-2 rounded-xl text-sm font-bold transition border ${
                        isFollowingThisUser
                          ? "bg-white/5 border-white/10 text-gray-300 hover:border-red-500/50 hover:text-red-400"
                          : "border-[#FFD000]/40 text-[#0B0F1A] hover:opacity-90"
                      }`}
                      style={!isFollowingThisUser ? { background: "linear-gradient(90deg, #FFD000, #00CFFF)" } : {}}
                    >
                      {isFollowingThisUser ? "Following" : "Follow"}
                    </button>
                    <Link to={createPageUrl("Messages") + `?user=${encodeURIComponent(profileEmail)}`} className="px-6 py-2 rounded-xl text-sm font-bold transition border border-white/10 bg-white/5 text-white hover:bg-white/10">
                      Message
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="border-t border-white/5 px-6 sm:px-8 py-4">
              <div className="grid grid-cols-5 gap-2 sm:gap-4">
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
            </div>

            {/* Organization Map */}
            {(institutionApps.some(app => app.organization_map_url) || isOwnProfile) && (
              <div className="border-t border-white/5 px-6 sm:px-8 py-6">
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
                        accept="image/png"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          e.target.value = null;
                          setUploadingMap(true);
                          setMapUploadProgress({ step: 1, percent: 25, label: "Uploading image..." });
                          try {
                            const { file_url } = await base44.integrations.Core.UploadFile({ file });
                            setMapUploadProgress({ step: 2, percent: 50, label: "AI extracting territories..." });
                            let extractedTerritories = [];
                            try {
                              const extractResult = await base44.integrations.Core.InvokeLLM({
                                prompt: `Analyze this organization map image. Extract all territory names, regions, countries, and any hierarchical structure visible. Return a JSON array of objects with fields: name (territory/conference name), region (geographic region), country (country name).`,
                                file_urls: [file_url],
                                response_json_schema: {
                                  type: "object",
                                  properties: {
                                    territories: {
                                      type: "array",
                                      items: {
                                        type: "object",
                                        properties: {
                                          name: { type: "string" },
                                          region: { type: "string" },
                                          country: { type: "string" }
                                        }
                                      }
                                    }
                                  }
                                }
                              });
                              extractedTerritories = extractResult?.territories || [];
                            } catch (aiErr) {
                              console.warn("AI extraction failed:", aiErr);
                            }
                            setMapUploadProgress({ step: 3, percent: 85, label: "Saving to profile..." });
                            const appWithMap = institutionApps.find(a => a.organization_map_url) || primaryApp;
                            const updateData = { organization_map_url: file_url };
                            if (extractedTerritories.length > 0) {
                              updateData.extracted_territories = JSON.stringify(extractedTerritories);
                            }
                            await base44.entities.InstitutionApplication.update(appWithMap.id, updateData);
                            setMapUploadProgress({ step: 4, percent: 100, label: "Done!" });
                            await new Promise(r => setTimeout(r, 600));
                            queryClient.invalidateQueries({ queryKey: ["profileInstitutionApps"] });
                            toast.success(`Organization map updated! ${extractedTerritories.length} territories extracted.`);
                          } catch (err) {
                            toast.error("Failed to upload map");
                          } finally {
                            setUploadingMap(false);
                            setMapUploadProgress(null);
                          }
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Progress bar */}
                {mapUploadProgress && (
                  <div className="mb-4 rounded-xl bg-white/[0.03] border border-[#FFD000]/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#FFD000]">{mapUploadProgress.label}</span>
                      <span className="text-xs font-bold text-gray-400">{mapUploadProgress.percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${mapUploadProgress.percent}%`, background: "linear-gradient(90deg, #FFD000, #00CFFF)" }}
                      />
                    </div>
                    <div className="flex gap-4 mt-2">
                      {["Upload", "Extract", "Save", "Done"].map((s, i) => (
                        <span key={s} className={`text-[9px] font-bold uppercase tracking-wider ${mapUploadProgress.step > i ? "text-[#FFD000]" : mapUploadProgress.step === i + 1 ? "text-[#00CFFF]" : "text-gray-600"}`}>
                          {mapUploadProgress.step > i ? "✓" : (i + 1)} {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {institutionApps.some(app => app.organization_map_url) ? (
                  (() => {
                    const appWithMap = institutionApps.find(a => a.organization_map_url);
                    if (appWithMap?.extracted_territories) {
                      try {
                        const territories = JSON.parse(appWithMap.extracted_territories);
                        if (territories.length > 0) {
                          return (
                            <TerritoryMapVisual
                              territories={territories}
                              institutionName={appWithMap.institution_name}
                              memberCount={0}
                              ownerEmail={profileEmail}
                            />
                          );
                        }
                      } catch (e) {}
                    }
                    // fallback: show uploaded image if no extracted territories yet
                    return (
                      <div className="rounded-2xl overflow-hidden border border-[#FFD000]/20 bg-white p-4">
                        <img
                          src={appWithMap?.organization_map_url}
                          alt="Organization Map"
                          className="w-full h-auto object-contain max-h-[460px]"
                        />
                      </div>
                    );
                  })()
                ) : isOwnProfile && !mapUploadProgress ? (
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