import React, { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { Globe, MapPin } from "lucide-react";
import TerritoryDrillDownPanel from "./TerritoryDrillDownPanel";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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

export default function TerritoryMapVisual({ territories, institutionName, memberCount, ownerEmail }) {
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
      <div className="rounded-2xl overflow-hidden" style={{ background: "#0B0F1A", border: "1px solid rgba(0,207,255,0.2)", boxShadow: "0 0 40px rgba(0,207,255,0.05)" }}>

        {/* Header row */}
        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(0,207,255,0.1)", background: "rgba(0,207,255,0.03)" }}>
          <Globe className="w-4 h-4 text-[#00CFFF]" />
          <span className="text-[11px] font-black text-[#00CFFF] uppercase tracking-[0.2em]">Territory Map</span>
          <span className="text-[10px] ml-1" style={{ color: "rgba(0,207,255,0.4)" }}>· click a region</span>
          <span className="ml-auto text-[11px] font-bold px-3 py-1 rounded-lg" style={{ color: "#00CFFF", background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.2)" }}>
            {countries.length} countries
          </span>
        </div>

        {/* Map + Stats side by side */}
        <div className="flex flex-col lg:flex-row">

          {/* Map — takes ~70% */}
          <div className="relative flex-1" style={{ minHeight: 480, background: "#080C14" }}>
            {/* Tooltip */}
            {tooltip.visible && (
              <div
                className="absolute z-20 pointer-events-none px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                style={{
                  background: "rgba(0,207,255,0.15)",
                  border: "1px solid rgba(0,207,255,0.4)",
                  backdropFilter: "blur(10px)",
                  left: tooltip.x,
                  top: tooltip.y - 38,
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
                }}
              >
                {tooltip.name}
                <span className="ml-2 text-[#00CFFF] text-[9px] font-black uppercase">explore →</span>
              </div>
            )}

            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 900, center: [33, 0] }}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const isoId = String(geo.id);
                    const isHighlighted = highlightedIsoCodes.has(isoId);
                    const isSelected = selectedCountry && ISO_TO_COUNTRY[isoId] === selectedCountry;

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
                            setTooltip(prev => ({
                              ...prev,
                              x: evt.clientX - svgRect.left,
                              y: evt.clientY - svgRect.top,
                            }));
                          }
                        }}
                        onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, name: "" })}
                        style={{
                          default: {
                            fill: isSelected ? "#006699" : isHighlighted ? "#004D80" : "#0D1220",
                            stroke: isSelected ? "#00CFFF" : isHighlighted ? "#0099CC" : "#141929",
                            strokeWidth: isHighlighted ? 1.2 : 0.3,
                            outline: "none",
                            cursor: isHighlighted ? "pointer" : "default",
                          },
                          hover: {
                            fill: isHighlighted ? "#0077AA" : "#111828",
                            stroke: isHighlighted ? "#00CFFF" : "#141929",
                            strokeWidth: isHighlighted ? 1.5 : 0.3,
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
              {centerMarker && (
                <Marker coordinates={centerMarker}>
                  <circle r={16} fill="rgba(0,207,255,0.1)" />
                  <circle r={7} fill="#00CFFF" stroke="#fff" strokeWidth={2} />
                </Marker>
              )}
              {/* Seychelles marker — too small to see on map */}
              {highlightedIsoCodes.has("690") && (
                <Marker coordinates={[55.5, -4.7]}>
                  <circle r={10} fill="rgba(0,207,255,0.15)" />
                  <circle r={5} fill="#00CFFF" stroke="#fff" strokeWidth={1.5} />
                  <text y={-14} textAnchor="middle" fill="#00CFFF" fontSize={9} fontWeight="bold">Seychelles</text>
                </Marker>
              )}
            </ComposableMap>
          </div>

          {/* Stats panel — right side, vertically centered */}
          <div
            className="lg:w-56 shrink-0 flex flex-col justify-center px-8 py-8"
            style={{ background: "#080C14", borderTop: "1px solid rgba(0,207,255,0.08)", borderLeft: "1px solid rgba(0,207,255,0.08)" }}
          >
            <div className="text-[10px] font-black uppercase tracking-[0.25em] mb-6" style={{ color: "#00CFFF" }}>
              Territory Stats
            </div>

            {/* Stat rows */}
            {[
              { label: "Countries", value: countries.length, color: "#00CFFF" },
              { label: "Regions", value: regions.length, color: "#FFD000" },
              { label: "Territories", value: territories.length, color: "#8A5CFF" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "rgba(200,208,224,0.6)" }}>{label}</span>
                <span className="text-2xl font-black" style={{ color, fontFamily: "Space Grotesk, sans-serif", textShadow: `0 0 12px ${color}60` }}>
                  {value}
                </span>
              </div>
            ))}

            {/* Clickable country list */}
            {countries.length > 0 && (
              <div className="mt-6 space-y-1">
                <div className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: "rgba(0,207,255,0.4)" }}>Jump to</div>
                {countries.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCountry(c)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition group"
                    style={{ hover: { background: "rgba(0,207,255,0.05)" } }}
                    onMouseOver={e => e.currentTarget.style.background = "rgba(0,207,255,0.05)"}
                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#00CFFF", boxShadow: "0 0 6px #00CFFF" }} />
                    <span className="text-[11px] truncate" style={{ color: "rgba(200,208,224,0.6)" }}>{c}</span>
                  </button>
                ))}
              </div>
            )}
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