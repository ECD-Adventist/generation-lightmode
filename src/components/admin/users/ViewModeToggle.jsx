import React from "react";
import { Table, Globe, TrendingUp } from "lucide-react";

const MODES = [
  { key: "table", label: "Table", icon: <Table size={13} /> },
  { key: "heatmap", label: "Heatmap", icon: <Globe size={13} /> },
  { key: "cohorts", label: "Cohorts", icon: <TrendingUp size={13} /> },
];

export default function ViewModeToggle({ mode, onChange, t }) {
  return (
    <div className="inline-flex items-center p-1 rounded-xl border" style={{ background: t.surface, borderColor: t.border }}>
      {MODES.map(m => {
        const active = mode === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition"
            style={active
              ? { background: t.gradient, color: "#fff", boxShadow: t.shadow }
              : { color: t.textSecondary, background: "transparent" }}
          >
            {m.icon} {m.label}
          </button>
        );
      })}
    </div>
  );
}