import React from "react";
import { Pencil, Plus } from "lucide-react";
import ContentThumbnail from "@/components/content-hub/ContentThumbnail";
import { typeMeta } from "@/components/content-hub/contentConstants";
import { useAdminTheme, getAdminTokens } from "../AdminThemeContext";

export default function DayContentPanel({ date, items, onAdd, onEdit }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  return (
    <div className="mt-4 rounded-xl p-4" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-bold" style={{ color: t.textPrimary }}>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { dateStyle: "full" })}</h4>
          <p className="text-[11px]" style={{ color: t.textMuted }}>{items.length} scheduled {items.length === 1 ? "item" : "items"}</p>
        </div>
        <button onClick={() => onAdd(date)} className="min-h-11 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold" style={{ background: "rgba(0,207,255,0.12)", color: t.accent }}><Plus size={13} /> Add Content</button>
      </div>
      {items.length === 0 ? <p className="text-xs py-4 text-center" style={{ color: t.textMuted }}>No content scheduled for this date.</p> : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {items.map(item => { const meta = typeMeta(item.content_type); return (
            <button key={item.id} onClick={() => onEdit(item)} className="w-full min-h-14 flex items-center gap-3 rounded-xl p-2 text-left hover:opacity-80" style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}25` }}>
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0"><ContentThumbnail item={item} fallback={<div className="w-full h-full flex items-center justify-center"><meta.icon className="w-6 h-6" style={{ color: meta.color }} /></div>} /></div>
              <span className="flex-1 min-w-0"><span className="block text-xs font-bold truncate" style={{ color: t.textPrimary }}>{item.title}</span><span className="block text-[10px]" style={{ color: t.textMuted }}>{new Date(item.scheduled_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {meta.label} · {item.language}</span></span>
              <Pencil size={14} className="shrink-0" style={{ color: t.textSecondary }} />
            </button>
          ); })}
        </div>
      )}
    </div>
  );
}