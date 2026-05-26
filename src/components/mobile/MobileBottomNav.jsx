import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, Users, User, Search, MessageCircle } from "lucide-react";

const tabs = [
  { key: "Feed", label: "Feed", icon: Zap, match: ["Feed", "GlowFeed", "Post"] },
  { key: "Discover", label: "Search", icon: Search, match: ["Discover"] },
  { key: "GlowGroups", label: "Groups", icon: Users, match: ["GlowGroups", "GroupChat", "GroupSession"] },
  { key: "Messages", label: "Messages", icon: MessageCircle, match: ["Messages"] },
  { key: "Profile", label: "Profile", icon: User, match: ["Profile", "Settings"] },
];

export default function MobileBottomNav({ currentPageName }) {
  const location = useLocation();
  const scrollPositions = useRef({});

  // 1. Save scroll position on scroll
  useEffect(() => {
    const onScroll = () => {
      scrollPositions.current[location.pathname] = window.scrollY;
      sessionStorage.setItem(`scroll_pos_${location.pathname}`, window.scrollY.toString());
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  // 2. Save last path for each tab
  useEffect(() => {
    const currentTab = tabs.find(t => t.match.includes(currentPageName) || location.pathname.startsWith(`/${t.key}`));
    if (currentTab) {
      const cleanPath = location.pathname + location.search;
      sessionStorage.setItem(`tab_history_${currentTab.key}`, cleanPath);
    }
  }, [location, currentPageName]);

  // 3. Restore scroll position on mount/location change
  useEffect(() => {
    const savedScroll = scrollPositions.current[location.pathname] || sessionStorage.getItem(`scroll_pos_${location.pathname}`);
    if (savedScroll !== null) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }, 50);
    }
  }, [location.pathname]);

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
          const targetPath = sessionStorage.getItem(`tab_history_${key}`) || createPageUrl(key);
          return (
            <Link
              key={key}
              to={targetPath}
              onClick={(e) => {
                if (active) {
                  e.preventDefault();
                  const rootPath = createPageUrl(key);
                  if (location.pathname !== rootPath) {
                    window.location.href = rootPath;
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                } else {
                  sessionStorage.setItem('tab_switch', 'true');
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