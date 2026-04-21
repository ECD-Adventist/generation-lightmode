import React, { useState } from "react";
import { Loader2, Shield, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";

export default function BulkRoleModal({ users, allRoles, onClose, onDone, t }) {
  const [role, setRole] = useState("user");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: users.length });
  const ELEVATED = ["admin", "super_admin"];

  const run = async () => {
    if (ELEVATED.includes(role)) {
      const ok = window.confirm(`You're about to grant ${role.toUpperCase()} to ${users.length} users. Continue?`);
      if (!ok) return;
    }
    setBusy(true);
    let ok = 0, fail = 0;
    for (let i = 0; i < users.length; i++) {
      try {
        await base44.functions.invoke("adminUpdateUserRole", { targetUserId: users[i].id, newRole: role });
        ok++;
      } catch { fail++; }
      setProgress({ done: i + 1, total: users.length });
    }
    setBusy(false);
    toast.success(`Role updated for ${ok} user(s)${fail ? ` · ${fail} failed` : ""}`);
    onDone?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
      <div className="border rounded-2xl p-6 w-full max-w-md" style={{ background: t.surface, borderColor: t.border, boxShadow: t.shadowXl }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: t.accentSoft }}>
              <Shield size={18} style={{ color: t.accent }} />
            </div>
            <h3 className="font-bold text-lg" style={{ color: t.textPrimary }}>Bulk role change — {users.length} user(s)</h3>
          </div>
          <button onClick={onClose} disabled={busy}><X size={18} style={{ color: t.textMuted }} /></button>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: t.textMuted }}>New role</label>
          <BottomSheetSelect
            value={role}
            onChange={setRole}
            options={allRoles.map(r => ({ value: r, label: r.replace(/_/g, " ") }))}
            triggerClassName="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
            triggerStyle={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
          />
          {ELEVATED.includes(role) && (
            <p className="text-[11px] mt-2 font-semibold" style={{ color: t.warning }}>⚠ Granting elevated admin role. Review carefully.</p>
          )}
        </div>

        {busy && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: t.textSecondary }}>
              <span>Updating roles...</span>
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
            Apply to {users.length}
          </button>
        </div>
      </div>
    </div>
  );
}