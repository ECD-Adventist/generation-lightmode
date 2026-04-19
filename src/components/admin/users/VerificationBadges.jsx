import React from "react";
import { computeVerificationBadges } from "./userEngagement";

export default function VerificationBadges({ user, max = 3 }) {
  const badges = computeVerificationBadges(user);
  if (!badges.length) return null;
  const shown = badges.slice(0, max);
  const extra = badges.length - shown.length;

  return (
    <div className="flex items-center gap-1">
      {shown.map(b => (
        <span
          key={b.key}
          title={b.label}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] shrink-0"
          style={{ background: `${b.color}22`, border: `1px solid ${b.color}55` }}
        >
          {b.icon}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[9px] font-bold" title={`${extra} more`} style={{ color: "#8A97B5" }}>+{extra}</span>
      )}
    </div>
  );
}