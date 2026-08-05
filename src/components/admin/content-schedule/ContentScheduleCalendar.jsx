import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { typeMeta } from "@/components/content-hub/contentConstants";
import { useAdminTheme, getAdminTokens } from "../AdminThemeContext";

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function ContentScheduleCalendar({ items, onDayClick, onItemClick }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const itemsByDay = useMemo(() => {
    const map = {};
    for (const item of items) {
      const key = dayKey(new Date(item.scheduled_at));
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [items]);

  const cells = useMemo(() => {
    const first = new Date(month);
    const startOffset = first.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < startOffset; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(month.getFullYear(), month.getMonth(), d));
    return list;
  }, [month]);

  const todayKey = dayKey(new Date());
  const shift = (n) => setMonth(m => new Date(m.getFullYear(), m.getMonth() + n, 1));

  return (
    <div className="rounded-2xl p-4" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold font-['Space_Grotesk'] text-sm" style={{ color: t.textPrimary }}>
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(11,63,217,0.06)", color: t.textSecondary }}><ChevronLeft size={15} /></button>
          <button onClick={() => shift(1)} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(11,63,217,0.06)", color: t.textSecondary }}><ChevronRight size={15} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="text-center text-[9px] font-black uppercase tracking-wider py-1" style={{ color: t.textMuted }}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />;
          const key = dayKey(date);
          const dayItems = itemsByDay[key] || [];
          const isToday = key === todayKey;
          return (
            <div key={key}
              onClick={() => onDayClick(key)}
              className="min-h-[74px] rounded-lg p-1 cursor-pointer group transition"
              style={{
                background: isToday ? (isDark ? "rgba(0,207,255,0.08)" : "rgba(11,63,217,0.06)") : (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"),
                border: `1px solid ${isToday ? (isDark ? "rgba(0,207,255,0.35)" : "rgba(11,63,217,0.3)") : t.border}`,
              }}>
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-bold" style={{ color: isToday ? t.accent : t.textSecondary }}>{date.getDate()}</span>
                <Plus size={10} className="opacity-0 group-hover:opacity-60 transition" style={{ color: t.textMuted }} />
              </div>
              <div className="space-y-0.5 mt-0.5">
                {dayItems.slice(0, 2).map(item => {
                  const meta = typeMeta(item.content_type);
                  return (
                    <button key={item.id}
                      onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                      className="w-full text-left rounded px-1 py-0.5 text-[9px] font-semibold truncate block transition hover:opacity-80"
                      style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}35` }}
                      title={item.title}>
                      {meta.emoji} {item.title}
                    </button>
                  );
                })}
                {dayItems.length > 2 && <p className="text-[8px] px-1 font-bold" style={{ color: t.textMuted }}>+{dayItems.length - 2} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}