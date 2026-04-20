import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, Users, User } from "lucide-react";

const tabs = [
  { key: "Feed", label: "Feed", icon: Zap, match: ["Feed", "GlowFeed"] },
  { key: "GlowGroups", label: "Groups", icon: Users, match: ["GlowGroups", "GroupChat", "GroupSession"] },
  { key: "Profile", label: "Profile", icon: User, match: ["Profile", "Settings"] },
];

export default function MobileBottomNav({ currentPageName }) {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[900] safe-pb"
      style={{
        background: "rgba(11,15,26,0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
      aria-label="Primary mobile navigation"
    >
      <div className="flex items-stretch justify-around px-2">
        {tabs.map(({ key, label, icon: Icon, match }) => {
          const active = match.includes(currentPageName) || location.pathname === `/${key}`;
          return (
            <Link
              key={key}
              to={active ? "#" : createPageUrl(key)}
              onClick={(e) => {
                if (active) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
              style={{
                minHeight: 56,
                color: active ? "#00CFFF" : "#8A9BB0",
                textDecoration: "none",
              }}
            >
              <Icon className="w-5 h-5" style={{ color: "inherit" }} />
              <span
                className="text-[10px] font-bold tracking-wide"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}