import React, { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, LayoutDashboard, Bell } from "lucide-react";

const tabs = [
  { key: "Feed", label: "Feed", icon: Zap, match: ["Feed", "GlowFeed", "Post"] },
  { key: "Dashboard", label: "Dashboard", icon: LayoutDashboard, match: ["Dashboard"] },
  { key: "Notifications", label: "Alerts", icon: Bell, match: ["Notifications"] },
];

export default function MobileBottomNav({ currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
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
      const cleanPath = currentTab.key === "Profile" || currentTab.key === "Feed"
        ? createPageUrl(currentTab.key)
        : location.pathname + location.search;
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
          const targetPath = key === "Profile" || key === "Feed"
            ? createPageUrl(key)
            : (sessionStorage.getItem(`tab_history_${key}`) || createPageUrl(key));
          return (
            <Link
              key={key}
              to={targetPath}
              onClick={(e) => {
                if (!active && ["Feed", "Dashboard", "Notifications"].includes(key)) {
                  e.preventDefault();
                  navigate(targetPath, { replace: false, state: { preserveMobileTabState: true } });
                  return;
                }
                if (active) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              aria-label={label}
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