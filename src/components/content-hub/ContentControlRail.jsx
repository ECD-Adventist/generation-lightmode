import React from "react";
import { Search } from "lucide-react";
import ContentMonthCalendar from "./ContentMonthCalendar";
import LanguageDropdown from "./LanguageDropdown";
import { CONTENT_TYPES } from "./contentConstants";

export default function ContentControlRail({ items, selectedDate, onSelectDate, search, onSearch, viewAll, onToggleViewAll, languages, language, onLanguage, type, onType }) {
  return (
    <section className="px-4 md:px-6 pb-10">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[300px_1fr] gap-8 lg:gap-14 items-center rounded-3xl px-5 py-7 md:px-10 md:py-10" style={{ background: "radial-gradient(circle at 18% 38%, rgba(24,200,255,0.08), transparent 34%), linear-gradient(135deg, #0B1220 0%, #0C1424 55%, #09101D 100%)", border: "1px solid rgba(86,122,172,0.2)", boxShadow: "0 24px 70px rgba(0,0,0,0.28)" }}>
        <ContentMonthCalendar items={items} selectedDate={selectedDate} onSelect={onSelectDate} />
        <div className="min-w-0">
          <h1 className="glm-headline text-3xl md:text-5xl text-white mb-3">All Things <span className="glm-gradient-text">New</span></h1>
          <p className="glm-body text-sm md:text-base max-w-2xl mb-6">Videos, posters & animations in your language — new content unlocks on schedule. Download it, share it, spread the light.</p>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#71809A" }} />
            <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search resources by title or keyword…" className="w-full rounded-xl py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-[#71809A]" style={{ background: "linear-gradient(135deg, rgba(27,39,64,0.94), rgba(18,29,50,0.94))", border: "1px solid rgba(97,126,171,0.42)" }} />
          </div>
          <button onClick={onToggleViewAll} className="w-full rounded-xl py-3 text-sm font-bold text-white mb-3" style={{ border: "1px solid rgba(255,255,255,0.78)", background: viewAll ? "rgba(24,200,255,0.12)" : "transparent" }}>{viewAll ? "Show Selected Date" : "View All Content"}</button>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            {languages.length > 1 ? <LanguageDropdown languages={languages} selected={language} onSelect={onLanguage} /> : <div />}
            <button onClick={() => onType("all")} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: "linear-gradient(135deg, #18243B, #111B30)", color: type === "all" ? "#18C8FF" : "#FFFFFF", border: "1px solid rgba(255,255,255,0.04)" }}>All Types <span className="text-lg leading-none">⌄</span></button>
          </div>
          <div className="flex flex-wrap gap-2 rounded-xl p-2" style={{ background: "linear-gradient(135deg, #18243B, #111B30)" }}>
            {CONTENT_TYPES.map(({ id, label, icon: Icon, color }) => <button key={id} onClick={() => onType(id)} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold" style={{ color: type === id ? color : "#DCE5F4", background: type === id ? `${color}18` : "transparent" }}><Icon size={13} />{label}s</button>)}
          </div>
        </div>
      </div>
    </section>
  );
}