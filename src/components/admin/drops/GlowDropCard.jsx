import React, { useState } from "react";
import {
  Heart,
  MoreVertical,
  CheckCircle2,
  XCircle,
  EyeOff,
  CheckSquare,
  Square,
  Eye,
  Maximize2,
  Pin,
  MessageCircle,
  Share2,
  Bookmark,
  Clock,
  Hash
} from "lucide-react";
import DropActionsMenu from "./DropActionsMenu";

const DEFAULT_AVATAR = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png";

function formatTime(date) {
  if (!date) return "";
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatusChip({ status, hidden, pinned }) {
  const map = {
    approved: { bg: "rgba(34,197,94,0.14)", color: "#22c55e", icon: <CheckCircle2 size={11} />, label: "Approved" },
    rejected: { bg: "rgba(239,68,68,0.14)", color: "#ef4444", icon: <XCircle size={11} />, label: "Rejected" },
  };
  const s = map[status] || map.approved;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border" style={{ background: s.bg, color: s.color, borderColor: `${s.color}44` }}>
        {s.icon} {s.label}
      </span>
      {hidden && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border" style={{ background: "rgba(138,92,255,0.14)", color: "#8A5CFF", borderColor: "rgba(138,92,255,0.4)" }}>
          <EyeOff size={11} /> Hidden
        </span>
      )}
      {pinned && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border" style={{ background: "rgba(255,208,0,0.16)", color: "#FFD000", borderColor: "rgba(255,208,0,0.35)" }}>
          <Pin size={11} /> Pinned
        </span>
      )}
    </div>
  );
}

