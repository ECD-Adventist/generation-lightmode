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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(11, 27, 61, 0.4)" }} onClick={onClose}>
      <div
        className="rounded-3xl p-6 w-full max-w-md animate-in slide-in-from-bottom-4"
        style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 16px 48px rgba(11, 63, 217, 0.18)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={drop.owner?.profile_picture_url || defaultAvatar} className="w-12 h-12 rounded-full object-cover" style={{ border: "2px solid #B8E5FF" }} />
            <div>
              <div className="font-bold" style={{ color: "#0B1B3D" }}>{drop.owner?.full_name || "Glow Believer"}</div>
              <div className="text-xs flex items-center gap-1" style={{ color: "#6B7FA0" }}>
                <MapPin className="w-3 h-3" /> {drop.owner?.country || "Global"}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="transition p-1" style={{ color: "#8A97B5" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {drop.verse && (
          <div className="rounded-2xl p-4 mb-3" style={{ background: "rgba(31, 184, 255, 0.06)", border: "1px solid #B8E5FF" }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#0B3FD9" }}>📖 Verse</div>
            <p className="text-sm leading-relaxed font-medium italic" style={{ color: "#0B1B3D" }}>"{drop.verse}"</p>
          </div>
        )}

        {drop.reflection && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(11, 63, 217, 0.04)", border: "1px solid #D6E4FF" }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#0B3FD9" }}>💡 Reflection</div>
            <p className="text-sm leading-relaxed" style={{ color: "#4A5878" }}>{drop.reflection}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm" style={{ color: "#6B7FA0" }}>
            <Heart className="w-4 h-4 text-red-400" /> {drop.likes_count || 0} lights
          </div>
          <Link
            to={createPageUrl("Post") + `?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`}
            className="flex items-center gap-1.5 text-sm font-bold transition"
            style={{ color: "#0B3FD9" }}
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}>
      <div className="flex flex-col items-center gap-3">
        <Globe className="w-10 h-10 animate-pulse" style={{ color: "#1FB8FF" }} />
        <span style={{ color: "#6B7FA0" }}>Loading global reach...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      {selectedDrop && <ImpactStoryPanel drop={selectedDrop} onClose={() => setSelectedDrop(null)} />}

      {/* Top Navigation */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b safe-pt" style={{ background: "rgba(246, 248, 252, 0.9)", borderColor: "#E2E8F0" }}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg transition" style={{ color: "#4A5878" }} title="Go back">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
              <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" style={{ height: 48, width: "auto" }} />
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            {[
              { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
              { to: "Dashboard", icon: <Zap className="w-4 h-4" />, label: "Dashboard" },
              { to: "Notifications", icon: <Bell className="w-4 h-4" />, label: "Alerts" },
              { to: "Profile", icon: <User className="w-4 h-4" />, label: "Profile" },
            ].map(item => (
              <Link key={item.to} to={createPageUrl(item.to)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-sm font-semibold" style={{ color: "#4A5878" }}
                onMouseOver={e => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5878"; }}
              >
                {item.icon}<span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_340px] gap-6">

        {/* LEFT: Map + Controls */}
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="rounded-3xl p-8" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF" }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#1FB8FF" }}></span>
                  <span className="text-xs font-bold tracking-wider uppercase" style={{ color: "#0B3FD9" }}>Live Global Map</span>
                </div>
                <h1 className="text-4xl font-bold font-['Space_Grotesk'] text-transparent bg-clip-text mb-2" style={{ backgroundImage: "linear-gradient(90deg, #1FB8FF, #0B3FD9)" }}>
                  Global Reach
                </h1>
                <p className="text-sm max-w-md" style={{ color: "#6B7FA0" }}>
                  {mapMode === "warriors"
                    ? "Explore where Light Warriors are building faith communities worldwide."
                    : "Discover inspiring Glow Drops shared by believers across nations."}
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex rounded-2xl p-1.5 gap-1 shrink-0" style={{ background: "#F0F4FA", border: "1px solid #E6ECF5" }}>
                <button
                  onClick={() => setMapMode("warriors")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                  style={mapMode === "warriors"
                    ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.25)" }
                    : { color: "#6B7FA0" }}
                >
                  <Users className="w-4 h-4" /> Warriors
                </button>
                <button
                  onClick={() => setMapMode("drops")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                  style={mapMode === "drops"
                    ? { background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 2px 8px rgba(255, 159, 26, 0.25)" }
                    : { color: "#6B7FA0" }}
                >
                  <Zap className="w-4 h-4" /> Drops
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
              {mapMode === "warriors" ? (
                <>
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                    <div className="w-3 h-3 rounded-full bg-[#FFD000]" />
                    <span style={{ color: "#4A5878" }}>Your region</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                    <div className="w-3 h-3 rounded-full bg-[#1FB8FF]" />
                    <span style={{ color: "#4A5878" }}>Other nations</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                    <div className="w-4 h-4 rounded-full" style={{ background: "rgba(31,184,255,0.3)" }} />
                    <span style={{ color: "#4A5878" }}>Low density</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                    <div className="w-5 h-5 rounded-full bg-[#1FB8FF]" />
                    <span style={{ color: "#4A5878" }}>High density</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                    <Heart className="w-3 h-3 text-red-400" />
                    <span style={{ color: "#4A5878" }}>Few likes</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                    <Heart className="w-4 h-4 text-red-400" />
                    <span style={{ color: "#4A5878" }}>Popular</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                    <Zap className="w-3 h-3" style={{ color: "#CC7A00" }} />
                    <span style={{ color: "#4A5878" }}>Click to view</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                    <TrendingUp className="w-3 h-3" style={{ color: "#1FB8FF" }} />
                    <span style={{ color: "#4A5878" }}>Newest first</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="rounded-3xl overflow-hidden" style={{ height: "65vh", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
            <MapContainer center={[5, 25]} zoom={3} style={{ height: "100%", width: "100%" }} zoomControl={true}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
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
                      color: isLocal ? "#CC7A00" : "#0B3FD9",
                      fillColor: isLocal ? "#FFD000" : "#1FB8FF",
                      fillOpacity: 0.25,
                      weight: isLocal ? 2.5 : 1.5,
                    }}
                  >
                    <Popup>
                      <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 12, padding: 16, minWidth: 200, color: "#0B1B3D", fontFamily: "Inter, sans-serif", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.12)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: isLocal ? "#FFD000" : "#0B3FD9", boxShadow: `0 0 8px ${isLocal ? "#FFD000" : "#0B3FD9"}` }} />
                          <strong style={{ color: isLocal ? "#CC7A00" : "#0B3FD9", fontSize: 15 }}>{cluster.country}</strong>
                        </div>
                        <div style={{ fontSize: 13, color: "#6B7FA0", marginBottom: 12 }}>
                          <strong style={{ color: "#0B1B3D", fontSize: 22, fontFamily: "Space Grotesk, sans-serif" }}>{cluster.count}</strong> Light Warrior{cluster.count !== 1 ? "s" : ""}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                          {cluster.members.slice(0, 5).map(m => (
                            <img key={m.email} src={m.profile_picture_url || defaultAvatar} title={m.full_name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1px solid #E6ECF5" }} />
                          ))}
                          {cluster.count > 5 && <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(11,63,217,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#0B3FD9", fontWeight: "bold" }}>+{cluster.count - 5}</div>}
                        </div>
                        {isLocal && <div style={{ fontSize: 11, color: "#CC7A00", fontWeight: 600 }}>⭐ Your region</div>}
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
                      <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 12, padding: 14, minWidth: 190, color: "#0B1B3D", fontFamily: "Inter, sans-serif", cursor: "pointer", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.12)" }}
                        onClick={() => setSelectedDrop(drop)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <img src={drop.owner?.profile_picture_url || defaultAvatar} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1px solid #E6ECF5" }} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#0B1B3D" }}>{drop.owner?.full_name || "Glow Believer"}</div>
                            <div style={{ fontSize: 11, color: "#6B7FA0" }}>{drop.owner?.country || "Global"}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "#4A5878", marginBottom: 8, lineHeight: 1.5, maxWidth: 200, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                          {drop.verse || drop.reflection || "Glow Drop"}
                        </div>
                        <div style={{ fontSize: 11, color: "#0B3FD9", fontWeight: 700, cursor: "pointer" }}>
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
            <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(31, 184, 255, 0.06)", border: "1px solid #B8E5FF" }}>
              <div className="text-3xl font-black font-['Space_Grotesk'] mb-1" style={{ color: "#0B3FD9" }}>{users.length}</div>
              <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#6B7FA0" }}>Light Warriors</div>
              <div className="text-[9px] mt-2" style={{ color: "#8A97B5" }}>Across {totalCountries} nations</div>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(255, 208, 0, 0.06)", border: "1px solid #FFE4A0" }}>
              <div className="text-3xl font-black font-['Space_Grotesk'] mb-1" style={{ color: "#CC7A00" }}>{glowDrops.length}</div>
              <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#6B7FA0" }}>Glow Drops</div>
              <div className="text-[9px] mt-2" style={{ color: "#8A97B5" }}>Faith stories shared</div>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(11, 63, 217, 0.04)", border: "1px solid #D6E4FF" }}>
              <div className="text-3xl font-black font-['Space_Grotesk'] mb-1" style={{ color: "#0B3FD9" }}>{totalCountries}</div>
              <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#6B7FA0" }}>Nations Active</div>
              <div className="text-[9px] mt-2" style={{ color: "#8A97B5" }}>Spreading light</div>
            </div>
          </div>

          {/* Local Believers */}
          <div className="rounded-3xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4" style={{ color: "#CC7A00" }} />
              <div className="text-sm font-bold uppercase tracking-wider" style={{ color: "#CC7A00" }}>Your Region</div>
            </div>
            <div className="text-xs mb-4" style={{ color: "#6B7FA0" }}>{user.country || "Your location"} — {localBelievers.length} warriors nearby</div>
            <div className="space-y-2">
              {localBelievers.map(person => (
                <Link key={person.email} to={createPageUrl("Profile") + `?user=${encodeURIComponent(person.email)}`}
                  className="flex items-center gap-3 p-2.5 rounded-2xl transition group hover:bg-[#F0F4FA]">
                  <img src={person.profile_picture_url || defaultAvatar} className="w-10 h-10 rounded-full object-cover transition" style={{ border: "1px solid #E6ECF5" }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate" style={{ color: "#0B1B3D" }}>{person.full_name}</div>
                    <div className="text-xs" style={{ color: "#6B7FA0" }}>{person.glow_score || 0} XP</div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition text-xs font-bold" style={{ color: "#0B3FD9" }}>→</div>
                </Link>
              ))}
              {localBelievers.length === 0 && (
                <div className="text-sm py-4 text-center" style={{ color: "#8A97B5" }}>
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No nearby warriors yet. You're pioneering your region!
                </div>
              )}
            </div>
          </div>

          {/* Recent Impact Stories */}
          <div className="rounded-3xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" style={{ color: "#0B3FD9" }} />
              <div className="text-sm font-bold uppercase tracking-wider" style={{ color: "#0B3FD9" }}>Trending Now</div>
            </div>
            <div className="text-xs mb-4" style={{ color: "#6B7FA0" }}>Latest inspiring drops from the movement</div>
            <div className="space-y-3">
              {glowDrops.slice(0, 5).map(drop => {
                const owner = userByEmail[drop.user_email] || {};
                return (
                  <button key={drop.id} onClick={() => setSelectedDrop({ ...drop, owner })}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-2xl hover:bg-[#F0F4FA] transition group">
                    <img src={owner.profile_picture_url || defaultAvatar} className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" style={{ border: "1px solid #E6ECF5" }} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: "#0B1B3D" }}>{owner.full_name || "Glow Believer"}</div>
                      <div className="text-xs line-clamp-2 mt-0.5" style={{ color: "#6B7FA0" }}>{drop.verse || drop.reflection || "Shared a Glow Drop"}</div>
                      <div className="text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition font-bold" style={{ color: "#0B3FD9" }}>Read story →</div>
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