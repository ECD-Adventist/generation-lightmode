import React from "react";

const BACKGROUND_URL = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/bc0d542e9_BACKGROUNDTMP-02-1.jpg";

function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function BrandedVerseCard({ verse, reflection, compact = false }) {
  const quote = stripHtml(reflection);
  const reference = stripHtml(verse);

  return (
    <div className={`relative w-full overflow-hidden bg-[#03091f] ${compact ? "aspect-[4/5] rounded-2xl" : "h-full min-h-[360px] rounded-xl sm:rounded-[1.5rem]"}`}>
      <img
        src={BACKGROUND_URL}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
        style={{ filter: "brightness(0.55) contrast(1.08) blur(0.3px)" }}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-[#03091f]/55" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(3,9,31,0.72)_100%)]" />
      <div className="absolute inset-x-0 top-[10%] z-10 text-center text-[10px] sm:text-xs font-black tracking-[0.28em] text-[#44e8ff] drop-shadow-[0_0_10px_rgba(68,232,255,0.85)]">
        lightmode.ecd.adventist.org
      </div>

      <div className="absolute inset-x-[8%] top-[15%] bottom-[20%] z-10 rounded-[1.5rem] sm:rounded-[2rem] border-[3px] border-[#44e8ff] shadow-[0_0_24px_rgba(68,232,255,0.65),inset_0_0_30px_rgba(68,232,255,0.08)]" />

      <div className="relative z-20 flex h-full flex-col items-center justify-center px-[12%] pb-[18%] pt-[22%] text-center">
        {quote && (
          <p
            className="font-['Inter'] font-medium italic leading-[1.18] tracking-[0.04em] text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.75)]"
            style={{ fontSize: compact ? "clamp(18px, 4.7vw, 30px)" : "clamp(21px, 4.4vw, 38px)" }}
          >
            {quote.length > 290 ? `${quote.slice(0, 290)}…` : quote}
          </p>
        )}

        {reference && (
          <div
            className="mt-6 sm:mt-8 font-['Space_Grotesk'] font-black leading-tight text-[#ffd000] drop-shadow-[0_3px_10px_rgba(0,0,0,0.75)]"
            style={{ fontSize: compact ? "clamp(19px, 5vw, 32px)" : "clamp(24px, 4.8vw, 42px)" }}
          >
            {reference}
          </div>
        )}
      </div>

      <div className="absolute bottom-[10%] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-['Space_Grotesk'] text-xl sm:text-3xl font-black italic text-[#ffd000] drop-shadow-[0_4px_10px_rgba(0,0,0,0.75)]">
        Faith. Always On
      </div>
    </div>
  );
}