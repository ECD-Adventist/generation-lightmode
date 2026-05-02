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
  const bodyFontSize = len > 140 ? "clamp(13px, 2vw, 20px)"
    : len > 90 ? "clamp(15px, 2.3vw, 24px)"
    : len > 50 ? "clamp(17px, 2.7vw, 28px)"
    : "clamp(19px, 3.2vw, 32px)";

  return (
    <div
      className={`relative overflow-hidden bg-black ${className || "aspect-[4/5] rounded-2xl"}`}
      style={{
        backgroundImage: `url(${CODES_OF_TRUTH_BACKGROUND_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Text block — top area, above the baked-in "Faith. Always On" + logo lockup */}
      <div className="absolute z-10 top-[14%] bottom-[36%] left-[9%] right-[9%] flex flex-col items-center justify-start text-center overflow-hidden">
        {verse && (
          <div
            className="font-['Space_Grotesk'] font-black uppercase mb-4"
            style={{
              color: "#FFD000",
              fontSize: "clamp(10px, 1.2vw, 14px)",
              letterSpacing: "0.3em",
              textShadow: "0 0 12px rgba(255,208,0,0.55), 0 2px 10px rgba(0,0,0,0.8)",
            }}
          >
            {verse}
          </div>
        )}

        {cleanedText && (
          <p
            className="font-['Space_Grotesk'] font-semibold leading-[1.25] line-clamp-6 max-w-[88%]"
            style={{
              color: "#FFFFFF",
              fontSize: bodyFontSize,
              letterSpacing: "-0.015em",
              textShadow: "0 2px 10px rgba(0,0,0,0.85), 0 0 22px rgba(0,0,0,0.6)",
            }}
          >
            {cleanedText}
          </p>
        )}
      </div>
    </div>
  );
}