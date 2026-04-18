import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AppFooter() {
  return (
    <footer
      className="w-full border-t mt-8"
      style={{ background: "#FFFFFF", borderColor: "#E6ECF5", color: "#6B7FA0" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img
            src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png"
            alt="Generation LightMode"
            style={{ height: 28, width: "auto" }}
          />
          <span className="text-xs font-semibold" style={{ color: "#0B1B3D" }}>
            © {new Date().getFullYear()} Generation LightMode
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <Link to={createPageUrl("About")} className="no-underline hover:underline" style={{ color: "#4A5878" }}>About</Link>
          <Link to={createPageUrl("Privacy")} className="no-underline hover:underline" style={{ color: "#4A5878" }}>Privacy</Link>
          <Link to={createPageUrl("Resources")} className="no-underline hover:underline" style={{ color: "#4A5878" }}>Resources</Link>
          <Link to={createPageUrl("Assistant")} className="no-underline hover:underline" style={{ color: "#4A5878" }}>Assistant</Link>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: "#0B3FD9" }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#1FB8FF", boxShadow: "0 0 8px #1FB8FF" }} />
          Faith. Always On.
        </div>
      </div>
    </footer>
  );
}