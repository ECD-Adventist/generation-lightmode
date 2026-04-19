import React, { createContext, useContext, useEffect, useState } from "react";

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
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}

// Shared token palette — components can pick values based on theme
export function getAdminTokens(theme) {
  if (theme === "light") {
    return {
      appBg: "#F6F8FC",
      surface: "#FFFFFF",
      surfaceMuted: "#F8FAFD",
      border: "#E6ECF5",
      borderStrong: "#D6E4FF",
      textPrimary: "#0B1B3D",
      textSecondary: "#4A5878",
      textMuted: "#8A97B5",
      accent: "#0B3FD9",
      accentSoft: "#EEF3FF",
      gradient: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)",
      gold: "linear-gradient(90deg, #FFD000 0%, #FF9F1A 100%)",
      shadow: "0 4px 16px rgba(11,63,217,0.08)",
    };
  }
  return {
    appBg: "#0B0F1A",
    surface: "#121826",
    surfaceMuted: "#0F1421",
    border: "rgba(255,255,255,0.06)",
    borderStrong: "rgba(0,207,255,0.25)",
    textPrimary: "#FFFFFF",
    textSecondary: "#C8D0E0",
    textMuted: "#8A97B5",
    accent: "#00CFFF",
    accentSoft: "rgba(0,207,255,0.1)",
    gradient: "linear-gradient(90deg, #00CFFF 0%, #8A5CFF 100%)",
    gold: "linear-gradient(90deg, #FFD000 0%, #FF9F1A 100%)",
    shadow: "0 4px 24px rgba(0,0,0,0.4)",
  };
}