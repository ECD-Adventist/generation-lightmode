import React, { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Globe, Users, MapPin, Layers, Star, ChevronRight } from "lucide-react";
import TerritoryDrillDownPanel from "./TerritoryDrillDownPanel";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const ECD_COUNTRIES = [
  "Sudan", "South Sudan", "Ethiopia", "Eritrea", "Somalia", "Djibouti",
  "Uganda", "Kenya", "Tanzania", "Democratic Republic of Congo", "Rwanda", "Burundi"
];

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
  "140": "Central African Republic", "690": "Seychelles",
};

const COUNTRY_NAME_TO_ISO = {
  "Ethiopia": "231", "Kenya": "404", "Tanzania": "834", "Uganda": "800",
  "Rwanda": "646", "Burundi": "108", "Democratic Republic of Congo": "180",
  "Democratic Republic of the Congo": "180",
  "DRC": "180", "DR Congo": "180", "Congo": "180",
  "Sudan": "729", "South Sudan": "728",
  "Somalia": "706", "Eritrea": "232", "Djibouti": "262",
  "Seychelles": "690",
  "Zambia": "894", "Zimbabwe": "716", "Malawi": "454", "Mozambique": "508",
  "Angola": "024", "Madagascar": "450", "Nigeria": "566", "Ghana": "288",
  "Cameroon": "120", "Egypt": "818", "Libya": "434", "Algeria": "012",
  "Morocco": "504", "Tunisia": "788", "South Africa": "710",
  "Botswana": "072", "Namibia": "516", "Chad": "148", "Niger": "562",
  "Mali": "466", "Senegal": "686", "Ivory Coast": "384",
  "Côte d'Ivoire": "384", "Gabon": "266",
  "Central African Republic": "140", "CAR": "140",
};

const ECD_ISO_CODES = new Set(
  ECD_COUNTRIES.map(c => COUNTRY_NAME_TO_ISO[c]).filter(Boolean)
);

// Color palette for ECD nations — vivid gradient tiers
const ECD_COLORS = [
  "#C0392B", "#E74C3C", "#D35400", "#E67E22", "#B03A2E",
  "#922B21", "#CB4335", "#F39C12", "#D68910", "#A93226",
  "#CD6155", "#E59866"
];

function getCountryColor(isoId, isSelected) {
  if (isSelected) return "#FF6B35";
  if (!ECD_ISO_CODES.has(isoId)) return "#0D1220";
  // Deterministic color per country
  const idx = [...ECD_ISO_CODES].indexOf(isoId);
  return ECD_COLORS[idx % ECD_COLORS.length] || "#C0392B";
}

