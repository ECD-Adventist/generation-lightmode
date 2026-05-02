import React from "react";

export const CODES_OF_TRUTH_BACKGROUND_URL = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/7066ef85f_BACKGROUNDTMP-03.jpg";

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
  const bodyFontSize = len > 140 ? "clamp(14px, 2.2vw, 22px)"
    : len > 90 ? "clamp(16px, 2.6vw, 26px)"
    : len > 50 ? "clamp(18px, 3.1vw, 32px)"
    : "clamp(22px, 3.8vw, 40px)";

  return (
    <div
      className={`relative overflow-hidden bg-black ${className || "aspect-[4/5] rounded-2xl"}`}
      style={{
        backgroundImage: `url(${CODES_OF_TRUTH_BACKGROUND_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Text block — anchored to the upper-left quadrant, above the baked-in "Faith. Always On" + logo lockup */}
      <div className="absolute z-10 top-[8%] bottom-[34%] left-[8%] right-[34%] flex flex-col items-start text-left overflow-hidden">
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
            className="font-['Space_Grotesk'] font-semibold leading-[1.22] line-clamp-6"
            style={{
              color: "#FFFFFF",
              fontSize: bodyFontSize,
              letterSpacing: "-0.015em",
              textShadow: "0 2px 8px rgba(0,0,0,0.75), 0 0 18px rgba(0,0,0,0.55)",
            }}
          >
            {cleanedText}
          </p>
        )}
      </div>
    </div>
  );
}