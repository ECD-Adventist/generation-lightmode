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
 * royal-blue pill, white labels, gold selected state, respects the iOS home indicator.
 */

const tabs = [
  { key: "Feed", label: "Feed", icon: Zap, match: ["Feed", "GlowFeed", "Post"] },
  { key: "Discover", label: "Explore", icon: Search, match: ["Discover"] },
  { key: "Post", label: "Drop", icon: Plus, match: [], isPostButton: true },
  { key: "Messages", label: "Messages", icon: MessageCircle, match: ["Messages"] },
  { key: "Profile", label: "Profile", icon: User, match: ["Profile"] },
];

const GOLD = "#FFD000";
const INK = "#0B1B3D";
const MUTED = "rgba(255,255,255,0.72)";
const ACTIVE = "#FFD000";

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
        @keyframes mbn-spin-light { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .mbn-light { animation: none !important; } }
      `}</style>
      <div className="relative mx-auto" style={{ maxWidth: 520, height: 64, pointerEvents: "auto" }}>
        {/* Pill surface — same sky→royal blue as the Explore / Messages / Profile pills, translucent,
            with a circular gap cut around the protruding Drop button. Kept as a separate layer so the
            mask never clips the button itself. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            borderRadius: 999,
            background: "linear-gradient(90deg, rgba(31,184,255,0.80) 0%, rgba(11,63,217,0.84) 100%)",
            backdropFilter: "blur(22px) saturate(1.2)",
            WebkitBackdropFilter: "blur(22px) saturate(1.2)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "0 16px 40px rgba(11,63,217,0.30), inset 0 1px 0 rgba(255,255,255,0.25)",
            WebkitMaskImage: "radial-gradient(circle at 50% 3px, transparent 37px, #000 38px)",
            maskImage: "radial-gradient(circle at 50% 3px, transparent 37px, #000 38px)",
          }}
        />
        <div className="relative flex items-stretch justify-around h-full">
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
                {/* Seat: a rotating light ring (same conic light as the profile covers) around the gold button */}
                <span
                  className="relative flex items-center justify-center rounded-full overflow-hidden active:scale-95 transition"
                  style={{ width: 62, height: 62, marginTop: -28, background: "#0B3FD9", boxShadow: "0 10px 26px rgba(255,159,26,0.40)" }}
                >
                  <span
                    aria-hidden="true"
                    className="mbn-light absolute rounded-full"
                    style={{
                      top: "50%",
                      left: "50%",
                      width: "220%",
                      height: "220%",
                      background: "conic-gradient(from 0deg, transparent 60%, #1FB8FF 78%, #0B3FD9 90%, #FFD000 100%)",
                      animation: "mbn-spin-light 4s linear infinite",
                    }}
                  />
                  <span
                    className="relative flex items-center justify-center rounded-full"
                    style={{ width: 54, height: 54, background: "linear-gradient(135deg, #FFD000 0%, #FF9F1A 100%)", border: "2px solid rgba(255,255,255,0.85)" }}
                  >
                    <Plus className="w-6 h-6" strokeWidth={2.75} style={{ color: INK }} />
                  </span>
                </span>
                <span className="text-[10px] font-bold tracking-wide" style={{ fontFamily: "Inter, sans-serif", color: "#FFFFFF" }}>
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
      </div>
    </nav>,
    document.body
  );
}
