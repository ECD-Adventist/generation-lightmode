import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, User, Search, MessageCircle, Plus } from "lucide-react";
import useMobileTabNavigation from "@/hooks/useMobileTabNavigation";

/**
 * Primary mobile tab bar — LightMode brand.
 *
 * Pattern: "floating tab bar with a protruded key action at the centre"
 * (Mobbin, Tab Bar UI — variants 3 & 4). Five destinations, icon + label,
 * gold indicator on the selected tab, light glass surface, respects the iOS home indicator.
 */

const tabs = [
  { key: "Feed", label: "Feed", icon: Zap, match: ["Feed", "GlowFeed", "Post"] },
  { key: "Discover", label: "Search", icon: Search, match: ["Discover"] },
  { key: "Post", label: "Drop", icon: Plus, match: [], isPostButton: true },
  { key: "Messages", label: "Messages", icon: MessageCircle, match: ["Messages"] },
  { key: "Profile", label: "Profile", icon: User, match: ["Profile"] },
];

const GOLD = "#FFD000";
const INK = "#0B1B3D";
const CANVAS = "#F6F8FC";
const MUTED = "#8A97B5";
const ACTIVE = "#0B3FD9";

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

  if (typeof document === "undefined") return null;

  return createPortal(
    <nav
      className="md:hidden z-[900]"
      style={{
        position: "fixed",
        bottom: 0,
        insetInline: 0,
        width: "100%",
        maxWidth: "100vw",
        padding: "0 12px calc(env(safe-area-inset-bottom, 0px) + 10px)",
        pointerEvents: "none",
      }}
      aria-label="Primary mobile navigation"
      data-mobile-bottom-nav="primary"
    >
      <style>{`
        @keyframes mbn-dot { from { transform: scaleX(0); opacity: 0 } to { transform: scaleX(1); opacity: 1 } }
      `}</style>
      <div
        className="relative mx-auto flex items-stretch justify-around"
        style={{
          maxWidth: 520,
          height: 64,
          borderRadius: 999,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: "1px solid #E2EAF5",
          boxShadow: "0 16px 40px rgba(11,27,61,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
          pointerEvents: "auto",
        }}
      >
        {tabs.map(({ key, label, icon: Icon, match, isPostButton }) => {
          if (isPostButton) {
            return (
              <Link
                key={key}
                to={`${createPageUrl("Feed")}?compose=1`}
                onClick={(e) => {
                  sessionStorage.setItem("tab_switch", "true");
                  if (currentPageName === "Feed" && location.pathname === createPageUrl("Feed")) {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent("openDropComposer"));
                  }
                }}
                className="flex-1 flex flex-col items-center justify-end gap-1 pb-1.5"
                style={{ textDecoration: "none" }}
                aria-label="Create a drop"
              >
                <span
                  className="flex items-center justify-center rounded-full active:scale-95 transition"
                  style={{
                    width: 54,
                    height: 54,
                    marginTop: -24,
                    background: "linear-gradient(135deg, #FFD000 0%, #FF9F1A 100%)",
                    boxShadow: `0 10px 26px rgba(255,159,26,0.45), 0 0 0 5px ${CANVAS}`,
                  }}
                >
                  <Plus className="w-6 h-6" strokeWidth={2.75} style={{ color: INK }} />
                </span>
                <span className="text-[10px] font-bold tracking-wide" style={{ fontFamily: "Inter, sans-serif", color: INK }}>
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
              className="relative flex-1 flex flex-col items-center justify-center gap-1"
              style={{ minHeight: 56, color: active ? ACTIVE : MUTED, textDecoration: "none" }}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span
                  className="absolute top-1.5 h-[3px] w-5 rounded-full"
                  style={{ background: GOLD, animation: "mbn-dot 220ms cubic-bezier(0.22,1,0.36,1)" }}
                />
              )}
              <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.5 : 2} style={{ color: "inherit", fill: active && key === "Feed" ? ACTIVE : "none" }} />
              <span className="text-[10px] font-bold tracking-wide" style={{ fontFamily: "Inter, sans-serif" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>,
    document.body
  );
}
