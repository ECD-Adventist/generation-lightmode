import React, { useMemo } from "react";
import ContentCard, { LockedContentCard } from "./ContentCard";
import { CONTENT_TYPES, typeMeta } from "./contentConstants";

const dateKey = item => new Date(item.scheduled_at).toLocaleDateString("en-CA");
const dateLabel = key => new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function ContentGroupedList({ items, locked = false }) {
  const groups = useMemo(() => CONTENT_TYPES.map(type => {
    const typed = items.filter(item => item.content_type === type.id);
    const dates = [...new Set(typed.map(dateKey))].sort((a, b) => locked ? a.localeCompare(b) : b.localeCompare(a));
    return { type, dates: dates.map(date => ({ date, languages: [...new Set(typed.filter(item => dateKey(item) === date).map(item => item.language || "Other"))].sort() })) };
  }).filter(group => group.dates.length), [items, locked]);

  return <div className="space-y-10">{groups.map(({ type, dates }) => (
    <section key={type.id} aria-labelledby={`${locked ? "upcoming" : "available"}-${type.id}`}>
      <h3 id={`${locked ? "upcoming" : "available"}-${type.id}`} className="glm-headline text-xl text-white flex items-center gap-2 mb-5">
        <span aria-hidden="true">{type.emoji}</span> {type.label}s
      </h3>
      <div className="space-y-8">{dates.map(({ date, languages }) => (
        <div key={date} className="pl-3 border-l" style={{ borderColor: `${type.color}55` }}>
          <h4 className="text-sm font-bold text-white mb-4">{dateLabel(date)}</h4>
          <div className="space-y-6">{languages.map(language => {
            const matching = items.filter(item => item.content_type === type.id && dateKey(item) === date && (item.language || "Other") === language);
            return <div key={language}><p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: typeMeta(type.id).color }}>{language}</p>
              <div className={`grid gap-4 ${locked ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                {matching.map((item, index) => locked ? <LockedContentCard key={item.id} item={item} /> : <ContentCard key={item.id} item={item} priority={index < 3} />)}
              </div>
            </div>;
          })}</div>
        </div>
      ))}</div>
    </section>
  ))}</div>;
}