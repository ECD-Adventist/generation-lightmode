import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

/**
 * Compact mobile sub-page header: back arrow + title + optional action slot.
 * Sticky glass look on the light app-shell theme.
 */
export default function MobilePageHeader({ title, subtitle, action, backTo, showBack = true }) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (backTo) navigate(createPageUrl(backTo));
    else if (window.history.length > 1) navigate(-1);
    else navigate(createPageUrl("Feed"));
  };

  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl border-b safe-pt" style={{ background: "rgba(246, 248, 252, 0.95)", borderColor: "#E2E8F0" }}>
      <div className="px-4 py-3 flex items-center gap-3">
        {showBack && (
          <button onClick={handleBack} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-black truncate" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#0B1B3D" }}>{title}</h1>
          {subtitle && <p className="text-[11px] truncate" style={{ color: "#6B7FA0" }}>{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}