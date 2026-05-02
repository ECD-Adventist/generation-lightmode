import React from "react";
import { Heart, MessageCircle } from "lucide-react";

/**
 * Compact 1:1 grid tile for the Profile "Drops" tab.
 * Shows just the media (or verse text fallback) with a hover overlay
 * displaying engagement stats. Click opens the full PostViewerModal.
 */
export default function DropGridTile({ drop, onClick }) {
  const hasMedia = !!drop.media_url;

  return (
    <button
      type="button"
      onClick={onClick}
      className="aspect-square relative group cursor-pointer overflow-hidden flex items-center justify-center text-center rounded-xl transition-all hover:-translate-y-0.5"
      style={{
        background: hasMedia ? "#0B1B3D" : "linear-gradient(135deg, #EEF3FF 0%, #DDE7FB 100%)",
        border: "1px solid #E6ECF5",
        boxShadow: "0 2px 10px rgba(11, 63, 217, 0.06)",
      }}
    >
      {hasMedia ? (
        <img
          src={drop.media_url}
          alt={drop.verse || "Drop"}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="relative z-10 w-full h-full flex items-center justify-center px-3">
          <span
            className="font-bold font-['Space_Grotesk'] text-xs sm:text-sm md:text-base break-words line-clamp-6 leading-tight"
            style={{ color: "#0B3FD9" }}
          >
            {drop.verse || drop.reflection || "Drop"}
          </span>
        </div>
      )}

      {/* Hover overlay with stats */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 flex items-center justify-center gap-4 backdrop-blur-[2px]"
        style={{ background: "rgba(11, 27, 61, 0.55)" }}
      >
        <div className="flex items-center gap-1.5 font-bold text-sm text-white">
          <Heart className="w-4 h-4 fill-white" /> {drop.likes_count || 0}
        </div>
        <div className="flex items-center gap-1.5 font-bold text-sm text-white">
          <MessageCircle className="w-4 h-4 fill-white" /> 0
        </div>
      </div>
    </button>
  );
}