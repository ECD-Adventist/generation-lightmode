import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShieldCheck, ChevronLeft, ChevronDown, Mail } from "lucide-react";

export default function MobilePrivacy({ sections }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="min-h-screen" style={{ background: "#0B0F1A", color: "#E0E8F0" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 safe-pt" style={{ background: "rgba(11,15,26,0.95)", backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(0,207,255,0.1)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 p-2 -ml-2" style={{ color: "#00CFFF" }}>
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-bold">Home</span>
          </Link>
          <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "#00CFFF" }}>Legal</span>
          <div className="w-12" />
        </div>
      </div>

      {/* Hero */}
      <section className="px-5 pt-6 pb-5" style={{ background: "linear-gradient(180deg, rgba(0,207,255,0.06) 0%, transparent 100%)", borderBottom: "1px solid rgba(0,207,255,0.08)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)" }}>
            <ShieldCheck size={20} color="#00CFFF" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: "#00CFFF" }}>Legal Document</div>
            <h1 className="text-2xl font-black leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#FFFFFF" }}>Privacy Policy</h1>
          </div>
        </div>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#C8D0E0" }}>
          How Generation LightMode collects, uses, and protects your personal information.
        </p>
        <p className="text-xs" style={{ color: "#4A5568" }}>
          Last updated: <strong style={{ color: "#8A9BB0" }}>March 2026</strong>
        </p>
      </section>

      {/* Sections (accordion for mobile readability) */}
      <div className="px-4 py-5 space-y-2.5">
        {sections.map((section, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "rgba(18,24,38,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
              >
                <span className="text-sm font-bold flex-1" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#00CFFF" }}>{section.title}</span>
                <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: "#00CFFF", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-[13px] leading-[1.75] whitespace-pre-line" style={{ color: "#C8D0E0" }}>
                  {section.content.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                    j % 2 === 1
                      ? <strong key={j} style={{ color: "#FFFFFF" }}>{part}</strong>
                      : part
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact card */}
      <div className="px-4 pb-24">
        <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(0,207,255,0.04)", border: "1px solid rgba(0,207,255,0.15)" }}>
          <Mail className="w-5 h-5 mx-auto mb-2" style={{ color: "#00CFFF" }} />
          <p className="text-xs mb-1" style={{ color: "#8A9BB0" }}>Questions about this policy?</p>
          <a href="mailto:privacy@generationlightmode.org" className="text-sm font-bold" style={{ color: "#00CFFF" }}>
            privacy@generationlightmode.org
          </a>
        </div>
      </div>
    </div>
  );
}