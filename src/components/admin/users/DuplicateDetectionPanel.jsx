import React, { useMemo } from "react";
import { X, AlertTriangle, Users, Eye } from "lucide-react";
import { detectDuplicates } from "./userAnalytics";

export default function DuplicateDetectionPanel({ users, onClose, onOpenUser, t }) {
  const groups = useMemo(() => detectDuplicates(users), [users]);

  const severityStyle = (s) => ({
    strong: { fg: "#ef4444", bg: "rgba(239,68,68,0.1)", bd: "rgba(239,68,68,0.3)", label: "STRONG" },
    medium: { fg: "#fbbf24", bg: "rgba(255,208,0,0.1)", bd: "rgba(255,208,0,0.3)", label: "MEDIUM" },
    weak: { fg: "#8A5CFF", bg: "rgba(138,92,255,0.1)", bd: "rgba(138,92,255,0.3)", label: "WEAK" },
  }[s]);

  return (
    <div className="fixed inset-0 z-[200] flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-full overflow-y-auto shadow-2xl" style={{ background: t.surface, borderLeft: `1px solid ${t.border}` }}>
        <div className="sticky top-0 z-10 p-5 border-b flex items-center justify-between" style={{ background: t.surface, borderColor: t.border }}>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="font-bold text-lg" style={{ color: t.textPrimary }}>Duplicate Detection</h2>
                <p className="text-xs" style={{ color: t.textSecondary }}>
                  {groups.length} potential duplicate {groups.length === 1 ? "group" : "groups"} found
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-70" style={{ color: t.textSecondary, background: t.surfaceMuted }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                <Users size={28} />
              </div>
              <p className="font-bold text-sm" style={{ color: t.textPrimary }}>No duplicates detected</p>
              <p className="text-xs mt-1" style={{ color: t.textMuted }}>All user accounts appear unique.</p>
            </div>
          ) : (
            groups.map((g, i) => {
              const sv = severityStyle(g.severity);
              return (
                <div key={i} className="border rounded-xl p-4" style={{ background: t.surfaceMuted, borderColor: t.border }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: sv.bg, color: sv.fg, border: `1px solid ${sv.bd}` }}>
                        {sv.label}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: t.textPrimary }}>{g.reason}</span>
                    </div>
                    <span className="text-xs" style={{ color: t.textMuted }}>{g.users.length} accounts</span>
                  </div>
                  <div className="space-y-2">
                    {g.users.map(u => (
                      <div key={u.email} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: t.surface }}>
                        <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate" style={{ color: t.textPrimary }}>{u.full_name || "Unknown"}</p>
                          <p className="text-[11px] truncate" style={{ color: t.textMuted }}>{u.email}</p>
                        </div>
                        <div className="text-[10px] text-right" style={{ color: t.textMuted }}>
                          {u.country && <div>{u.country}</div>}
                          {u.created_date && <div>{new Date(u.created_date).toLocaleDateString()}</div>}
                        </div>
                        <button
                          onClick={() => onOpenUser(u)}
                          className="p-2 rounded-lg transition hover:opacity-70"
                          style={{ background: t.accentSoft, color: t.accent }}
                          title="Review user"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}