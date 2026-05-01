import React, { useState } from "react";
import { Heart, MoreVertical, CheckCircle2, XCircle, EyeOff, CheckSquare, Square, Eye, Maximize2, Pin } from "lucide-react";
import DropActionsMenu from "./DropActionsMenu";

function StatusChip({ status, hidden, pinned, t }) {
  const map = {
    approved: { bg: "rgba(34,197,94,0.15)",  color: "#22c55e", icon: <CheckCircle2 size={10} />, label: "Approved" },
    rejected: { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", icon: <XCircle size={10} />,      label: "Rejected" },
  };
  const s = map[status] || map.approved;
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: s.bg, color: s.color, borderColor: `${s.color}40` }}>
        {s.icon} {s.label}
      </span>
      {hidden && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: "rgba(138,92,255,0.15)", color: "#8A5CFF", borderColor: "rgba(138,92,255,0.4)" }}>
          <EyeOff size={10} /> Hidden
        </span>
      )}
      {pinned && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: "rgba(255,208,0,0.18)", color: "#CC7A00", borderColor: "rgba(255,208,0,0.45)" }}>
          <Pin size={10} /> Pinned
        </span>
      )}
    </div>
  );
}

export default function GlowDropCard({ drop, selected, onToggleSelect, onPreview, onApprove, onReject, onHide, onUnhide, onDelete, onPin, onUnpin, t, isDark }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tags = (drop.hashtags || "").split(/[,\s#]+/).map(s => s.trim()).filter(Boolean).slice(0, 4);

  return (
    <div
      className="border rounded-2xl p-5 flex flex-col gap-3 transition"
      style={{
        background: t.surface,
        borderColor: selected ? t.borderStrong : t.border,
        boxShadow: selected ? `0 0 0 2px ${t.accentSoft}, ${t.shadow}` : t.shadow,
        opacity: drop.hidden ? 0.82 : 1,
      }}
    >
      {/* Header: avatar + meta + status + select */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onToggleSelect} className="shrink-0 transition hover:opacity-70" style={{ color: selected ? t.accent : t.textMuted }}>
            {selected ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ background: t.gradient }}>
            {drop.user_email?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: t.textPrimary }}>{drop.user_email}</p>
            <p className="text-[11px]" style={{ color: t.textMuted }}>{drop.created_date ? new Date(drop.created_date).toLocaleString() : ""}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusChip status={drop.status || "approved"} hidden={drop.hidden} pinned={drop.pinned} t={t} />
          {onPreview && (
            <button
              onClick={onPreview}
              className="p-1.5 rounded-lg transition hover:opacity-70"
              style={{ color: t.accent, background: t.accentSoft }}
              title="Preview drop"
            >
              <Maximize2 size={14} />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1.5 rounded-lg transition hover:opacity-70"
              style={{ color: t.textMuted, background: t.surfaceMuted }}
              title="More actions"
            >
              <MoreVertical size={15} />
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
                t={t} isDark={isDark}
              />
            )}
          </div>
        </div>
      </div>

      {/* Content — click to preview */}
      <div
        className="flex-1 rounded-xl p-4 border cursor-pointer transition hover:opacity-95"
        style={{ background: t.surfaceMuted, borderColor: t.border }}
        onClick={onPreview}
      >
        <p className="font-bold mb-2 text-sm" style={{ color: t.accent }}>
          {drop.verse || <span style={{ color: t.textMuted }}>No verse attached</span>}
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: t.textSecondary }}>
          {drop.reflection || <span style={{ color: t.textMuted }}>No reflection</span>}
        </p>

        {drop.media_url && (
          <div className="mt-3 relative rounded-lg overflow-hidden border bg-black h-40 group" style={{ borderColor: t.border }}>
            <img src={drop.media_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Attachment" />
          </div>
        )}

        {/* Hidden banner */}
        {drop.hidden && drop.hidden_reason && (
          <div className="mt-3 rounded-lg px-3 py-2 flex items-start gap-2 text-xs" style={{ background: "rgba(138,92,255,0.1)", border: "1px solid rgba(138,92,255,0.25)" }}>
            <EyeOff size={12} style={{ color: "#8A5CFF", marginTop: 1 }} className="shrink-0" />
            <span style={{ color: t.textSecondary }}><span className="font-bold" style={{ color: "#8A5CFF" }}>Hidden:</span> {drop.hidden_reason}</span>
          </div>
        )}
      </div>

      {/* Footer meta row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "#f43f5e" }}>
            <Heart size={11} /> {drop.likes_count || 0}
          </span>
          {drop.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ background: t.accentSoft, color: t.accent }}>
              {drop.category}
            </span>
          )}
          {tags.map(tag => (
            <span key={tag} className="text-[10px] font-bold" style={{ color: t.textMuted }}>#{tag}</span>
          ))}
        </div>
      </div>

      {/* Primary action row — always visible for fast admin */}
      <div className="flex gap-2">
        {drop.status !== "approved" && (
          <button
            onClick={onApprove}
            className="flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition hover:opacity-80"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            <CheckCircle2 size={14} /> Approve
          </button>
        )}
        {drop.status !== "rejected" && (
          <button
            onClick={onReject}
            className="flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition hover:opacity-80"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <XCircle size={14} /> Reject
          </button>
        )}
        {!drop.hidden ? (
          <button
            onClick={onHide}
            className="flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition hover:opacity-80"
            style={{ background: "rgba(138,92,255,0.1)", color: "#8A5CFF", border: "1px solid rgba(138,92,255,0.25)" }}
          >
            <EyeOff size={14} /> Hide
          </button>
        ) : (
          <button
            onClick={onUnhide}
            className="flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition hover:opacity-80"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
          >
            <Eye size={14} /> Unhide
          </button>
        )}
      </div>
    </div>
  );
}