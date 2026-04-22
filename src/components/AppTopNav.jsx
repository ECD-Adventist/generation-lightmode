import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Users, Bell, Zap, MessageCircle } from "lucide-react";

export default function AppTopNav() {
  const items = [
    { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
    { to: "GlowGroups", icon: <Users className="w-4 h-4" />, label: "Groups" },
    { to: "Notifications", icon: <Bell className="w-4 h-4" />, label: "Alerts" },
    { to: "Dashboard", icon: <Zap className="w-4 h-4" />, label: "Dashboard" },
    { to: "Messages", icon: <MessageCircle className="w-4 h-4" />, label: "Messages" },
  ];

  return (
    <div className="sticky top-0 z-50 backdrop-blur-xl border-b safe-pt" style={{ background: "rgba(246, 248, 252, 0.9)", borderColor: "#E2E8F0" }}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
          <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" style={{ height: 48, width: "auto" }} />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {items.map((item) => (
            <Link
              key={item.to}
              to={createPageUrl(item.to)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-sm font-semibold"
              style={{ color: "#4A5878" }}
              onMouseOver={(e) => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5878"; }}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}