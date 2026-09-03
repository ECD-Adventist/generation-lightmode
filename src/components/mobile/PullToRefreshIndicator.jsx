import React from "react";
import { Zap } from "lucide-react";

/**
 * Pull-to-refresh indicator — LightMode brand.
 * A gold lightning bolt fills as you pull; it spins once you release.
 * Pass `pullDistance`, `isRefreshing`, `threshold` from usePullToRefresh.
 */
export default function PullToRefreshIndicator({ pullDistance, isRefreshing, threshold = 70 }) {
  const visible = pullDistance > 0 || isRefreshing;
  if (!visible) return null;
  const progress = Math.min(1, pullDistance / threshold);
  const ready = progress >= 1;
  const height = isRefreshing ? 56 : pullDistance;

  return (
    <div
      className="flex items-end justify-center w-full overflow-hidden pointer-events-none"
      style={{ height, transition: isRefreshing ? "height 160ms ease-out" : "none" }}
      aria-live="polite"
      aria-label={isRefreshing ? "Refreshing" : ready ? "Release to refresh" : "Pull to refresh"}
    >
      <style>{`
        @keyframes ptr-spin { to { transform: rotate(360deg) } }
        @keyframes ptr-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.12) } }
      `}</style>
      <div
        className="mb-2 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2EAF5",
          boxShadow: "0 8px 22px rgba(11,27,61,0.14)",
          transform: isRefreshing ? "none" : `scale(${0.6 + progress * 0.4}) rotate(${progress * 180}deg)`,
          opacity: isRefreshing ? 1 : 0.35 + progress * 0.65,
          animation: isRefreshing ? "ptr-pulse 900ms ease-in-out infinite" : "none",
        }}
      >
        <Zap
          className="w-4 h-4"
          style={{
            color: "#E0A800",
            fill: ready || isRefreshing ? "#FFD000" : "transparent",
            animation: isRefreshing ? "ptr-spin 900ms linear infinite" : "none",
          }}
        />
      </div>
    </div>
  );
}
