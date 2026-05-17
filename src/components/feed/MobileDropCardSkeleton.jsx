import React from "react";

/**
 * Lightweight skeleton card that matches MobileDropCard footprint (4:5 image + action row).
 * Pure CSS shimmer — no JS animation cost, no blur, no shadows.
 */
export default function MobileDropCardSkeleton() {
  return (
    <article
      className="relative rounded-[1.35rem] overflow-hidden mb-4"
      style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}
    >
      <style>{`
        @keyframes mdc-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .mdc-shimmer {
          background: linear-gradient(90deg, #EEF3FA 0%, #F6F9FD 50%, #EEF3FA 100%);
          background-size: 200% 100%;
          animation: mdc-shimmer 1.4s ease-in-out infinite;
        }
      `}</style>
      <div className="mdc-shimmer" style={{ aspectRatio: "4 / 5" }} />
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="mdc-shimmer w-6 h-6 rounded-full" />
        <div className="mdc-shimmer h-3 w-12 rounded" />
        <div className="mdc-shimmer w-6 h-6 rounded-full" />
        <div className="mdc-shimmer h-3 w-6 rounded" />
        <div className="flex-1" />
        <div className="mdc-shimmer w-6 h-6 rounded-full" />
      </div>
    </article>
  );
}