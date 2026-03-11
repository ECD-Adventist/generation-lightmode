import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

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
  Global: [0, 0],
};

const addJitter = ([lat, lng], index = 1) => [lat + ((index % 5) - 2) * 0.8, lng + ((index % 7) - 3) * 0.8];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const prayerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function GlobalReach() {
  const [user, setUser] = useState(null);
  const [activeLayer, setActiveLayer] = useState("all");

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

  const { data: prayerRequests = [] } = useQuery({
    queryKey: ["mapPrayerRequests"],
    queryFn: () => base44.entities.PrayerRequest.list("-created_date", 100),
    enabled: !!user,
  });

  const { data: glowDrops = [] } = useQuery({
    queryKey: ["mapGlowDrops"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 100),
    enabled: !!user,
  });

  const userByEmail = useMemo(() => Object.fromEntries(users.map((entry) => [entry.email, entry])), [users]);

  const prayerMarkers = prayerRequests.map((request, index) => {
    const owner = userByEmail[request.user_email] || {};
    const country = owner.country || "Global";
    const base = countryCoordinates[country] || countryCoordinates.Global;
    return { ...request, owner, position: addJitter(base, index) };
  });

  const dropMarkers = glowDrops.map((drop, index) => {
    const owner = userByEmail[drop.user_email] || {};
    const country = owner.country || "Global";
    const base = countryCoordinates[country] || countryCoordinates.Global;
    return { ...drop, owner, position: addJitter(base, index + 9) };
  });

  const localBelievers = users.filter((entry) => entry.email !== user?.email && entry.country && entry.country === user?.country).slice(0, 8);

  if (!user) return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">Loading global reach...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white px-4 py-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[minmax(0,1fr)_340px] gap-4">
        <div className="space-y-4">
          <div className="bg-[#121826] border border-white/10 rounded-3xl p-6">
            <h1 className="text-3xl font-bold">Global Reach</h1>
            <p className="text-gray-400 mt-2">See prayer requests and public drops around the world, then connect with nearby believers.</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { key: "all", label: "All activity" },
                { key: "prayers", label: "Prayer requests" },
                { key: "drops", label: "Public drops" },
              ].map((item) => (
                <button key={item.key} onClick={() => setActiveLayer(item.key)} className={`px-4 py-2 rounded-full text-sm font-semibold ${activeLayer === item.key ? "bg-[#00CFFF] text-black" : "bg-white/10 text-gray-300"}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[70vh] rounded-3xl overflow-hidden border border-white/10">
            <MapContainer center={[3, 20]} zoom={3} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' />

              {(activeLayer === "all" || activeLayer === "prayers") && prayerMarkers.map((request) => (
                <Marker key={`prayer-${request.id}`} position={request.position} icon={prayerIcon}>
                  <Popup>
                    <div className="min-w-[200px]">
                      <div className="font-bold mb-1">{request.is_anonymous ? "Anonymous prayer" : request.owner.full_name || "Prayer request"}</div>
                      <div className="text-sm mb-2">{request.content}</div>
                      <div className="text-xs text-gray-500 mb-2">{request.owner.country || "Global"}</div>
                      {!request.is_anonymous && request.owner.email && (
                        <Link to={createPageUrl("Profile") + `?user=${encodeURIComponent(request.owner.email)}`} className="text-sm text-[#00CFFF]">Connect</Link>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {(activeLayer === "all" || activeLayer === "drops") && dropMarkers.map((drop) => (
                <Marker key={`drop-${drop.id}`} position={drop.position} icon={dropIcon}>
                  <Popup>
                    <div className="min-w-[200px]">
                      <div className="font-bold mb-1">{drop.owner.full_name || "Glow Drop"}</div>
                      <div className="text-sm mb-2">{drop.verse || drop.reflection || "Public drop"}</div>
                      <div className="text-xs text-gray-500 mb-2">{drop.owner.country || "Global"}</div>
                      <Link to={createPageUrl("Post") + `?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`} className="text-sm text-[#FFD000]">Open post</Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#121826] border border-white/10 rounded-3xl p-5">
            <div className="text-lg font-bold text-white">Local believers</div>
            <div className="text-sm text-gray-400 mt-1">People near your area you can connect with.</div>
            <div className="mt-4 space-y-3">
              {localBelievers.map((person) => (
                <Link key={person.email} to={createPageUrl("Profile") + `?user=${encodeURIComponent(person.email)}`} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition">
                  <img src={person.profile_picture_url || defaultAvatar} alt={person.full_name} className="w-11 h-11 rounded-full object-cover border border-white/10" />
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{person.full_name}</div>
                    <div className="text-xs text-gray-500 truncate">{person.country}</div>
                  </div>
                </Link>
              ))}
              {localBelievers.length === 0 && <div className="text-sm text-gray-500 mt-3">No nearby believers found yet.</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#121826] border border-white/10 rounded-3xl p-4 text-center">
              <div className="text-3xl font-black text-[#8A5CFF]">{prayerRequests.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Prayer requests</div>
            </div>
            <div className="bg-[#121826] border border-white/10 rounded-3xl p-4 text-center">
              <div className="text-3xl font-black text-[#FFD000]">{glowDrops.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Public drops</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}