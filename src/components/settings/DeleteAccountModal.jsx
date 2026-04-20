import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/**
 * In-app confirmation modal for account deletion.
 * Requires the user to type "DELETE" to enable the destructive action.
 * Invokes the provided `onConfirm` handler (simulated deletion — backend function
 * not wired here to avoid accidental data loss; integrate when ready).
 */
export default function DeleteAccountModal({ isOpen, onClose, userEmail, onConfirm }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const canDelete = typed.trim().toUpperCase() === "DELETE" && !busy;

  const handleConfirm = async () => {
    if (!canDelete) return;
    setBusy(true);
    try {
      if (onConfirm) {
        await onConfirm();
      } else {
        // Simulated deletion — replace with a backend function call when ready.
        await new Promise((r) => setTimeout(r, 1200));
        toast.success("Deletion request submitted. Our team will process it within 30 days.");
      }
      onClose?.();
    } catch (e) {
      toast.error(e?.message || "Could not submit your request. Please try again.");
    } finally {
      setBusy(false);
      setTyped("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v && !busy) { setTyped(""); onClose?.(); } }}>
      <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden" style={{ background: "#FFFFFF" }}>
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FEE2E2" }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#DC2626" }} />
            </div>
            <div>
              <h2 className="text-lg font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>
                Delete your account?
              </h2>
              <p className="text-sm mt-1" style={{ color: "#6B7FA0" }}>
                This will permanently remove your profile, all your <strong>Glow Drops</strong>, messages, comments, prayer requests, follows, and <strong>group memberships</strong>. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="rounded-xl p-3 mb-4 text-sm" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" }}>
            <p className="font-bold mb-1">What happens next:</p>
            <ul className="list-disc pl-5 space-y-0.5 text-[13px]">
              <li>Your Glow Drops, messages, comments, and prayer requests are permanently deleted.</li>
              <li>Your follows and group memberships are removed.</li>
              <li>Your account record is deleted and you'll be signed out.</li>
            </ul>
          </div>

          <label className="block text-[13px] font-bold mb-1.5" style={{ color: "#0B1B3D" }}>
            Type <span className="font-mono" style={{ color: "#DC2626" }}>DELETE</span> to confirm
          </label>
          <input
            type="text"
            autoFocus
            disabled={busy}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="DELETE"
            className="w-full h-11 rounded-xl px-3 text-sm focus:outline-none"
            style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}
          />
          {userEmail && (
            <p className="text-[11px] mt-2" style={{ color: "#8A97B5" }}>
              Account: <span className="font-mono">{userEmail}</span>
            </p>
          )}

          <div className="flex gap-2 mt-5">
            <button
              onClick={() => { if (!busy) { setTyped(""); onClose?.(); } }}
              disabled={busy}
              className="flex-1 h-11 rounded-xl font-bold text-sm transition disabled:opacity-60"
              style={{ background: "#F6F8FC", color: "#0B1B3D", border: "1px solid #E0EAF5" }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canDelete}
              className="flex-1 h-11 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: canDelete ? "#DC2626" : "#FCA5A5", color: "#FFFFFF" }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {busy ? "Submitting…" : "Delete my account"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}