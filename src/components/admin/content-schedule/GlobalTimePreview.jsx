import React from "react";
import { Globe2 } from "lucide-react";

const zones = [
  ["Nairobi · Addis Ababa · Kampala · Dar es Salaam", "Africa/Nairobi"],
  ["Kigali · Goma · Bujumbura", "Africa/Kigali"],
  ["Kinshasa", "Africa/Kinshasa"],
  ["Antananarivo", "Indian/Antananarivo"],
];

export default function GlobalTimePreview({ date, time }) {
  if (!date || !time) return null;
  const instant = new Date(`${date}T${time}`);
  const adminZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "your local timezone";
  if (Number.isNaN(instant.getTime())) return null;

  return <div className="rounded-xl p-3 bg-cyan-400/5 border border-cyan-400/20">
    <p className="text-xs font-bold text-cyan-300 flex items-center gap-1.5"><Globe2 size={13} /> One global release</p>
    <p className="text-[10px] text-white/50 mt-1 mb-2">Entered in {adminZone}. Everyone unlocks at the same instant.</p>
    <div className="space-y-1.5">{zones.map(([label, timeZone]) => (
      <div key={timeZone} className="flex justify-between gap-3 text-[10px]"><span className="text-white/55">{label}</span><strong className="text-white text-right shrink-0">{new Intl.DateTimeFormat(undefined, { timeZone, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(instant)}</strong></div>
    ))}</div>
  </div>;
}