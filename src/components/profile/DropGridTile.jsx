import React from "react";

const LEADER_BG = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/6a1c1025d_Gemini_Generated_Image_s3fvlrs3fvlrs3fv.png?v=2";

function stripRepostPrefix(text = "") {
  return text.replace(/^(\[Reposted from .+?\]\s*)+/i, "").trim();
}

export default function DropGridTile({ drop, onClick, authorName, authorTitle, isLeader = false }) {
  const hasMedia = !!drop.media_url;
  const reflection = stripRepostPrefix(drop.reflection || "");

  return (
    <button
      type="button"
      onClick={onClick}
      className="aspect-square relative group overflow-hidden rounded-[1.35rem] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
      style={{
        background: hasMedia ? "#0B1B3D" : "#070B18",
        border: isLeader ? "1px solid #FFE4A0" : "1px solid #E6ECF5",
        boxShadow: isLeader
          ? "0 8px 24px rgba(11, 63, 217, 0.10), 0 16px 38px rgba(255, 208, 0, 0.10)"
          : "0 4px 16px rgba(11, 63, 217, 0.08)",
      }}
    >
      {hasMedia ? (
        <>
          <img src={drop.media_url} alt={drop.verse || "Drop"} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          {drop.verse && (
            <div className="absolute bottom-3 left-3 right-3 text-left">
              <p className="text-white text-[11px] sm:text-xs font-bold leading-snug line-clamp-3 drop-shadow-md">{drop.verse}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <img src={LEADER_BG} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "grayscale(100%) contrast(1.08) brightness(0.52)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,12,28,0.45) 0%, rgba(8,12,28,0.25) 42%, rgba(8,12,28,0.85) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 20%, rgba(8,12,28,0.62) 100%)" }} />
          <div className="absolute -top-8 -left-8 w-36 h-36 rounded-full blur-3xl opacity-35" style={{ background: "rgba(0,128,254,0.55)" }} />
          <div className="absolute -bottom-10 -right-8 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: "rgba(212,184,46,0.55)" }} />

          <div className="relative z-10 h-full flex flex-col items-center justify-center px-3 py-4 text-center">
            <div className="font-serif leading-none mb-1" style={{ fontSize: "clamp(42px, 8vw, 74px)", color: "#FFD000" }}>“</div>
            {drop.verse && (
              <p className="font-['Space_Grotesk'] font-semibold text-white text-[10px] sm:text-xs md:text-sm leading-snug line-clamp-5 drop-shadow-md">
                {drop.verse}
              </p>
            )}
            {!drop.verse && reflection && (
              <p className="font-['Space_Grotesk'] font-semibold text-white text-[10px] sm:text-xs md:text-sm leading-snug line-clamp-6 drop-shadow-md">
                {reflection}
              </p>
            )}
            {(authorName || authorTitle) && (
              <div className="mt-3 flex flex-col items-center gap-0.5">
                <div className="h-px w-10" style={{ background: "linear-gradient(90deg, transparent, #FFD000, transparent)" }} />
                {authorName && <span className="text-[8px] sm:text-[9px] font-black tracking-[0.16em] uppercase" style={{ color: "#FFD000" }}>— {authorName}</span>}
                {authorTitle && <span className="text-[7px] sm:text-[8px] tracking-[0.14em] uppercase text-white/65">{authorTitle}</span>}
              </div>
            )}
          </div>
        </>
      )}

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center" style={{ background: "rgba(11, 27, 61, 0.34)" }}>
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white border border-white/30 bg-black/25 backdrop-blur-md">View Post</span>
      </div>
    </button>
  );
}