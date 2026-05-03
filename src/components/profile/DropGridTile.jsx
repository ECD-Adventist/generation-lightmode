import React from "react";
import { Heart, MessageCircle, Bookmark, Pin, Sparkles, Image as ImageIcon, Quote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import KeepIt100Poster from "@/components/keep-it-100/KeepIt100Poster";
import CodesOfTruthPoster from "@/components/codes-of-truth/CodesOfTruthPoster";

const LEADER_BG = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/6a1c1025d_Gemini_Generated_Image_s3fvlrs3fvlrs3fv.png?v=2";

function stripRepostPrefix(text = "") {
  return text.replace(/^(\[Reposted from .+?\]\s*)+/i, "").trim();
}

function compactCount(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toString();
}

export default function DropGridTile({ drop, onClick, authorName, authorTitle, isLeader = false, commentsCount = 0, isSaved = false }) {
  const hasMedia = !!drop.media_url;
  const reflection = stripRepostPrefix(drop.reflection || "");
  const likes = drop.likes_count || 0;
  const isPinned = !!drop.pinned;
  const isKeepIt100 = !hasMedia && (drop.category === "Keep It 100" || /keepit100/i.test(drop.hashtags || ""));
  const isCodeOfTruth = !hasMedia && drop.category === "Code of Truth";

  const timeAgo = (() => {
    if (!drop.created_date) return null;
    try {
      const dateStr = drop.created_date.endsWith("Z") ? drop.created_date : drop.created_date + "Z";
      return formatDistanceToNow(new Date(dateStr), { addSuffix: false });
    } catch {
      return null;
    }
  })();

  const hashtags = (drop.hashtags || "")
    .split(/[\s,]+/)
    .map(t => t.trim())
    .filter(t => t.startsWith("#") && t.length > 1)
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group ${isKeepIt100 || isCodeOfTruth ? "aspect-[4/5]" : "aspect-[4/5] sm:aspect-square"} relative overflow-hidden rounded-[1.35rem] sm:rounded-[1.4rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
      style={{
        background: hasMedia ? "#0B1B3D" : "#070B18",
        border: isLeader ? "1px solid #FFE4A0" : isPinned ? "1px solid #B8E5FF" : "1px solid #E6ECF5",
        boxShadow: isLeader
          ? "0 8px 24px rgba(11, 63, 217, 0.10), 0 16px 38px rgba(255, 208, 0, 0.12)"
          : "0 4px 16px rgba(11, 63, 217, 0.08)",
      }}
    >
      {/* Background layer */}
      {hasMedia ? (
        <>
          <img src={drop.media_url} alt={drop.verse || "Drop"} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
        </>
      ) : isKeepIt100 ? (
        <KeepIt100Poster text={reflection || drop.reflection} verse={drop.verse} className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105" />
      ) : isCodeOfTruth ? (
        <CodesOfTruthPoster text={reflection || drop.reflection} verse={drop.verse} className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <>
          <img src={LEADER_BG} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ filter: "grayscale(100%) contrast(1.08) brightness(0.5)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,12,28,0.45) 0%, rgba(8,12,28,0.20) 40%, rgba(8,12,28,0.92) 100%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 25%, rgba(8,12,28,0.65) 100%)" }} />
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-40" style={{ background: "rgba(0,128,254,0.6)" }} />
          <div className="absolute -bottom-12 -right-10 w-44 h-44 rounded-full blur-3xl opacity-30" style={{ background: "rgba(212,184,46,0.6)" }} />
        </>
      )}

      {/* Top corner badges */}
      <div className="absolute top-2 left-2 right-2 z-20 flex items-start justify-between gap-1.5 pointer-events-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isPinned && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md" style={{ background: "rgba(11, 63, 217, 0.85)", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.4)" }}>
              <Pin className="w-2.5 h-2.5 fill-white" /> Pinned
            </span>
          )}
          {isLeader && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md" style={{ background: "linear-gradient(135deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 2px 8px rgba(255, 159, 26, 0.4)" }}>
              <Sparkles className="w-2.5 h-2.5" /> Leader
            </span>
          )}
        </div>
        {hasMedia && (
          <span className="w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md" style={{ background: "rgba(0,0,0,0.4)" }}>
            <ImageIcon className="w-3 h-3 text-white" />
          </span>
        )}
          {!hasMedia && !isLeader && !isKeepIt100 && (
          <span className="w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md" style={{ background: "rgba(0,0,0,0.4)" }}>
            <Quote className="w-3 h-3 text-white" />
          </span>
        )}
      </div>

      {/* Content layer */}
      {hasMedia ? (
        drop.verse && (
          <div className="absolute bottom-12 left-3 right-3 text-left z-10">
            <p className="text-white text-[11px] sm:text-xs font-bold leading-snug line-clamp-3 drop-shadow-md">{drop.verse}</p>
          </div>
        )
      ) : isKeepIt100 || isCodeOfTruth ? null : (
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 pt-9 pb-12 text-center">
          <div className="font-serif leading-none mb-1" style={{ fontSize: "clamp(44px, 12vw, 60px)", color: isLeader ? "#FFD000" : "#5AC8FF" }}>“</div>
          {drop.verse && (
            <p className="font-['Space_Grotesk'] font-black text-white text-[12px] sm:text-xs md:text-sm leading-tight line-clamp-5 drop-shadow-md">
              {drop.verse}
            </p>
          )}
          {!drop.verse && reflection && (
            <p className="font-['Space_Grotesk'] font-black text-white text-[12px] sm:text-xs md:text-sm leading-tight line-clamp-6 drop-shadow-md">
              {reflection}
            </p>
          )}
          {isLeader && (authorName || authorTitle) && (
            <div className="mt-2 flex flex-col items-center gap-0.5">
              <div className="h-px w-10" style={{ background: "linear-gradient(90deg, transparent, #FFD000, transparent)" }} />
              {authorName && <span className="text-[10px] sm:text-[9px] font-black tracking-[0.14em] uppercase" style={{ color: "#FFD000" }}>— {authorName}</span>}
              {authorTitle && <span className="text-[8px] sm:text-[8px] tracking-[0.12em] uppercase text-white/70 line-clamp-1">{authorTitle}</span>}
            </div>
          )}
        </div>
      )}

      {/* Bottom engagement strip — always visible */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-2.5 py-2 flex items-center justify-between gap-2" style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.7))" }}>
        <div className="flex items-center gap-2.5 text-white">
          <span className="flex items-center gap-1 text-[11px] font-bold drop-shadow-md">
            <Heart className={`w-3.5 h-3.5 ${likes > 0 ? "fill-red-500 text-red-500" : "text-white"}`} />
            {compactCount(likes)}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold drop-shadow-md">
            <MessageCircle className="w-3.5 h-3.5" />
            {compactCount(commentsCount)}
          </span>
          {isSaved && (
            <Bookmark className="w-3.5 h-3.5 fill-amber-400 text-amber-400 drop-shadow-md" />
          )}
        </div>
        {timeAgo && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/75 drop-shadow-md whitespace-nowrap">{timeAgo}</span>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 flex flex-col items-center justify-center gap-2 backdrop-blur-[3px]" style={{ background: "rgba(11, 27, 61, 0.55)" }}>
        <div className="flex items-center gap-5 text-white">
          <div className="flex flex-col items-center gap-0.5">
            <Heart className={`w-6 h-6 ${likes > 0 ? "fill-red-500 text-red-500" : "fill-white"}`} />
            <span className="text-xs font-black">{compactCount(likes)}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <MessageCircle className="w-6 h-6 fill-white" />
            <span className="text-xs font-black">{compactCount(commentsCount)}</span>
          </div>
        </div>
        {hashtags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap justify-center px-3 mt-1">
            {hashtags.map(tag => (
              <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(31,184,255,0.2)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.2)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <span className="mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white border border-white/30 bg-black/25">View Post</span>
      </div>
    </button>
  );
}