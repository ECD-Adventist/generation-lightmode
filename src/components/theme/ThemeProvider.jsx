import React, { createContext, useContext, useEffect, useState } from "react";

// Shadcn-level theme provider: toggles the `dark` class on <html>.
// Modes: "light" | "dark" | "system". Defaults to system (which is dark on most modern devices).
// Only affects components that use the CSS variables from index.css (shadcn primitives).

const ThemeContext = createContext({ theme: "system", resolvedTheme: "dark", setTheme: () => {} });

const STORAGE_KEY = "glm-theme";

function getSystemTheme() {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeClass(resolved) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

export function ThemeProvider({ children, defaultTheme = "system" }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return defaultTheme;
    return localStorage.getItem(STORAGE_KEY) || defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    theme === "system" ? getSystemTheme() : theme
  );

  // Resolve and apply on theme change
  useEffect(() => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, [theme]);

  // React to system preference changes when mode = system
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      applyThemeClass(resolved);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = (next) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}