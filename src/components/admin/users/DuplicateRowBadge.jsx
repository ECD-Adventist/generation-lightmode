import React from "react";
import { AlertTriangle } from "lucide-react";

export default function DuplicateRowBadge({ severity, onClick, t }) {
  const colors = {
    strong: { bg: "rgba(239,68,68,0.15)", fg: "#ef4444", label: "DUP" },
    medium: { bg: "rgba(255,208,0,0.18)", fg: "#fbbf24", label: "DUP?" },
    weak: { bg: "rgba(138,92,255,0.15)", fg: "#8A5CFF", label: "MAYBE" },
  }[severity] || { bg: t.surfaceMuted, fg: t.textMuted, label: "DUP" };

  return (
    <button
      onClick={onClick}
      title={`Possible duplicate (${severity}). Click to review.`}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition hover:opacity-80"
      style={{ background: colors.bg, color: colors.fg, border: `1px solid ${colors.fg}40` }}
    >
      <AlertTriangle size={9} /> {colors.label}
    </button>
  );
}