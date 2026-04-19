import React, { useMemo, useState } from "react";
import { buildCohortRetention } from "./userAnalytics";
import { Info, TrendingUp } from "lucide-react";

function cellColor(pct) {
  if (pct >= 70) return "#16a34a";
  if (pct >= 50) return "#22c55e";
  if (pct >= 30) return "#fbbf24";
  if (pct >= 10) return "#fb923c";
  if (pct > 0) return "#ef4444";
  return null;
}

export default function CohortRetentionGrid({ users, t }) {
  const [monthsBack, setMonthsBack] = useState(6);
  const cohorts = useMemo(() => buildCohortRetention(users, monthsBack), [users, monthsBack]);

  const maxPeriods = monthsBack;

  return (
    <div className="space-y-4">
      <div className="border rounded-2xl p-5" style={{ background: t.surface, borderColor: t.border }}>
        <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: t.accentSoft, color: t.accent }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: t.textPrimary }}>Cohort Retention</h3>
              <p className="text-xs" style={{ color: t.textSecondary }}>
                % of users from each signup month still active in later months
              </p>
            </div>
          </div>
          <select
            value={monthsBack}
            onChange={e => setMonthsBack(Number(e.target.value))}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg mb-4" style={{ background: t.accentSoft, border: `1px solid ${t.borderStrong}` }}>
          <Info size={14} style={{ color: t.accent }} className="shrink-0 mt-0.5" />
          <p className="text-[11px]" style={{ color: t.textSecondary }}>
            <strong>Note:</strong> "Active" means the user's profile record was updated during that month (based on <code>updated_date</code>).
            Without true session tracking, this is a proxy — actual app engagement may differ.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left font-bold" style={{ color: t.textMuted }}>Cohort</th>
                <th className="p-2 text-center font-bold" style={{ color: t.textMuted }}>Size</th>
                {Array.from({ length: maxPeriods }).map((_, i) => (
                  <th key={i} className="p-2 text-center font-bold" style={{ color: t.textMuted }}>M{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map(c => (
                <tr key={c.key} className="border-t" style={{ borderColor: t.border }}>
                  <td className="p-2 font-bold" style={{ color: t.textPrimary }}>{c.label}</td>
                  <td className="p-2 text-center" style={{ color: t.textSecondary }}>{c.size}</td>
                  {Array.from({ length: maxPeriods }).map((_, i) => {
                    const p = c.periods[i];
                    if (!p) return <td key={i} className="p-2" />;
                    const color = cellColor(p.pct);
                    return (
                      <td key={i} className="p-1 text-center">
                        <div
                          className="rounded-md py-1.5 font-bold text-[11px]"
                          style={{
                            background: color ? `${color}25` : t.surfaceMuted,
                            color: color || t.textMuted,
                            border: color ? `1px solid ${color}50` : `1px solid ${t.border}`,
                          }}
                          title={`${p.active} of ${c.size} active (${p.pct}%)`}
                        >
                          {p.pct}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {cohorts.length === 0 && (
                <tr><td colSpan={maxPeriods + 2} className="p-6 text-center" style={{ color: t.textMuted }}>No cohort data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-4 flex-wrap text-[10px] font-bold uppercase tracking-wider">
          <span style={{ color: t.textMuted }}>Legend:</span>
          {[
            { label: "70%+", color: "#16a34a" },
            { label: "50-69%", color: "#22c55e" },
            { label: "30-49%", color: "#fbbf24" },
            { label: "10-29%", color: "#fb923c" },
            { label: "<10%", color: "#ef4444" },
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