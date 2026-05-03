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
  const bodyFontSize = len > 160 ? "clamp(12px, 1.7vw, 18px)"
    : len > 120 ? "clamp(13px, 1.95vw, 21px)"
    : len > 80 ? "clamp(15px, 2.25vw, 25px)"
    : len > 45 ? "clamp(18px, 2.75vw, 31px)"
    : "clamp(22px, 3.35vw, 38px)";

  return (
    <div
      className={`relative overflow-hidden bg-black ${className || "aspect-[4/5] rounded-2xl"}`}
      style={{
        backgroundImage: `url(${CODES_OF_TRUTH_BACKGROUND_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Premium text block — fitted into the lower-left empty space and clear of the author chip/logo lockup */}
      <div className="absolute z-10 top-[29%] bottom-[23%] left-[9%] right-[41%] flex flex-col items-start justify-center text-left overflow-hidden">
        {verse && (
          <div
            className="font-['Space_Grotesk'] font-black uppercase mb-3"
            style={{
              color: "#FFD000",
              fontSize: "clamp(8px, 0.9vw, 11px)",
              letterSpacing: "0.32em",
              textShadow: "0 0 10px rgba(255,208,0,0.5), 0 2px 10px rgba(0,0,0,0.85)",
            }}
          >
            {verse}
          </div>
        )}

        {cleanedText && (
          <p
            className="font-['Space_Grotesk'] font-medium leading-[1.14] line-clamp-6 max-w-[16ch]"
            style={{
              color: "#FFFFFF",
              fontSize: bodyFontSize,
              letterSpacing: "-0.035em",
              textShadow: "0 3px 14px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.75)",
            }}
          >
            {cleanedText}
          </p>
        )}
      </div>
    </div>
  );
}