import React, { useState } from "react";
import { Play, Pause, CalendarPlus, Trash2, Download, X, Loader2, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { getChallengeStatus } from "./challengeHelpers";

function exportCSV(challenges, submissions) {
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [
    ["Title", "Description", "Status", "Start", "End", "Reward", "Territory", "Metric", "Participants", "Submissions", "Created"],
    ...challenges.map(c => {
      const subs = submissions.filter(s => s.challenge_id === c.id);
      const participants = new Set(subs.map(s => s.user_email)).size;
      return [
        c.title, c.description, getChallengeStatus(c),
        c.start_date || "", c.end_date || "", c.points_reward || 0,
        c.territory_scope || "", c.territory_metric || "",
        participants, subs.length, c.created_date || "",
      ];
    }),
  ];
  const csv = rows.map(r => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `challenges_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ChallengesBulkBar({ selected, setSelected, challenges, submissions, onRefresh, t }) {
  const [busy, setBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  if (selected.size === 0) return null;

  const selectedList = challenges.filter(c => selected.has(c.id));

  const run = async (fn, successMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(successMsg);
      setSelected(new Set());
      onRefresh();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setBusy(false);
      setMoreOpen(false);
    }
  };

  const bulkActivate = () => run(
    async () => { for (const c of selectedList) await base44.entities.Challenge.update(c.id, { active: true }); },
    `Activated ${selected.size} challenge(s)`
  );
  const bulkDeactivate = () => run(
    async () => { for (const c of selectedList) await base44.entities.Challenge.update(c.id, { active: false }); },
    `Deactivated ${selected.size} challenge(s)`
  );
  const bulkExtend = async () => {
    const days = parseInt(window.prompt("Extend end date by how many days?", "7"), 10);
    if (!days || days <= 0) return;
    run(async () => {
      for (const c of selectedList) {
        const current = c.end_date ? new Date(c.end_date) : new Date();
        current.setDate(current.getDate() + days);
        await base44.entities.Challenge.update(c.id, { end_date: current.toISOString().slice(0, 10) });
      }
    }, `Extended ${selected.size} challenge(s) by ${days} day(s)`);
  };
  const bulkDelete = () => {
    if (!window.confirm(`Delete ${selected.size} challenge(s)? This cannot be undone.`)) return;
    run(
      async () => { for (const c of selectedList) await base44.entities.Challenge.delete(c.id); },
      `Deleted ${selected.size} challenge(s)`
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border" style={{ background: t.accentSoft, borderColor: t.borderStrong || t.border }}>
      <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ background: t.accent, color: "#fff" }}>
        {selected.size} selected
      </span>

      <button onClick={bulkActivate} disabled={busy} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition hover:opacity-80"
        style={{ borderColor: "rgba(34,197,94,0.3)", color: "#22c55e", background: "rgba(34,197,94,0.06)" }}>
        <Play size={11} /> Activate
      </button>
      <button onClick={bulkDeactivate} disabled={busy} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition hover:opacity-80"
        style={{ borderColor: "rgba(148,163,184,0.3)", color: t.textSecondary, background: t.surface }}>
        <Pause size={11} /> Deactivate
      </button>
      <button onClick={bulkExtend} disabled={busy} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition hover:opacity-80"
        style={{ borderColor: t.border, color: t.textSecondary, background: t.surface }}>
        <CalendarPlus size={11} /> Extend
      </button>

      <div className="relative">
        <button onClick={() => setMoreOpen(v => !v)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition hover:opacity-80"
          style={{ borderColor: t.border, color: t.textSecondary, background: t.surface }}>
          More <ChevronDown size={11} />
        </button>
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-[80]" onClick={() => setMoreOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-xl p-1 z-[90]" style={{ background: t.surface, borderColor: t.border }}>
              <button onClick={() => { setMoreOpen(false); exportCSV(selectedList, submissions); toast.success("Exported to CSV"); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition hover:opacity-80" style={{ color: t.textSecondary }}>
                <Download size={12} /> Export selected
              </button>
              <button onClick={() => { setMoreOpen(false); bulkDelete(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition hover:opacity-80" style={{ color: "#ef4444" }}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </>
        )}
      </div>

      {busy && <Loader2 size={13} className="animate-spin" style={{ color: t.accent }} />}

      <button onClick={() => setSelected(new Set())} className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition hover:opacity-70" style={{ color: t.textMuted }}>
        <X size={11} /> Clear
      </button>
    </div>
  );
}