import React from "react";
import { computeEngagementScore, engagementTier } from "./userEngagement";

export default function EngagementMeter({ user, t }) {
  const score = computeEngagementScore(user);
  const tier = engagementTier(score);

  return (
    <div className="flex flex-col gap-1" title={`${tier.label} · ${score}/100`}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold tabular-nums" style={{ color: tier.color }}>{score}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: t?.textMuted }}>{tier.label}</span>
      </div>
      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: t?.surfaceMuted || "rgba(0,0,0,0.08)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, score)}%`, background: tier.color }}
        />
      </div>
    </div>
  );
}