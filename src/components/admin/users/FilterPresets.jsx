import React, { useEffect, useState } from "react";
import { Bookmark, Plus, X, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "admin_users_filter_presets";

export default function FilterPresets({ currentFilters, onApply, t, isDark }) {
  const [presets, setPresets] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");

  // Load presets on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPresets(JSON.parse(stored));
    } catch { /* noop */ }
  }, []);

  const persist = (next) => {
    setPresets(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  const savePreset = () => {
    const name = newName.trim();
    if (!name) { toast.error("Give the preset a name"); return; }
    if (presets.some(p => p.name === name)) { toast.error("Name already in use"); return; }
    persist([...presets, { name, filters: currentFilters, createdAt: Date.now() }]);
    setNewName("");
    setSaving(false);
    toast.success(`Preset "${name}" saved`);
  };

  const deletePreset = (name) => {
    persist(presets.filter(p => p.name !== name));
    toast.success(`Removed "${name}"`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition"
        style={{ borderColor: t.border, color: t.textSecondary, background: t.surface }}
      >
        <Bookmark size={13} />
        Presets {presets.length > 0 && <span className="opacity-60">({presets.length})</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-72 rounded-xl border shadow-xl p-3 z-[100]"
            style={{ background: t.surface, borderColor: t.border, boxShadow: t.shadowLg }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: t.textMuted }}>
              Saved Filter Presets
            </p>

            {presets.length === 0 ? (
              <p className="text-xs py-3 text-center" style={{ color: t.textMuted }}>No presets yet.</p>
            ) : (
              <div className="space-y-1 max-h-56 overflow-y-auto adm-scroll">
                {presets.map(p => (
                  <div
                    key={p.name}
                    className="flex items-center gap-2 p-2 rounded-lg border transition hover:opacity-90"
                    style={{ borderColor: t.border, background: t.surfaceMuted }}
                  >
                    <button
                      onClick={() => { onApply(p.filters); setOpen(false); toast.success(`Applied "${p.name}"`); }}
                      className="flex-1 text-left text-xs font-semibold truncate"
                      style={{ color: t.textPrimary }}
                    >
                      {p.name}
                    </button>
                    <button
                      onClick={() => deletePreset(p.name)}
                      className="p-1 rounded hover:opacity-70"
                      style={{ color: t.danger }}
                      title="Delete preset"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 mt-3 border-t" style={{ borderColor: t.border }}>
              {saving ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") savePreset(); if (e.key === "Escape") { setSaving(false); setNewName(""); } }}
                    placeholder="Preset name..."
                    className="flex-1 text-xs rounded-lg px-2 py-1.5 border focus:outline-none"
                    style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
                  />
                  <button onClick={savePreset} className="p-1.5 rounded-lg" style={{ background: t.accent, color: "#fff" }}><Check size={12} /></button>
                  <button onClick={() => { setSaving(false); setNewName(""); }} className="p-1.5 rounded-lg border" style={{ borderColor: t.border, color: t.textMuted }}><X size={12} /></button>
                </div>
              ) : (
                <button
                  onClick={() => setSaving(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold"
                  style={{ background: t.accentSoft, color: t.accent, border: `1px solid ${t.borderStrong}` }}
                >
                  <Plus size={12} /> Save current filters
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}