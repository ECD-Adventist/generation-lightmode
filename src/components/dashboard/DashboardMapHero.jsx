import React, { useMemo, useState } from "react";
import { MapContainer, CircleMarker, Popup } from "react-leaflet";
import LocalWorldBasemap from "@/components/maps/LocalWorldBasemap";
import "leaflet/dist/leaflet.css";
import { AlertCircle, Globe, RefreshCw, X } from "lucide-react";
import { countryCoordinates } from "@/lib/countryCoordinates";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";

export default function DashboardMapHero({ userCountry }) {
  const [activePanel, setActivePanel] = useState(null);
  const { data: snapshot, isLoading: queryLoading, isPlaceholderData, isError, error, refetch, isFetching } = usePublicCommunitySnapshot();
  const isLoading = queryLoading || isPlaceholderData;
  const hasSnapshot = Boolean(snapshot?.generated_at);

  const countryClusters = useMemo(() => {
    const stats = Array.isArray(snapshot?.countryStats) ? snapshot.countryStats : [];
    return stats
      .filter((entry) => entry?.country && Number(entry.users || 0) > 0)
      .map((entry) => ({
        country: entry.country,
        coords: countryCoordinates[entry.country] || countryCoordinates.Global,
        count: Number(entry.users || 0),
        groups: Number(entry.groups || 0),
        drops: Number(entry.drops || 0),
      }))
      .sort((a, b) => b.count - a.count);
  }, [snapshot?.countryStats]);

  const totalRegisteredUsers = Number(snapshot?.totalUsers || 0);
  const totalMappedUsers = countryClusters.reduce((sum, cluster) => sum + cluster.count, 0);
  const totalCountries = countryClusters.length;
  const topCountry = countryClusters[0];

  const panelClusters = activePanel === "topRegion"
    ? (topCountry ? [topCountry] : [])
    : countryClusters;
  const panelTitle = activePanel === "registered"
    ? "Registered users by nation"
    : activePanel === "mapped"
      ? "Mapped warriors by nation"
      : activePanel === "nations"
        ? "Active nations"
        : `${topCountry?.country || "Top region"} overview`;
  const panelSubtitle = activePanel === "registered"
    ? `${totalRegisteredUsers.toLocaleString()} registered users total`
    : activePanel === "mapped"
      ? `${totalMappedUsers.toLocaleString()} profiles with country data`
      : activePanel === "nations"
        ? `${totalCountries.toLocaleString()} nations represented`
        : topCountry
          ? `${topCountry.count.toLocaleString()} mapped warriors`
          : "No region data available";

  if (isError && !hasSnapshot) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: "#FFF8E6", border: "1px solid #FFE4A0" }}>
        <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "#CC7A00" }} />
        <p className="font-bold" style={{ color: "#0B1B3D" }}>Community reach data could not be loaded.</p>
        <p className="text-xs mt-1" style={{ color: "#6B7FA0" }}>{error?.message || "The database request failed. Your records have not been deleted."}</p>
        <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold disabled:opacity-60" style={{ background: "#0B3FD9", color: "#FFFFFF" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-['Inter']">
      {hasSnapshot && <p className="text-xs text-muted-foreground" role="status">
        {isFetching ? "Updating totals… " : isError ? "Refresh unavailable — showing last loaded totals. " : ""}
        Last updated {new Date(snapshot.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
      </p>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { key: "registered", val: isLoading ? "…" : totalRegisteredUsers.toLocaleString(), label: "Registered Users", color: "#0B3FD9", bg: "rgba(11, 63, 217, 0.08)", border: "#D6E4FF" },
          { key: "mapped", val: isLoading ? "…" : totalMappedUsers.toLocaleString(), label: "Warriors Mapped", color: "#0B3FD9", bg: "rgba(11, 63, 217, 0.08)", border: "#D6E4FF" },
          { key: "nations", val: isLoading ? "…" : totalCountries.toLocaleString(), label: "Nations Active", color: "#CC7A00", bg: "rgba(255, 208, 0, 0.1)", border: "#FFE4A0" },
          { key: "topRegion", val: isLoading ? "…" : (topCountry?.country || "—"), label: "Top Region", color: "#1FB8FF", bg: "rgba(31, 184, 255, 0.08)", border: "#B8E5FF" },
        ].map((stat) => (
          <button key={stat.key} type="button" onClick={() => setActivePanel(stat.key)} disabled={isLoading} className="rounded-2xl p-4 text-center transition hover:-translate-y-0.5 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#1FB8FF]" style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
            <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: stat.color }}>{stat.val}</div>
            <div className="text-xs uppercase tracking-wider mt-1" style={{ color: "#6B7FA0" }}>{stat.label}</div>
          </button>
        ))}
      </div>

      <div className="relative rounded-[1.75rem] overflow-hidden" style={{ height: "400px", background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
        <style>{`.leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; border-radius: 12px; } .leaflet-popup-tip { background: #FFFFFF; border: 1px solid #E6ECF5; }`}</style>
        <MapContainer className="isolate z-0" center={[5, 25]} zoom={3} style={{ height: "100%", width: "100%" }} zoomControl={true}>
          <LocalWorldBasemap variant="light" />
          {countryClusters.map((cluster) => {
            const radius = Math.max(10, Math.min(45, Math.sqrt(cluster.count) * 5));
            const isLocal = cluster.country === userCountry;
            return (
              <CircleMarker key={cluster.country} center={cluster.coords} radius={radius} pathOptions={{ color: isLocal ? "#CC7A00" : "#0B3FD9", fillColor: isLocal ? "#FFD000" : "#1FB8FF", fillOpacity: isLocal ? 0.35 : 0.2, weight: isLocal ? 2 : 1.5 }}>
                <Popup>
                  <div style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", borderRadius: 12, padding: 14, minWidth: 220, fontFamily: "Inter, sans-serif", color: "#0B1B3D", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.12)" }}>
                    <strong style={{ color: isLocal ? "#CC7A00" : "#0B3FD9", fontSize: 15 }}>{cluster.country}</strong>
                    <div style={{ marginTop: 10, fontSize: 13, color: "#3A4A6B" }}><strong style={{ color: "#0B1B3D", fontSize: 20, display: "block" }}>{cluster.count.toLocaleString()}</strong>Light Warrior{cluster.count !== 1 ? "s" : ""}</div>
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #E6ECF5", fontSize: 12, color: "#6B7FA0" }}>{cluster.groups.toLocaleString()} groups · {cluster.drops.toLocaleString()} approved drops</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        <div className="absolute bottom-4 left-4 backdrop-blur-lg rounded-xl px-4 py-3 text-xs z-10 max-w-xs hidden md:block" style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #E6ECF5", color: "#6B7FA0" }}>
          <p className="font-bold mb-2 flex items-center gap-2" style={{ color: "#0B1B3D" }}><Globe className="w-3.5 h-3.5" /> Circle size = warrior density</p>
          <p className="text-[11px]">Gold circles = your region · Blue circles = other nations</p>
        </div>
      </div>

      {activePanel && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" style={{ background: "rgba(11, 27, 61, 0.45)" }} onClick={() => setActivePanel(null)}>
          <div className="w-full max-w-xl max-h-[80vh] rounded-3xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 24px 80px rgba(11, 27, 61, 0.3)" }} onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E6ECF5" }}>
              <div><h3 className="font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>{panelTitle}</h3><p className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>{panelSubtitle}</p></div>
              <button onClick={() => setActivePanel(null)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#F6F8FC", color: "#0B1B3D" }}><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2" style={{ maxHeight: "calc(80vh - 82px)" }}>
              {panelClusters.length === 0 && <p className="text-sm text-center py-8" style={{ color: "#6B7FA0" }}>No country data has been recorded yet.</p>}
              {panelClusters.map((cluster) => (
                <div key={cluster.country} className="w-full flex items-center justify-between gap-4 rounded-2xl px-4 py-3" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
                  <div><span className="font-bold" style={{ color: "#0B1B3D" }}>{cluster.country}</span><p className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>{cluster.groups.toLocaleString()} groups · {cluster.drops.toLocaleString()} approved drops</p></div>
                  <span className="text-sm font-black" style={{ color: "#0B3FD9" }}>{cluster.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}