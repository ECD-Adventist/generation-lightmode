import React, { useState } from "react";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import MobileBottomSheet from "@/components/mobile/MobileBottomSheet";

/**
 * Mobile-only delete-account sheet — LightMode branded (light mode).
 */
export default function MobileDeleteAccountSheet({ isOpen, onClose, userEmail, onConfirm }) {
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

  const handleClose = () => {
    if (busy) return;
    setTyped("");
    onClose?.();
  };

  const header = (
    <div className="relative overflow-hidden px-5 pt-4 pb-5" style={{ background: "linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%)" }}>
      <div className="absolute -top-6 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: "#DC2626", opacity: 0.12 }} />
      <div className="relative flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #F87171, #DC2626)", boxShadow: "0 8px 20px rgba(220, 38, 38, 0.25)" }}>
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Delete your account?</h2>
          <p className="text-xs mt-0.5" style={{ color: "#6B7FA0" }}>This action cannot be undone</p>
        </div>
      </div>
    </div>
  );

  return (
    <MobileBottomSheet isOpen={isOpen} onClose={handleClose} dismissible={!busy} header={header} maxHeight="85dvh">
      <div className="px-5 py-4">
        <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#6B7FA0" }}>
          This will permanently remove your profile, all your <strong style={{ color: "#0B1B3D" }}>Glow Drops</strong>, messages, comments, prayer requests, follows, and <strong style={{ color: "#0B1B3D" }}>group memberships</strong>.
        </p>

        <div className="rounded-2xl p-4 mb-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <p className="font-black text-[13px] mb-2" style={{ color: "#991B1B" }}>What happens next:</p>
          <ul className="space-y-1.5 text-[12.5px]" style={{ color: "#991B1B" }}>
            <li className="flex gap-2"><span>•</span><span>Your Glow Drops, messages, comments, and prayer requests are permanently deleted.</span></li>
            <li className="flex gap-2"><span>•</span><span>Your follows and group memberships are removed.</span></li>
            <li className="flex gap-2"><span>•</span><span>Your account record is deleted and you'll be signed out.</span></li>
          </ul>
        </div>

        <label className="block text-[12px] font-black uppercase tracking-wider mb-2" style={{ color: "#0B1B3D" }}>
          Type <span className="font-mono" style={{ color: "#DC2626" }}>DELETE</span> to confirm
        </label>
        <input
          type="text"
          autoFocus
          disabled={busy}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="DELETE"
          inputMode="text"
          autoCapitalize="characters"
          className="w-full h-12 rounded-xl px-4 text-sm font-mono tracking-wider focus:outline-none"
          style={{ background: "#F6F8FC", border: "1.5px solid #E0EAF5", color: "#0B1B3D" }}
        />
        {userEmail && (
          <p className="text-[11px] mt-2" style={{ color: "#8A97B5" }}>
            Account: <span className="font-mono">{userEmail}</span>
          </p>
        )}

        <div className="flex gap-2.5 mt-5">
          <button
            onClick={handleClose}
            disabled={busy}
            className="flex-1 h-12 rounded-full font-black text-sm active:scale-[0.98] transition disabled:opacity-60"
            style={{ background: "#F6F8FC", color: "#0B1B3D", border: "1px solid #E0EAF5" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canDelete}
            className="flex-1 h-12 rounded-full font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:cursor-not-allowed"
            style={{
              background: canDelete ? "linear-gradient(90deg, #EF4444, #DC2626)" : "#FCA5A5",
              color: "#FFFFFF",
              boxShadow: canDelete ? "0 8px 24px rgba(220, 38, 38, 0.35)" : "none",
            }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {busy ? "Submitting…" : "Delete"}
          </button>
        </div>
      </div>
    </MobileBottomSheet>
  );
}