import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Building2, Camera, Crown, Edit3, ExternalLink, Grid, Loader2, MapPin, MessageCircle, Settings, Share2, Shield, Sparkles, Trash2, Upload, UserCheck, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import CountryFlag from "@/components/common/CountryFlag";
import TerritoryMapVisual from "@/components/institution/TerritoryMapVisual";
import { getDisplayName } from "@/lib/displayName";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

export default function MobileInstitutionProfile({
  user,
  currentUser,
  isOwnProfile,
  profileEmail,
  myDrops,
  myFollowers,
  myFollowing,
  institutionApps,
  onEditProfile,
  onShareProfile,
  onFollowToggle,
  isFollowingThisUser,
  onProfileImageSelect,
  onCoverImageSelect,
  uploadingImage,
  onSetConnectionsView,
  activeTab,
  onTabChange,
  children,
}) {
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const orgMapInputRef = useRef(null);
  const queryClient = useQueryClient();
  const [viewerImage, setViewerImage] = useState(null);
  const [uploadingMap, setUploadingMap] = useState(false);
  const [mapUploadProgress, setMapUploadProgress] = useState(null);

  const primaryApp = institutionApps?.[0];
  const { data: institutionPages = [] } = useQuery({
    queryKey: ["allInstitutionPages"],
    queryFn: () => base44.entities.InstitutionPage.list("-created_date", 100),
  });

  const primaryPage = useMemo(() => {
    return institutionPages.find(p => p.owner_email === profileEmail && p.name?.toLowerCase() === primaryApp?.institution_name?.toLowerCase()) ||
      institutionPages.find(p => p.owner_email === profileEmail);
  }, [institutionPages, profileEmail, primaryApp]);

  const appWithMap = useMemo(() => institutionApps.find(a => a.organization_map_url) || primaryApp, [institutionApps, primaryApp]);
  const hasMap = !!appWithMap?.organization_map_url;
  const displayName = getDisplayName(user);

  const territories = useMemo(() => {
    if (!appWithMap?.extracted_territories) return [];
    try {
      const parsed = JSON.parse(appWithMap.extracted_territories);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [appWithMap?.extracted_territories]);

  const saveMapData = async (appRecord, mapData) => {
    if (appRecord?.institution_page_id) {
      await base44.entities.InstitutionPage.update(appRecord.institution_page_id, mapData);
      return;
    }
    if (appRecord?.id) await base44.entities.InstitutionApplication.update(appRecord.id, mapData);
    if (primaryPage?.id) await base44.entities.InstitutionPage.update(primaryPage.id, mapData);
  };

  const refreshMapQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["profileInstitutionApps"] });
    queryClient.invalidateQueries({ queryKey: ["publicInstitutionPagesForProfile"] });
    queryClient.invalidateQueries({ queryKey: ["allInstitutionPages"] });
  };

  const handleDeleteMap = async () => {
    if (!appWithMap || !window.confirm("Delete this organization map?")) return;
    await saveMapData(appWithMap, { organization_map_url: "", extracted_territories: "" });
    refreshMapQueries();
    toast.success("Organization map deleted.");
  };

  const handleMapUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = null;
    setUploadingMap(true);
    setMapUploadProgress({ step: 1, percent: 25, label: "Uploading image..." });
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMapUploadProgress({ step: 2, percent: 50, label: "Reading territory borders..." });
      let extractedTerritories = [];
      try {
        const extractResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this organization or territory map image carefully. Focus on visible borders, boundary lines, labels, legends, and hierarchy. IMPORTANT: do not add countries that are not visibly inside the uploaded map border or explicitly labeled in the map. If the map is ECD and shows 12 nations, return exactly those 12 nations, not nearby islands or extra countries unless clearly included. Use exact country names where possible from this set when visible: Sudan, South Sudan, Ethiopia, Eritrea, Somalia, Djibouti, Uganda, Kenya, Tanzania, Democratic Republic of Congo, Rwanda, Burundi, Seychelles. If a border encloses several labels, create one item per visible territory and include the parent region. Return only territories that are visible or strongly implied by map borders/labels. For each item include: name, region, country, border_notes, confidence.`,
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
                    country: { type: "string" },
                    border_notes: { type: "string" },
                    confidence: { type: "number" },
                  },
                },
              },
            },
          },
        });
        extractedTerritories = extractResult?.territories || [];
      } catch (aiErr) {
        console.warn("AI extraction failed:", aiErr);
      }
      setMapUploadProgress({ step: 3, percent: 85, label: "Saving map..." });
      const updateData = { organization_map_url: file_url };
      if (extractedTerritories.length > 0) updateData.extracted_territories = JSON.stringify(extractedTerritories);
      await saveMapData(appWithMap || primaryApp, updateData);
      setMapUploadProgress({ step: 4, percent: 100, label: "Done!" });
      await new Promise(r => setTimeout(r, 500));
      refreshMapQueries();
      toast.success(`Organization map updated! ${extractedTerritories.length} territories extracted.`);
    } catch {
      toast.error("Failed to upload map");
    } finally {
      setUploadingMap(false);
      setMapUploadProgress(null);
    }
  };

  const tabs = [
    { key: "drops", icon: Grid, label: "Posts" },
    { key: "institutions", icon: Building2, label: "Institution" },
  ];

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "linear-gradient(180deg, #0B0F1A 0%, #121826 46%, #EEF3FF 46%, #E2EBFF 100%)", color: "#0B1B3D" }}>
      <style>{`
        @keyframes mip-sweep { 0% { transform: translateX(-150%) skewX(-20deg); } 100% { transform: translateX(300%) skewX(-20deg); } }
        @keyframes mip-spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
      `}</style>

      <div className="relative z-20 flex items-center justify-between px-4 safe-pt pt-4 pb-2">
        <Link to={createPageUrl("Feed")} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", color: "#00CFFF", border: "1px solid rgba(0,207,255,0.18)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={onShareProfile} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", color: "#FFD000", border: "1px solid rgba(255,208,0,0.22)" }}><Share2 className="w-4 h-4" /></button>
          {isOwnProfile && <Link to={createPageUrl("Settings")} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", color: "#00CFFF", border: "1px solid rgba(0,207,255,0.18)" }}><Settings className="w-4 h-4" /></Link>}
        </div>
      </div>

      <div className="px-4 pb-1">
        <button type="button" onClick={() => user.cover_picture_url && setViewerImage({ url: user.cover_picture_url, alt: "Institution cover" })} className="relative w-full h-44 rounded-[1.6rem] p-[2px] overflow-hidden block" style={{ boxShadow: "0 18px 50px rgba(0,0,0,0.35)" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", width: "220%", height: "220%", background: "conic-gradient(from 0deg, transparent 58%, #00CFFF 74%, #8A5CFF 88%, #FFD000 100%)", animation: "mip-spin 4s linear infinite" }} />
          <div className="relative w-full h-full rounded-[1.45rem] overflow-hidden z-10" style={{ background: user.cover_picture_url ? `url(${user.cover_picture_url}) center/cover` : "linear-gradient(135deg, #0B0F1A 0%, #121826 48%, #172554 100%)" }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.08), rgba(11,15,26,0.70))" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "30%", background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.18), rgba(255,255,255,0.42), transparent)", animation: "mip-sweep 4s infinite ease-in-out" }} />
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md" style={{ background: "rgba(255,208,0,0.12)", border: "1px solid rgba(255,208,0,0.35)" }}>
              <Shield className="w-3 h-3" style={{ color: "#FFD000" }} />
              <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#FFD000" }}>Verified Institution</span>
            </div>
          </div>
        </button>
        <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={onCoverImageSelect} disabled={uploadingImage} />
      </div>

      <div className="relative -mt-12 px-4 z-20">
        <div className="rounded-[1.7rem] p-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 12px 32px rgba(11,63,217,0.12)" }}>
          <div className="flex items-end gap-3">
            <button type="button" onClick={() => setViewerImage({ url: user.profile_picture_url || defaultAvatar, alt: "Institution profile" })} className="relative w-24 h-24 rounded-full p-[3px]" style={{ background: "linear-gradient(135deg, #00CFFF, #0B3FD9, #FFD000)", boxShadow: "0 10px 28px rgba(11,63,217,0.35)" }}>
              <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF", border: "3px solid #FFFFFF" }}>
                <img src={user.profile_picture_url || defaultAvatar} className="w-full h-full object-cover" />
              </div>
              <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFD000, #FF9F1A)", border: "2px solid #FFFFFF" }}><Crown className="w-4 h-4" style={{ color: "#0B1B3D" }} /></span>
            </button>
            <input type="file" ref={profileInputRef} accept="image/*" className="hidden" onChange={onProfileImageSelect} disabled={uploadingImage} />
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-lg font-black font-['Space_Grotesk'] truncate flex items-center gap-1.5" style={{ color: "#0B1B3D" }}>
                <span className="truncate">{displayName}</span><CountryFlag country={user?.country} size="sm" />
              </h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mt-1" style={{ background: "#FFF8E6", border: "1px solid #FFE4A0" }}>
                <Building2 className="w-3 h-3" style={{ color: "#CC7A00" }} />
                <span className="text-[10px] font-black uppercase" style={{ color: "#CC7A00" }}>{primaryApp?.institution_type || "Institution"}</span>
              </div>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed mt-3" style={{ color: "#3A4A6B" }}>{user.bio || "Leading with faith and purpose. Building community through the power of light."}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {(primaryApp?.country || user.country) && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black" style={{ background: "#EEF3FF", color: "#0B3FD9", border: "1px solid #D6E4FF" }}><MapPin className="w-3 h-3" /> {primaryApp?.country || user.country}</span>}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black" style={{ background: "rgba(0,207,255,0.10)", color: "#0B3FD9", border: "1px solid #B8E5FF" }}><Sparkles className="w-3 h-3" /> Official Profile</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[{ value: myDrops.length, label: "Posts" }, { value: myFollowers.length, label: "Followers", onClick: () => onSetConnectionsView("Followers") }, { value: myFollowing.length, label: "Following", onClick: () => onSetConnectionsView("Following") }].map((s, i) => {
              const Tag = s.onClick ? "button" : "div";
              return <Tag key={i} onClick={s.onClick} className="rounded-2xl py-3 text-center" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}><div className="text-lg font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{s.value}</div><div className="text-[10px] font-bold uppercase" style={{ color: "#6B7FA0" }}>{s.label}</div></Tag>;
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            {isOwnProfile ? <>
              <button onClick={onEditProfile} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[12px] font-black" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}><Edit3 className="w-3.5 h-3.5" /> Edit Profile</button>
              {primaryPage && <Link to={`/InstitutionDashboard?id=${primaryPage.id}`} className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-[12px] font-black no-underline" style={{ background: "#FFD000", color: "#0B1B3D" }}><ExternalLink className="w-3.5 h-3.5" /> Manage</Link>}
            </> : <>
              <button onClick={onFollowToggle} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[12px] font-black" style={isFollowingThisUser ? { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" } : { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>{isFollowingThisUser ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}{isFollowingThisUser ? "Following" : "Follow"}</button>
              {currentUser && <Link to={createPageUrl("Messages") + `?user=${encodeURIComponent(profileEmail)}`} className="flex items-center justify-center px-5 py-2.5 rounded-full text-[12px] font-black" style={{ background: "#FFD000", color: "#0B1B3D" }}><MessageCircle className="w-3.5 h-3.5" /></Link>}
            </>}
          </div>
          {isOwnProfile && <Link to="/InstitutionControlCenter" className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-[12px] font-black no-underline" style={{ background: "#F6F8FC", color: "#0B3FD9", border: "1px solid #D6E4FF" }}><Shield className="w-3.5 h-3.5" /> Institution Control Center</Link>}
        </div>
      </div>

      {(hasMap || isOwnProfile) && (
        <div className="px-3 mt-4">
          <div className="rounded-[1.5rem] overflow-hidden" style={{ background: "#0B0F1A", border: "1px solid rgba(0,207,255,0.18)", boxShadow: "0 12px 32px rgba(0,0,0,0.25)" }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(0,207,255,0.12)" }}>
              <Sparkles className="w-4 h-4" style={{ color: "#FFD000" }} />
              <div className="flex-1 min-w-0"><div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#FFD000" }}>Organization Map</div><div className="text-[10px]" style={{ color: "rgba(200,208,224,0.6)" }}>Mobile territory view</div></div>
              {isOwnProfile && <div className="flex gap-1.5">
                {hasMap && <button onClick={handleDeleteMap} disabled={uploadingMap} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" }}><Trash2 className="w-3.5 h-3.5" /></button>}
                <button onClick={() => orgMapInputRef.current?.click()} disabled={uploadingMap} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,207,255,0.12)", color: "#00CFFF", border: "1px solid rgba(0,207,255,0.25)" }}>{uploadingMap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}</button>
              </div>}
              <input ref={orgMapInputRef} type="file" accept="image/*" className="hidden" onChange={handleMapUpload} />
            </div>
            {mapUploadProgress && <div className="m-3 rounded-xl p-3" style={{ background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.16)" }}><div className="flex justify-between text-[11px] font-bold mb-2"><span style={{ color: "#00CFFF" }}>{mapUploadProgress.label}</span><span style={{ color: "#C8D0E0" }}>{mapUploadProgress.percent}%</span></div><div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}><div className="h-full rounded-full" style={{ width: `${mapUploadProgress.percent}%`, background: "linear-gradient(90deg, #00CFFF, #8A5CFF, #FFD000)" }} /></div></div>}
            {hasMap ? <TerritoryMapVisual territories={territories} institutionName={appWithMap.institution_name} memberCount={0} ownerEmail={profileEmail} hqCountry={appWithMap.country || user.country} /> : isOwnProfile ? <button onClick={() => orgMapInputRef.current?.click()} className="w-full p-8 text-center"><Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "#00CFFF" }} /><p className="text-sm font-bold" style={{ color: "#C8D0E0" }}>Upload organization map</p></button> : null}
          </div>
        </div>
      )}

      <div className="sticky top-0 z-30 mt-4 px-3 py-2.5 backdrop-blur-xl" style={{ background: "rgba(246,248,252,0.92)", borderBottom: "1px solid #E2E8F0" }}>
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">{tabs.map(t => { const Icon = t.icon; const active = activeTab === t.key; return <button key={t.key} onClick={() => onTabChange(t.key)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black whitespace-nowrap" style={active ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" } : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}><Icon className="w-3.5 h-3.5" /> {t.label}</button>; })}</div>
      </div>

      <div className="px-3 pb-24 pt-3">{children}</div>

      {viewerImage && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(5,10,25,0.92)", backdropFilter: "blur(10px)" }} onClick={() => setViewerImage(null)}><button onClick={() => setViewerImage(null)} className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", color: "#FFFFFF" }}><X className="w-5 h-5" /></button><img src={viewerImage.url} alt={viewerImage.alt} onClick={(e) => e.stopPropagation()} className="max-w-full max-h-[85vh] object-contain rounded-2xl" /></div>}
    </div>
  );
}