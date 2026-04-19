import React, { createContext, useContext, useEffect, useState } from "react";
import { AdminThemeStyles } from "./AdminThemeStyles";

// Minimal theme context for the Control Center only.
// Persists choice in localStorage under "admin_theme".
// Values: "dark" | "light"
const AdminThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });

export function AdminThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem("admin_theme") || "dark";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_theme", theme);
      // Expose theme to CSS via data-attribute so admin-theme.css can react
      document.documentElement.setAttribute("data-admin-theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      <AdminThemeStyles />
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}

// ─── Shared token palette (aligned with DashboardHero/Stats DNA) ─────────
// Dark: deep navy mesh (#060B18 → #0B1226 → #0A1F4A) + sky/royal accents (#5AC8FF → #1FB8FF → #0B3FD9) + gold #FFD60A
// Light: pearl mesh (#EBF1FF → #EDE5FF) + royal blue #0B3FD9 primary + amber #92400E alerts
export function getAdminTokens(theme) {
  if (theme === "light") {
    return {
      // Surfaces
      appBg: "#F4F8FF",
      surface: "#FFFFFF",
      surfaceMuted: "#F6F9FE",
      surfaceAlt: "#EEF3FC",

      // Borders
      border: "rgba(11,63,217,0.08)",
      borderStrong: "rgba(11,63,217,0.18)",
      borderSoft: "rgba(15,23,42,0.04)",

      // Text
      textPrimary: "#0B1B3D",
      textSecondary: "#334261",
      textMuted: "#6B7FA0",

      // Accents (Dashboard DNA)
      accent: "#0B3FD9",
      accentSoft: "rgba(11,63,217,0.08)",
      accentSky: "#1FB8FF",
      accentDeep: "#0B3FD9",

      // Gradients
      gradient: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)",
      gradientMesh: "linear-gradient(135deg, #EBF1FF 0%, #E3EAFF 25%, #EDE5FF 50%, #F0ECFF 75%, #EBF1FF 100%)",
      gradientGold: "linear-gradient(90deg, #FFD000 0%, #FF9F1A 100%)",

      // Semantics
      gold: "#FF9F1A",
      goldText: "#92400E",
      goldSoft: "#FEF3C7",
      success: "#16a34a",
      successSoft: "rgba(34,197,94,0.08)",
      warning: "#B45309",
      warningSoft: "rgba(245,158,11,0.1)",
      danger: "#DC2626",
      dangerSoft: "rgba(239,68,68,0.08)",

      // Shadows
      shadow: "0 2px 12px rgba(15,23,42,0.04)",
      shadowLg: "0 4px 16px rgba(11,63,217,0.08)",
      shadowXl: "0 8px 32px rgba(11,63,217,0.12)",
    };
  }
  return {
    // Surfaces (Dashboard-mesh aligned)
    appBg: "#060B18",
    surface: "#0F1421",
    surfaceMuted: "#0B1226",
    surfaceAlt: "#0A1F4A",

    // Borders
    border: "rgba(255,255,255,0.06)",
    borderStrong: "rgba(31,184,255,0.3)",
    borderSoft: "rgba(255,255,255,0.04)",

    // Text
    textPrimary: "#FFFFFF",
    textSecondary: "#C8D0E0",
    textMuted: "#8A97B5",

    // Accents (Dashboard DNA — sky/royal blue trio)
    accent: "#5AC8FF",
    accentSoft: "rgba(31,184,255,0.12)",
    accentSky: "#1FB8FF",
    accentDeep: "#0B3FD9",

    // Gradients
    gradient: "linear-gradient(135deg, #5AC8FF 0%, #1FB8FF 50%, #0B3FD9 100%)",
    gradientMesh: "linear-gradient(135deg, #060B18 0%, #0B1226 25%, #0F1730 50%, #0A1F4A 75%, #060B18 100%)",
    gradientGold: "linear-gradient(90deg, #FFD60A 0%, #FF9F1A 100%)",

    // Semantics
    gold: "#FFD60A",
    goldText: "#FFD60A",
    goldSoft: "rgba(255,214,10,0.15)",
    success: "#4ade80",
    successSoft: "rgba(34,197,94,0.12)",
    warning: "#fbbf24",
    warningSoft: "rgba(255,214,10,0.12)",
    danger: "#f87171",
    dangerSoft: "rgba(239,68,68,0.12)",

    // Shadows
    shadow: "0 2px 16px rgba(0,0,0,0.25)",
    shadowLg: "0 4px 24px rgba(0,0,0,0.4)",
    shadowXl: "0 8px 40px rgba(0,0,0,0.55)",
  };
}