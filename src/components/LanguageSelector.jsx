import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇰🇪" },       // Kenya (ECD HQ)
  { code: "sw", label: "Kiswahili", native: "Kiswahili", flag: "🇹🇿" },   // Tanzania
  { code: "fr", label: "French", native: "Français", flag: "🇨🇩" },       // DR Congo / Burundi / Djibouti
  { code: "ln", label: "Lingala", native: "Lingála", flag: "🇨🇩" },       // DR Congo
  { code: "rw", label: "Kinyarwanda", native: "Kinyarwanda", flag: "🇷🇼" }, // Rwanda
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇩" },        // Sudan / Somalia / Eritrea / Djibouti
  { code: "am", label: "Amharic", native: "አማርኛ", flag: "🇪🇹" },         // Ethiopia
  { code: "rn", label: "Kirundi", native: "Kirundi", flag: "🇧🇮" },       // Burundi
  { code: "pt", label: "Português", native: "Português", flag: "🇦🇴" },   // Angola (nearest ECD Portuguese)
  { code: "so", label: "Somali", native: "Soomaali", flag: "🇸🇴" },       // Somalia
  { code: "ti", label: "Tigrinya", native: "ትግርኛ", flag: "🇪🇷" },        // Eritrea
  { code: "nus", label: "Nuer", native: "Nuer", flag: "🇸🇸" },            // South Sudan
  { code: "lg", label: "Luganda", native: "Luganda", flag: "🇺🇬" },       // Uganda
];

const LANG_STORAGE_KEY = "glm_language";

export function getLanguage() {
  return localStorage.getItem(LANG_STORAGE_KEY) || "en";
}

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(getLanguage);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = LANGUAGES.find(l => l.code === selected) || LANGUAGES[0];

  const handleSelect = (lang) => {
    setSelected(lang.code);
    localStorage.setItem(LANG_STORAGE_KEY, lang.code);
    setOpen(false);
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent("languageChange", { detail: lang.code }));
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(0,207,255,0.08)",
          border: "1px solid rgba(0,207,255,0.3)",
          borderRadius: 50, padding: "7px 14px",
          color: "#00CFFF", cursor: "pointer",
          fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
          transition: "all 0.2s",
        }}
        onMouseOver={e => e.currentTarget.style.background = "rgba(0,207,255,0.18)"}
        onMouseOut={e => e.currentTarget.style.background = "rgba(0,207,255,0.08)"}
      >
        <Globe size={14} />
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "rgba(18,24,38,0.98)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(0,207,255,0.2)", borderRadius: 16,
          padding: "8px", minWidth: 200, zIndex: 2000,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          maxHeight: 360, overflowY: "auto",
        }}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 14px", border: "none",
                borderRadius: 10, cursor: "pointer",
                background: selected === lang.code ? "rgba(0,207,255,0.12)" : "transparent",
                color: selected === lang.code ? "#00CFFF" : "#C8D0E0",
                fontFamily: "Inter, sans-serif", fontSize: 14, textAlign: "left",
                transition: "all 0.15s",
              }}
              onMouseOver={e => { if (selected !== lang.code) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseOut={e => { if (selected !== lang.code) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 18 }}>{lang.flag}</span>
              <span style={{ fontWeight: selected === lang.code ? 700 : 400 }}>{lang.native}</span>
              {selected === lang.code && <span style={{ marginLeft: "auto", fontSize: 12 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}