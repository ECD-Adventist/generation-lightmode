import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

/**
 * Mobile-only top header rendered on app-shell pages.
 *
 * Behavior:
 * - On root pages (Feed, Dashboard, Profile, Notifications, GlowGroups, Messages,
 *   Discover, Settings, Saved): shows the brand logo, no back button.
 * - On any other app-shell sub-path: shows a "Back" button that calls navigate(-1).
 *
 * Pages that already render their own immersive mobile header (e.g. MobileFeed,
 * MobileDashboard, MobileProfile) opt-out via the `hidden` array below so this
 * header doesn't double-up.
 */

const ROOT_PAGES = new Set([
  "Feed",
  "Dashboard",
  "Profile",
  "Notifications",
  "GlowGroups",
  "Messages",
  "Discover",
  "Settings",
  "Saved",
]);

// Pages that ship their own full-bleed mobile header — don't show MobileHeader.
const PAGES_WITH_OWN_HEADER = new Set([
  "Feed",
  "Dashboard",
  "Profile",
  "Notifications",
  "GlowGroups",
  "GroupChat",
  "Messages",
  "Discover",
  "Settings",
  "Saved",
  "PrayerWall",
  "DailyDevotion",
  "DailyTruthFeed",
  "Milestones",
  "Leaderboard",
  "LightReflections",
  "FaithQuiz",
  "TerritoryPhotos",
  "GlobalReach",
  "Live",
  "AdminCenter",
  "AdminReports",
  "InstitutionDashboard",
  "InstitutionControlCenter",
  "InstitutionPage",
  "GenerationLightMode",
  "GlowFeed",
  "GroupSession",
]);

export default function MobileHeader({ currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (PAGES_WITH_OWN_HEADER.has(currentPageName)) return null;

  const isRoot = ROOT_PAGES.has(currentPageName) && location.pathname !== "/";
  const showBack = !isRoot;

  return (
    <div
      className="sticky top-0 z-40 backdrop-blur-xl border-b safe-pt"
      style={{ background: "rgba(246, 248, 252, 0.95)", borderColor: "#E2E8F0" }}
    >
      <div className="px-4 py-2.5 flex items-center gap-3">
        {showBack ? (
          <button
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link to={createPageUrl("Home")} className="shrink-0" aria-label="Home">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png"
              alt="Generation LightMode"
              className="h-9 w-auto object-contain"
            />
          </Link>
        )}
        <div className="flex-1" />
      </div>
    </div>
  );
}