import React from "react";
import { Loader2 } from "lucide-react";
import { formatBytes } from "./contentMedia";

// Shared progress readout for content downloads and previews.
// Falls back to a byte counter when the total size isn't known yet.
export function progressPercent({ received = 0, total = 0 } = {}) {
  if (!total) return null;
  return Math.min(99, Math.round((received / total) * 100));
}

export default function ContentTransferProgress({ progress, label = "Loading", color = "#00CFFF" }) {
  const percent = progressPercent(progress);
  const received = progress?.received || 0;
  const total = progress?.total || 0;

  return (
    <div className="flex flex-col items-center gap-2.5 w-[190px]">
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color }} />
        <span className="text-[12px] font-bold text-white">
          {label}{percent !== null ? ` ${percent}%` : ""}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: percent !== null ? `${percent}%` : "35%", background: color }}
        />
      </div>
      <span className="text-[10px]" style={{ color: "#8A9BB0" }}>
        {total ? `${formatBytes(received)} of ${formatBytes(total)}` : formatBytes(received)}
      </span>
    </div>
  );
}