export default function GlowDropCard({ drop, selected, onToggleSelect, onPreview, onApprove, onReject, onHide, onUnhide, onDelete, onPin, onUnpin, t, isDark }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tags = (drop.hashtags || "").split(/[,\s#]+/).map(s => s.trim()).filter(Boolean).slice(0, 5);
  const status = drop.status || "approved";
  const hasMedia = !!drop.media_url;

  return (
    <article
      className="relative overflow-hidden rounded-[2rem] border transition-all duration-300 hover:-translate-y-1"
      style={{
        background: isDark ? "linear-gradient(180deg, rgba(18,24,38,0.98), rgba(11,15,26,0.98))" : "#FFFFFF",
        borderColor: selected ? t.borderStrong : t.border,
        boxShadow: selected ? `0 0 0 2px ${t.accentSoft}, 0 24px 80px rgba(0,0,0,0.28)` : "0 18px 60px rgba(0,0,0,0.22)",
        opacity: drop.hidden ? 0.86 : 1,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-24 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(31,184,255,0.18), rgba(138,92,255,0.12), rgba(255,208,0,0.12))" }} />

      <div className="relative z-10 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onToggleSelect} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition hover:scale-105" style={{ background: selected ? t.accentSoft : t.surfaceMuted, color: selected ? t.accent : t.textMuted }}>
              {selected ? <CheckSquare size={17} /> : <Square size={17} />}
            </button>
            <div className="w-12 h-12 rounded-full p-[2px] shrink-0" style={{ background: t.gradient }}>
              <div className="w-full h-full rounded-full overflow-hidden" style={{ background: t.surface }}>
                <img src={DEFAULT_AVATAR} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm truncate" style={{ color: t.textPrimary }}>{drop.user_email || "Glow Believer"}</p>
              <p className="text-xs flex items-center gap-1.5" style={{ color: t.textMuted }}>
                <Clock size={11} /> {formatTime(drop.created_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onPreview} className="w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-105" style={{ color: t.accent, background: t.accentSoft }} title="Preview drop">
              <Maximize2 size={15} />
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen(v => !v)} className="w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-105" style={{ color: t.textSecondary, background: t.surfaceMuted }} title="More actions">
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <DropActionsMenu
                  drop={drop}
                  onClose={() => setMenuOpen(false)}
                  onApprove={onApprove}
                  onReject={onReject}
                  onHide={onHide}
                  onUnhide={onUnhide}
                  onDelete={onDelete}
                  onPin={onPin}
                  onUnpin={onUnpin}
                  t={t}
                  isDark={isDark}
                />
              )}
            </div>
          </div>
        </div>

        <div onClick={onPreview} className="relative overflow-hidden rounded-[1.5rem] cursor-pointer group border" style={{ borderColor: t.border, background: hasMedia ? "#000000" : "linear-gradient(160deg, #071126 0%, #102A5C 48%, #08101F 100%)" }}>
          {hasMedia ? (
            <>
              <img src={drop.media_url} alt={drop.verse || "Glow Drop"} loading="lazy" className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/25" />
            </>
          ) : (
            <div className="aspect-[4/5] min-h-[420px] flex flex-col items-center justify-center text-center px-8 relative overflow-hidden">
              <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-40" style={{ background: "#1FB8FF" }} />
              <div className="absolute -bottom-20 -right-16 w-64 h-64 rounded-full blur-3xl opacity-30" style={{ background: "#FFD000" }} />
              {drop.verse && <h3 className="relative z-10 font-['Space_Grotesk'] text-2xl md:text-3xl font-black leading-tight text-white drop-shadow-xl">{drop.verse}</h3>}
              {drop.reflection && <p className="relative z-10 mt-5 text-sm md:text-base leading-relaxed italic max-w-md text-white/82 line-clamp-6">“{drop.reflection}”</p>}
              <div className="relative z-10 mt-7 h-1 w-20 rounded-full" style={{ background: t.gradient }} />
            </div>
          )}

          {hasMedia && (drop.verse || drop.reflection) && (
            <div className="absolute left-5 right-16 bottom-5 text-white">
              {drop.verse && <h3 className="font-['Space_Grotesk'] text-xl md:text-2xl font-black leading-tight drop-shadow-lg line-clamp-3">{drop.verse}</h3>}
              {drop.reflection && <p className="mt-2 text-sm text-white/86 leading-relaxed line-clamp-3 drop-shadow">{drop.reflection}</p>}
            </div>
          )}

          <div className="absolute right-3 bottom-4 flex flex-col items-center gap-3">
            {[
              { icon: <Heart size={18} />, value: drop.likes_count || 0, color: "#f43f5e" },
              { icon: <MessageCircle size={18} />, value: drop.comments_count || 0, color: "#1FB8FF" },
              { icon: <Share2 size={18} />, value: drop.shares_count || 0, color: "#FFD000" },
              { icon: <Bookmark size={18} />, value: null, color: "#FFFFFF" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/15 bg-black/45 shadow-lg" style={{ color: item.color }}>
                  {item.icon}
                </div>
                {item.value !== null && <span className="text-[11px] font-black text-white drop-shadow">{item.value}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <StatusChip status={status} hidden={drop.hidden} pinned={drop.pinned} />
            {drop.category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider" style={{ background: t.accentSoft, color: t.accent }}>
                <Hash size={11} /> {drop.category}
              </span>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => <span key={tag} className="text-xs font-bold" style={{ color: t.textMuted }}>#{tag}</span>)}
            </div>
          )}

          {drop.hidden && drop.hidden_reason && (
            <div className="rounded-2xl px-4 py-3 flex items-start gap-2 text-xs" style={{ background: "rgba(138,92,255,0.1)", border: "1px solid rgba(138,92,255,0.25)" }}>
              <EyeOff size={14} style={{ color: "#8A5CFF", marginTop: 1 }} className="shrink-0" />
              <span style={{ color: t.textSecondary }}><span className="font-black" style={{ color: "#8A5CFF" }}>Hidden reason:</span> {drop.hidden_reason}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1">
            {status !== "approved" && (
              <button onClick={onApprove} className="py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition hover:opacity-85" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.28)" }}>
                <CheckCircle2 size={14} /> Approve
              </button>
            )}
            {status !== "rejected" && (
              <button onClick={onReject} className="py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition hover:opacity-85" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.28)" }}>
                <XCircle size={14} /> Reject
              </button>
            )}
            {!drop.hidden ? (
              <button onClick={onHide} className="py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition hover:opacity-85" style={{ background: "rgba(138,92,255,0.12)", color: "#8A5CFF", border: "1px solid rgba(138,92,255,0.28)" }}>
                <EyeOff size={14} /> Hide
              </button>
            ) : (
              <button onClick={onUnhide} className="py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition hover:opacity-85" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.28)" }}>
                <Eye size={14} /> Unhide
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}