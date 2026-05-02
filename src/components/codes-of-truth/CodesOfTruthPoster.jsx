import React from "react";

export const CODES_OF_TRUTH_BACKGROUND_URL = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/d68c01a4b_BACKGROUNDTMP-03.jpg";

function cleanCodeText(text = "") {
  let out = String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Strip any number of leading "[Reposted from ...]" prefixes
  while (/^\[reposted from [^\]]+\]\s*/i.test(out)) {
    out = out.replace(/^\[reposted from [^\]]+\]\s*/i, "");
  }

  // Strip leading pin/label noise
  out = out
    .replace(/^\s*📌\s*/, "")
    .replace(/^\s*daily\s*code\s*of\s*truth\s*[:\-–]?\s*/i, "")
    .replace(/^\s*codes?\s*of\s*truth\s*[:\-–]?\s*/i, "")
    .replace(/^["“'']+|["”'']+$/g, "")
    .trim();

  return out;
}

function truncateForPoster(text, maxChars = 180) {
  if (!text || text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 80 ? slice.slice(0, lastSpace) : slice).replace(/[,;:.!?\-–—\s]+$/, "") + "…";
}

export default function CodesOfTruthPoster({ text, verse, className = "" }) {
  const cleaned = cleanCodeText(text);
  const cleanedText = truncateForPoster(cleaned, 180);
  // Auto-shrink type for longer copy so it never overflows into the bottom logo area
  const len = cleanedText?.length || 0;
  const bodyFontSize = len > 140 ? "clamp(16px, 2.6vw, 28px)"
    : len > 90 ? "clamp(18px, 3.1vw, 34px)"
    : "clamp(22px, 4vw, 44px)";

  return (
    <div
      className={`relative overflow-hidden bg-black ${className || "aspect-[4/5] rounded-2xl"}`}
      style={{
        backgroundImage: `url(${CODES_OF_TRUTH_BACKGROUND_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Subtle left-side darkening so text always reads cleanly over the eclipse art */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 65%)",
        }}
      />

      {/* Text block — anchored to the upper-left quadrant, away from the bright eclipse flash on the right */}
      <div className="absolute z-10 top-[18%] bottom-[22%] left-[7%] right-[30%] flex flex-col items-start text-left overflow-hidden">
        {/* Decorative cyan open-quote */}
        <div
          aria-hidden="true"
          className="font-serif leading-none select-none mb-2"
          style={{
            color: "#00DFFF",
            fontSize: "clamp(48px, 8.5vw, 92px)",
            textShadow: "0 0 22px rgba(0,223,255,0.6)",
          }}
        >
          “
        </div>

        {verse && (
          <div
            className="font-['Space_Grotesk'] font-black uppercase mb-3"
            style={{
              color: "#FFD000",
              fontSize: "clamp(11px, 1.3vw, 15px)",
              letterSpacing: "0.28em",
              textShadow: "0 0 12px rgba(255,208,0,0.55), 0 2px 10px rgba(0,0,0,0.8)",
            }}
          >
            {verse}
          </div>
        )}

        {cleanedText && (
          <p
            className="font-['Space_Grotesk'] font-bold leading-[1.18] line-clamp-6"
            style={{
              color: "#FFFFFF",
              fontSize: bodyFontSize,
              letterSpacing: "-0.02em",
              textShadow: "0 4px 22px rgba(0,0,0,0.85)",
            }}
          >
            {cleanedText}
          </p>
        )}

        {/* Thin gold underline accent */}
        <div
          className="mt-6 h-[2px] w-20"
          style={{
            background: "linear-gradient(90deg, #FFD000, rgba(255,208,0,0))",
            boxShadow: "0 0 10px rgba(255,208,0,0.5)",
          }}
        />
      </div>
    </div>
  );
}