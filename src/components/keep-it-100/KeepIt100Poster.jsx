import React from "react";

export const KEEP_IT_100_BACKGROUND_URL = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/ae9c17d35_BACKGROUNDTMP-02.jpg";

function cleanKeepIt100Text(text = "") {
  return String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\s*📌\s*/, "")
    .replace(/^\s*keep\s*it\s*100\s*[:\-–]?\s*/i, "")
    .replace(/^["“'']+|["”'']+$/g, "")
    .trim();
}

export default function KeepIt100Poster({ text, verse, className = "" }) {
  const cleanedText = cleanKeepIt100Text(text);

  return (
    <div
      className={`relative overflow-hidden bg-[#07112b] ${className || "aspect-[4/5] rounded-2xl"}`}
      style={{
        backgroundImage: `url(${KEEP_IT_100_BACKGROUND_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute z-10 top-[15.5%] bottom-[31%] left-[13%] right-[16%] flex items-center justify-center text-center">
        <div className="w-full max-w-[86%] flex flex-col items-center justify-center text-center">
          {cleanedText && (
            <p
              className="font-['Space_Grotesk'] font-semibold leading-[1.18] line-clamp-5"
              style={{
                color: "#FFFFFF",
                fontSize: "clamp(11px, 2.4vw, 26px)",
                letterSpacing: "-0.035em",
                textShadow: "0 4px 20px rgba(0,0,0,0.72), 0 0 18px rgba(0,207,255,0.22)",
              }}
            >
              {cleanedText}
            </p>
          )}

          {verse && (
            <div className="mt-5 sm:mt-7 flex items-center justify-center gap-3 max-w-full">
              <div className="h-px w-8 sm:w-14" style={{ background: "linear-gradient(90deg, transparent, rgba(255,208,0,0.85))" }} />
              <span
                className="font-['Space_Grotesk'] font-black uppercase whitespace-nowrap truncate"
                style={{
                  color: "#FFD000",
                  fontSize: "clamp(7px, 0.85vw, 11px)",
                  letterSpacing: "0.26em",
                  textShadow: "0 0 12px rgba(255,208,0,0.5), 0 2px 10px rgba(0,0,0,0.7)",
                }}
              >
                {verse}
              </span>
              <div className="h-px w-8 sm:w-14" style={{ background: "linear-gradient(90deg, rgba(255,208,0,0.85), transparent)" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}