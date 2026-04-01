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
      <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: "#0B0F1A" }}>

        {/* Header row */}
        <div className="px-5 py-3 flex items-center gap-2 border-b border-white/5">
          <Globe className="w-4 h-4 text-[#00CFFF]" />
          <span className="text-[11px] font-black text-[#00CFFF] uppercase tracking-[0.2em]">Territory Map</span>
          <span className="text-[10px] text-gray-600 ml-1">· click a region</span>
          <span className="ml-auto text-[11px] font-bold text-gray-300 bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
            {countries.length} countries
          </span>
        </div>

        {/* Map + Stats side by side */}
        <div className="flex flex-col lg:flex-row">

          {/* Map — takes ~70% */}
          <div className="relative flex-1" style={{ minHeight: 340, background: "#0B0F1A" }}>
            {/* Tooltip */}
            {tooltip.visible && (
              <div
                className="absolute z-20 pointer-events-none px-3 py-1.5 rounded-lg text-xs font-bold text-white border border-white/10"
                style={{
                  background: "rgba(11,15,26,0.97)",
                  left: tooltip.x,
                  top: tooltip.y - 38,
                  transform: "translateX(-50%)",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
                }}
              >
                {tooltip.name}
                <span className="ml-2 text-[#e74c3c] text-[9px] font-black uppercase">explore →</span>
              </div>
            )}

            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 160, center: [20, 10] }}
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
                            fill: isSelected ? "#c0392b" : isHighlighted ? "#8B1A1A" : "#161B28",
                            stroke: isSelected ? "#e74c3c" : isHighlighted ? "#a93226" : "#1e2536",
                            strokeWidth: isHighlighted ? 0.7 : 0.3,
                            outline: "none",
                            cursor: isHighlighted ? "pointer" : "default",
                          },
                          hover: {
                            fill: isHighlighted ? "#b52828" : "#1a2030",
                            stroke: isHighlighted ? "#e74c3c" : "#1e2536",
                            strokeWidth: isHighlighted ? 1 : 0.3,
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
                  <circle r={5} fill="#e74c3c" stroke="#fff" strokeWidth={1.5} />
                  <circle r={12} fill="rgba(231,76,60,0.15)" />
                </Marker>
              )}
            </ComposableMap>
          </div>

          {/* Stats panel — right side, vertically centered */}
          <div
            className="lg:w-56 shrink-0 flex flex-col justify-center px-8 py-8 border-t border-white/5 lg:border-t-0 lg:border-l lg:border-white/5"
            style={{ background: "#0B0F1A" }}
          >
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00CFFF] mb-6">
              Territory Stats
            </div>

            {/* Stat rows — label left, big number right */}
            {[
              { label: "Countries", value: countries.length, color: "#00CFFF" },
              { label: "Regions", value: regions.length, color: "#FFD000" },
              { label: "Territories", value: territories.length, color: "#8A5CFF" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">{label}</span>
                <span
                  className="text-2xl font-black"
                  style={{ color, fontFamily: "Space Grotesk, sans-serif" }}
                >
                  {value}
                </span>
              </div>
            ))}

            {/* Clickable country list */}
            {countries.length > 0 && (
              <div className="mt-6 space-y-1">
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2">Jump to</div>
                {countries.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedCountry(c)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition hover:bg-white/5 group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B1A1A] group-hover:bg-[#e74c3c] transition shrink-0" />
                    <span className="text-[11px] text-gray-500 group-hover:text-white transition truncate">{c}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Territory chips */}
        <div className="px-5 py-4 border-t border-white/5 flex flex-wrap gap-2">
          {territories.map((t, i) => (
            <button
              key={i}
              onClick={() => setSelectedCountry(t.country)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition hover:border-[#e74c3c]/50 hover:text-white"
              style={{
                background: "rgba(139,26,26,0.12)",
                borderColor: "rgba(231,76,60,0.2)",
                color: "#c0a0a0",
              }}
            >
              <MapPin className="w-2.5 h-2.5" /> {t.name}
            </button>
          ))}
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