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

function truncateForPoster(text, maxChars = 145) {
  if (!text || text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 80 ? slice.slice(0, lastSpace) : slice).replace(/[,;:.!?\-–—\s]+$/, "") + "…";
}

function splitVerseLabel(verse = "") {
  const cleaned = String(verse).trim();
  const match = cleaned.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (!match) return { reference: cleaned, quote: "" };
  return { reference: match[1].trim(), quote: match[2].trim() };
}

export default function CodesOfTruthPoster({ text, verse, className = "" }) {
  const cleaned = cleanCodeText(text);
  const cleanedText = truncateForPoster(cleaned, 340);
  // Auto-shrink type for longer copy so it never overflows into the bottom logo area
  const len = cleanedText?.length || 0;
  const bodyFontSize = len > 260 ? "clamp(7px, 2.9cqw, 11px)"
    : len > 180 ? "clamp(8px, 3.3cqw, 12px)"
    : len > 120 ? "clamp(9px, 3.8cqw, 14px)"
    : len > 60 ? "clamp(10px, 4.4cqw, 16px)"
    : "clamp(12px, 5.6cqw, 18px)";
  const verseParts = splitVerseLabel(verse);

  return (
    <div
      className={`relative overflow-hidden bg-black ${className || "aspect-[4/5] rounded-2xl"}`}
      style={{
        backgroundImage: `url(${CODES_OF_TRUTH_BACKGROUND_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        containerType: "inline-size",
      }}
    >
      {/* Premium text block — fitted into the lower-left empty space and clear of the author chip/logo lockup */}
      <div className="absolute z-10 top-[24%] bottom-[28%] left-[9%] right-[30%] flex flex-col items-start justify-center text-left overflow-hidden">
        {verse && (
          <div className="mb-2 max-w-[26ch]">
            <div
              className="font-['Space_Grotesk'] font-black uppercase inline-flex rounded-full px-1.5 py-0.5 mb-1.5"
              style={{
                color: "#00CFFF",
                background: "rgba(0,207,255,0.12)",
                border: "1px solid rgba(0,207,255,0.28)",
                fontSize: "clamp(5px, 2.2cqw, 8px)",
                letterSpacing: "0.24em",
                textShadow: "0 0 10px rgba(0,207,255,0.45), 0 2px 10px rgba(0,0,0,0.85)",
              }}
            >
              {verseParts.reference}
            </div>
            {verseParts.quote && (
              <div
                className="font-['Space_Grotesk'] font-bold uppercase leading-[1.25]"
                style={{
                  color: "#FFD000",
                  fontSize: "clamp(5px, 2.5cqw, 10px)",
                  letterSpacing: "0.22em",
                  textShadow: "0 0 10px rgba(255,208,0,0.45), 0 2px 10px rgba(0,0,0,0.9)",
                }}
              >
                {verseParts.quote}
              </div>
            )}
          </div>
        )}

        {cleanedText && (
          <p
            className="font-['Space_Grotesk'] font-semibold leading-[1.15] line-clamp-[9] max-w-[26ch]"
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