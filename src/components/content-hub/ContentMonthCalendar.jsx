import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function ContentMonthCalendar({ items, selectedDate, onSelect }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const contentDates = useMemo(() => {
    const set = new Set();
    items.forEach(item => {
      if (item.scheduled_at) {
        const d = new Date(item.scheduled_at);
        set.add(toKey(d));
      }
    });
    return set;
  }, [items]);

  const days = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    return cells;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const todayKey = toKey(today);

  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,207,255,0.2)" }}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-white/10" style={{ color: "#C8D0E0" }}>
          <ChevronLeft size={16} />
        </button>
        <span className="font-['Space_Grotesk'] font-bold text-sm text-white">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-white/10" style={{ color: "#C8D0E0" }}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold uppercase" style={{ color: "#5A6B85" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const key = toKey(day);
          const hasContent = contentDates.has(key);
          const isSelected = key === selectedDate;
          const isToday = key === todayKey;
          return (
            <button key={i} onClick={() => onSelect(key)}
              className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition relative"
              style={{
                background: isSelected ? "linear-gradient(135deg, #00CFFF, #8A5CFF)" : hasContent ? "rgba(0,207,255,0.12)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isSelected ? "transparent" : isToday ? "rgba(0,207,255,0.4)" : "rgba(255,255,255,0.05)"}`,
              }}>
              <span className="text-[11px] font-bold" style={{ color: isSelected ? "#0B0F1A" : "#C8D0E0" }}>{day.getDate()}</span>
              {hasContent && <span className="w-1 h-1 rounded-full" style={{ background: isSelected ? "#0B0F1A" : "#00CFFF" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}