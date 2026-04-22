import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Shared mobile bottom-sheet shell — LightMode branded (light mode).
 * Used by mobile-only form variants. Locks body scroll while open.
 */
export default function MobileBottomSheet({
  isOpen,
  onClose,
  dismissible = true,
  children,
  header, // optional node rendered above children
  maxHeight = "92dvh",
}) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end font-['Inter']"
      style={{ background: "rgba(11, 27, 61, 0.55)", backdropFilter: "blur(12px)" }}
      onClick={() => { if (dismissible) onClose?.(); }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full rounded-t-[28px] flex flex-col overflow-hidden animate-[mbs-slide-up_280ms_cubic-bezier(0.22,1,0.36,1)]"
        style={{
          background: "#FFFFFF",
          color: "#0B1B3D",
          maxHeight,
          boxShadow: "0 -20px 60px rgba(11, 27, 61, 0.25)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <style>{`
          @keyframes mbs-slide-up { from { transform: translateY(100%); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }
        `}</style>

        {/* Drag handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-11 h-1.5 rounded-full" style={{ background: "#D6E4FF" }} />
        </div>

        {/* Close button (top right) */}
        {dismissible && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition z-10"
            style={{ background: "#F6F8FC", color: "#6B7FA0", border: "1px solid #E6ECF5" }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {header}

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}