import React from "react";

/**
 * Skeleton card matching MobileDropCard's footprint on the light canvas
 * (author row + 4:5 media + action capsule). Pure CSS shimmer.
 */
export default function MobileDropCardSkeleton() {
  return (
    <article
      className="relative rounded-[22px] overflow-hidden mb-4"
      style={{ background: "#FFFFFF", border: "1px solid #E2EAF5" }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes mdc-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .mdc-shimmer {
          background: linear-gradient(90deg, #EEF3FA 0%, #F7F9FD 50%, #EEF3FA 100%);
          background-size: 200% 100%;
          animation: mdc-shimmer 1.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) { .mdc-shimmer { animation: none; } }
      `}</style>
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <div className="mdc-shimmer w-10 h-10 rounded-full" />
        <div className="flex-1">
          <div className="mdc-shimmer h-3 w-28 rounded-full" />
          <div className="mdc-shimmer h-2.5 w-16 rounded-full mt-2" />
        </div>
      </div>
      <div className="mdc-shimmer" style={{ aspectRatio: "4 / 5" }} />
      <div className="px-3 pt-3 pb-4">
        <div className="mdc-shimmer h-11 rounded-full" />
        <div className="mdc-shimmer h-3 w-3/4 rounded-full mt-4" />
        <div className="mdc-shimmer h-3 w-1/2 rounded-full mt-2" />
      </div>
    </article>
  );
}
