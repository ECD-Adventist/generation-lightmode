import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { base44 } from "@/api/base44Client";
import { Building2, Globe, Users, MapPin, Layers, Star, ChevronRight } from "lucide-react";
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

const HQ_COORDINATES = {
  "Sudan": [30.2176, 12.8628],
  "South Sudan": [31.307, 6.877],
  "Ethiopia": [39.7823, 9.145],
  "Eritrea": [39.7823, 15.1794],
  "Somalia": [46.1996, 5.1521],
  "Djibouti": [42.5903, 11.8251],
  "Uganda": [32.2903, 1.3733],
  "Kenya": [37.9062, -0.0236],
  "Tanzania": [34.8888, -6.369],
  "Democratic Republic of Congo": [21.7587, -4.0383],
  "Rwanda": [29.8739, -1.9403],
  "Burundi": [29.9189, -3.3731],
  "Seychelles": [55.492, -4.6796],
};

function resolveCountryName(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const directCode = COUNTRY_NAME_TO_ISO[raw];
  if (directCode) return ISO_TO_COUNTRY[directCode] || raw;
  const compact = raw.toLowerCase().replace(/[^a-z]/g, "");
  const match = Object.keys(COUNTRY_NAME_TO_ISO).find(name => name.toLowerCase().replace(/[^a-z]/g, "") === compact);
  if (!match) return null;
  return ISO_TO_COUNTRY[COUNTRY_NAME_TO_ISO[match]] || match;
}

// LightMode dark palette — cyan, gold, violet, royal blue
const ECD_COLORS = [
  "#00CFFF", "#FFD000", "#8A5CFF", "#2979FF", "#1FB8FF",
  "#D4B82E", "#6D5DFB", "#00E0FF", "#FFB703", "#4DA8FF",
  "#A78BFA", "#7DD3FC"
];

function getCountryColor(isoId, isSelected) {
  if (isSelected) return "#FFD000";
  if (!ECD_ISO_CODES.has(isoId)) return "#111827";
  const idx = [...ECD_ISO_CODES].indexOf(isoId);
  return ECD_COLORS[idx % ECD_COLORS.length] || "#00CFFF";
}

