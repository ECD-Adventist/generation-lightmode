import React from "react";

export const CODES_OF_TRUTH_BACKGROUND_URL = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/9f447b683_BACKGROUNDTMP-03.jpg";

function cleanCodeText(text = "") {
  return String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\s*🔐\s*/, "")
    .replace(/^\s*code\s*of\s*truth\s*[:\-–]?\s*/i, "")
    .replace(/^\s*codes\s*of\s*truth\s*[:\-–]?\s*/i, "")
    .replace(/^["“'']+|["”'']+$/g, "")
    .trim();
}

export default function CodesOfTruthPoster({ text, verse, className = "" }) {
  const cleanedText = cleanCodeText(text);

  return (
    <div
      className={`relative overflow-hidden bg-black ${className || "aspect-[4/5] rounded-2xl"}`}
      style={{
        backgroundImage: `url(${CODES_OF_TRUTH_BACKGROUND_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/10 pointer-events-none" />

      <div className="absolute z-10 top-[20%] bottom-[28%] left-[13%] right-[13%] flex items-center justify-center text-center">
        <div className="w-full max-w-[82%] flex flex-col items-center justify-center text-center">
          <div
            className="font-serif leading-none mb-1 sm:mb-2 select-none"
            style={{
              color: "#00DFFF",
              fontSize: "clamp(34px, 7vw, 74px)",
              textShadow: "0 0 18px rgba(0,223,255,0.45), 0 4px 18px rgba(0,0,0,0.7)",
            }}
          >
            “
          </div>

          {cleanedText && (
            <p
              className="font-['Space_Grotesk'] font-black leading-[1.06] line-clamp-5"
              style={{
                color: "#FFFFFF",
                fontSize: "clamp(19px, 3.25vw, 38px)",
                letterSpacing: "-0.04em",
                textShadow: "0 4px 22px rgba(0,0,0,0.88), 0 0 18px rgba(255,208,0,0.18)",
              }}
            >
              {cleanedText}
            </p>
          )}

          {verse && (
            <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 sm:gap-3 max-w-full">
              <div className="h-px w-8 sm:w-14" style={{ background: "linear-gradient(90deg, transparent, rgba(255,208,0,0.95))" }} />
              <span
                className="font-['Space_Grotesk'] font-black uppercase whitespace-nowrap truncate"
                style={{
                  color: "#FFD000",
                  fontSize: "clamp(9px, 1.06vw, 13px)",
                  letterSpacing: "0.23em",
                  textShadow: "0 0 12px rgba(255,208,0,0.55), 0 2px 10px rgba(0,0,0,0.8)",
                }}
              >
                {verse}
              </span>
              <div className="h-px w-8 sm:w-14" style={{ background: "linear-gradient(90deg, rgba(255,208,0,0.95), transparent)" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}