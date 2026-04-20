import React, { useState } from "react";
import { Loader2, Bell, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function BulkNotifyModal({ users, onClose, onDone, t }) {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: users.length });

  const run = async () => {
    if (!message.trim()) { toast.error("Message required"); return; }
    if (sendEmail && !subject.trim()) { toast.error("Subject required when sending email"); return; }

    setBusy(true);
    let ok = 0, fail = 0;
    for (let i = 0; i < users.length; i++) {
      try {
        await base44.functions.invoke("adminSendUserNotification", {
          targetUserId: users[i].id,
          message,
          subject: sendEmail ? subject : undefined,
          sendEmail,
        });
        ok++;
      } catch { fail++; }
      setProgress({ done: i + 1, total: users.length });
    }
    setBusy(false);
    toast.success(`Sent to ${ok} user(s)${fail ? ` · ${fail} failed` : ""}`);
    onDone?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
      <div className="border rounded-2xl p-6 w-full max-w-md" style={{ background: t.surface, borderColor: t.border, boxShadow: t.shadowXl }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: t.accentSoft }}>
              <Bell size={18} style={{ color: t.accent }} />
            </div>
            <h3 className="font-bold text-lg" style={{ color: t.textPrimary }}>Broadcast to {users.length} user(s)</h3>
          </div>
          <button onClick={onClose} disabled={busy}><X size={18} style={{ color: t.textMuted }} /></button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: t.textMuted }}>In-app message *</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              maxLength={300}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
              placeholder="Your announcement..."
            />
            <p className="text-[10px] mt-1 text-right" style={{ color: t.textMuted }}>{message.length}/300</p>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer" style={{ color: t.textSecondary }}>
            <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
            Also send email
          </label>

          {sendEmail && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: t.textMuted }}>Email subject *</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
                placeholder="Subject line"
              />
            </div>
          )}
        </div>

        {busy && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: t.textSecondary }}>
              <span>Sending...</span>
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
            style={{ background: t.accent }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}
            Send to {users.length}
          </button>
        </div>
      </div>
    </div>
  );
}