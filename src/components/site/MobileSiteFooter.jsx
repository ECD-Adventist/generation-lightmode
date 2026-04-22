import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Shared branded mobile footer for all public website pages (Home, About, Impact,
 * Assistant, Resources, KeepIt100, CodesOfTruth). Dark LightMode theme with logo,
 * tagline, link grid, copyright, and "Powered by ECD" badge.
 */
export default function MobileSiteFooter({ t }) {
  const tagline = (t && t("footerText")) || "Where faith meets action.";
  const poweredBy = (t && t("poweredBy")) || "Powered by ECD";

  const links = [
    ["About", "About"], ["Impact", "Impact"],
    ["Challenges", "Challenges"], ["GlowGroups", "GlowGroups"],
    ["Keep It 100", "KeepIt100"], ["Codes of Truth", "CodesOfTruth"],
    ["Assistant", "Assistant"], ["Resources", "Resources"],
  ];

  return (
    <footer className="py-8 px-5 safe-pb" style={{ background: "#080C14", borderTop: "1px solid rgba(0,207,255,0.1)" }}>
      <img
        src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
        alt="Generation LightMode"
        style={{ height: 40, marginBottom: 14, filter: "drop-shadow(0 0 8px rgba(0,207,255,0.4))" }}
      />
      <p className="text-[12px] leading-relaxed mb-4" style={{ color: "#C8D0E0" }}>
        {tagline} <strong style={{ color: "#FFD000" }}>Faith. Always On.</strong>
      </p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {links.map(([label, page]) => (
          <Link key={page} to={createPageUrl(page)} className="text-[12px] font-semibold no-underline" style={{ color: "#C8D0E0" }}>
            {label}
          </Link>
        ))}
      </div>
      <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <span className="text-[10px]" style={{ color: "#C8D0E0" }}>© 2026 LightMode</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00CFFF", boxShadow: "0 0 8px #00CFFF" }} />
          <span className="text-[10px]" style={{ color: "#C8D0E0" }}>{poweredBy}</span>
        </div>
      </div>
    </footer>
  );
}