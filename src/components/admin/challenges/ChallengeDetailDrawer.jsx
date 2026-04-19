import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Target, Users, FileText, Calendar, MapPin, Award, ExternalLink, Trophy, Loader2 } from "lucide-react";
import { getChallengeStatus, statusTheme, timeUntil } from "./challengeHelpers";

export default function ChallengeDetailDrawer({ challenge, onClose, onEdit, t, isDark }) {
  const status = getChallengeStatus(challenge);
  const s = statusTheme(status);

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["challenge_submissions", challenge.id],
    queryFn: () => base44.entities.ChallengeSubmission.filter({ challenge_id: challenge.id }, "-created_date", 200),
    enabled: !!challenge.id,
  });

  const leaderboard = useMemo(() => {
    const map = new Map();
    subs.forEach(s => {
      if (!s.user_email) return;
      const entry = map.get(s.user_email) || { email: s.user_email, submissions: 0, points: 0 };
      entry.submissions += 1;
      entry.points += s.points_awarded || 0;
      map.set(s.user_email, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.points - a.points || b.submissions - a.submissions);
  }, [subs]);

  return (
    <div className="fixed inset-0 z-[90] flex" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="ml-auto w-full max-w-xl h-full border-l shadow-2xl overflow-hidden flex flex-col" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b" style={{ borderColor: t.border }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0" style={{ background: "rgba(255,208,0,0.1)", borderColor: "rgba(255,208,0,0.2)" }}>
                <Target className="w-6 h-6" style={{ color: isDark ? "#FFD000" : "#d97706" }} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold truncate" style={{ color: t.textPrimary }}>{challenge.title}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 border" style={{ background: s.bg, color: s.color, borderColor: `${s.color}40` }}>
                  {s.label}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg transition hover:opacity-70 shrink-0" style={{ background: t.surfaceMuted, color: t.textMuted }}>
              <X size={16} />
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={onEdit} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition hover:opacity-80" style={{ background: t.accentSoft, color: t.accent, border: `1px solid ${t.accent}40` }}>
              <ExternalLink size={13} /> Edit
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {challenge.description && (
            <p className="text-sm leading-relaxed" style={{ color: t.textSecondary }}>{challenge.description}</p>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
              <p className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1" style={{ color: t.textMuted }}>
                <Award size={11} /> Reward
              </p>
              <p className="font-black text-lg" style={{ color: isDark ? "#FFD000" : "#d97706" }}>+{challenge.points_reward || 0} XP</p>
            </div>
            <div className="rounded-xl p-3 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
              <p className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1" style={{ color: t.textMuted }}>
                <Users size={11} /> Participants
              </p>
              <p className="font-bold text-lg" style={{ color: t.textPrimary }}>{leaderboard.length}</p>
            </div>
            {challenge.start_date && (
              <div className="rounded-xl p-3 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
                <p className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1" style={{ color: t.textMuted }}>
                  <Calendar size={11} /> Starts
                </p>
                <p className="font-bold text-sm" style={{ color: t.textPrimary }}>{new Date(challenge.start_date).toLocaleDateString()}</p>
                <p className="text-[10px]" style={{ color: t.textMuted }}>{timeUntil(challenge.start_date)}</p>
              </div>
            )}
            {challenge.end_date && (
              <div className="rounded-xl p-3 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
                <p className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1" style={{ color: t.textMuted }}>
                  <Calendar size={11} /> Ends
                </p>
                <p className="font-bold text-sm" style={{ color: t.textPrimary }}>{new Date(challenge.end_date).toLocaleDateString()}</p>
                <p className="text-[10px]" style={{ color: t.textMuted }}>{timeUntil(challenge.end_date)}</p>
              </div>
            )}
            {challenge.territory_scope && (
              <div className="rounded-xl p-3 border col-span-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
                <p className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1" style={{ color: t.textMuted }}>
                  <MapPin size={11} /> Territory
                </p>
                <p className="font-bold text-sm" style={{ color: t.textPrimary }}>
                  {challenge.territory_scope}
                  {challenge.territory_metric && <span className="ml-2 text-[10px] font-bold" style={{ color: t.accent }}>· {challenge.territory_metric.replace("_", " ")}</span>}
                </p>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: t.textPrimary }}>
              <Trophy size={13} style={{ color: "#FFD000" }} /> Leaderboard
            </h3>
            {isLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: t.accent }} /></div>
            ) : leaderboard.length === 0 ? (
              <div className="py-6 text-center text-xs" style={{ color: t.textMuted }}>No participants yet.</div>
            ) : (
              <div className="space-y-1.5">
                {leaderboard.slice(0, 10).map((u, idx) => (
                  <div key={u.email} className="flex items-center gap-3 rounded-lg p-2 border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0" style={{ background: idx === 0 ? "#FFD000" : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : t.surface, color: idx < 3 ? "#0B1B3D" : t.textSecondary }}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold truncate flex-1" style={{ color: t.textPrimary }}>{u.email}</span>
                    <span className="text-[10px]" style={{ color: t.textMuted }}>{u.submissions} sub</span>
                    <span className="text-xs font-black" style={{ color: isDark ? "#FFD000" : "#d97706" }}>+{u.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submissions */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: t.textPrimary }}>
              <FileText size={13} /> Recent Submissions ({subs.length})
            </h3>
            {subs.length === 0 ? (
              <div className="py-4 text-center text-xs" style={{ color: t.textMuted }}>No submissions yet.</div>
            ) : (
              <div className="space-y-2">
                {subs.slice(0, 15).map(sub => (
                  <a key={sub.id} href={sub.submission_url} target="_blank" rel="noopener noreferrer" className="block rounded-lg p-3 border transition hover:opacity-80" style={{ background: t.surfaceMuted, borderColor: t.border }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate" style={{ color: t.textPrimary }}>{sub.user_email}</span>
                      <span className="text-[10px] shrink-0" style={{ color: t.textMuted }}>{sub.created_date ? new Date(sub.created_date).toLocaleDateString() : ""}</span>
                    </div>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: t.accent }}>{sub.submission_url}</p>
                    {sub.points_awarded > 0 && <p className="text-[10px] font-bold mt-1" style={{ color: isDark ? "#FFD000" : "#d97706" }}>+{sub.points_awarded} XP awarded</p>}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}