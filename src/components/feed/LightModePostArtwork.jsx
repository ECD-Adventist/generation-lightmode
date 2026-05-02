import React from "react";

const BACKGROUND_URL = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/bc0d542e9_BACKGROUNDTMP-02-1.jpg";
const BRAND_LOGO = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png";
const CHURCH_LOGO = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/741681e20_ALLICONS.jpg";

function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function LightModePostArtwork({ verse, reflection, category, compact = false }) {
  const quote = stripHtml(reflection) || stripHtml(verse) || "Faith. Always On.";
  const reference = stripHtml(reflection) && stripHtml(verse) ? stripHtml(verse) : category || "Generation LightMode";

  return (
    <div
      className="relative w-full aspect-[4/5] overflow-hidden rounded-[1.35rem] text-white bg-[#03091f]"
      style={{ boxShadow: "inset 0 0 80px rgba(0,207,255,0.08)" }}
    >
      <img src={BACKGROUND_URL} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-[#02071f]/10" />

      <div className="absolute inset-x-[9%] top-[13%] bottom-[21%] rounded-[1.4rem] border-[3px] border-[#45E8FF] shadow-[0_0_22px_rgba(69,232,255,0.55)] bg-[#02071f]/18 backdrop-blur-[1px]" />

      <div className="relative z-10 h-full flex flex-col items-center px-[10%] pt-[11%] pb-[8%] text-center">
        <div className="text-[#45E8FF] font-bold tracking-[0.22em] uppercase mb-[7%]" style={{ fontSize: compact ? "8px" : "clamp(9px,1.55vw,13px)" }}>
          lightmode.ecd.adventist.org
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[86%]">
          <p
            className="font-medium italic leading-[1.16] tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] line-clamp-[11]"
            style={{ fontSize: compact ? "18px" : "clamp(23px,4.2vw,36px)" }}
          >
            {quote}
          </p>
          <div
            className="mt-[7%] font-black text-[#FFD000] drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] line-clamp-2"
            style={{ fontSize: compact ? "17px" : "clamp(20px,3.6vw,34px)" }}
          >
            {reference}
          </div>
        </div>

        <div className="mt-[2%] flex items-end justify-between w-full">
          <img src={BRAND_LOGO} alt="Generation LightMode" className="w-[31%] object-contain drop-shadow-[0_0_10px_rgba(255,208,0,0.25)]" />
          <div className="text-[#FFD000] italic font-semibold rotate-[-3deg]" style={{ fontFamily: "cursive", fontSize: compact ? "15px" : "clamp(18px,3vw,30px)" }}>
            Faith. Always On
          </div>
          <img src={CHURCH_LOGO} alt="" className="w-[9%] aspect-square rounded-full bg-white object-cover" />
        </div>
      </div>
    </div>
  );
}