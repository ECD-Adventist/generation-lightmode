import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, User, Search, MessageCircle, Plus } from "lucide-react";
import useMobileTabNavigation from "@/hooks/useMobileTabNavigation";

const tabs = [
  { key: "Feed", label: "Feed", icon: Zap, match: ["Feed", "GlowFeed", "Post"] },
  { key: "Discover", label: "Search", icon: Search, match: ["Discover"] },
  { key: "Post", label: "Drop", icon: Plus, match: [], isPostButton: true },
  { key: "Messages", label: "Messages", icon: MessageCircle, match: ["Messages"] },
  { key: "Profile", label: "Profile", icon: User, match: ["Profile"] },
];

export default function MobileBottomNav({ currentPageName }) {
  const location = useLocation();
  const scrollPositions = useRef({});
  const { activeTab, switchTab, targetFor } = useMobileTabNavigation(currentPageName);
  const scrollKey = activeTab ? `mobile_tab_scroll_${activeTab}` : `mobile_route_scroll_${location.pathname}`;

  // Save and restore one independent scroll position per primary tab.
  useEffect(() => {
    const onScroll = () => {
      scrollPositions.current[scrollKey] = window.scrollY;
      sessionStorage.setItem(scrollKey, window.scrollY.toString());
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollKey]);

  useEffect(() => {
    const savedScroll = scrollPositions.current[scrollKey] ?? sessionStorage.getItem(scrollKey);
    if (savedScroll !== null) requestAnimationFrame(() => window.scrollTo(0, Number(savedScroll) || 0));
  }, [scrollKey]);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[900] safe-pb"
      style={{
        background: "#0B0F1A",
        borderTop: "1px solid #1F2937",
      }}
      aria-label="Primary mobile navigation"
      data-mobile-bottom-nav="primary"
    >
      <div className="flex items-stretch justify-around px-2">
        {tabs.map(({ key, label, icon: Icon, match, isPostButton }) => {
          if (isPostButton) {
            return (
              <Link
                key={key}
                to={`${createPageUrl("Feed")}?compose=1`}
                onClick={(e) => {
                  sessionStorage.setItem('tab_switch', 'true');
                  if (currentPageName === "Feed" && location.pathname === createPageUrl("Feed")) {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent("openDropComposer"));
                  }
                }}
                className="flex-1 flex flex-col items-center justify-end gap-1.5 py-2"
                style={{ minHeight: 56, textDecoration: "none" }}
                aria-label="Create post"
              >
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 50,
                    height: 50,
                    marginTop: -22,
                    background: "linear-gradient(135deg, #FFD000 0%, #00CFFF 100%)",
                    boxShadow: "0 6px 22px rgba(255,208,0,0.45), 0 0 18px rgba(0,207,255,0.35), 0 0 0 4px #0B0F1A",
                  }}
                >
                  <Plus className="w-6 h-6" strokeWidth={2.6} style={{ color: "#0B0F1A" }} />
                </span>
                <span
                  className="text-[10px] font-bold tracking-wide"
                  style={{ fontFamily: "Inter, sans-serif", color: "#00CFFF" }}
                >
                  {label}
                </span>
              </Link>
            );
          }
          const active = activeTab === key || match.includes(currentPageName) || location.pathname === `/${key}`;
          const targetPath = targetFor(key);
          return (
            <Link
              key={key}
              to={targetPath}
              onClick={(e) => {
                e.preventDefault();
                switchTab(key);
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