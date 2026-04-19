import React from "react";
import { Target, Users, FileText, Award, MapPin, Edit2, Trash2, Eye, Calendar, Copy } from "lucide-react";
import { getChallengeStatus, statusTheme, timeUntil, countParticipants, countSubmissions } from "./challengeHelpers";

export default function ChallengeCard({ challenge, submissions, onView, onEdit, onDelete, onDuplicate, selected, onToggleSelect, t, isDark }) {
  const status = getChallengeStatus(challenge);
  const s = statusTheme(status);
  const participants = countParticipants(challenge.id, submissions);
  const subCount = countSubmissions(challenge.id, submissions);

  const countdown = status === "active" && challenge.end_date ? `Ends ${timeUntil(challenge.end_date)}`
                  : status === "upcoming" && challenge.start_date ? `Starts ${timeUntil(challenge.start_date)}`
                  : status === "ended" && challenge.end_date ? `Ended ${timeUntil(challenge.end_date)}`
                  : "";

  return (
    <div
      className="border rounded-2xl p-5 flex flex-col gap-3 transition cursor-pointer hover:opacity-95 relative"
      style={{ background: t.surface, borderColor: selected ? t.accent : t.border, boxShadow: t.shadow }}
      onClick={onView}
    >
      {onToggleSelect && (
        <label className="absolute top-3 right-3 cursor-pointer" onClick={e => e.stopPropagation()}>
          <input type="checkbox" checked={!!selected} onChange={onToggleSelect} className="w-4 h-4 rounded cursor-pointer" />
        </label>
      )}

      {/* Header */}
      <div className="flex justify-between items-start gap-3 pr-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0" style={{ background: "rgba(255,208,0,0.1)", borderColor: "rgba(255,208,0,0.2)" }}>
            <Target className="w-5 h-5" style={{ color: isDark ? "#FFD000" : "#d97706" }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base leading-tight truncate" style={{ color: t.textPrimary }}>{challenge.title}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-1 border" style={{ background: s.bg, color: s.color, borderColor: `${s.color}40` }}>
              {s.label}
            </span>
          </div>
        </div>
        <span className="font-black text-sm shrink-0" style={{ color: isDark ? "#FFD000" : "#d97706" }}>+{challenge.points_reward || 0} XP</span>
      </div>

      {/* Description */}
      {challenge.description && (
        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: t.textSecondary }}>{challenge.description}</p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: t.textMuted }}>
        {countdown && (
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} /> {countdown}
          </span>
        )}
        {challenge.territory_scope && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {challenge.territory_scope}
          </span>
        )}
        {challenge.territory_metric && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: t.accentSoft, color: t.accent }}>
            {challenge.territory_metric.replace("_", " ")}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: t.border }}>
        <div className="flex items-center gap-1.5 text-xs">
          <Users size={13} style={{ color: t.accent }} />
          <span className="font-bold" style={{ color: t.textPrimary }}>{participants}</span>
          <span style={{ color: t.textMuted }}>participants</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <FileText size={13} style={{ color: t.accent }} />
          <span className="font-bold" style={{ color: t.textPrimary }}>{subCount}</span>
          <span style={{ color: t.textMuted }}>submissions</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: t.border }}>
        <button
          onClick={(e) => { e.stopPropagation(); onView?.(); }}
          className="flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition hover:opacity-80"
          style={{ background: t.accentSoft, color: t.accent, border: `1px solid ${t.accent}40` }}
        >
          <Eye size={13} /> View
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
          className="py-2 px-3 rounded-lg text-xs transition hover:opacity-80"
          style={{ background: t.surfaceMuted, color: t.textSecondary, border: `1px solid ${t.border}` }}
          title="Edit"
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}
          className="py-2 px-3 rounded-lg text-xs transition hover:opacity-80"
          style={{ background: t.surfaceMuted, color: t.textSecondary, border: `1px solid ${t.border}` }}
          title="Duplicate"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          className="py-2 px-3 rounded-lg text-xs transition hover:opacity-80"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}