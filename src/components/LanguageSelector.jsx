import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", native: "English", flag: "🇰🇪" },
  { code: "sw", label: "Kiswahili", native: "Kiswahili", flag: "🇹🇿" },
  { code: "fr", label: "French", native: "Français", flag: "🇨🇩" },
  { code: "ln", label: "Lingala", native: "Lingála", flag: "🇨🇩" },
  { code: "rw", label: "Kinyarwanda", native: "Kinyarwanda", flag: "🇷🇼" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇩" },
  { code: "am", label: "Amharic", native: "አማርኛ", flag: "🇪🇹" },
  { code: "rn", label: "Kirundi", native: "Kirundi", flag: "🇧🇮" },
  { code: "pt", label: "Português", native: "Português", flag: "🇦🇴" },
  { code: "so", label: "Somali", native: "Soomaali", flag: "🇸🇴" },
  { code: "ti", label: "Tigrinya", native: "ትግርኛ", flag: "🇪🇷" },
  { code: "nus", label: "Nuer", native: "Thok Naath", flag: "🇸🇸" },
  { code: "lg", label: "Luganda", native: "Luganda", flag: "🇺🇬" },
];

const LANG_STORAGE_KEY = "glm_language";
const SUPPORTED_LANGUAGE_CODES = LANGUAGES.map(lang => lang.code);

export function getLanguage() {
  const savedLanguage = localStorage.getItem(LANG_STORAGE_KEY);
  return SUPPORTED_LANGUAGE_CODES.includes(savedLanguage) ? savedLanguage : "en";
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
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 36, height: 36,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "50%",
          color: "#C8D0E0", cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.15)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.4)"; e.currentTarget.style.color = "#00CFFF"; }}
        onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#C8D0E0"; }}
        title={current.native}
      >
        <span style={{ fontSize: 18 }}>{current.flag}</span>
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