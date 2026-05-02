import React, { useRef, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Camera, Shield, MapPin, ExternalLink, Building2, Crown, Sparkles, Upload, Loader2, Trash2, Facebook, Instagram, Youtube, Linkedin, Music2, MessageCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import TerritoryMapVisual from "@/components/institution/TerritoryMapVisual";
import { getDisplayName } from "@/lib/displayName";

export default function ExecutiveProfileHeader({
  user, isOwnProfile, profileEmail, myDrops, myFollowers, myFollowing,
  onSetConnectionsView, onEditProfile, onFollowToggle, isFollowingThisUser,
  currentUser, onProfileImageSelect, onCoverImageSelect, uploadingImage, institutionApps,
}) {
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const orgMapInputRef = useRef(null);
  const [uploadingMap, setUploadingMap] = useState(false);
  const [mapUploadProgress, setMapUploadProgress] = useState(null);
  const queryClient = useQueryClient();
  const primaryApp = institutionApps[0];

  const { data: institutionPages = [] } = useQuery({ queryKey: ["allInstitutionPages"], queryFn: () => base44.entities.InstitutionPage.list("-created_date", 100) });
  const primaryPage = useMemo(() => institutionPages.find(p => p.owner_email === profileEmail && p.name?.toLowerCase() === primaryApp?.institution_name?.toLowerCase()) || institutionPages.find(p => p.owner_email === profileEmail), [institutionPages, profileEmail, primaryApp]);
  const socialLinks = useMemo(() => {
    try { return user.social_links ? JSON.parse(user.social_links) : {}; } catch { return {}; }
  }, [user.social_links]);
  const visibleSocialLinks = [
    { key: "facebook", label: "Facebook", icon: Facebook },
    { key: "instagram", label: "Instagram", icon: Instagram },
    { key: "youtube", label: "YouTube", icon: Youtube },
    { key: "tiktok", label: "TikTok", icon: Music2 },
    { key: "linkedin", label: "LinkedIn", icon: Linkedin },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  ].filter(item => socialLinks[item.key]);

  const cardBg = "#FFFFFF";
  const borderColor = "#E6ECF5";

  const syncMapToPublicPage = async (mapData) => {
    if (primaryPage?.id) {
      await base44.entities.InstitutionPage.update(primaryPage.id, mapData);
    }
  };

  const saveMapData = async (appRecord, mapData) => {
    if (appRecord?.institution_page_id) {
      await base44.entities.InstitutionPage.update(appRecord.institution_page_id, mapData);
      return;
    }
    if (appRecord?.id) {
      await base44.entities.InstitutionApplication.update(appRecord.id, mapData);
    }
    await syncMapToPublicPage(mapData);
  };

  return (
    <>
      <style>{`
        @keyframes exec-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes crown-float { 0%, 100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-4px) rotate(3deg); } }
      `}</style>

      <div className="px-4 mt-6 relative z-20 font-['Inter']">
        <div className="rounded-[1.75rem] overflow-hidden" style={{ background: cardBg, border: `1px solid ${borderColor}`, boxShadow: "0 8px 32px rgba(11, 63, 217, 0.08)" }}>

          {/* Cover Banner */}
          <div className={`w-full h-48 sm:h-56 relative overflow-hidden ${isOwnProfile ? "cursor-pointer" : ""}`} onClick={() => isOwnProfile && coverInputRef.current?.click()}>
            {user.cover_picture_url ? <img src={user.cover_picture_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #EEF3FF 0%, #DDE7FB 50%, #D6E4FF 100%)" }} />}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(255,255,255,0.6) 0%, transparent 50%)" }} />
            {isOwnProfile && <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-20" style={{ background: "rgba(11, 27, 61, 0.4)" }}><div className="flex items-center gap-2 text-white font-bold px-4 py-2 rounded-lg backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.3)" }}><Camera className="w-5 h-5" /> Change Cover</div></div>}
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={onCoverImageSelect} disabled={uploadingImage} />

          {/* Accent shimmer line */}
          <div className="relative h-[2px] overflow-hidden" style={{ background: "#E6ECF5" }}>
            <div className="absolute inset-y-0 w-1/2" style={{ background: "linear-gradient(90deg, transparent, #1FB8FF, #FFD000, transparent)", animation: "exec-shimmer 2.5s linear infinite" }} />
          </div>

          {/* Profile Info */}
          <div className="px-6 py-5 sm:px-8">
            <div className="flex flex-row gap-5 items-end -mt-20">
              <div className="relative shrink-0 z-10">
                <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] ${isOwnProfile ? "cursor-pointer" : ""}`} style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }} onClick={() => isOwnProfile && profileInputRef.current?.click()}>
                  <div className="w-full h-full rounded-full overflow-hidden relative group" style={{ background: "#FFFFFF" }}>
                    <img src={user.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} alt="Profile" className="w-full h-full object-cover" />
                    {isOwnProfile && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center" style={{ background: "rgba(11,27,61,0.45)" }}><Camera className="w-5 h-5 text-white mb-1" /><span className="text-[9px] text-white font-bold uppercase">Change</span></div>}
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #FFD000, #FF9F1A)", border: "2px solid #FFFFFF", animation: "crown-float 3s ease-in-out infinite" }}>
                  <Crown className="w-4 h-4" style={{ color: "#0B1B3D" }} />
                </div>
                <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={onProfileImageSelect} disabled={uploadingImage} />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{getDisplayName(user)}</h1>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(255,208,0,0.12)", border: "1px solid #FFE4A0" }}>
                    <Building2 className="w-3 h-3" style={{ color: "#CC7A00" }} />
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#CC7A00" }}>Institution Profile</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: "rgba(11,63,217,0.06)", border: "1px solid #D6E4FF" }}>
                    <Shield className="w-3 h-3" style={{ color: "#0B3FD9" }} />
                    <span className="text-[10px] font-bold" style={{ color: "#0B3FD9" }}>Verified</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed mt-4 mb-2 whitespace-pre-line" style={{ color: "#3A4A6B" }}>{user.bio || "Leading with faith and purpose. Building community through the power of light."}</p>
            <div className="flex flex-wrap gap-3 items-center mb-4 mt-1">
              {user.country && <span className="flex items-center gap-1 text-xs" style={{ color: "#6B7FA0" }}><MapPin className="w-3 h-3" /> {user.country}</span>}
              {user.website_url && <a href={user.website_url.startsWith("http") ? user.website_url : `https://${user.website_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold hover:underline" style={{ color: "#0B3FD9" }}><ExternalLink className="w-3 h-3" /> {user.website_url.replace(/^https?:\/\//, "")}</a>}
              {visibleSocialLinks.map(item => {
                const Icon = item.icon;
                const url = socialLinks[item.key].startsWith("http") ? socialLinks[item.key] : `https://${socialLinks[item.key]}`;
                return <a key={item.key} href={url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full flex items-center justify-center transition hover:scale-105" style={{ background: "#EEF3FF", color: "#0B3FD9", border: "1px solid #D6E4FF" }} title={item.label}><Icon className="w-3.5 h-3.5" /></a>;
              })}
              <span className="text-xs" style={{ color: "#8A97B5" }}>Joined {user.created_date ? new Date(user.created_date).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "recently"}</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {isOwnProfile && (
                <>
                  <button onClick={onEditProfile} className="px-5 py-2 rounded-xl text-sm font-bold transition" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>Edit Profile</button>
                  {primaryPage && <Link to={`/InstitutionDashboard?id=${primaryPage.id}`} className="px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2" style={{ background: "rgba(255,208,0,0.1)", border: "1px solid #FFE4A0", color: "#CC7A00" }}><Building2 className="w-4 h-4" /> Manage Institution</Link>}
                  <Link to="/InstitutionControlCenter" className="px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B3FD9" }}><Shield className="w-4 h-4" /> Control Center</Link>
                </>
              )}
              {!isOwnProfile && currentUser && (
                <>
                  <button onClick={onFollowToggle} className="px-6 py-2 rounded-xl text-sm font-bold transition" style={isFollowingThisUser ? { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" } : { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>{isFollowingThisUser ? "Following" : "Follow"}</button>
                  <Link to={createPageUrl("Messages") + `?user=${encodeURIComponent(profileEmail)}`} className="px-6 py-2 rounded-xl text-sm font-bold transition" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#0B1B3D" }}>Message</Link>
                </>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="border-t px-6 sm:px-8 py-4" style={{ borderColor }}>
            <div className="grid grid-cols-5 gap-2 sm:gap-4">
              {[
                { val: myDrops.length, label: "Posts", color: "#0B1B3D" },
                { val: myFollowers.length, label: "Followers", color: "#0B3FD9", onClick: () => onSetConnectionsView("Followers") },
                { val: myFollowing.length, label: "Following", color: "#0B3FD9", onClick: () => onSetConnectionsView("Following") },
                { val: user.glow_score || 0, label: "XP", color: "#CC7A00" },
                { val: user.faith_streak_count || 0, label: "Streak", color: "#1FB8FF" },
              ].map((stat, i) => (
                <button key={i} onClick={stat.onClick} disabled={!stat.onClick} className={`text-center px-2 py-2.5 rounded-xl transition ${stat.onClick ? "hover:bg-[#F6F8FC] cursor-pointer" : "cursor-default"}`} style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                  <div className="text-lg sm:text-xl font-black font-['Space_Grotesk']" style={{ color: stat.color }}>{stat.val}</div>
                  <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "#8A97B5" }}>{stat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Organization Map */}
          {(institutionApps.some(app => app.organization_map_url) || isOwnProfile) && (
            <div className="border-t px-6 sm:px-8 py-6" style={{ borderColor }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4" style={{ color: "#CC7A00" }} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#CC7A00" }}>Organization Map</h3>
                {isOwnProfile && (
                  <>
                    <div className="ml-auto flex items-center gap-2">
                      {institutionApps.some(app => app.organization_map_url) && (
                        <button
                          onClick={async () => {
                            const appWithMap = institutionApps.find(a => a.organization_map_url);
                            if (!appWithMap || !window.confirm("Delete this organization map?")) return;
                            await saveMapData(appWithMap, { organization_map_url: "", extracted_territories: "" });
                            queryClient.invalidateQueries({ queryKey: ["profileInstitutionApps"] });
                            queryClient.invalidateQueries({ queryKey: ["publicInstitutionPagesForProfile"] });
                            queryClient.invalidateQueries({ queryKey: ["allInstitutionPages"] });
                            toast.success("Organization map deleted.");
                          }}
                          disabled={uploadingMap}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition"
                          style={{ color: "#dc2626", background: "#FEF2F2", border: "1px solid #FECACA" }}
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                      <button onClick={() => orgMapInputRef.current?.click()} disabled={uploadingMap} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition" style={{ color: "#6B7FA0", background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                        {uploadingMap ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} {institutionApps.some(app => app.organization_map_url) ? "Replace" : "Upload"}
                      </button>
                    </div>
                    <input ref={orgMapInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]; if (!file) return; e.target.value = null;
                      setUploadingMap(true);
                      setMapUploadProgress({ step: 1, percent: 25, label: "Uploading image..." });
                      try {
                        const { file_url } = await base44.integrations.Core.UploadFile({ file });
                        setMapUploadProgress({ step: 2, percent: 50, label: "AI extracting territories..." });
                        let extractedTerritories = [];
                        try { const extractResult = await base44.integrations.Core.InvokeLLM({ prompt: `Analyze this organization's uploaded territory, structure, or mission map carefully. This may be any organization, country, region, district, church field, school network, ministry territory, or custom administrative map — do not assume it is ECD. Focus only on visible borders, boundary lines, labels, legends, hierarchy, and named areas in the uploaded image. Extract every visible country, territory, field, conference, union, region, district, campus, branch, or ministry area shown. IMPORTANT: do not add places that are not visibly inside the uploaded map border or explicitly labeled. Use exact country names when a country is visible, but for local/custom maps keep the map's own territory names. If a border encloses several labels, create one item per visible territory and include the parent region if visible. For each item include: name, region, country, border_notes, confidence.`, file_urls: [file_url], response_json_schema: { type: "object", properties: { territories: { type: "array", items: { type: "object", properties: { name: { type: "string" }, region: { type: "string" }, country: { type: "string" }, border_notes: { type: "string" }, confidence: { type: "number" } } } } } } }); extractedTerritories = extractResult?.territories || []; } catch (aiErr) { console.warn("AI extraction failed:", aiErr); }
                        setMapUploadProgress({ step: 3, percent: 85, label: "Saving to profile..." });
                        const appWithMap = institutionApps.find(a => a.organization_map_url) || primaryApp;
                        const updateData = { organization_map_url: file_url }; if (extractedTerritories.length > 0) updateData.extracted_territories = JSON.stringify(extractedTerritories);
                        await saveMapData(appWithMap, updateData);
                        setMapUploadProgress({ step: 4, percent: 100, label: "Done!" }); await new Promise(r => setTimeout(r, 600));
                        queryClient.invalidateQueries({ queryKey: ["profileInstitutionApps"] });
                        queryClient.invalidateQueries({ queryKey: ["publicInstitutionPagesForProfile"] });
                        queryClient.invalidateQueries({ queryKey: ["allInstitutionPages"] });
                        toast.success(`Organization map updated! ${extractedTerritories.length} territories extracted.`);
                      } catch { toast.error("Failed to upload map"); }
                      finally { setUploadingMap(false); setMapUploadProgress(null); }
                    }} />
                  </>
                )}
              </div>

              {mapUploadProgress && (
                <div className="mb-4 rounded-xl p-4" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold" style={{ color: "#0B3FD9" }}>{mapUploadProgress.label}</span>
                    <span className="text-xs font-bold" style={{ color: "#6B7FA0" }}>{mapUploadProgress.percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#E6ECF5" }}>
                    <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${mapUploadProgress.percent}%`, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)" }} />
                  </div>
                  <div className="flex gap-4 mt-2">
                    {["Upload", "Extract", "Save", "Done"].map((s, i) => (
                      <span key={s} className="text-[9px] font-bold uppercase tracking-wider" style={{ color: mapUploadProgress.step > i ? "#0B3FD9" : mapUploadProgress.step === i + 1 ? "#1FB8FF" : "#8A97B5" }}>
                        {mapUploadProgress.step > i ? "✓" : (i + 1)} {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {institutionApps.some(app => app.organization_map_url) ? (() => {
                const appWithMap = institutionApps.find(a => a.organization_map_url);
                if (appWithMap?.extracted_territories) { try { const territories = JSON.parse(appWithMap.extracted_territories); if (territories.length > 0) return <TerritoryMapVisual territories={territories} institutionName={appWithMap.institution_name} memberCount={0} ownerEmail={profileEmail} hqCountry={appWithMap.country || user.country} />; } catch {} }
                return <TerritoryMapVisual territories={[]} institutionName={appWithMap.institution_name} memberCount={0} ownerEmail={profileEmail} hqCountry={appWithMap.country || user.country} />;
              })() : isOwnProfile && !mapUploadProgress ? (
                <button onClick={() => orgMapInputRef.current?.click()} disabled={uploadingMap} className="w-full border-2 border-dashed rounded-xl p-8 transition text-center" style={{ borderColor: "#D6E4FF" }}>
                  <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "#8A97B5" }} />
                  <p className="text-sm" style={{ color: "#6B7FA0" }}>Upload your organization map / structure</p>
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  );
}