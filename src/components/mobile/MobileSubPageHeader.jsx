import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

// A minimal mobile-only top bar with a Back button for app-shell sub-pages.
// Hidden on desktop. Respects iOS safe-area inset.
export default function MobileSubPageHeader({ title }) {
  const navigate = useNavigate();

  return (
    <header
      className="md:hidden sticky top-0 z-[800] safe-pt"
      style={{
        background: "rgba(11,15,26,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-2 px-3 h-12">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/Feed"))}
          className="flex items-center justify-center rounded-full"
          style={{
            minWidth: 44,
            minHeight: 44,
            color: "#E0E8F0",
            background: "transparent",
            border: "none",
          }}
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        {title && (
          <span
            className="font-bold text-sm truncate"
            style={{ color: "#fff", fontFamily: "Inter, sans-serif" }}
          >
            {title}
          </span>
        )}
      </div>
    </header>
  );
}