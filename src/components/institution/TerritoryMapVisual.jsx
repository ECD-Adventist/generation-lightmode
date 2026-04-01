import React, { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Globe, Users, MapPin } from "lucide-react";
import TerritoryDrillDownPanel from "./TerritoryDrillDownPanel";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO numeric → country name (for click lookup)
const ISO_TO_COUNTRY = {
  "231": "Ethiopia", "404": "Kenya", "834": "Tanzania", "800": "Uganda",
  "646": "Rwanda", "108": "Burundi", "180": "Democratic Republic of Congo",
  "729": "Sudan", "728": "South Sudan", "706": "Somalia", "232": "Eritrea",
  "262": "Djibouti", "894": "Zambia", "716": "Zimbabwe", "454": "Malawi",
  "508": "Mozambique", "024": "Angola", "450": "Madagascar", "566": "Nigeria",
  "288": "Ghana", "120": "Cameroon", "818": "Egypt", "434": "Libya",
  "012": "Algeria", "504": "Morocco", "788": "Tunisia", "710": "South Africa",
  "072": "Botswana", "516": "Namibia", "148": "Chad", "562": "Niger",
  "466": "Mali", "686": "Senegal", "384": "Ivory Coast", "266": "Gabon",
  "140": "Central African Republic",
};

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

export default function TerritoryMapVisual({ territories, institutionName, memberCount, ownerEmail }) {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, name: "" });

  const highlightedIsoCodes = useMemo(() => {
    const codes = new Set();
    territories.forEach(t => {
      const code = COUNTRY_NAME_TO_ISO[t.country || ""];
      if (code) codes.add(code);
    });
    return codes;
  }, [territories]);

  const regions = useMemo(() => [...new Set(territories.map(t => t.region).filter(Boolean))], [territories]);
  const countries = useMemo(() => [...new Set(territories.map(t => t.country).filter(Boolean))], [territories]);

  const centerMarker = useMemo(() => {
    if (highlightedIsoCodes.has("834")) return [34.8, -6.4];
    if (highlightedIsoCodes.has("404")) return [37.9, 0.02];
    if (highlightedIsoCodes.has("180")) return [23.5, -2.5];
    return null;
  }, [highlightedIsoCodes]);

  const handleCountryClick = (geo) => {
    const isoId = String(geo.id);
    if (!highlightedIsoCodes.has(isoId)) return;
    const countryName = ISO_TO_COUNTRY[isoId];
    if (countryName) setSelectedCountry(countryName);
  };

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: "#0e1117" }}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <Globe className="w-4 h-4 text-[#00CFFF]" />
          <span className="text-[11px] font-black text-[#00CFFF] uppercase tracking-[0.18em]">Territory Map</span>
          <span className="text-[10px] text-gray-500 ml-1">· Click a region to explore</span>
          <span className="ml-auto text-[10px] font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{countries.length} countries</span>
        </div>

        {/* Map + Stats */}
        <div className="flex flex-col lg:flex-row">
          {/* Map */}
          <div className="flex-1 relative" style={{ minHeight: 320 }}>
            {/* Tooltip */}
            {tooltip.visible && (
              <div
                className="absolute z-20 pointer-events-none px-3 py-1.5 rounded-lg text-xs font-bold text-white border border-white/10"
                style={{
                  background: "rgba(14,17,23,0.95)",
                  left: tooltip.x + 10,
                  top: tooltip.y - 30,
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                }}
              >
                {tooltip.name}
                <span className="ml-2 text-[#e74c3c] text-[9px] font-black uppercase">Click to explore →</span>
              </div>
            )}

            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 220, center: [25, 5] }}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const isoId = String(geo.id);
                    const isHighlighted = highlightedIsoCodes.has(isoId);
                    const isHovered = hoveredCountry === isoId;
                    const isSelected = selectedCountry && ISO_TO_COUNTRY[isoId] === selectedCountry;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => handleCountryClick(geo)}
                        onMouseEnter={(evt) => {
                          if (!isHighlighted) return;
                          setHoveredCountry(isoId);
                          const rect = evt.target.closest("svg")?.getBoundingClientRect();
                          const svgEl = evt.target.closest("svg");
                          if (svgEl) {
                            const svgRect = svgEl.getBoundingClientRect();
                            setTooltip({
                              visible: true,
                              x: evt.clientX - svgRect.left,
                              y: evt.clientY - svgRect.top,
                              name: ISO_TO_COUNTRY[isoId] || "",
                            });
                          }
                        }}
                        onMouseMove={(evt) => {
                          if (!isHighlighted) return;
                          const svgEl = evt.target.closest("svg");
                          if (svgEl) {
                            const svgRect = svgEl.getBoundingClientRect();
                            setTooltip(prev => ({
                              ...prev,
                              x: evt.clientX - svgRect.left,
                              y: evt.clientY - svgRect.top,
                            }));
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredCountry(null);
                          setTooltip({ visible: false, x: 0, y: 0, name: "" });
                        }}
                        style={{
                          default: {
                            fill: isSelected ? "#c0392b" : isHighlighted ? "#8B1A1A" : "#1a1e2a",
                            stroke: isSelected ? "#e74c3c" : isHighlighted ? "#c0392b" : "#2a2f3d",
                            strokeWidth: isHighlighted ? 0.8 : 0.4,
                            outline: "none",
                            cursor: isHighlighted ? "pointer" : "default",
                          },
                          hover: {
                            fill: isHighlighted ? "#b52828" : "#1e2330",
                            stroke: isHighlighted ? "#e74c3c" : "#2a2f3d",
                            strokeWidth: isHighlighted ? 1.2 : 0.4,
                            outline: "none",
                            cursor: isHighlighted ? "pointer" : "default",
                            filter: isHighlighted ? "drop-shadow(0 0 6px rgba(231,76,60,0.6))" : "none",
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
                    {memberCount >= 1000000 ? `${(memberCount / 1000000).toFixed(1)}M`
                      : memberCount >= 1000 ? `${(memberCount / 1000).toFixed(1)}K`
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

            {/* Clickable country list */}
            <div className="mt-4 space-y-1">
              <div className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Explore by Country</div>
              {countries.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCountry(c)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition hover:bg-white/5 group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8B1A1A] group-hover:bg-[#e74c3c] transition shrink-0" />
                  <span className="text-[11px] text-gray-400 group-hover:text-white transition truncate">{c}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Territory chips */}
        <div className="px-6 py-4 border-t border-white/5">
          <div className="flex flex-wrap gap-1.5">
            {territories.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedCountry(t.country)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition hover:border-[#e74c3c]/50 hover:text-white"
                style={{ background: "rgba(139,26,26,0.15)", borderColor: "rgba(231,76,60,0.25)", color: "#e8a0a0" }}
              >
                <MapPin className="w-2.5 h-2.5" /> {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Drill-down side panel */}
      {selectedCountry && (
        <TerritoryDrillDownPanel
          country={selectedCountry}
          territories={territories}
          ownerEmail={ownerEmail}
          onClose={() => setSelectedCountry(null)}
        />
      )}
    </>
  );
}