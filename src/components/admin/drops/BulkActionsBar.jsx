import React from "react";
import { CheckCircle2, XCircle, EyeOff, Trash2, X, Loader2 } from "lucide-react";

export default function BulkActionsBar({ count, onApprove, onReject, onHide, onDelete, onClear, busy, t }) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border" style={{ background: t.accentSoft, borderColor: t.borderStrong }}>
      <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ background: t.accent, color: "#fff" }}>
        {count} selected
      </span>
      <div className="w-px h-5 mx-1" style={{ background: t.border }} />

      <button onClick={onApprove} disabled={busy} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border disabled:opacity-50" style={{ borderColor: "rgba(34,197,94,0.3)", color: "#22c55e", background: "rgba(34,197,94,0.06)" }}>
        {busy ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Approve
      </button>
      <button onClick={onReject} disabled={busy} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border disabled:opacity-50" style={{ borderColor: "rgba(239,68,68,0.3)", color: "#ef4444", background: "rgba(239,68,68,0.06)" }}>
        <XCircle size={11} /> Reject
      </button>
      <button onClick={onHide} disabled={busy} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border disabled:opacity-50" style={{ borderColor: "rgba(138,92,255,0.3)", color: "#8A5CFF", background: "rgba(138,92,255,0.06)" }}>
        <EyeOff size={11} /> Hide
      </button>
      <button onClick={onDelete} disabled={busy} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border disabled:opacity-50" style={{ borderColor: "rgba(239,68,68,0.3)", color: "#ef4444", background: "rgba(239,68,68,0.06)" }}>
        <Trash2 size={11} /> Delete
      </button>

      <button onClick={onClear} className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition" style={{ color: t.textMuted }}>
        <X size={11} /> Clear
      </button>
    </div>
  );
}