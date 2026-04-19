import React, { useState, useEffect } from "react";
import { X, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Delete modal with orphan warning — fetches impact data before showing
export default function DeleteUserModal({ targetUser, onClose, onConfirm, t }) {
  const [deleting, setDeleting] = useState(false);
  const [orphans, setOrphans] = useState(null);
  const [loadingImpact, setLoadingImpact] = useState(true);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("adminGetUserDetail", { targetUserId: targetUser.id });
        if (mounted) setOrphans(res.data?.orphans);
      } catch {
        if (mounted) setOrphans({});
      } finally {
        if (mounted) setLoadingImpact(false);
      }
    })();
    return () => { mounted = false; };
  }, [targetUser.id]);

  const hasOrphans = orphans && (orphans.owned_groups > 0 || orphans.total_drops > 0 || orphans.pending_prayers > 0 || orphans.group_memberships > 0);
  const matches = typed.trim().toLowerCase() === "delete";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="border rounded-2xl p-6 w-full max-w-md shadow-2xl" style={{ background: t.surface, borderColor: "rgba(239,68,68,0.3)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-red-500 text-lg flex items-center gap-2"><Trash2 size={18} /> Remove User</h3>
          <button onClick={onClose} className="transition hover:opacity-70" style={{ color: t.textMuted }}><X size={18} /></button>
        </div>

        <p className="text-sm mb-3" style={{ color: t.textSecondary }}>
          Are you sure you want to permanently remove <span className="font-semibold" style={{ color: t.textPrimary }}>{targetUser.full_name || targetUser.email}</span>?
        </p>

        {loadingImpact ? (
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: t.textMuted }}>
            <Loader2 size={14} className="animate-spin" /> Checking impact…
          </div>
        ) : hasOrphans ? (
          <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-500">This user has active data that may be affected:</p>
            </div>
            <ul className="space-y-1 pl-6 text-xs" style={{ color: t.textSecondary }}>
              {orphans.owned_groups > 0 && <li>• Leads <span className="font-bold text-red-500">{orphans.owned_groups}</span> GlowGroup{orphans.owned_groups === 1 ? "" : "s"} {orphans.owned_groups_list?.length > 0 && <span>({orphans.owned_groups_list.map(g => g.name).join(", ")})</span>}</li>}
              {orphans.total_drops > 0 && <li>• Posted <span className="font-bold">{orphans.total_drops}</span> Glow Drop{orphans.total_drops === 1 ? "" : "s"}</li>}
              {orphans.group_memberships > 0 && <li>• Member of <span className="font-bold">{orphans.group_memberships}</span> group{orphans.group_memberships === 1 ? "" : "s"}</li>}
              {orphans.pending_prayers > 0 && <li>• Has <span className="font-bold text-red-500">{orphans.pending_prayers}</span> unanswered prayer request{orphans.pending_prayers === 1 ? "" : "s"}</li>}
            </ul>
            <p className="text-[10px] mt-2 pl-6" style={{ color: t.textMuted }}>Their content will remain but their account access will be revoked.</p>
          </div>
        ) : null}

        <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: t.textSecondary }}>
          Type <span className="font-mono text-red-500">DELETE</span> to confirm
        </label>
        <input
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder="DELETE"
          className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none font-mono uppercase"
          style={{ background: t.surfaceMuted, borderColor: matches ? "#22c55e" : t.border, color: t.textPrimary }}
        />

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm transition" style={{ borderColor: t.border, color: t.textSecondary, background: "transparent" }}>Cancel</button>
          <button
            disabled={deleting || !matches}
            onClick={async () => { setDeleting(true); await onConfirm(); setDeleting(false); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Remove Permanently
          </button>
        </div>
      </div>
    </div>
  );
}