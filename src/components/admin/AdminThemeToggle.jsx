import React from "react";
import { Sun, Moon } from "lucide-react";
import { useAdminTheme } from "./AdminThemeContext";

// Animated pill toggle: slides a knob between moon/sun positions.
export default function AdminThemeToggle() {
  const { theme, toggleTheme } = useAdminTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="relative flex items-center rounded-full transition-all"
      style={{
        width: 64,
        height: 32,
        padding: 3,
        background: isDark
          ? "linear-gradient(90deg, #0B3FD9 0%, #121826 100%)"
          : "linear-gradient(90deg, #FFD000 0%, #1FB8FF 100%)",
        boxShadow: isDark
          ? "inset 0 0 12px rgba(0,0,0,0.5), 0 2px 8px rgba(11,63,217,0.3)"
          : "inset 0 0 12px rgba(255,255,255,0.3), 0 2px 8px rgba(255,159,26,0.3)",
        border: "none",
        cursor: "pointer",
      }}
    >
      {/* Static icons behind the knob */}
      <Moon className="absolute left-2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.8)" }} />
      <Sun className="absolute right-2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.9)" }} />

      {/* Sliding knob */}
      <div
        className="rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          width: 26,
          height: 26,
          background: "#FFFFFF",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          transform: isDark ? "translateX(0)" : "translateX(32px)",
        }}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5" style={{ color: "#0B3FD9" }} />
        ) : (
          <Sun className="w-3.5 h-3.5" style={{ color: "#FF9F1A" }} />
        )}
      </div>
    </button>
  );
}