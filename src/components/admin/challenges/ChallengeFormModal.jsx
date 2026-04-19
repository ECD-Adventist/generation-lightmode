import React, { useState, useEffect } from "react";
import { X, Loader2, Save, Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const METRICS = [
  { value: "", label: "— None —" },
  { value: "glow_score", label: "Glow Score" },
  { value: "drops", label: "Drops" },
  { value: "followers", label: "Followers" },
];

export default function ChallengeFormModal({ challenge, onClose, onSaved, t }) {
  const isEdit = !!challenge?.id;
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    points_reward: 100,
    active: true,
    territory_scope: "",
    territory_metric: "",
  });

  useEffect(() => {
    if (challenge) {
      setForm({
        title: challenge.title || "",
        description: challenge.description || "",
        start_date: challenge.start_date || "",
        end_date: challenge.end_date || "",
        points_reward: challenge.points_reward ?? 100,
        active: challenge.active !== false,
        territory_scope: challenge.territory_scope || "",
        territory_metric: challenge.territory_metric || "",
      });
    }
  }, [challenge]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (publish = true) => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (form.points_reward == null || form.points_reward < 0) return toast.error("Reward must be 0 or more");
    if (form.start_date && form.end_date && new Date(form.end_date) < new Date(form.start_date)) {
      return toast.error("End date can't be before start date");
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      points_reward: Number(form.points_reward),
      active: publish ? form.active : false,
      territory_scope: form.territory_scope.trim(),
      territory_metric: form.territory_metric || null,
    };

    setBusy(true);
    try {
      if (isEdit) await base44.entities.Challenge.update(challenge.id, payload);
      else await base44.entities.Challenge.create(payload);
      toast.success(isEdit ? "Challenge updated" : publish ? "Challenge published" : "Saved as draft");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="w-full max-w-xl max-h-[92vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col" style={{ background: t.surface, borderColor: t.border }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,208,0,0.1)", color: "#FFD000" }}>
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: t.textPrimary }}>{isEdit ? "Edit Challenge" : "Create Challenge"}</h2>
              <p className="text-xs" style={{ color: t.textMuted }}>Define a mission for your community</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition hover:opacity-70" style={{ background: t.surfaceMuted, color: t.textMuted }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block" style={{ color: t.textMuted }}>Title *</label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. 7-Day Scripture Streak" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block" style={{ color: t.textMuted }}>Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} placeholder="Describe the challenge and what participants must do..." className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block" style={{ color: t.textMuted }}>Start Date</label>
              <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block" style={{ color: t.textMuted }}>End Date</label>
              <Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block" style={{ color: t.textMuted }}>Reward (XP) *</label>
              <Input type="number" min="0" value={form.points_reward} onChange={e => set("points_reward", e.target.value)} style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block" style={{ color: t.textMuted }}>Metric</label>
              <select value={form.territory_metric} onChange={e => set("territory_metric", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}>
                {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1 block" style={{ color: t.textMuted }}>Territory Scope</label>
            <Input value={form.territory_scope} onChange={e => set("territory_scope", e.target.value)} placeholder="e.g. Kenya, Global, or leave blank" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }} />
            <p className="text-[10px] mt-1" style={{ color: t.textMuted }}>Optional — restrict challenge to a country or region.</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => set("active", e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm font-semibold" style={{ color: t.textPrimary }}>Active (visible to users)</span>
          </label>
        </div>

        <div className="flex gap-2 p-4 border-t" style={{ borderColor: t.border, background: t.surfaceMuted }}>
          <button onClick={onClose} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-semibold border" style={{ background: t.surface, color: t.textSecondary, borderColor: t.border }}>
            Cancel
          </button>
          {!isEdit && (
            <button onClick={() => handleSubmit(false)} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-semibold border" style={{ background: t.surface, color: t.textSecondary, borderColor: t.border }}>
              Save as Draft
            </button>
          )}
          <button onClick={() => handleSubmit(true)} disabled={busy} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60" style={{ background: "linear-gradient(90deg, #FFD000 0%, #FF9F1A 100%)", color: "#0B1B3D" }}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isEdit ? "Update" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}