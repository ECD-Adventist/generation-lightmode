import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { Globe, X } from "lucide-react";
import { countryCoordinates } from "@/lib/countryCoordinates";

export default function DashboardMapHero({ userCountry }) {
  const [activePanel, setActivePanel] = useState(null);
  const { data: usersPayload = { users: [], totalUsers: 0 }, isLoading } = useQuery({
    queryKey: ["dashboardMapUsersRealDataV2"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", { include_count: true, include_email: true, limit: 2000 });
      return Array.isArray(res.data) ? { users: res.data, totalUsers: res.data.length } : res.data;
    },
    staleTime: 30 * 1000,
    refetchOnMount: "always",
  });

  const users = Array.isArray(usersPayload) ? usersPayload : (usersPayload.users || []);
  const totalRegisteredUsers = Array.isArray(usersPayload) ? users.length : (usersPayload.totalUsers || users.length);
  const mappedUsers = useMemo(() => users.filter(u => (u.country || "").trim()), [users]);

  const countryClusters = useMemo(() => {
    const clusters = {};
    mappedUsers.forEach(u => {
      const country = (u.country || "").trim();
      const coords = countryCoordinates[country] || countryCoordinates.Global;
      if (!clusters[country]) clusters[country] = { country, coords, count: 0, xpTotal: 0, topMembers: [] };
      clusters[country].count++;
      clusters[country].xpTotal += u.glow_score || 0;
      clusters[country].topMembers.push(u);
    });
    return Object.values(clusters)
      .map(cluster => ({ ...cluster, topMembers: cluster.topMembers.sort((a, b) => (b.glow_score || 0) - (a.glow_score || 0)).slice(0, 5) }))
      .sort((a, b) => b.count - a.count);
  }, [mappedUsers]);

  const totalMappedUsers = mappedUsers.length;
  const totalCountries = countryClusters.length;
  const topCountry = countryClusters[0];
  const panelUsers = activePanel === "registered" ? users : activePanel === "mapped" ? mappedUsers : activePanel === "topRegion" ? mappedUsers.filter(u => (u.country || "").trim() === topCountry?.country) : [];
  const panelTitle = activePanel === "registered" ? "Total registered users" : activePanel === "mapped" ? "Warriors with country data" : activePanel === "nations" ? "Active nations" : `${topCountry?.country || "Top region"} users`;

  return (
    <div className="space-y-4 font-['Inter']">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { key: "registered", val: isLoading ? "…" : totalRegisteredUsers, label: "Registered Users", color: "#0B3FD9", bg: "rgba(11, 63, 217, 0.08)", border: "#D6E4FF" },
          { key: "mapped", val: isLoading ? "…" : totalMappedUsers, label: "Warriors Mapped", color: "#0B3FD9", bg: "rgba(11, 63, 217, 0.08)", border: "#D6E4FF" },
          { key: "nations", val: isLoading ? "…" : totalCountries, label: "Nations Active", color: "#CC7A00", bg: "rgba(255, 208, 0, 0.1)", border: "#FFE4A0" },
          { key: "topRegion", val: isLoading ? "…" : (topCountry?.country || "—"), label: "Top Region", color: "#1FB8FF", bg: "rgba(31, 184, 255, 0.08)", border: "#B8E5FF" },
        ].map((s) => (
          <button key={s.key} type="button" onClick={() => setActivePanel(s.key)} className="rounded-2xl p-4 text-center transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#1FB8FF]" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs uppercase tracking-wider mt-1" style={{ color: "#6B7FA0" }}>{s.label}</div>
          </button>
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

      {activePanel && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" style={{ background: "rgba(11, 27, 61, 0.45)" }} onClick={() => setActivePanel(null)}>
          <div className="w-full max-w-xl max-h-[80vh] rounded-3xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 24px 80px rgba(11, 27, 61, 0.3)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
              <div>
                <h3 className="font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{panelTitle}</h3>
                <p className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>{activePanel === "nations" ? `${totalCountries} countries from user profiles` : `${panelUsers.length} profiles shown`}</p>
              </div>
              <button onClick={() => setActivePanel(null)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#F6F8FC", color: "#0B1B3D" }}><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2" style={{ maxHeight: "calc(80vh - 82px)" }}>
              {activePanel === "nations" && countryClusters.length === 0 && <p className="text-sm text-center py-8" style={{ color: "#6B7FA0" }}>No country data yet.</p>}
              {activePanel !== "nations" && panelUsers.length === 0 && <p className="text-sm text-center py-8" style={{ color: "#6B7FA0" }}>No profiles to show yet.</p>}
              {activePanel === "nations" ? countryClusters.map(cluster => (
                <div key={cluster.country} className="w-full flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                  <span className="font-bold" style={{ color: "#0B1B3D" }}>{cluster.country}</span>
                  <span className="text-sm font-black" style={{ color: "#0B3FD9" }}>{cluster.count}</span>
                </div>
              )) : panelUsers.map(person => (
                <div key={person.email} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                  <img src={person.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate" style={{ color: "#0B1B3D" }}>{person.display_name || person.full_name || person.email?.split("@")[0]}</div>
                    <div className="text-xs truncate" style={{ color: "#6B7FA0" }}>{person.country || "No country set"} · {person.glow_score || 0} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}