import React from "react";
import { Loader2, ArrowDown } from "lucide-react";

// Lightweight indicator rendered above a scroll container during pull-to-refresh.
// Pass `pullDistance`, `isRefreshing`, `threshold` from usePullToRefresh hook.
export default function PullToRefreshIndicator({ pullDistance, isRefreshing, threshold = 70 }) {
  const visible = pullDistance > 0 || isRefreshing;
  if (!visible) return null;
  const ready = pullDistance >= threshold;
  const height = isRefreshing ? 48 : pullDistance;

  return (
    <div
      className="flex items-center justify-center w-full overflow-hidden pointer-events-none transition-[height] duration-150"
      style={{ height }}
    >
      <div className="flex items-center gap-2 text-xs font-bold" style={{ color: "#0B3FD9" }}>
        {isRefreshing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Refreshing…
          </>
        ) : (
          <>
            <ArrowDown
              className="w-4 h-4 transition-transform"
              style={{ transform: ready ? "rotate(180deg)" : "rotate(0deg)" }}
            />
            {ready ? "Release to refresh" : "Pull to refresh"}
          </>
        )}
      </div>
    </div>
  );
}