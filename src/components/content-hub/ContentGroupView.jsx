import React, { useState, useMemo } from "react";
import { ChevronDown, CalendarDays } from "lucide-react";
import ContentCard, { LockedContentCard } from "./ContentCard";
import { CONTENT_TYPES, typeMeta } from "./contentConstants";

function formatDateLabel(dateStr) {
  if (!dateStr || dateStr === "9999-99-99") return "Unscheduled";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function ContentGroupView({ items, locked = false }) {
  const [collapsedTypes, setCollapsedTypes] = useState(new Set());

  const toggleType = (typeId) => {
    setCollapsedTypes(prev => {
      const next = new Set(prev);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const typeId = item.content_type || "other";
      if (!map.has(typeId)) map.set(typeId, new Map());
      const dateKey = item.scheduled_at ? item.scheduled_at.slice(0, 10) : "9999-99-99";
      const typeMap = map.get(typeId);
      if (!typeMap.has(dateKey)) typeMap.set(dateKey, new Map());
      const langMap = typeMap.get(dateKey);
      const lang = item.language || "Other";
      if (!langMap.has(lang)) langMap.set(lang, []);
      langMap.get(lang).push(item);
    }
    return map;
  }, [items]);

  const typeOrder = CONTENT_TYPES.map(t => t.id);

  return (
    <div className="space-y-5">
      {typeOrder.map(typeId => {
        const typeMap = grouped.get(typeId);
        if (!typeMap || typeMap.size === 0) return null;
        const meta = typeMeta(typeId);
        const dates = [...typeMap.keys()].sort((a, b) => a.localeCompare(b));
        const itemCount = [...typeMap.values()].reduce(
          (sum, m) => sum + [...m.values()].reduce((s, arr) => s + arr.length, 0), 0
        );
        const collapsed = collapsedTypes.has(typeId);

        return (
          <div key={typeId} className="rounded-2xl overflow-hidden" style={{ background: "#121826", border: `1px solid ${meta.color}25` }}>
            <button
              type="button"
              onClick={() => toggleType(typeId)}
              className="w-full flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{meta.emoji}</span>
                <div className="text-left">
                  <h3 className="font-['Space_Grotesk'] font-black text-base text-white">{meta.label}s</h3>
                  <p className="text-[11px]" style={{ color: "#8A9BB0" }}>{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <ChevronDown
                size={20}
                className="transition-transform"
                style={{ color: meta.color, transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
              />
            </button>
            {!collapsed && (
              <div className="px-4 pb-4 space-y-4">
                {dates.map(dateKey => {
                  const langMap = typeMap.get(dateKey);
                  const langs = [...langMap.keys()].sort();
                  return (
                    <div key={dateKey} className="rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <CalendarDays size={13} style={{ color: meta.color }} />
                        <span className="text-xs font-bold text-white">{formatDateLabel(dateKey)}</span>
                      </div>
                      <div className="p-4 space-y-4">
                        {langs.map(lang => {
                          const cards = langMap.get(lang);
                          return (
                            <div key={lang}>
                              <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#8A9BB0" }}>{lang}</p>
                              <div className={locked
                                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                              }>
                                {cards.map(item => locked
                                  ? <LockedContentCard key={item.id} item={item} />
                                  : <ContentCard key={item.id} item={item} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}