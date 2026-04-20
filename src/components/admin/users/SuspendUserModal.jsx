import React, { useState } from "react";
import { X, Loader2, AlertTriangle, Ban, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SuspendUserModal({ targetUser, action, onClose, onDone, t }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const isSuspend = action === "suspend";

  const handleConfirm = async () => {
    if (isSuspend && !reason.trim()) {
      toast.error("Please provide a reason for suspension.");
      return;
    }
    setLoading(true);
    try {
      await base44.functions.invoke("adminSuspendUser", {
        targetUserId: targetUser.id,
        action,
        reason: reason.trim(),
      });
      toast.success(isSuspend
        ? `${targetUser.full_name || targetUser.email} suspended.`
        : `${targetUser.full_name || targetUser.email} reactivated.`
      );
      onDone?.();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
      <div className="border rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ background: t.surface, borderColor: isSuspend ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isSuspend ? <Ban className="w-6 h-6 text-red-500" /> : <CheckCircle2 className="w-6 h-6 text-green-500" />}
            <h3 className="font-bold text-lg" style={{ color: isSuspend ? "#ef4444" : "#22c55e" }}>
              {isSuspend ? "Suspend User" : "Reactivate User"}
            </h3>
          </div>
          <button onClick={onClose} className="transition hover:opacity-70" style={{ color: t.textMuted }}><X size={18} /></button>
        </div>

        <p className="text-sm mb-4" style={{ color: t.textSecondary }}>
          {isSuspend ? "You are about to suspend " : "You are about to reactivate "}
          <span className="font-semibold" style={{ color: t.textPrimary }}>{targetUser.full_name || targetUser.email}</span>.
        </p>

        {isSuspend && (
          <>
            <div className="rounded-xl p-3 mb-4 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-500">Suspended users cannot post, like, comment, or interact in groups until reactivated.</p>
            </div>

            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: t.textSecondary }}>Reason (required)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Violated community guidelines, spam posts..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none resize-none"
              style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
            />
          </>
        )}

        {!isSuspend && targetUser.suspended_reason && (
          <div className="rounded-xl p-3 mb-4" style={{ background: t.surfaceMuted, border: `1px solid ${t.border}` }}>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: t.textMuted }}>Original reason</p>
            <p className="text-sm" style={{ color: t.textSecondary }}>{targetUser.suspended_reason}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm transition" style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}>Cancel</button>
          <button
            disabled={loading || (isSuspend && !reason.trim())}
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: isSuspend ? "#ef4444" : "#22c55e", border: "none" }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : (isSuspend ? <Ban size={14} /> : <CheckCircle2 size={14} />)}
            {isSuspend ? "Suspend" : "Reactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}