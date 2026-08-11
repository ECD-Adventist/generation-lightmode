import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { CONTENT_CATEGORIES, categoryMeta } from "./contentConstants";

export default function CategoryDropdown({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = selected === "all" ? "All Categories" : (categoryMeta(selected)?.label || "All Categories");

  const option = (id, text) => (
    <button key={id} onClick={() => { onSelect(id); setOpen(false); }}
      className="w-full text-left px-3 py-2 rounded-xl text-[12px] font-bold transition hover:bg-white/5"
      style={{ color: selected === id ? "#FFD000" : "#C8D0E0", background: selected === id ? "rgba(255,208,0,0.08)" : "transparent" }}>
      {text}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition active:scale-[0.99]"
        style={{ background: "linear-gradient(135deg, #18243B, #111B30)", border: "1px solid rgba(255,255,255,0.04)", color: selected !== "all" ? "#F4C84A" : "#FFFFFF", fontFamily: "Inter, sans-serif" }}>
        <span className="flex items-center gap-2 truncate"><LayoutGrid size={14} /> {label}</span>
        <ChevronDown size={14} style={{ opacity: 0.7 }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 left-0 right-0 z-20 rounded-xl p-2 min-w-[220px] max-h-72 overflow-y-auto"
            style={{ background: "rgba(18,24,38,0.98)", border: "1px solid rgba(0,207,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
            {option("all", "All Categories")}
            {CONTENT_CATEGORIES.map(c => option(c.id, c.label))}
          </div>
        </>
      )}
    </div>
  );
}