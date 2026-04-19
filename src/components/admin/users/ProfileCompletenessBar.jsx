import React from "react";
import { computeProfileCompleteness, completenessColor } from "./userAnalytics";

export default function ProfileCompletenessBar({ user, t }) {
  const { score, filled, total, missing } = computeProfileCompleteness(user);
  const color = completenessColor(score);
  const segments = 10;
  const litSegments = Math.round((score / 100) * segments);

  const tooltip = missing.length
    ? `${score}% complete — Missing: ${missing.join(", ")}`
    : `${score}% complete — All fields filled`;

  return (
    <div className="flex flex-col gap-1" title={tooltip}>
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className="w-1 h-3 rounded-sm transition"
              style={{
                background: i < litSegments ? color : (t?.border || "rgba(255,255,255,0.08)"),
                opacity: i < litSegments ? 1 : 0.5,
              }}
            />
          ))}
        </div>
        <span className="text-[11px] font-bold" style={{ color }}>{score}%</span>
      </div>
      <span className="text-[9px]" style={{ color: t?.textMuted || "#8A97B5" }}>
        {filled}/{total} fields
      </span>
    </div>
  );
}