import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe } from "lucide-react";

export default function LanguageDropdown({ languages, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel = selected === "all" ? "All Languages" : selected;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition active:scale-[0.99]"
        style={{ background: "linear-gradient(135deg, #18243B, #111B30)", border: "1px solid rgba(255,255,255,0.04)", color: selected !== "all" ? "#F4C84A" : "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
        <span className="flex items-center gap-2"><Globe size={14} /> {selectedLabel}</span>
        <ChevronDown size={14} style={{ opacity: 0.7 }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 left-0 right-0 z-20 rounded-xl p-2 min-w-[180px] max-h-64 overflow-y-auto"
            style={{ background: "rgba(18,24,38,0.98)", border: "1px solid rgba(0,207,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
            <button onClick={() => { onSelect("all"); setOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-xl text-[12px] font-bold transition hover:bg-white/5"
              style={{ color: selected === "all" ? "#FFD000" : "#C8D0E0", background: selected === "all" ? "rgba(255,208,0,0.08)" : "transparent" }}>
              All Languages
            </button>
            {languages.map(lang => (
              <button key={lang} onClick={() => { onSelect(lang); setOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-[12px] font-bold transition hover:bg-white/5"
                style={{ color: selected === lang ? "#FFD000" : "#C8D0E0", background: selected === lang ? "rgba(255,208,0,0.08)" : "transparent" }}>
                {lang}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}