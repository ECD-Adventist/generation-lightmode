import React from "react";

const OFFICIAL_POST_BACKGROUND = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/6a1c1025d_Gemini_Generated_Image_s3fvlrs3fvlrs3fv.png?v=2";
const BRAND_LOGO = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg";

function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function OfficialPostArt({ verse, reflection, category = "Announcement", className = "" }) {
  const plainReflection = stripHtml(reflection);
  const hasVerse = Boolean(verse?.trim());
  const hasReflection = Boolean(plainReflection);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <img
        src={OFFICIAL_POST_BACKGROUND}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ filter: "contrast(1.05) brightness(0.62) saturate(1.08)" }}
        loading="lazy"
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,10,25,0.70) 0%, rgba(8,18,48,0.38) 42%, rgba(5,10,25,0.86) 100%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 42%, rgba(0,207,255,0.16), transparent 34%), radial-gradient(circle at 84% 82%, rgba(255,208,0,0.18), transparent 32%), radial-gradient(circle at 12% 12%, rgba(138,92,255,0.18), transparent 30%)" }} />
      <div className="absolute inset-x-8 top-24 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,208,0,0.75), rgba(0,207,255,0.55), transparent)" }} />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-7 sm:px-10 pr-16 sm:pr-24 py-14">
        <div className="mb-5 flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)" }}>
          <img src={BRAND_LOGO} alt="" className="w-5 h-5 rounded-full object-cover" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: "#FFD000" }}>{category || "Official"}</span>
        </div>

        <div className="font-serif leading-none select-none mb-2" style={{ fontSize: "clamp(54px, 9vw, 96px)", color: "rgba(255,208,0,0.88)", textShadow: "0 0 28px rgba(255,208,0,0.22)" }}>“</div>

        {hasVerse && (
          <h2 className="font-['Space_Grotesk'] font-black leading-[1.08] tracking-[-0.035em] max-w-[12ch]" style={{ color: "#FFFFFF", fontSize: "clamp(30px, 6vw, 60px)", textShadow: "0 4px 28px rgba(0,0,0,0.62)" }}>
            {verse}
          </h2>
        )}

        {hasReflection && (
          <p className="mt-5 max-w-[36ch] font-['Inter'] leading-relaxed" style={{ color: "rgba(235,242,255,0.88)", fontSize: "clamp(13px, 1.65vw, 18px)", textShadow: "0 2px 14px rgba(0,0,0,0.52)" }}>
            {plainReflection.length > 180 ? `${plainReflection.slice(0, 180)}…` : plainReflection}
          </p>
        )}

        <div className="mt-7 flex items-center gap-3">
          <span className="h-px w-12" style={{ background: "linear-gradient(90deg, transparent, #FFD000)" }} />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.26em]" style={{ color: "#FFD000", textShadow: "0 1px 10px rgba(0,0,0,0.6)" }}>Generation LightMode</span>
          <span className="h-px w-12" style={{ background: "linear-gradient(90deg, #FFD000, transparent)" }} />
        </div>
      </div>
    </div>
  );
}