import React, { useMemo } from "react";
import { MapPin, Globe } from "lucide-react";
import { buildCountryDensity } from "./userAnalytics";

// Lightweight heatmap: ranked country list + visual bars.
// Avoids pulling heavy Leaflet setup for a tab that's mostly a quick density view.
// Click a country → parent filters the table to that country.
export default function UsersHeatmap({ users, onCountryClick, t }) {
  const density = useMemo(() => buildCountryDensity(users), [users]);
  const maxCount = density[0]?.count || 1;
  const totalCountries = density.length;
  const totalWithCountry = density.reduce((s, d) => s + d.count, 0);
  const totalWithoutCountry = users.length - totalWithCountry;

  const heatColor = (count) => {
    const pct = count / maxCount;
    if (pct >= 0.75) return "#ef4444";
    if (pct >= 0.5) return "#fb923c";
    if (pct >= 0.25) return "#fbbf24";
    if (pct >= 0.1) return "#22c55e";
    return "#5AC8FF";
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-2xl p-5" style={{ background: t.surface, borderColor: t.border }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: t.accentSoft, color: t.accent }}>
            <Globe size={18} />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: t.textPrimary }}>Geographic Distribution</h3>
            <p className="text-xs" style={{ color: t.textSecondary }}>
              {totalWithCountry} users across {totalCountries} countries
              {totalWithoutCountry > 0 && <span style={{ color: t.warning }}> · {totalWithoutCountry} with no country set</span>}
            </p>
          </div>
        </div>

        {density.length === 0 ? (
          <div className="py-8 text-center" style={{ color: t.textMuted }}>
            <MapPin size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No country data available.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-2">
            {density.map((d, i) => {
              const color = heatColor(d.count);
              const widthPct = (d.count / maxCount) * 100;
              return (
                <button
                  key={d.country}
                  onClick={() => onCountryClick?.(d.country)}
                  className="w-full group flex items-center gap-3 p-2.5 rounded-lg transition text-left"
                  style={{ background: t.surfaceMuted, border: `1px solid ${t.border}` }}
                >
                  <span className="w-6 text-xs font-bold" style={{ color: t.textMuted }}>#{i + 1}</span>
                  <span className="flex items-center gap-1.5 text-sm font-bold w-44 shrink-0" style={{ color: t.textPrimary }}>
                    <MapPin size={12} style={{ color }} />
                    {d.country}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: t.border }}>
                    <div
                      className="h-full transition-all"
                      style={{ width: `${widthPct}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }}
                    />
                  </div>
                  <span className="text-xs font-bold w-14 text-right" style={{ color }}>
                    {d.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 flex-wrap text-[10px] font-bold uppercase tracking-wider">
          <span style={{ color: t.textMuted }}>Density:</span>
          {[
            { label: "High", color: "#ef4444" },
            { label: "Med-High", color: "#fb923c" },
            { label: "Medium", color: "#fbbf24" },
            { label: "Low", color: "#22c55e" },
            { label: "Minimal", color: "#5AC8FF" },
          ].map(l => (
            <span key={l.label} className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ background: l.color }} />
              <span style={{ color: t.textSecondary }}>{l.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}