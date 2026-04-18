import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AppFooter() {
  return (
    <footer className="w-full mt-12" style={{ color: "#6B7FA0" }}>
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t" style={{ borderColor: "#E6ECF5" }}>
        <div className="flex items-center gap-4 text-xs font-medium">
          <Link to={createPageUrl("About")} className="no-underline hover:underline" style={{ color: "#4A5878" }}>About</Link>
          <Link to={createPageUrl("Privacy")} className="no-underline hover:underline" style={{ color: "#4A5878" }}>Privacy</Link>
          <Link to={createPageUrl("Resources")} className="no-underline hover:underline" style={{ color: "#4A5878" }}>Resources</Link>
          <Link to={createPageUrl("Assistant")} className="no-underline hover:underline" style={{ color: "#4A5878" }}>Assistant</Link>
        </div>

        <div className="text-[11px] font-semibold" style={{ color: "#8A97B5" }}>
          © {new Date().getFullYear()} Generation LightMode · <span style={{ color: "#0B3FD9" }}>Faith. Always On.</span>
        </div>
      </div>
    </footer>
  );
}