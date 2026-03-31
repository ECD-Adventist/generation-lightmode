import React, { useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Map ISO country names from topojson to our country strings
const COUNTRY_NAME_MAP = {
  "United States of America": "United States",
  "United Republic of Tanzania": "Tanzania",
  "Democratic Republic of the Congo": "Democratic Republic of the Congo",
  "Congo": "Republic of the Congo",
  "Ivory Coast": "Côte d'Ivoire",
  "South Korea": "South Korea",
  "North Korea": "North Korea",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Central African Rep.": "Central African Republic",
  "Dominican Rep.": "Dominican Republic",
  "Eq. Guinea": "Equatorial Guinea",
  "S. Sudan": "South Sudan",
  "W. Sahara": "Western Sahara",
  "Czechia": "Czech Republic",
  "Macedonia": "North Macedonia",
  "Solomon Is.": "Solomon Islands",
};

function getCountryColor(countryName, statsMap, maxScore) {
  const name = COUNTRY_NAME_MAP[countryName] || countryName;
  const stats = statsMap[name];
  if (!stats) return "#1a2235";

  const intensity = stats.score / maxScore;
  if (intensity > 0.7) return "#00CFFF";
  if (intensity > 0.4) return "#0099CC";
  if (intensity > 0.2) return "#005F80";
  if (intensity > 0.05) return "#003A50";
  return "#002030";
}

export default function CountriesWorldMap({ countryStats }) {
  const [tooltip, setTooltip] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const statsMap = {};
  countryStats.forEach(c => { statsMap[c.country] = c; });
  const maxScore = countryStats[0]?.score || 1;

  const handleMouseMove = (e) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative bg-[#080C14] rounded-2xl border border-white/5 overflow-hidden" onMouseMove={handleMouseMove}>
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-sm">🌍 Global Activity Map</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Hover a country to see member stats</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-[#00CFFF]"></span> High</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-[#005F80]"></span> Medium</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-[#002030]"></span> Low</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-[#1a2235]"></span> None</span>
        </div>
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 120, center: [20, 10] }}
        style={{ width: "100%", height: "420px" }}
      >
        <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={6}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = geo.properties.name;
                const mappedName = COUNTRY_NAME_MAP[name] || name;
                const stats = statsMap[mappedName];
                const fillColor = getCountryColor(name, statsMap, maxScore);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="#0B0F1A"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none", transition: "fill 0.2s" },
                      hover: { outline: "none", fill: stats ? "#FFD000" : "#243050", cursor: stats ? "pointer" : "default" },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={() => {
                      if (stats) setTooltip({ name: mappedName, ...stats });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 10 }}
        >
          <div className="bg-[#121826]/95 backdrop-blur-md border border-[#00CFFF]/30 rounded-xl px-4 py-3 shadow-2xl min-w-[180px]">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
              <div className="w-2 h-2 rounded-full bg-[#00CFFF] shrink-0"></div>
              <span className="font-bold text-white text-sm">{tooltip.name}</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-6">
                <span className="text-gray-400">Members</span>
                <span className="text-white font-bold">{tooltip.users}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-gray-400">Total XP</span>
                <span className="text-[#FFD000] font-bold">{tooltip.totalXP.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-gray-400">Glow Drops</span>
                <span className="text-[#8A5CFF] font-bold">{tooltip.drops}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-gray-400">Groups</span>
                <span className="text-[#00CFFF] font-bold">{tooltip.groups}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}