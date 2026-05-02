import React from "react";

export const CODES_OF_TRUTH_BACKGROUND_URL = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/d68c01a4b_BACKGROUNDTMP-03.jpg";

function cleanCodeText(text = "") {
  return String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\s*📌\s*/, "")
    .replace(/^\s*daily\s*code\s*of\s*truth\s*[:\-–]?\s*/i, "")
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
      {/* Subtle left-side darkening so text always reads cleanly over the eclipse art */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 65%)",
        }}
      />

      {/* Text block — anchored to the upper-left quadrant, away from the bright eclipse flash on the right */}
      <div className="absolute z-10 top-[20%] left-[7%] right-[30%] flex flex-col items-start text-left">
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
            className="font-['Space_Grotesk'] font-bold leading-[1.15] line-clamp-7"
            style={{
              color: "#FFFFFF",
              fontSize: "clamp(22px, 4vw, 44px)",
              letterSpacing: "-0.025em",
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