import React, { useState } from "react";
import { Loader2, Ban, CheckCircle2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function BulkSuspendModal({ users, action, onClose, onDone, t }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: users.length });
  const isSuspend = action === "suspend";

  const run = async () => {
    if (isSuspend && !reason.trim()) { toast.error("Please provide a reason"); return; }
    setBusy(true);
    let ok = 0, fail = 0;
    for (let i = 0; i < users.length; i++) {
      try {
        await base44.functions.invoke("adminSuspendUser", {
          targetUserId: users[i].id,
          action: isSuspend ? "suspend" : "activate",
          reason: isSuspend ? reason : undefined,
        });
        ok++;
      } catch { fail++; }
      setProgress({ done: i + 1, total: users.length });
    }
    setBusy(false);
    toast.success(`${isSuspend ? "Suspended" : "Reactivated"} ${ok} user(s)${fail ? ` · ${fail} failed` : ""}`);
    onDone?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="border rounded-2xl p-6 w-full max-w-md" style={{ background: t.surface, borderColor: t.border, boxShadow: t.shadowXl }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isSuspend ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)" }}>
              {isSuspend ? <Ban size={18} style={{ color: t.danger }} /> : <CheckCircle2 size={18} style={{ color: t.success }} />}
            </div>
            <h3 className="font-bold text-lg" style={{ color: t.textPrimary }}>
              Bulk {isSuspend ? "Suspend" : "Reactivate"} {users.length} user(s)
            </h3>
          </div>
          <button onClick={onClose} disabled={busy}><X size={18} style={{ color: t.textMuted }} /></button>
        </div>

        {isSuspend && (
          <div className="mb-4">
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: t.textMuted }}>Reason *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
              placeholder="This reason will be recorded for each user..."
            />
          </div>
        )}

        {busy && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: t.textSecondary }}>
              <span>Processing...</span>
              <span className="font-bold">{progress.done}/{progress.total}</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: t.surfaceMuted }}>
              <div className="h-full transition-all" style={{ width: `${(progress.done / progress.total) * 100}%`, background: t.accent }} />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={busy} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: t.border, color: t.textSecondary }}>Cancel</button>
          <button
            onClick={run}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: isSuspend ? t.danger : t.success }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}