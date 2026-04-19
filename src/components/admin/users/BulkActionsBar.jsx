import React, { useState } from "react";
import { RefreshCw, Ban, CheckCircle2, Shield, Bell, Download, X, Loader2, ChevronDown } from "lucide-react";

// Top-level bulk toolbar. Keeps existing "set territory status" and adds:
// suspend / reactivate / role / notify / export-selected.
export default function BulkActionsBar({
  selectedCount,
  selectedUsers,
  bulkStatus, setBulkStatus, onApplyTerritory, territoryUpdating,
  onBulkSuspend, onBulkReactivate, onBulkRole, onBulkNotify, onExportSelected, onClear,
  t,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  if (selectedCount === 0) return null;

  const suspendedCount = selectedUsers.filter(u => u.status === "suspended").length;
  const activeCount = selectedCount - suspendedCount;

  const MoreItem = ({ icon, label, onClick, danger }) => (
    <button
      onClick={() => { setMoreOpen(false); onClick(); }}
      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition hover:opacity-80"
      style={{ color: danger ? t.danger : t.textSecondary }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border" style={{ background: t.accentSoft, borderColor: t.borderStrong }}>
      <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ background: t.accent, color: "#fff" }}>
        {selectedCount} selected
      </span>

      {/* Territory status (existing) */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>Territory:</span>
        <select
          value={bulkStatus}
          onChange={e => setBulkStatus(e.target.value)}
          className="border rounded-lg px-2 py-1 text-xs focus:outline-none font-semibold"
          style={{ background: t.surface, borderColor: t.border, color: t.textPrimary }}
        >
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          onClick={onApplyTerritory}
          disabled={territoryUpdating}
          className="flex items-center gap-1 px-3 py-1 rounded-lg text-white text-xs font-bold disabled:opacity-50"
          style={{ background: t.accent }}
        >
          {territoryUpdating ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          Apply
        </button>
      </div>

      <div className="w-px h-5 mx-1" style={{ background: t.border }} />

      {/* Fast bulk actions */}
      {activeCount > 0 && (
        <button
          onClick={onBulkSuspend}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition"
          style={{ borderColor: "rgba(239,68,68,0.3)", color: t.danger, background: "rgba(239,68,68,0.06)" }}
          title={`Suspend ${activeCount} active user(s)`}
        >
          <Ban size={11} /> Suspend
        </button>
      )}
      {suspendedCount > 0 && (
        <button
          onClick={onBulkReactivate}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition"
          style={{ borderColor: "rgba(34,197,94,0.3)", color: t.success, background: "rgba(34,197,94,0.06)" }}
          title={`Reactivate ${suspendedCount} suspended user(s)`}
        >
          <CheckCircle2 size={11} /> Reactivate
        </button>
      )}

      <button
        onClick={onBulkNotify}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition"
        style={{ borderColor: t.border, color: t.textSecondary, background: t.surface }}
      >
        <Bell size={11} /> Notify
      </button>

      {/* More menu */}
      <div className="relative">
        <button
          onClick={() => setMoreOpen(v => !v)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition"
          style={{ borderColor: t.border, color: t.textSecondary, background: t.surface }}
        >
          More <ChevronDown size={11} />
        </button>
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-[80]" onClick={() => setMoreOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-xl p-1 z-[90]" style={{ background: t.surface, borderColor: t.border, boxShadow: t.shadowLg }}>
              <MoreItem icon={<Shield size={12} />} label="Change role" onClick={onBulkRole} />
              <MoreItem icon={<Download size={12} />} label="Export selected" onClick={onExportSelected} />
            </div>
          </>
        )}
      </div>

      <button
        onClick={onClear}
        className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition"
        style={{ color: t.textMuted }}
        title="Clear selection"
      >
        <X size={11} /> Clear
      </button>
    </div>
  );
}