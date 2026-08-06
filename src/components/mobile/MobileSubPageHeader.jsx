import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Menu, X } from "lucide-react";
import { createPageUrl } from "@/utils";

// A minimal mobile-only top bar with a Back button for app-shell sub-pages.
// Hidden on desktop. Respects iOS safe-area inset.
// When `showMenu` is true, a menu button appears on the right corner.
export default function MobileSubPageHeader({ title, showMenu = false }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { label: "About", page: "About" },
    { label: "Impact", page: "Impact" },
    { label: "Assistant", page: "Assistant" },
    { label: "Keep It 100", page: "KeepIt100" },
    { label: "Codes of Truth", page: "CodesOfTruth" },
    { label: "Resources", page: "Resources" },
    { label: "All Things New", page: "ContentHub" },
    { label: "Challenges", page: "Challenges" },
    { label: "GlowGroups", page: "GlowGroups" },
    { label: "Feed", page: "Feed" },
    { label: "Notifications", page: "Notifications" },
    { label: "Dashboard", page: "Dashboard" },
    { label: "Profile", page: "Profile" },
    { label: "Settings", page: "Settings" },
  ];

  return (
    <>
      <header
        className="md:hidden sticky top-0 z-[800] safe-pt"
        style={{
          background: "rgba(11,15,26,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-2 px-3 h-12">
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/Feed"))}
            className="flex items-center justify-center rounded-full"
            style={{ minWidth: 44, minHeight: 44, color: "#E0E8F0", background: "transparent", border: "none" }}
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          {title && (
            <span className="font-bold text-sm truncate flex-1" style={{ color: "#fff", fontFamily: "Inter, sans-serif" }}>
              {title}
            </span>
          )}
          {showMenu && (
            <button
              onClick={() => setMenuOpen(true)}
              className="flex items-center justify-center rounded-full ml-auto"
              style={{ minWidth: 44, minHeight: 44, color: "#E0E8F0", background: "transparent", border: "none" }}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[2000] safe-pt" style={{ background: "rgba(11,15,26,0.98)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center justify-between px-3 h-12">
            <span className="font-bold text-sm" style={{ color: "#fff", fontFamily: "Inter, sans-serif" }}>Menu</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center rounded-full"
              style={{ minWidth: 44, minHeight: 44, color: "#E0E8F0", background: "transparent", border: "none" }}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex flex-col px-2 pt-2">
            {menuItems.map(item => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3.5 text-sm font-medium border-b border-white/5 transition hover:bg-white/5"
                style={{ color: "#E0E8F0", fontFamily: "Inter, sans-serif" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}