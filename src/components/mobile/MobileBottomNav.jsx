import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Newspaper, User, Search, MessageCircle, Power } from "lucide-react";

const tabs = [
  { key: "Feed", label: "Feed", icon: Newspaper, match: ["Feed", "GlowFeed", "Post"] },
  { key: "Discover", label: "Search", icon: Search, match: ["Discover"] },
  { key: "Post", label: "Drop", icon: Power, match: [], isPostButton: true },
  { key: "Messages", label: "Messages", icon: MessageCircle, match: ["Messages"] },
  { key: "Profile", label: "Profile", icon: User, match: ["Profile"] },
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

  // 2. Restore scroll position on mount/location change
  useEffect(() => {
    const savedScroll = scrollPositions.current[location.pathname] || sessionStorage.getItem(`scroll_pos_${location.pathname}`);
    if (savedScroll !== null) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }, 50);
    }
  }, [location.pathname]);

  const renderTab = ({ key, label, icon: Icon, match }) => {
    const active = match.includes(currentPageName) || location.pathname === `/${key}`;
    const targetPath = createPageUrl(key);
    return (
      <Link
        key={key}
        to={targetPath}
        onClick={(event) => {
          sessionStorage.setItem("tab_switch", "true");
          if (location.pathname === targetPath && !location.search) {
            event.preventDefault();
            window.location.href = targetPath;
          }
        }}
        className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${active ? "text-brand-cyan" : "text-brand-muted"}`}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.6 : 2.1} />
        <span className="text-[10px] font-bold leading-none tracking-wide">{label}</span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed inset-x-3 z-50 md:hidden"
      style={{ bottom: "calc(12px + env(safe-area-inset-bottom))" }}
      aria-label="Primary mobile navigation"
    >
      <div className="flex items-end gap-2">
        <div className="flex h-16 min-w-0 flex-1 rounded-full border border-brand-cyan/25 bg-brand-panel/95 px-1 shadow-floating-nav backdrop-blur-xl">
          {tabs.slice(0, 2).map(renderTab)}
        </div>

        <Link
          to={`${createPageUrl("Feed")}?compose=1`}
          onClick={(event) => {
            sessionStorage.setItem("tab_switch", "true");
            if (currentPageName === "Feed" && location.pathname === createPageUrl("Feed")) {
              event.preventDefault();
              window.dispatchEvent(new CustomEvent("openDropComposer"));
            }
          }}
          className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-full bg-gradient-to-br from-brand-cyan via-brand-blue to-brand-violet text-white shadow-floating-action transition-transform duration-200 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep"
          aria-label="Create post"
        >
          <Power className="h-6 w-6" strokeWidth={2.5} />
          <span className="text-[10px] font-extrabold leading-none tracking-wide">Drop</span>
        </Link>

        <div className="flex h-16 min-w-0 flex-1 rounded-full border border-brand-cyan/25 bg-brand-panel/95 px-1 shadow-floating-nav backdrop-blur-xl">
          {tabs.slice(3).map(renderTab)}
        </div>
      </div>
    </nav>
  );
}