import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Building2, Globe, Users, MapPin } from "lucide-react";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Map country names to ISO numeric codes for highlighting
const COUNTRY_NAME_TO_ISO = {
  "Ethiopia": "231", "Kenya": "404", "Tanzania": "834", "Uganda": "800",
  "Rwanda": "646", "Burundi": "108", "Democratic Republic of Congo": "180",
  "DRC": "180", "Congo": "180", "Sudan": "729", "South Sudan": "728",
  "Somalia": "706", "Eritrea": "232", "Djibouti": "262", "Zambia": "894",
  "Zimbabwe": "716", "Malawi": "454", "Mozambique": "508", "Angola": "024",
  "Madagascar": "450", "Nigeria": "566", "Ghana": "288", "Cameroon": "120",
  "Egypt": "818", "Libya": "434", "Algeria": "012", "Morocco": "504",
  "Tunisia": "788", "South Africa": "710", "Botswana": "072", "Namibia": "516",
  "Chad": "148", "Niger": "562", "Mali": "466", "Senegal": "686",
  "Ivory Coast": "384", "Côte d'Ivoire": "384", "Gabon": "266",
  "Central African Republic": "140", "CAR": "140",
};

function StatRow({ value, label, color = "#00CFFF" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-lg font-black" style={{ color, fontFamily: "Space Grotesk, sans-serif" }}>{value}</span>
    </div>
  );
}

export default function TerritoryMapVisual({ territories, institutionName, memberCount }) {
  // Extract unique countries to highlight
  const highlightedIsoCodes = useMemo(() => {
    const codes = new Set();
    territories.forEach(t => {
      const country = t.country || "";
      const code = COUNTRY_NAME_TO_ISO[country];
      if (code) codes.add(code);
    });
    return codes;
  }, [territories]);

  // Derive stats from territories
  const regions = useMemo(() => [...new Set(territories.map(t => t.region).filter(Boolean))], [territories]);
  const countries = useMemo(() => [...new Set(territories.map(t => t.country).filter(Boolean))], [territories]);

  // Find a center marker coordinate (approximate centroid of EAfrica if available)
  const centerMarker = useMemo(() => {
    if (highlightedIsoCodes.has("834")) return [34.8, -6.4]; // Tanzania center
    if (highlightedIsoCodes.has("404")) return [37.9, 0.02]; // Kenya
    if (highlightedIsoCodes.has("180")) return [23.5, -2.5]; // DRC
    return null;
  }, [highlightedIsoCodes]);

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/10"
      style={{ background: "#0e1117" }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
        <Globe className="w-4 h-4 text-[#00CFFF]" />
        <span className="text-[11px] font-black text-[#00CFFF] uppercase tracking-[0.18em]">Territory Map</span>
        <span className="ml-auto text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{countries.length} countries</span>
      </div>

      {/* Map + Stats layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Map */}
        <div className="flex-1 relative" style={{ minHeight: 320 }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 220, center: [25, 5] }}
            style={{ width: "100%", height: "100%" }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const isHighlighted = highlightedIsoCodes.has(String(geo.id));
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill: isHighlighted ? "#8B1A1A" : "#1a1e2a",
                          stroke: isHighlighted ? "#c0392b" : "#2a2f3d",
                          strokeWidth: isHighlighted ? 0.8 : 0.4,
                          outline: "none",
                        },
                        hover: {
                          fill: isHighlighted ? "#a82020" : "#1e2330",
                          stroke: isHighlighted ? "#e74c3c" : "#2a2f3d",
                          strokeWidth: 0.6,
                          outline: "none",
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
            {centerMarker && (
              <Marker coordinates={centerMarker}>
                <circle r={5} fill="#e74c3c" stroke="#fff" strokeWidth={1.5} />
                <circle r={10} fill="rgba(231,76,60,0.2)" />
              </Marker>
            )}
          </ComposableMap>
        </div>

        {/* Stats panel */}
        <div className="w-full lg:w-52 px-6 py-5 border-t border-white/5 lg:border-t-0 lg:border-l lg:border-white/5 flex flex-col justify-center gap-1">
          <div className="mb-4">
            <div className="text-[9px] font-black uppercase tracking-widest text-[#00CFFF] mb-1">Territory Stats</div>
            {memberCount > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  {memberCount >= 1000000
                    ? `${(memberCount / 1000000).toFixed(1)}M`
                    : memberCount >= 1000
                    ? `${(memberCount / 1000).toFixed(1)}K`
                    : memberCount}
                </span>
                <div className="w-8 h-8 rounded-full bg-[#8B1A1A] flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>
          <StatRow value={countries.length} label="Countries" color="#00CFFF" />
          <StatRow value={regions.length} label="Regions" color="#FFD000" />
          <StatRow value={territories.length} label="Territories" color="#8A5CFF" />
        </div>
      </div>

      {/* Territory name chips */}
      <div className="px-6 py-4 border-t border-white/5">
        <div className="flex flex-wrap gap-1.5">
          {territories.map((t, i) => (
            <span
              key={i}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
              style={{ background: "rgba(139,26,26,0.15)", borderColor: "rgba(231,76,60,0.25)", color: "#e8a0a0" }}
            >
              <MapPin className="w-2.5 h-2.5" /> {t.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}