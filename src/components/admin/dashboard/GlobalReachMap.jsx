import React, { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { Globe2, MapPin, Plus, Minus, RotateCcw } from "lucide-react";
import { AnimatedNumber } from "./useCountUp";
import { countryCoordinates } from "@/lib/countryCoordinates";

// Lightweight world topojson (countries only). react-simple-maps accepts a URL.
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function PanelShell({ title, subtitle, icon: Icon, iconColor, t, isDark, children, delay = 0, badge = null }) {
  return (
    <div className="rounded-[1.5rem] border overflow-hidden relative" style={{
      background: isDark ? t.surface : "#FFFFFF",
      borderColor: isDark ? t.border : "rgba(0,0,0,0.04)",
      boxShadow: isDark ? "0 8px 28px rgba(0,0,0,0.3)" : "0 8px 28px rgba(15,23,42,0.06)",
      animation: `grm-panel-fade 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
    }}>
      <style>{`@keyframes grm-panel-fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${iconColor}, transparent)` }} />
      <div className="p-5 pb-3 relative">
        <div className="absolute top-0 right-0 w-[120px] h-[120px] rounded-full blur-[60px] opacity-30 pointer-events-none" style={{ background: iconColor }} />
        <div className="relative flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}12`, border: `1px solid ${iconColor}20` }}>
              <Icon size={14} style={{ color: iconColor }} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold font-['Space_Grotesk'] tracking-tight" style={{ color: t.textPrimary }}>{title}</h3>
              <p className="text-[10px]" style={{ color: t.textMuted }}>{subtitle}</p>
            </div>
          </div>
          {badge && (
            <div className="px-2.5 py-1 rounded-lg text-[10px] font-black" style={{ background: `${iconColor}10`, color: iconColor, border: `1px solid ${iconColor}20` }}>
              {badge}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function GlobalReachMap({ users, t, isDark }) {
  const accentColor = isDark ? "#00CFFF" : "#0B3FD9";
  const landFill = isDark ? "#1A2540" : "#E6ECF7";
  const landStroke = isDark ? "#2B3A5F" : "#CBD5EF";
  const waterColor = isDark ? "#0A1020" : "#F4F7FE";

  const countryPoints = useMemo(() => {
    const counts = {};
    users.forEach(u => { if (u.country) counts[u.country] = (counts[u.country] || 0) + 1; });
    return Object.entries(counts)
      .map(([country, count]) => {
        const coords = countryCoordinates[country];
        if (!coords) return null;
        // countryCoordinates stores [lat, lng] → Marker expects [lng, lat]
        return { country, count, coordinates: [coords[1], coords[0]] };
      })
      .filter(Boolean)
      .sort((a, b) => a.count - b.count); // smaller first so bigger sit on top
  }, [users]);

  const maxCount = Math.max(...countryPoints.map(p => p.count), 1);
  const totalCountries = countryPoints.length;
  const totalWarriors = countryPoints.reduce((s, p) => s + p.count, 0);

  // Interactive state
  const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1 });
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  const handleZoomIn = () => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }));
  const handleZoomOut = () => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }));
  const handleReset = () => { setPosition({ coordinates: [0, 20], zoom: 1 }); setSelected(null); };
  const handleMoveEnd = (pos) => setPosition(pos);
  const handleMarkerClick = (point) => {
    setSelected(point);
    setPosition({ coordinates: point.coordinates, zoom: 4 });
  };

  return (
    <PanelShell title="Global Reach" subtitle="Live warrior distribution" icon={Globe2} iconColor={accentColor} t={t} isDark={isDark} delay={0}
      badge={<><AnimatedNumber value={totalCountries} duration={1400} /> countries</>}>
      <div className="px-5 pb-5">
        <div className="relative rounded-2xl overflow-hidden" style={{
          background: waterColor,
          border: `1px solid ${isDark ? "rgba(0,207,255,0.12)" : "rgba(11,63,217,0.08)"}`,
          aspectRatio: "800 / 420",
        }}>
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: isDark
              ? "radial-gradient(ellipse at center, rgba(0,207,255,0.08) 0%, transparent 70%)"
              : "radial-gradient(ellipse at center, rgba(11,63,217,0.05) 0%, transparent 70%)",
          }} />

          <ComposableMap
            projection="geoEqualEarth"
            projectionConfig={{ scale: 150, center: [0, 10] }}
            width={800}
            height={420}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%", display: "block" }}
          >
            <ZoomableGroup
              center={position.coordinates}
              zoom={position.zoom}
              onMoveEnd={handleMoveEnd}
              minZoom={1}
              maxZoom={8}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const name = geo.properties.name;
                    const isActive = countryPoints.some(p => p.country === name);
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => setHovered(name)}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          default: {
                            fill: isActive ? (isDark ? "#1E3560" : "#CFDBF5") : landFill,
                            stroke: landStroke,
                            strokeWidth: 0.4,
                            outline: "none",
                            transition: "fill 0.2s",
                          },
                          hover: { fill: isDark ? "#2A3F6B" : "#BBCBEF", outline: "none", cursor: "pointer" },
                          pressed: { fill: landFill, outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {countryPoints.map((p, i) => {
                const intensity = p.count / maxCount;
                const coreR = (2.5 + intensity * 4.5) / Math.sqrt(position.zoom);
                const pulseR = coreR + 4 / Math.sqrt(position.zoom);
                const isSelected = selected?.country === p.country;
                return (
                  <Marker
                    key={p.country}
                    coordinates={p.coordinates}
                    onClick={() => handleMarkerClick(p)}
                    onMouseEnter={() => setHovered(p.country)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ default: { cursor: "pointer" } }}
                  >
                    <circle r={pulseR} fill={accentColor} opacity={0.25} style={{
                      animation: `grm-pulse 2.2s ease-in-out ${i * 150}ms infinite`,
                      transformOrigin: "center",
                      transformBox: "fill-box",
                      pointerEvents: "none",
                    }} />
                    <circle
                      r={isSelected ? coreR * 1.4 : coreR}
                      fill={accentColor}
                      stroke={isSelected ? "#FFD000" : (isDark ? "#0A1020" : "#FFFFFF")}
                      strokeWidth={isSelected ? 1.5 : 1}
                      style={{
                        filter: `drop-shadow(0 0 ${coreR}px ${accentColor})`,
                        animation: `grm-appear 0.6s cubic-bezier(0.22,1,0.36,1) ${150 + i * 60}ms both`,
                        transformOrigin: "center",
                        transformBox: "fill-box",
                        transition: "r 0.2s, stroke 0.2s",
                      }} />
                    <title>{p.country}: {p.count} warrior{p.count === 1 ? "" : "s"} — click to focus</title>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>

          {/* Zoom controls */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            <button onClick={handleZoomIn} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:scale-105 backdrop-blur-md" style={{
              background: isDark ? "rgba(11,15,26,0.8)" : "rgba(255,255,255,0.95)",
              border: `1px solid ${isDark ? "rgba(0,207,255,0.25)" : "rgba(11,63,217,0.15)"}`,
              color: accentColor,
            }} title="Zoom in">
              <Plus size={14} strokeWidth={2.5} />
            </button>
            <button onClick={handleZoomOut} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:scale-105 backdrop-blur-md" style={{
              background: isDark ? "rgba(11,15,26,0.8)" : "rgba(255,255,255,0.95)",
              border: `1px solid ${isDark ? "rgba(0,207,255,0.25)" : "rgba(11,63,217,0.15)"}`,
              color: accentColor,
            }} title="Zoom out">
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <button onClick={handleReset} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:scale-105 backdrop-blur-md" style={{
              background: isDark ? "rgba(11,15,26,0.8)" : "rgba(255,255,255,0.95)",
              border: `1px solid ${isDark ? "rgba(0,207,255,0.25)" : "rgba(11,63,217,0.15)"}`,
              color: accentColor,
            }} title="Reset view">
              <RotateCcw size={13} strokeWidth={2.5} />
            </button>
          </div>

          {/* Hover / selected tooltip */}
          {(hovered || selected) && (
            <div className="absolute top-3 left-3 px-3 py-2 rounded-xl backdrop-blur-md pointer-events-none" style={{
              background: isDark ? "rgba(11,15,26,0.85)" : "rgba(255,255,255,0.95)",
              border: `1px solid ${accentColor}40`,
              boxShadow: `0 4px 16px ${accentColor}20`,
            }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: t.textMuted }}>
                {selected && !hovered ? "Focused" : "Hover"}
              </p>
              <p className="text-[13px] font-black" style={{ color: t.textPrimary }}>
                {hovered || selected?.country}
              </p>
              {(() => {
                const active = countryPoints.find(p => p.country === (hovered || selected?.country));
                return active ? (
                  <p className="text-[10px] font-bold mt-0.5" style={{ color: accentColor }}>
                    {active.count} warrior{active.count === 1 ? "" : "s"}
                  </p>
                ) : (
                  <p className="text-[9px] mt-0.5" style={{ color: t.textMuted }}>No warriors yet</p>
                );
              })()}
            </div>
          )}

          <style>{`
            @keyframes grm-pulse { 0%,100% { transform: scale(0.8); opacity: 0.4; } 50% { transform: scale(1.8); opacity: 0; } }
            @keyframes grm-appear { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          `}</style>

          {/* Stats overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md" style={{
            background: isDark ? "rgba(11,15,26,0.7)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${isDark ? "rgba(0,207,255,0.15)" : "rgba(11,63,217,0.08)"}`,
          }}>
            <MapPin size={11} style={{ color: accentColor }} />
            <span className="text-[10px] font-bold" style={{ color: t.textPrimary }}>
              <AnimatedNumber value={totalWarriors} duration={1400} /> warriors live
            </span>
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md" style={{
            background: isDark ? "rgba(11,15,26,0.7)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${isDark ? "rgba(0,207,255,0.15)" : "rgba(11,63,217,0.08)"}`,
          }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
            <span className="text-[9px] font-bold" style={{ color: t.textMuted }}>Active territory</span>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}