import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { Users, Globe, Zap } from "lucide-react";

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

export default function DashboardMapHero({ userCountry }) {
  const { data: users = [] } = useQuery({
    queryKey: ["dashboardMapUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 mins
  });

  // Build country clusters
  const countryClusters = useMemo(() => {
    const clusters = {};
    users.forEach(u => {
      const country = u.country || "Global";
      const coords = countryCoordinates[country] || countryCoordinates.Global;
      if (!clusters[country]) {
        clusters[country] = { country, coords, count: 0, xpTotal: 0, topMembers: [] };
      }
      clusters[country].count++;
      clusters[country].xpTotal += u.glow_score || 0;
      if (clusters[country].topMembers.length < 3) {
        clusters[country].topMembers.push(u);
      }
    });
    return Object.values(clusters).sort((a, b) => b.count - a.count);
  }, [users]);

  const totalUsers = users.length;
  const totalCountries = countryClusters.length;
  const topCountry = countryClusters[0];

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-[#00CFFF]/20 to-[#00CFFF]/5 border border-[#00CFFF]/30 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(0,207,255,0.1)]">
          <div className="text-2xl font-black text-[#00CFFF] font-['Space_Grotesk']">{totalUsers}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Warriors Online</div>
        </div>
        <div className="bg-gradient-to-br from-[#FFD000]/20 to-[#FFD000]/5 border border-[#FFD000]/30 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(255,208,0,0.1)]">
          <div className="text-2xl font-black text-[#FFD000] font-['Space_Grotesk']">{totalCountries}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Nations Active</div>
        </div>
        <div className="bg-gradient-to-br from-[#8A5CFF]/20 to-[#8A5CFF]/5 border border-[#8A5CFF]/30 rounded-2xl p-4 text-center shadow-[0_0_20px_rgba(138,92,255,0.1)]">
          <div className="text-2xl font-black text-[#8A5CFF] font-['Space_Grotesk']">{topCountry?.country || "—"}</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Top Region</div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-[#121826] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,207,255,0.1)]" style={{ height: "400px" }}>
        <MapContainer center={[5, 25]} zoom={3} style={{ height: "100%", width: "100%" }} zoomControl={true}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />

          {countryClusters.map(cluster => {
            const radius = Math.max(10, Math.min(45, cluster.count * 3.5));
            const isLocal = cluster.country === userCountry;
            const opacity = isLocal ? 0.35 : 0.2;
            return (
              <CircleMarker
                key={cluster.country}
                center={cluster.coords}
                radius={radius}
                pathOptions={{
                  color: isLocal ? "#FFD000" : "#00CFFF",
                  fillColor: isLocal ? "#FFD000" : "#00CFFF",
                  fillOpacity: opacity,
                  weight: isLocal ? 2 : 1.5,
                }}
              >
                <Popup>
                  <div style={{ background: "#0B0F1A", border: "1px solid rgba(0,207,255,0.3)", borderRadius: 12, padding: 14, minWidth: 220, color: "#fff", fontFamily: "Inter, sans-serif" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: isLocal ? "#FFD000" : "#00CFFF", boxShadow: `0 0 10px ${isLocal ? "#FFD000" : "#00CFFF"}` }} />
                      <strong style={{ color: isLocal ? "#FFD000" : "#00CFFF", fontSize: 15 }}>{cluster.country}</strong>
                      {isLocal && <span style={{ marginLeft: "auto", fontSize: 14 }}>⭐</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "#ddd", marginBottom: 10 }}>
                      <strong style={{ color: "#fff", fontSize: 20, fontFamily: "Space Grotesk, sans-serif", display: "block" }}>{cluster.count}</strong>
                      Light Warrior{cluster.count !== 1 ? "s" : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "#999", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      {(cluster.xpTotal / cluster.count).toFixed(0)} avg XP per warrior
                    </div>
                    {cluster.topMembers.length > 0 && (
                      <div style={{ fontSize: 12, color: "#ccc" }}>
                        <div style={{ marginBottom: 6, fontWeight: 600, color: "#FFD000", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Top Warriors</div>
                        {cluster.topMembers.map(m => (
                          <div key={m.email} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#aaa" }}>
                            <span>{m.full_name?.split(" ")[0]}</span>
                            <span style={{ color: "#FFD000", fontWeight: "bold" }}>{m.glow_score || 0}⚡</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-[#0B0F1A]/90 backdrop-blur-lg border border-white/10 rounded-xl px-4 py-3 text-xs text-gray-400 z-10 max-w-xs hidden md:block">
          <p className="font-bold text-white mb-2 flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Circle size = warrior density</p>
          <p className="text-[11px]">Gold circles = your region • Cyan circles = other nations</p>
        </div>
      </div>
    </div>
  );
}