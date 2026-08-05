import React from "react";
import { Music, X } from "lucide-react";

export default function AudioPlayer({ audioUrl, audioTitle, onRemove }) {
  if (!audioUrl) return null;

  return (
    <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5" }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(31,184,255,0.12)" }}>
        <Music className="w-4 h-4" style={{ color: "#0B3FD9" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate" style={{ color: "#0B1B3D" }}>{audioTitle || "Attached track"}</p>
        <audio src={audioUrl} controls className="w-full h-8 mt-1" />
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition hover:bg-red-50"
          style={{ color: "#8A97B5" }}
          aria-label="Remove track"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}