export default function TerritoryMapVisual({ territories, institutionName, memberCount, ownerEmail, hqCountry, compact = false }) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, name: "" });

  const { data: mapUsers = [] } = useQuery({
    queryKey: ["territoryMapUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const highlightedIsoCodes = useMemo(() => {
    const codes = new Set();
    territories.forEach(t => {
      const country = resolveCountryName(t.country || t.name);
      const code = COUNTRY_NAME_TO_ISO[country];
      if (code) codes.add(code);
    });
    return codes.size > 0 ? codes : new Set(ECD_ISO_CODES);
  }, [territories]);

  const regions = useMemo(() => [...new Set(territories.map(t => t.region).filter(Boolean))], [territories]);
  const countries = useMemo(() => {
    const names = [...highlightedIsoCodes].map(code => ISO_TO_COUNTRY[code]).filter(Boolean);
    return names.length > 0 ? names : ECD_COUNTRIES;
  }, [highlightedIsoCodes]);

  const usersInMap = useMemo(() => {
    return mapUsers.filter(user => {
      const country = resolveCountryName(user.country);
      return country && highlightedIsoCodes.has(COUNTRY_NAME_TO_ISO[country]);
    }).length;
  }, [mapUsers, highlightedIsoCodes]);

  const hqResolvedCountry = resolveCountryName(hqCountry) || countries[0];
  const hqCoordinates = HQ_COORDINATES[hqResolvedCountry] || HQ_COORDINATES.Kenya;

  const handleCountryClick = (geo) => {
    const isoId = String(geo.id);
    if (!highlightedIsoCodes.has(isoId)) return;
    const countryName = ISO_TO_COUNTRY[isoId];
    if (countryName) setSelectedCountry(countryName === selectedCountry ? null : countryName);
  };

  const stats = [
    { label: "Nations", value: countries.length, icon: <Globe className="w-4 h-4" />, color: "#00CFFF", bg: "rgba(0,207,255,0.12)" },
    { label: "Regions", value: regions.length || 1, icon: <Layers className="w-4 h-4" />, color: "#FFD000", bg: "rgba(255,208,0,0.12)" },
    { label: "Territories", value: territories.length || 9, icon: <MapPin className="w-4 h-4" />, color: "#8A5CFF", bg: "rgba(138,92,255,0.12)" },
    { label: "Users", value: usersInMap || memberCount || "—", icon: <Users className="w-4 h-4" />, color: "#1FB8FF", bg: "rgba(31,184,255,0.12)" },
  ];

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={{
        background: "linear-gradient(135deg, #0B0F1A 0%, #121826 55%, #151B35 100%)",
        border: "1px solid rgba(0,207,255,0.22)",
        boxShadow: "0 0 60px rgba(0,207,255,0.10), 0 0 120px rgba(138,92,255,0.08), 0 24px 80px rgba(0,0,0,0.45)"
      }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3" style={{
          borderBottom: "1px solid rgba(0,207,255,0.16)",
          background: "linear-gradient(90deg, rgba(0,207,255,0.10) 0%, rgba(138,92,255,0.08) 50%, transparent 100%)"
        }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,207,255,0.14)", border: "1px solid rgba(0,207,255,0.34)", boxShadow: "0 0 18px rgba(0,207,255,0.25)" }}>
            <Globe className="w-4 h-4 text-[#00CFFF]" />
          </div>
          <div>
            <div className="text-[11px] font-black text-[#00CFFF] uppercase tracking-[0.25em]">{institutionName || "Organization"} Map</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">Extracted territory visualization · {countries.length} nation{countries.length === 1 ? "" : "s"}</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,208,0,0.10)", border: "1px solid rgba(255,208,0,0.26)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#FFD000] animate-pulse" />
            <span className="text-[10px] font-bold text-[#FFD000]">LIVE</span>
          </div>
        </div>

        {compact ? null : (
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
        )}

        {/* Map + Side panel */}
        <div className="flex flex-col lg:flex-row">

          {/* Map */}
          <div className="relative flex-1" style={{ minHeight: compact ? 280 : 400, background: "radial-gradient(circle at 50% 45%, #101A33 0%, #080C14 72%)" }}>

            {/* Glow effect behind map */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(0,207,255,0.10) 0%, rgba(138,92,255,0.06) 45%, transparent 72%)"
            }} />

            {/* Tooltip */}
            {tooltip.visible && (
              <div
                className="absolute z-20 pointer-events-none px-3 py-2 rounded-xl text-xs font-bold text-white"
                style={{
                  background: "rgba(11,15,26,0.78)",
                  border: "1px solid rgba(0,207,255,0.55)",
                  backdropFilter: "blur(12px)",
                  left: tooltip.x,
                  top: tooltip.y - 44,
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00CFFF]" />
                  {tooltip.name}
                </div>
                <div className="text-[9px] text-[#00CFFF]/80 mt-0.5 text-center">click to explore</div>
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
                            stroke: isHighlighted ? "rgba(255,255,255,0.72)" : "#1F2937",
                            strokeWidth: isHighlighted ? 1.05 : 0.35,
                            outline: "none",
                            cursor: isHighlighted ? "pointer" : "default",
                            filter: isSelected ? "brightness(1.2) drop-shadow(0 0 10px rgba(255,208,0,0.85))" : isHighlighted ? "drop-shadow(0 0 4px rgba(0,207,255,0.18))" : "none",
                          },
                          hover: {
                            fill: isHighlighted ? "#FFD000" : "#111827",
                            stroke: isHighlighted ? "rgba(0,207,255,0.9)" : "#1F2937",
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
              {/* HQ marker from registration country */}
              <Marker coordinates={hqCoordinates}>
                <circle r={20} fill="rgba(255,208,0,0.10)" />
                <circle r={10} fill="rgba(0,207,255,0.18)" />
                <circle r={5} fill="#FFD000" stroke="#00CFFF" strokeWidth={1.5} />
                <g transform="translate(-7,-27)">
                  <rect width="14" height="14" rx="4" fill="#0B0F1A" stroke="#FFD000" strokeWidth="1" />
                  <Building2 x="3" y="3" width="8" height="8" color="#FFD000" />
                </g>
              </Marker>
            </ComposableMap>
          </div>

          {compact ? null : (
            <div className="lg:w-52 shrink-0 flex flex-col" style={{
              background: "linear-gradient(180deg, #0B0F1A 0%, #080C14 100%)",
              borderTop: "1px solid rgba(0,207,255,0.10)",
              borderLeft: "1px solid rgba(0,207,255,0.10)"
            }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-3.5 h-3.5 text-[#FFD000]" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FFD000]">Territory Hub</span>
                </div>
                <div className="text-xs font-bold text-white leading-tight">{institutionName || "Institution"}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">HQ: {hqResolvedCountry || "Registered location"}</div>
                <div className="text-[10px] text-[#00CFFF] mt-1 font-bold">{usersInMap || 0} registered user{usersInMap === 1 ? "" : "s"} in this map</div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 px-2 mb-2">Nations</div>
                <div className="space-y-0.5">
                  {countries.map((country, i) => (
                    <button
                      key={country}
                      onClick={() => setSelectedCountry(selectedCountry === country ? null : country)}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-all group"
                      style={{
                        background: selectedCountry === country ? "rgba(0,207,255,0.12)" : "transparent",
                        border: selectedCountry === country ? "1px solid rgba(0,207,255,0.34)" : "1px solid transparent",
                      }}
                      onMouseOver={e => { if (selectedCountry !== country) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseOut={e => { if (selectedCountry !== country) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: ECD_COLORS[i % ECD_COLORS.length], boxShadow: `0 0 6px ${ECD_COLORS[i % ECD_COLORS.length]}80` }}
                      />
                      <span className="text-[11px] font-medium flex-1 truncate" style={{ color: selectedCountry === country ? "#00CFFF" : "rgba(200,208,224,0.72)" }}>
                        {country === "Democratic Republic of Congo" ? "DR Congo" : country}
                      </span>
                      {selectedCountry === country && <ChevronRight className="w-3 h-3 text-[#00CFFF] shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="text-[9px] text-gray-600 text-center">Click a country to explore</div>
              </div>
            </div>
          )}
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