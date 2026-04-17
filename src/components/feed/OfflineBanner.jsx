import React from "react";
import { WifiOff, RefreshCw, Loader2 } from "lucide-react";

export default function OfflineBanner({ isOnline, lastCached, syncing, onSync }) {
  if (isOnline && !syncing) return null;

  return (
    <div className="mx-4 mb-4 rounded-2xl px-4 py-3 flex items-center gap-3 font-['Inter'] shrink-0" style={{
      background: isOnline ? "rgba(34, 197, 94, 0.08)" : "rgba(255, 159, 26, 0.1)",
      border: `1px solid ${isOnline ? "rgba(34,197,94,0.3)" : "#FFE4A0"}`,
    }}>
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 shrink-0" style={{ color: "#CC7A00" }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold" style={{ color: "#CC7A00" }}>You're offline</div>
            <div className="text-xs" style={{ color: "#8B6914" }}>
              {lastCached ? `Showing cached feed from ${new Date(lastCached).toLocaleString()}` : "No cached content available yet."}
            </div>
          </div>
        </>
      ) : syncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "#16A34A" }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold" style={{ color: "#16A34A" }}>Syncing offline content...</div>
          </div>
        </>
      ) : null}
    </div>
  );
}