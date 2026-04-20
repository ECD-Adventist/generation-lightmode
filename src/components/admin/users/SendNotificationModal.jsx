import React, { useState } from "react";
import { X, Loader2, Bell, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SendNotificationModal({ targetUser, onClose, t }) {
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) { toast.error("Message cannot be empty"); return; }
    setLoading(true);
    try {
      await base44.functions.invoke("adminSendUserNotification", {
        targetUserId: targetUser.id,
        message: message.trim(),
        sendEmail,
        subject: subject.trim() || undefined,
      });
      toast.success(sendEmail ? "Notification + email sent." : "Notification sent.");
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Failed to send.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
      <div className="border rounded-2xl w-full max-w-md shadow-2xl" style={{ background: t.surface, borderColor: t.border }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: t.accentSoft }}>
              <Bell className="w-5 h-5" style={{ color: t.accent }} />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: t.textPrimary }}>Send Notification</h3>
              <p className="text-xs" style={{ color: t.textMuted }}>To {targetUser.full_name || targetUser.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="transition hover:opacity-70" style={{ color: t.textMuted }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: t.textSecondary }}>
            <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="rounded" />
            Also send as email
          </label>

          {sendEmail && (
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: t.textSecondary }}>Email Subject</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Message from Generation LightMode"
                className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: t.textSecondary }}>Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              placeholder="Type your message here..."
              maxLength={500}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none resize-none"
              style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
            />
            <p className="text-[10px] mt-1" style={{ color: t.textMuted }}>{message.length}/500</p>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t" style={{ borderColor: t.border }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm transition" style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}>Cancel</button>
          <button
            disabled={loading || !message.trim()}
            onClick={handleSend}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: t.accent, border: "none" }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}