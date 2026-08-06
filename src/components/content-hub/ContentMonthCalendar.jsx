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
    <div className="w-full max-w-[280px] mx-auto lg:mx-0">
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:bg-white/10" style={{ color: "#7F8CA2" }} aria-label="Previous month"><ChevronLeft size={15} /></button>
        <span className="font-['Space_Grotesk'] font-medium text-xl text-white">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:bg-white/10" style={{ color: "#7F8CA2" }} aria-label="Next month"><ChevronRight size={15} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-3">
        {WEEKDAYS.map((d, i) => <div key={i} className="text-center text-[10px] font-bold uppercase" style={{ color: "#778397" }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const key = toKey(day);
          const hasContent = contentDates.has(key);
          const isSelected = key === selectedDate;
          const isToday = key === todayKey;
          return (
            <button key={i} onClick={() => onSelect(key)} className="h-8 rounded-lg flex flex-col items-center justify-center transition relative" style={{ background: isSelected ? "linear-gradient(135deg, #18C8FF 0%, #70D2B2 48%, #F4C84A 100%)" : "transparent", boxShadow: isSelected ? "0 5px 16px rgba(24,200,255,0.2)" : "none" }}>
              <span className="text-[12px] font-semibold" style={{ color: isSelected ? "#07111F" : isToday ? "#FFFFFF" : "#D5DDEA" }}>{day.getDate()}</span>
              {hasContent && !isSelected && <span className="absolute -bottom-0.5 w-4 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, #18C8FF, #F4C84A)" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}