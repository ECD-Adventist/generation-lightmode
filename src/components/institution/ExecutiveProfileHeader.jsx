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
  const [mapUploadProgress, setMapUploadProgress] = useState(null); // null | { step, percent, label }
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

      {/* Executive Profile Card containing Cover and Info */}
      <div className="px-4 mt-6 relative z-20">
        <div
          className="rounded-3xl p-[1px] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #FFD000 0%, #00CFFF 50%, #FFD000 100%)",
            animation: "gold-pulse 3s ease-in-out infinite",
          }}
        >
          <div className="bg-[#0c1020] rounded-3xl overflow-hidden relative">
            
            {/* Cover Banner inside the box */}
            <div
              className={`w-full h-48 sm:h-56 relative overflow-hidden ${isOwnProfile ? "cursor-pointer" : ""}`}
              onClick={() => isOwnProfile && coverInputRef.current?.click()}
            >
              {user.cover_picture_url ? (
                <img src={user.cover_picture_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a2740] via-[#0f1628] to-[#0a1025]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A]/90 via-transparent to-[#0B0F1A]/10" />

              {/* Light border line style requested by user */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10" />

              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <div className="flex items-center gap-2 text-white font-bold bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                    <Camera className="w-5 h-5" /> Change Cover
                  </div>
                </div>
              )}
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={onCoverImageSelect} disabled={uploadingImage} />

            <div className="px-6 pb-8 sm:px-8 pt-4">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                {/* Premium Avatar */}
                <div className="relative shrink-0 -mt-16 sm:-mt-20 z-10">
                <div
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full p-[3px] ${isOwnProfile ? "cursor-pointer" : ""}`}
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
                      <span className="text-[10px] font-black text-[#FFD000] uppercase tracking-wider">Institution Profile</span>
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

              </div>

              {/* Stats Row - Executive style */}
              <div className="grid grid-cols-5 gap-2 sm:gap-4 mt-8 border-t border-white/5 pt-8">
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
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start mt-2">
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
                      <Link to="/InstitutionControlCenter" className="px-5 py-2.5 rounded-xl text-sm font-bold transition border border-[#8A5CFF]/30 bg-[#8A5CFF]/10 text-[#8A5CFF] hover:bg-[#8A5CFF]/20 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Control Center
                      </Link>
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
                        accept="image/png"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          e.target.value = null;
                          setUploadingMap(true);
                          setMapUploadProgress({ step: 1, percent: 10, label: "Uploading image..." });

                          try {
                            // Step 1: Upload file
                            setMapUploadProgress({ step: 1, percent: 25, label: "Uploading image..." });
                            const { file_url } = await base44.integrations.Core.UploadFile({ file });
                            setMapUploadProgress({ step: 1, percent: 40, label: "Upload complete" });

                            // Step 2: Extract territories using AI
                            setMapUploadProgress({ step: 2, percent: 50, label: "AI extracting territories..." });
                            let extractedTerritories = [];
                            try {
                              const extractResult = await base44.integrations.Core.InvokeLLM({
                                prompt: `Analyze this organization map image. Extract all territory names, regions, countries, and any hierarchical structure visible. Return a JSON array of objects with fields: name (territory/conference name), region (geographic region), country (country name). If you cannot identify territories, return a best-effort list based on visible text or geographic regions shown.`,
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
                              console.warn("AI extraction failed, saving map without territories:", aiErr);
                            }
                            setMapUploadProgress({ step: 2, percent: 70, label: `Found ${extractedTerritories.length} territories` });
                            await new Promise(r => setTimeout(r, 800));

                            // Step 3: Save to entity
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
                        style={{
                          width: `${mapUploadProgress.percent}%`,
                          background: "linear-gradient(90deg, #FFD000, #00CFFF)",
                        }}
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
                  <div className="rounded-xl overflow-hidden border border-[#FFD000]/10 bg-white/[0.02] p-4">
                    <img
                      src={institutionApps.find(app => app.organization_map_url)?.organization_map_url}
                      alt="Organization Map"
                      className="w-full h-auto object-contain max-h-[400px] rounded-lg mb-4 bg-white"
                    />
                    
                    {(() => {
                      const appWithMap = institutionApps.find(a => a.organization_map_url);
                      if (appWithMap?.extracted_territories) {
                        try {
                          const territories = JSON.parse(appWithMap.extracted_territories);
                          if (territories.length > 0) {
                            return (
                              <div className="mt-4 pt-4 border-t border-white/5">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <Sparkles className="w-3 h-3 text-[#00CFFF]" /> Extracted Territories
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {territories.map((t, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-[#00CFFF]/10 border border-[#00CFFF]/20 rounded-md text-xs font-semibold text-[#00CFFF]">
                                      {t.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        } catch (e) {}
                      }
                      return null;
                    })()}
                  </div>
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