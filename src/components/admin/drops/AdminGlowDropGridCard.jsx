import React, { useState } from "react";
import { CheckSquare, Clock, EyeOff, Heart, ImageIcon, MessageCircle, MoreVertical, Pin, Quote, Square } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import DropActionsMenu from "./DropActionsMenu";

const FALLBACK_BG = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/6a1c1025d_Gemini_Generated_Image_s3fvlrs3fvlrs3fv.png?v=2";

function compactCount(value) {
  const n = Number(value) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function timeAgo(date) {
  if (!date) return "";
  try {
    const dateStr = date.endsWith("Z") ? date : `${date}Z`;
    return formatDistanceToNow(new Date(dateStr), { addSuffix: false });
  } catch {
    return "";
  }
}

export default function AdminGlowDropGridCard({ drop, selected, onToggleSelect, onPreview, onApprove, onReject, onHide, onUnhide, onDelete, onPin, onUnpin, canManagePinnedAnnouncements = false, t, isDark }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasMedia = !!drop.media_url;
  const status = drop.status || "approved";
  const tags = (drop.hashtags || "").split(/[\s,]+/).filter(tag => tag.startsWith("#")).slice(0, 2);

  const stop = (handler) => (event) => {
    event.stopPropagation();
    handler?.();
  };

  return (
    <article
      onClick={onPreview}
      className="group relative aspect-[4/5] overflow-hidden rounded-[1.4rem] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      style={{
        background: hasMedia ? "#071126" : "#070B18",
        border: selected ? `2px solid ${t.accent}` : `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(11,27,61,0.12)"}`,
        opacity: drop.hidden ? 0.78 : 1,
      }}
    >
      {hasMedia ? (
        <>
          <img src={drop.media_url} alt={drop.verse || "Glow Drop"} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
        </>
      ) : (
        <>
          <img src={FALLBACK_BG} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 grayscale brightness-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/20 to-slate-950/90" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-5 pb-12 text-center">
            <Quote className="w-8 h-8 mb-2 text-cyan-300" />
            <p className="text-white text-xs sm:text-sm font-black leading-snug line-clamp-5 drop-shadow-md">{drop.verse || drop.reflection || "Glow Drop"}</p>
          </div>
        </>
      )}

      {hasMedia && drop.verse && (
        <div className="absolute left-3 right-3 bottom-12 z-10">
          <p className="text-white text-[11px] sm:text-xs font-bold leading-snug line-clamp-3 drop-shadow-md">{drop.verse}</p>
        </div>
      )}

      <div className="absolute top-2 left-2 right-2 z-30 flex items-start justify-between gap-2">
        <button onClick={stop(onToggleSelect)} className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition hover:scale-105" style={{ background: selected ? t.accentSoft : "rgba(0,0,0,0.45)", color: selected ? t.accent : "#FFFFFF" }} title="Select drop">
          {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-1.5">
          {drop.hidden && <span className="w-8 h-8 rounded-full flex items-center justify-center bg-violet-500/80 text-white backdrop-blur-md" title="Hidden"><EyeOff className="w-3.5 h-3.5" /></span>}
          {drop.pinned && <span className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-400/90 text-slate-950 backdrop-blur-md" title="Pinned"><Pin className="w-3.5 h-3.5" /></span>}
          <span className="w-8 h-8 rounded-full flex items-center justify-center bg-black/45 text-white backdrop-blur-md" title={hasMedia ? "Image post" : "Text post"}>
            {hasMedia ? <ImageIcon className="w-3.5 h-3.5" /> : <Quote className="w-3.5 h-3.5" />}
          </span>
          <div className="relative">
            <button onClick={stop(() => setMenuOpen(v => !v))} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/45 text-white backdrop-blur-md transition hover:scale-105" title="More actions">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div onClick={(event) => event.stopPropagation()}>
                <DropActionsMenu drop={drop} onClose={() => setMenuOpen(false)} onApprove={onApprove} onReject={onReject} onHide={onHide} onUnhide={onUnhide} onDelete={onDelete} onPin={onPin} onUnpin={onUnpin} canManagePinnedAnnouncements={canManagePinnedAnnouncements} t={t} isDark={isDark} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 px-3 py-2.5 flex items-end justify-between gap-2" style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.78))" }}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-white text-[11px] font-bold">
            <span className="flex items-center gap-1"><Heart className={`w-3.5 h-3.5 ${(drop.likes_count || 0) > 0 ? "fill-red-500 text-red-500" : "text-white"}`} />{compactCount(drop.likes_count)}</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{compactCount(drop.comments_count)}</span>
          </div>
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${status === "rejected" ? "bg-red-500/80" : "bg-emerald-500/80"} text-white`}>{status}</span>
            {tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded-full text-[8px] font-black bg-cyan-400/20 text-white border border-white/15">{tag}</span>)}
          </div>
        </div>
        {timeAgo(drop.created_date) && <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-white/80 whitespace-nowrap"><Clock className="w-3 h-3" />{timeAgo(drop.created_date)}</span>}
      </div>
    </article>
  );
}