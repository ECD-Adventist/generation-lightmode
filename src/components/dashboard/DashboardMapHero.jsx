import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { Globe } from "lucide-react";

const countryCoordinates = {
  Kenya: [-1.286389, 36.817223], Tanzania: [-6.369028, 34.888822], Uganda: [1.373333, 32.290275],
  Rwanda: [-1.940278, 29.873888], Nigeria: [9.082, 8.6753], Ghana: [7.9465, -1.0232],
  SouthAfrica: [-30.5595, 22.9375], "South Africa": [-30.5595, 22.9375],
  USA: [37.0902, -95.7129], Canada: [56.1304, -106.3468], Brazil: [-14.235, -51.9253],
  India: [20.5937, 78.9629], Philippines: [12.8797, 121.774], Australia: [-25.2744, 133.7751], Global: [0, 20],
};

export default function DashboardMapHero({ userCountry }) {
  const { data: users = [] } = useQuery({
    queryKey: ["dashboardMapUsers"],
    queryFn: async () => { const res = await base44.functions.invoke("listPublicUsers", {}); return res.data; },
    staleTime: 5 * 60 * 1000,
  });

  const countryClusters = useMemo(() => {
    const clusters = {};
    users.forEach(u => {
      const country = u.country || "Global";
      const coords = countryCoordinates[country] || countryCoordinates.Global;
      if (!clusters[country]) clusters[country] = { country, coords, count: 0, xpTotal: 0, topMembers: [] };
      clusters[country].count++;
      clusters[country].xpTotal += u.glow_score || 0;
      if (clusters[country].topMembers.length < 3) clusters[country].topMembers.push(u);
    });
    return Object.values(clusters).sort((a, b) => b.count - a.count);
  }, [users]);

  const totalUsers = users.length;
  const totalCountries = countryClusters.length;
  const topCountry = countryClusters[0];

  return (
    <div className="space-y-4 font-['Inter']">
      <div className="grid grid-cols-3 gap-3">
        {[
          { val: totalUsers, label: "Warriors Online", color: "#0B3FD9", bg: "rgba(11, 63, 217, 0.08)", border: "#D6E4FF" },
          { val: totalCountries, label: "Nations Active", color: "#CC7A00", bg: "rgba(255, 208, 0, 0.1)", border: "#FFE4A0" },
          { val: topCountry?.country || "—", label: "Top Region", color: "#1FB8FF", bg: "rgba(31, 184, 255, 0.08)", border: "#B8E5FF" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4 text-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs uppercase tracking-wider mt-1" style={{ color: "#6B7FA0" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative rounded-[1.75rem] overflow-hidden" style={{ height: "400px", background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
        <style>{`
          .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; border-radius: 12px; }
          .leaflet-popup-tip { background: #FFFFFF; border: 1px solid #E6ECF5; }
          .leaflet-control-attribution { display: none !important; }
        `}</style>
        <MapContainer center={[5, 25]} zoom={3} style={{ height: "100%", width: "100%" }} zoomControl={true}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
          {countryClusters.map(cluster => {
            const radius = Math.max(10, Math.min(45, cluster.count * 3.5));
            const isLocal = cluster.country === userCountry;
            return (
              <CircleMarker key={cluster.country} center={cluster.coords} radius={radius}
                pathOptions={{ color: isLocal ? "#CC7A00" : "#0B3FD9", fillColor: isLocal ? "#FFD000" : "#1FB8FF", fillOpacity: isLocal ? 0.35 : 0.2, weight: isLocal ? 2 : 1.5 }}>
                <Popup>
                  <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 12, padding: 14, minWidth: 220, fontFamily: "Inter, sans-serif", color: "#0B1B3D", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.12)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: isLocal ? "#FFD000" : "#0B3FD9", boxShadow: `0 0 8px ${isLocal ? "#FFD000" : "#0B3FD9"}` }} />
                      <strong style={{ color: isLocal ? "#CC7A00" : "#0B3FD9", fontSize: 15 }}>{cluster.country}</strong>
                      {isLocal && <span style={{ marginLeft: "auto", fontSize: 14 }}>⭐</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "#3A4A6B", marginBottom: 10 }}>
                      <strong style={{ color: "#0B1B3D", fontSize: 20, fontFamily: "Space Grotesk, sans-serif", display: "block" }}>{cluster.count}</strong>
                      Light Warrior{cluster.count !== 1 ? "s" : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "#8A97B5", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #E6ECF5" }}>
                      {(cluster.xpTotal / cluster.count).toFixed(0)} avg XP per warrior
                    </div>
                    {cluster.topMembers.length > 0 && (
                      <div style={{ fontSize: 12 }}>
                        <div style={{ marginBottom: 6, fontWeight: 600, color: "#CC7A00", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Top Warriors</div>
                        {cluster.topMembers.map(m => (
                          <div key={m.email} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#6B7FA0" }}>
                            <span>{m.full_name?.split(" ")[0]}</span>
                            <span style={{ color: "#CC7A00", fontWeight: "bold" }}>{m.glow_score || 0}⚡</span>
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
        <div className="absolute bottom-4 left-4 backdrop-blur-lg rounded-xl px-4 py-3 text-xs z-10 max-w-xs hidden md:block" style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #E6ECF5", color: "#6B7FA0" }}>
          <p className="font-bold mb-2 flex items-center gap-2" style={{ color: "#0B1B3D" }}><Globe className="w-3.5 h-3.5" /> Circle size = warrior density</p>
          <p className="text-[11px]">Gold circles = your region • Blue circles = other nations</p>
        </div>
      </div>
    </div>
  );
}