export default function TerritoryMapVisual({ territories, institutionName, memberCount, ownerEmail }) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, name: "" });

  const highlightedIsoCodes = useMemo(() => {
    const codes = new Set(ECD_ISO_CODES);
    territories.forEach(t => {
      const code = COUNTRY_NAME_TO_ISO[t.country || ""];
      if (code) codes.add(code);
    });
    return codes;
  }, [territories]);

  const regions = useMemo(() => [...new Set(territories.map(t => t.region).filter(Boolean))], [territories]);
  const countries = useMemo(() => {
    const normalized = new Map();
    territories.forEach(t => {
      const raw = (t.country || "").trim();
      if (!raw) return;
      const key = raw.toLowerCase().replace(/[^a-z]/g, "");
      if (!normalized.has(key)) normalized.set(key, raw);
    });
    return [...normalized.values()];
  }, [territories]);

  const handleCountryClick = (geo) => {
    const isoId = String(geo.id);
    if (!highlightedIsoCodes.has(isoId)) return;
    const countryName = ISO_TO_COUNTRY[isoId];
    if (countryName) setSelectedCountry(countryName === selectedCountry ? null : countryName);
  };

  const stats = [
    { label: "ECD Nations", value: ECD_COUNTRIES.length, icon: <Globe className="w-4 h-4" />, color: "#E74C3C", bg: "rgba(231,76,60,0.12)" },
    { label: "Regions", value: regions.length || 1, icon: <Layers className="w-4 h-4" />, color: "#F39C12", bg: "rgba(243,156,18,0.12)" },
    { label: "Territories", value: territories.length || 9, icon: <MapPin className="w-4 h-4" />, color: "#8A5CFF", bg: "rgba(138,92,255,0.12)" },
    { label: "Members", value: memberCount || "—", icon: <Users className="w-4 h-4" />, color: "#00CFFF", bg: "rgba(0,207,255,0.12)" },
  ];

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={{
        background: "linear-gradient(135deg, #0B0F1A 0%, #10192E 100%)",
        border: "1px solid rgba(231,76,60,0.25)",
        boxShadow: "0 0 60px rgba(231,76,60,0.08), 0 0 120px rgba(0,0,0,0.5)"
      }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3" style={{
          borderBottom: "1px solid rgba(231,76,60,0.15)",
          background: "linear-gradient(90deg, rgba(231,76,60,0.08) 0%, transparent 100%)"
        }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(231,76,60,0.15)", border: "1px solid rgba(231,76,60,0.3)" }}>
            <Globe className="w-4 h-4 text-[#E74C3C]" />
          </div>
          <div>
            <div className="text-[11px] font-black text-[#E74C3C] uppercase tracking-[0.25em]">ECD Territory Map</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">East-Central Africa Division · 12 Nations</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.2)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#E74C3C] animate-pulse" />
            <span className="text-[10px] font-bold text-[#E74C3C]">LIVE</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 divide-x" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", divideColor: "rgba(255,255,255,0.04)" }}>
          {stats.map(stat => (
            <div key={stat.label} className="px-4 py-3 text-center" style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div style={{ color: stat.color }}>{stat.icon}</div>
              </div>
              <div className="text-xl font-black" style={{ color: stat.color, fontFamily: "Space Grotesk, sans-serif", textShadow: `0 0 20px ${stat.color}50` }}>{stat.value}</div>
              <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "rgba(200,208,224,0.4)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Map + Side panel */}
        <div className="flex flex-col lg:flex-row">

          {/* Map */}
          <div className="relative flex-1" style={{ minHeight: 400, background: "#080C14" }}>

            {/* Glow effect behind map */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(231,76,60,0.06) 0%, transparent 70%)"
            }} />

            {/* Tooltip */}
            {tooltip.visible && (
              <div
                className="absolute z-20 pointer-events-none px-3 py-2 rounded-xl text-xs font-bold text-white"
                style={{
                  background: "rgba(231,76,60,0.2)",
                  border: "1px solid rgba(231,76,60,0.5)",
                  backdropFilter: "blur(12px)",
                  left: tooltip.x,
                  top: tooltip.y - 44,
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#E74C3C]" />
                  {tooltip.name}
                </div>
                <div className="text-[9px] text-[#E74C3C]/70 mt-0.5 text-center">click to explore</div>
              </div>
            )}

            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 780, center: [36, 0] }}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const isoId = String(geo.id);
                    const isHighlighted = highlightedIsoCodes.has(isoId);
                    const isSelected = selectedCountry && ISO_TO_COUNTRY[isoId] === selectedCountry;
                    const fillColor = getCountryColor(isoId, isSelected);

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onClick={() => handleCountryClick(geo)}
                        onMouseEnter={(evt) => {
                          if (!isHighlighted) return;
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
                            setTooltip(prev => ({ ...prev, x: evt.clientX - svgRect.left, y: evt.clientY - svgRect.top }));
                          }
                        }}
                        onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, name: "" })}
                        style={{
                          default: {
                            fill: fillColor,
                            stroke: isHighlighted ? "rgba(0,0,0,0.3)" : "#0A0F1C",
                            strokeWidth: isHighlighted ? 0.8 : 0.3,
                            outline: "none",
                            cursor: isHighlighted ? "pointer" : "default",
                            filter: isSelected ? "brightness(1.3) drop-shadow(0 0 6px rgba(255,107,53,0.8))" : isHighlighted ? "brightness(1)" : "none",
                          },
                          hover: {
                            fill: isHighlighted ? "#FF6B35" : "#0F1628",
                            stroke: isHighlighted ? "rgba(255,107,53,0.6)" : "#0A0F1C",
                            strokeWidth: isHighlighted ? 1.2 : 0.3,
                            outline: "none",
                            cursor: isHighlighted ? "pointer" : "default",
                          },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
              {/* Center marker on Tanzania */}
              <Marker coordinates={[34.8, -6.4]}>
                <circle r={18} fill="rgba(231,76,60,0.08)" />
                <circle r={8} fill="rgba(231,76,60,0.25)" />
                <circle r={4} fill="#E74C3C" stroke="#fff" strokeWidth={1.5} />
              </Marker>
            </ComposableMap>
          </div>

          {/* Right Panel */}
          <div className="lg:w-52 shrink-0 flex flex-col" style={{
            background: "#080C14",
            borderTop: "1px solid rgba(231,76,60,0.08)",
            borderLeft: "1px solid rgba(231,76,60,0.08)"
          }}>

            {/* Division badge */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-3.5 h-3.5 text-[#F39C12]" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F39C12]">ECD Division</span>
              </div>
              <div className="text-xs font-bold text-white leading-tight">East-Central Africa</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Seventh-day Adventist</div>
            </div>

            {/* Nation list */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 px-2 mb-2">Nations</div>
              <div className="space-y-0.5">
                {ECD_COUNTRIES.map((country, i) => (
                  <button
                    key={country}
                    onClick={() => setSelectedCountry(selectedCountry === country ? null : country)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-all group"
                    style={{
                      background: selectedCountry === country ? "rgba(231,76,60,0.12)" : "transparent",
                      border: selectedCountry === country ? "1px solid rgba(231,76,60,0.3)" : "1px solid transparent",
                    }}
                    onMouseOver={e => { if (selectedCountry !== country) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseOut={e => { if (selectedCountry !== country) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: ECD_COLORS[i % ECD_COLORS.length], boxShadow: `0 0 6px ${ECD_COLORS[i % ECD_COLORS.length]}80` }}
                    />
                    <span className="text-[11px] font-medium flex-1 truncate" style={{ color: selectedCountry === country ? "#E74C3C" : "rgba(200,208,224,0.65)" }}>
                      {country === "Democratic Republic of Congo" ? "DR Congo" : country}
                    </span>
                    {selectedCountry === country && <ChevronRight className="w-3 h-3 text-[#E74C3C] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom hint */}
            <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="text-[9px] text-gray-600 text-center">Click a country to explore</div>
            </div>
          </div>
        </div>
      </div>

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