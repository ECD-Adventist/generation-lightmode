import React, { useState } from "react";
import { X, Loader2, ShieldAlert } from "lucide-react";

// Requires admin to type target user's email to confirm elevating to admin/super_admin
export default function RoleElevationConfirm({ targetUser, newRole, onCancel, onConfirm, t }) {
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const matches = typed.trim().toLowerCase() === (targetUser.email || "").toLowerCase();

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
      <div className="border rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ background: t.surface, borderColor: "rgba(239,68,68,0.4)" }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.12)" }}>
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-red-500">Confirm Privilege Elevation</h3>
            <p className="text-xs mt-1" style={{ color: t.textSecondary }}>This grants powerful access. Cannot be undone silently.</p>
          </div>
          <button onClick={onCancel} className="transition hover:opacity-70" style={{ color: t.textMuted }}><X size={18} /></button>
        </div>

        <div className="rounded-xl p-3 mb-4 space-y-2" style={{ background: t.surfaceMuted, border: `1px solid ${t.border}` }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: t.textMuted }}>Promoting:</span>
            <span className="font-semibold" style={{ color: t.textPrimary }}>{targetUser.full_name || targetUser.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: t.textMuted }}>New role:</span>
            <span className="font-bold px-2 py-0.5 rounded-full text-xs uppercase tracking-wider" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>{newRole.replace(/_/g, " ")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: t.textMuted }}>Email:</span>
            <span className="font-mono text-xs" style={{ color: t.textSecondary }}>{targetUser.email}</span>
          </div>
        </div>

        <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: t.textSecondary }}>
          Type the user's email to confirm
        </label>
        <input
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder={targetUser.email}
          className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none font-mono"
          style={{ background: t.surfaceMuted, borderColor: matches ? "#22c55e" : t.border, color: t.textPrimary }}
        />
        {typed && !matches && <p className="text-[11px] mt-1 text-red-500">Email doesn't match — please type exactly.</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border text-sm transition" style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}>Cancel</button>
          <button
            disabled={loading || !matches}
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: "#ef4444", border: "none" }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            Confirm Elevation
          </button>
        </div>
      </div>
    </div>
  );
}