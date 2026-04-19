import React from "react";
import { X, Heart, Calendar, Tag, Hash, Mail, EyeOff, CheckCircle2, XCircle, Trash2, Eye, Copy } from "lucide-react";
import { toast } from "sonner";

function StatusPill({ status, hidden }) {
  const map = {
    approved: { bg: "rgba(34,197,94,0.15)", color: "#22c55e", label: "Approved" },
    rejected: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Rejected" },
  };
  const s = map[status] || map.approved;
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: s.bg, color: s.color, borderColor: `${s.color}40` }}>
        {s.label}
      </span>
      {hidden && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ background: "rgba(138,92,255,0.15)", color: "#8A5CFF", borderColor: "rgba(138,92,255,0.4)" }}>
          <EyeOff size={10} /> Hidden
        </span>
      )}
    </div>
  );
}

export default function DropPreviewModal({ drop, onClose, onApprove, onReject, onHide, onUnhide, onDelete, t, isDark }) {
  if (!drop) return null;

  const tags = (drop.hashtags || "").split(/[,\s#]+/).map(s => s.trim()).filter(Boolean);

  const copyContent = () => {
    const text = [drop.verse, drop.reflection].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
        style={{ background: t.surface, borderColor: t.border }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b gap-4" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shrink-0" style={{ background: t.gradient }}>
              {drop.user_email?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-bold truncate" style={{ color: t.textPrimary }}>
                <Mail size={12} style={{ color: t.textMuted }} /> {drop.user_email}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] mt-0.5" style={{ color: t.textMuted }}>
                <Calendar size={11} /> {drop.created_date ? new Date(drop.created_date).toLocaleString() : "—"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusPill status={drop.status || "approved"} hidden={drop.hidden} />
            <button onClick={onClose} className="p-2 rounded-lg transition hover:opacity-70" style={{ background: t.surfaceMuted, color: t.textMuted }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {drop.media_url && (
            <div className="rounded-xl overflow-hidden border bg-black" style={{ borderColor: t.border }}>
              <img src={drop.media_url} className="w-full max-h-[400px] object-contain" alt="Drop media" />
            </div>
          )}

          {drop.verse && (
            <div className="rounded-xl p-5 border" style={{ background: t.accentSoft, borderColor: `${t.accent}40` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: t.accent }}>Scripture</p>
              <p className="text-lg font-bold italic leading-relaxed" style={{ color: t.textPrimary }}>
                "{drop.verse}"
              </p>
            </div>
          )}

          {drop.reflection && (
            <div className="rounded-xl p-5 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>Reflection</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: t.textSecondary }}>
                {drop.reflection}
              </p>
            </div>
          )}

          {drop.hidden && drop.hidden_reason && (
            <div className="rounded-xl p-4 border flex gap-2 items-start" style={{ background: "rgba(138,92,255,0.1)", borderColor: "rgba(138,92,255,0.3)" }}>
              <EyeOff size={14} style={{ color: "#8A5CFF", marginTop: 2 }} className="shrink-0" />
              <div>
                <p className="text-xs font-bold" style={{ color: "#8A5CFF" }}>Hidden from public feed</p>
                <p className="text-xs mt-1" style={{ color: t.textSecondary }}>{drop.hidden_reason}</p>
              </div>
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 border flex items-center gap-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
              <Heart size={14} style={{ color: "#f43f5e" }} />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>Likes</p>
                <p className="font-bold" style={{ color: t.textPrimary }}>{drop.likes_count || 0}</p>
              </div>
            </div>
            <div className="rounded-xl p-3 border flex items-center gap-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
              <Tag size={14} style={{ color: t.accent }} />
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>Category</p>
                <p className="font-bold" style={{ color: t.textPrimary }}>{drop.category || "—"}</p>
              </div>
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: t.textMuted }}>
                <Hash size={11} /> Hashtags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-md text-[11px] font-bold" style={{ background: t.accentSoft, color: t.accent }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap gap-2 p-4 border-t" style={{ borderColor: t.border, background: t.surfaceMuted }}>
          {drop.status !== "approved" && (
            <button onClick={onApprove} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition hover:opacity-80" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
              <CheckCircle2 size={14} /> Approve
            </button>
          )}
          {drop.status !== "rejected" && (
            <button onClick={onReject} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition hover:opacity-80" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
              <XCircle size={14} /> Reject
            </button>
          )}
          {!drop.hidden ? (
            <button onClick={onHide} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition hover:opacity-80" style={{ background: "rgba(138,92,255,0.1)", color: "#8A5CFF", border: "1px solid rgba(138,92,255,0.25)" }}>
              <EyeOff size={14} /> Hide
            </button>
          ) : (
            <button onClick={onUnhide} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition hover:opacity-80" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
              <Eye size={14} /> Unhide
            </button>
          )}
          <button onClick={copyContent} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition hover:opacity-80" style={{ background: t.surface, color: t.textSecondary, border: `1px solid ${t.border}` }}>
            <Copy size={14} /> Copy
          </button>
          <button onClick={onDelete} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition hover:opacity-80" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}