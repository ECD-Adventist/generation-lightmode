import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Users, Zap, Globe, MapPin, Heart, X, ExternalLink, Home, Bell, User, Filter, TrendingUp, ArrowLeft } from "lucide-react";

const defaultAvatar = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

const countryCoordinates = {
  Kenya: [-1.286389, 36.817223],
  Tanzania: [-6.369028, 34.888822],
  Uganda: [1.373333, 32.290275],
  Rwanda: [-1.940278, 29.873888],
  Nigeria: [9.082, 8.6753],
  Ghana: [7.9465, -1.0232],
  SouthAfrica: [-30.5595, 22.9375],
  "South Africa": [-30.5595, 22.9375],
  USA: [37.0902, -95.7129],
  Canada: [56.1304, -106.3468],
  Brazil: [-14.235, -51.9253],
  India: [20.5937, 78.9629],
  Philippines: [12.8797, 121.774],
  Australia: [-25.2744, 133.7751],
  Global: [0, 20],
};

const addJitter = ([lat, lng], seed = 1) => [
  lat + ((seed * 13 + 7) % 17 - 8) * 0.5,
  lng + ((seed * 7 + 3) % 13 - 6) * 0.5,
];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Impact Story Panel
function ImpactStoryPanel({ drop, onClose }) {
  if (!drop) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#121826] border border-[#00CFFF]/30 rounded-3xl p-6 w-full max-w-md shadow-[0_0_60px_rgba(0,207,255,0.2)] animate-in slide-in-from-bottom-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={drop.owner?.profile_picture_url || defaultAvatar} className="w-12 h-12 rounded-full object-cover border-2 border-[#00CFFF]/40" />
            <div>
              <div className="font-bold text-white">{drop.owner?.full_name || "Glow Believer"}</div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {drop.owner?.country || "Global"}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {drop.verse && (
          <div className="bg-[#00CFFF]/8 border border-[#00CFFF]/20 rounded-2xl p-4 mb-3">
            <div className="text-xs text-[#00CFFF] font-bold uppercase tracking-wider mb-2">📖 Verse</div>
            <p className="text-white text-sm leading-relaxed font-medium italic">"{drop.verse}"</p>
          </div>
        )}

        {drop.reflection && (
          <div className="bg-[#8A5CFF]/8 border border-[#8A5CFF]/20 rounded-2xl p-4 mb-4">
            <div className="text-xs text-[#8A5CFF] font-bold uppercase tracking-wider mb-2">💡 Reflection</div>
            <p className="text-gray-300 text-sm leading-relaxed">{drop.reflection}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Heart className="w-4 h-4 text-red-400" /> {drop.likes_count || 0} lights
          </div>
          <Link
            to={createPageUrl("Post") + `?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`}
            className="flex items-center gap-1.5 text-sm font-bold text-[#FFD000] hover:text-white transition"
          >
            Open post <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function GlobalReach() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mapMode, setMapMode] = useState("warriors"); // "warriors" | "drops"
  const [selectedDrop, setSelectedDrop] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    enabled: !!user,
  });

  const { data: glowDrops = [] } = useQuery({
    queryKey: ["mapGlowDrops"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 200),
    enabled: !!user,
  });

  const userByEmail = useMemo(() => Object.fromEntries(users.map(u => [u.email, u])), [users]);

  // Warriors: cluster users by country — one circle per country, radius = member count
  const warriorClusters = useMemo(() => {
    const clusters = {};
    users.forEach(u => {
      const country = u.country || "Global";
      const coords = countryCoordinates[country] || countryCoordinates.Global;
      if (!clusters[country]) clusters[country] = { country, coords, count: 0, members: [] };
      clusters[country].count++;
      clusters[country].members.push(u);
    });
    return Object.values(clusters);
  }, [users]);

  // Drops: each drop is a pin with jitter
  const dropMarkers = useMemo(() => glowDrops.map((drop, i) => {
    const owner = userByEmail[drop.user_email] || {};
    const country = owner.country || "Global";
    const base = countryCoordinates[country] || countryCoordinates.Global;
    return { ...drop, owner, position: addJitter(base, i + 1) };
  }), [glowDrops, userByEmail]);

  const localBelievers = users.filter(u => u.email !== user?.email && u.country && u.country === user?.country).slice(0, 8);

  // Stats
  const totalCountries = useMemo(() => new Set(users.map(u => u.country).filter(Boolean)).size, [users]);

  if (!user) return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <Globe className="w-10 h-10 text-[#00CFFF] animate-pulse" />
        <span className="text-gray-400">Loading global reach...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {selectedDrop && <ImpactStoryPanel drop={selectedDrop} onClose={() => setSelectedDrop(null)} />}

      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition" title="Go back">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
              <img
                src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
                alt="LightMode"
                style={{ height: 96, width: "auto", filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
              />
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Zap className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to={createPageUrl("Notifications")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Bell className="w-4 h-4" /><span className="hidden sm:inline">Alerts</span>
            </Link>
            <Link to={createPageUrl("Profile")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <User className="w-4 h-4" /><span className="hidden sm:inline">Profile</span>
            </Link>
            <Link to={createPageUrl("Home")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-[#00CFFF] hover:bg-white/5 transition text-sm font-medium border border-white/5">
              <Globe className="w-4 h-4" /> Website
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_340px] gap-6">

        {/* LEFT: Map + Controls */}
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-[#121826] to-[#0B0F1A] border border-white/10 rounded-3xl p-8 shadow-[0_0_40px_rgba(0,207,255,0.08)]">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#00CFFF] animate-pulse"></span>
                  <span className="text-[#00CFFF] text-xs font-bold tracking-wider uppercase">Live Global Map</span>
                </div>
                <h1 className="text-4xl font-bold font-['Space_Grotesk'] text-transparent bg-clip-text bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] mb-2">
                  Global Reach
                </h1>
                <p className="text-gray-400 text-sm max-w-md">
                  {mapMode === "warriors"
                    ? "Explore where Light Warriors are building faith communities worldwide."
                    : "Discover inspiring Glow Drops shared by believers across nations."}
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex bg-[#0B0F1A] border border-white/10 rounded-2xl p-1.5 gap-1 shrink-0 shadow-[0_0_20px_rgba(0,207,255,0.1)]">
                <button
                  onClick={() => setMapMode("warriors")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    mapMode === "warriors"
                      ? "bg-gradient-to-r from-[#00CFFF] to-[#00CFFF] text-black shadow-[0_0_20px_rgba(0,207,255,0.5)]"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Users className="w-4 h-4" /> Warriors
                </button>
                <button
                  onClick={() => setMapMode("drops")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    mapMode === "drops"
                      ? "bg-gradient-to-r from-[#FFD000] to-[#FFD000] text-black shadow-[0_0_20px_rgba(255,208,0,0.5)]"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Zap className="w-4 h-4" /> Drops
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
              {mapMode === "warriors" ? (
                <>
                  <div className="flex items-center gap-2 p-2 bg-white/3 rounded-lg border border-white/5">
                    <div className="w-3 h-3 rounded-full bg-[#FFD000]" />
                    <span className="text-gray-300">Your region</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/3 rounded-lg border border-white/5">
                    <div className="w-3 h-3 rounded-full bg-[#00CFFF]" />
                    <span className="text-gray-300">Other nations</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/3 rounded-lg border border-white/5">
                    <div className="w-4 h-4 rounded-full bg-[#00CFFF]/40" />
                    <span className="text-gray-300">Low density</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/3 rounded-lg border border-white/5">
                    <div className="w-5 h-5 rounded-full bg-[#00CFFF]" />
                    <span className="text-gray-300">High density</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-2 bg-white/3 rounded-lg border border-white/5">
                    <Heart className="w-3 h-3 text-red-400" />
                    <span className="text-gray-300">Few likes</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/3 rounded-lg border border-white/5">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="text-gray-300">Popular</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/3 rounded-lg border border-white/5">
                    <Zap className="w-3 h-3 text-[#FFD000]" />
                    <span className="text-gray-300">Click to view</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/3 rounded-lg border border-white/5">
                    <TrendingUp className="w-3 h-3 text-[#00CFFF]" />
                    <span className="text-gray-300">Newest first</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,207,255,0.1)]" style={{ height: "65vh" }}>
            <MapContainer center={[5, 25]} zoom={3} style={{ height: "100%", width: "100%" }} zoomControl={true}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap &copy; CARTO'
              />

              {/* WARRIORS MODE: density circles */}
              {mapMode === "warriors" && warriorClusters.map(cluster => {
                const radius = Math.max(8, Math.min(40, cluster.count * 4));
                const isLocal = cluster.country === user?.country;
                return (
                  <CircleMarker
                    key={cluster.country}
                    center={cluster.coords}
                    radius={radius}
                    pathOptions={{
                      color: isLocal ? "#FFD000" : "#00CFFF",
                      fillColor: isLocal ? "#FFD000" : "#00CFFF",
                      fillOpacity: 0.25,
                      weight: isLocal ? 2.5 : 1.5,
                    }}
                  >
                    <Popup>
                      <div style={{ background: "#121826", border: "1px solid rgba(0,207,255,0.3)", borderRadius: 12, padding: 16, minWidth: 200, color: "#fff", fontFamily: "Inter, sans-serif" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: isLocal ? "#FFD000" : "#00CFFF", boxShadow: `0 0 8px ${isLocal ? "#FFD000" : "#00CFFF"}` }} />
                          <strong style={{ color: isLocal ? "#FFD000" : "#00CFFF", fontSize: 15 }}>{cluster.country}</strong>
                        </div>
                        <div style={{ fontSize: 13, color: "#ccc", marginBottom: 12 }}>
                          <strong style={{ color: "#fff", fontSize: 22, fontFamily: "Space Grotesk, sans-serif" }}>{cluster.count}</strong> Light Warrior{cluster.count !== 1 ? "s" : ""}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                          {cluster.members.slice(0, 5).map(m => (
                            <img key={m.email} src={m.profile_picture_url || defaultAvatar} title={m.full_name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.2)" }} />
                          ))}
                          {cluster.count > 5 && <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,207,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#00CFFF", fontWeight: "bold" }}>+{cluster.count - 5}</div>}
                        </div>
                        {isLocal && <div style={{ fontSize: 11, color: "#FFD000", fontWeight: 600 }}>⭐ Your region</div>}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

              {/* DROPS MODE: individual pins */}
              {mapMode === "drops" && dropMarkers.map(drop => {
                const intensity = Math.min(1, 0.3 + (drop.likes_count || 0) * 0.07);
                return (
                  <CircleMarker
                    key={drop.id}
                    center={drop.position}
                    radius={6 + Math.min((drop.likes_count || 0), 8)}
                    pathOptions={{
                      color: "#FFD000",
                      fillColor: "#FFD000",
                      fillOpacity: intensity,
                      weight: 1.5,
                    }}
                    eventHandlers={{ click: () => setSelectedDrop(drop) }}
                  >
                    <Popup>
                      <div style={{ background: "#121826", border: "1px solid rgba(255,208,0,0.3)", borderRadius: 12, padding: 14, minWidth: 190, color: "#fff", fontFamily: "Inter, sans-serif", cursor: "pointer" }}
                        onClick={() => setSelectedDrop(drop)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <img src={drop.owner?.profile_picture_url || defaultAvatar} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{drop.owner?.full_name || "Glow Believer"}</div>
                            <div style={{ fontSize: 11, color: "#999" }}>{drop.owner?.country || "Global"}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "#ddd", marginBottom: 8, lineHeight: 1.5, maxWidth: 200, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                          {drop.verse || drop.reflection || "Glow Drop"}
                        </div>
                        <div style={{ fontSize: 11, color: "#FFD000", fontWeight: 700, cursor: "pointer" }}>
                          📖 Read local story →
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            <div className="bg-gradient-to-br from-[#00CFFF]/15 to-[#00CFFF]/5 border border-[#00CFFF]/30 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(0,207,255,0.1)]">
              <div className="text-3xl font-black text-[#00CFFF] font-['Space_Grotesk'] mb-1">{users.length}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Light Warriors</div>
              <div className="text-[9px] text-gray-600 mt-2">Across {totalCountries} nations</div>
            </div>
            <div className="bg-gradient-to-br from-[#FFD000]/15 to-[#FFD000]/5 border border-[#FFD000]/30 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(255,208,0,0.1)]">
              <div className="text-3xl font-black text-[#FFD000] font-['Space_Grotesk'] mb-1">{glowDrops.length}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Glow Drops</div>
              <div className="text-[9px] text-gray-600 mt-2">Faith stories shared</div>
            </div>
            <div className="bg-gradient-to-br from-[#8A5CFF]/15 to-[#8A5CFF]/5 border border-[#8A5CFF]/30 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(138,92,255,0.1)]">
              <div className="text-3xl font-black text-[#8A5CFF] font-['Space_Grotesk'] mb-1">{totalCountries}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Nations Active</div>
              <div className="text-[9px] text-gray-600 mt-2">Spreading light</div>
            </div>
          </div>

          {/* Local Believers */}
          <div className="bg-gradient-to-br from-[#121826] to-[#0B0F1A] border border-[#FFD000]/20 rounded-3xl p-6 shadow-[0_0_25px_rgba(255,208,0,0.08)]">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-[#FFD000]" />
              <div className="text-sm font-bold text-[#FFD000] uppercase tracking-wider">Your Region</div>
            </div>
            <div className="text-xs text-gray-400 mb-4">{user.country || "Your location"} — {localBelievers.length} warriors nearby</div>
            <div className="space-y-2">
              {localBelievers.map(person => (
                <Link key={person.email} to={createPageUrl("Profile") + `?user=${encodeURIComponent(person.email)}`}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/5 transition group">
                  <img src={person.profile_picture_url || defaultAvatar} className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-[#00CFFF]/40 transition" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white text-sm truncate">{person.full_name}</div>
                    <div className="text-xs text-gray-500">{person.glow_score || 0} XP</div>
                  </div>
                  <div className="text-[#00CFFF] opacity-0 group-hover:opacity-100 transition text-xs font-bold">→</div>
                </Link>
              ))}
              {localBelievers.length === 0 && (
                <div className="text-sm text-gray-500 py-4 text-center">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No nearby warriors yet. You're pioneering your region!
                </div>
              )}
            </div>
          </div>

          {/* Recent Impact Stories */}
          <div className="bg-gradient-to-br from-[#121826] to-[#0B0F1A] border border-[#00CFFF]/20 rounded-3xl p-6 shadow-[0_0_25px_rgba(0,207,255,0.08)]">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#00CFFF]" />
              <div className="text-sm font-bold text-[#00CFFF] uppercase tracking-wider">Trending Now</div>
            </div>
            <div className="text-xs text-gray-400 mb-4">Latest inspiring drops from the movement</div>
            <div className="space-y-3">
              {glowDrops.slice(0, 5).map(drop => {
                const owner = userByEmail[drop.user_email] || {};
                return (
                  <button key={drop.id} onClick={() => setSelectedDrop({ ...drop, owner })}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-2xl hover:bg-white/5 transition group">
                    <img src={owner.profile_picture_url || defaultAvatar} className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{owner.full_name || "Glow Believer"}</div>
                      <div className="text-xs text-gray-400 line-clamp-2 mt-0.5">{drop.verse || drop.reflection || "Shared a Glow Drop"}</div>
                      <div className="text-[10px] text-[#FFD000] mt-1 opacity-0 group-hover:opacity-100 transition font-bold">Read story →</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}