import React from "react";
import { computeActivityStatus, formatTimeAgo } from "./userEngagement";

export default function UserActivityDot({ user, t, showLabel = true }) {
  const act = computeActivityStatus(user);
  const timeAgo = formatTimeAgo(user?.updated_date);

  return (
    <div className="flex items-center gap-2" title={`${act.label} · ${timeAgo}`}>
      <span className="relative flex h-2 w-2 shrink-0">
        {act.status === "online" && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: act.color }} />
        )}
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: act.color }} />
      </span>
      {showLabel && (
        <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: t?.textSecondary || "#6B7FA0" }}>
          {timeAgo}
        </span>
      )}
    </div>
  );
}