import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const TABS = [
  { key: "active",   label: "Active",   color: "#22c55e" },
  { key: "upcoming", label: "Upcoming", color: "#FFD000" },
  { key: "ended",    label: "Ended",    color: "#94a3b8" },
  { key: "draft",    label: "Drafts",   color: "#8A5CFF" },
  { key: "all",      label: "All",      color: null },
];

export default function ChallengesToolbar({
  filter, setFilter,
  search, setSearch,
  territoryFilter, setTerritoryFilter,
  sortBy, setSortBy,
  territories,
  counts,
  t,
}) {
  return (
    <div className="border rounded-2xl p-4 flex flex-wrap gap-3 items-center" style={{ background: t.surface, borderColor: t.border }}>
      <div className="flex p-1 rounded-lg border overflow-x-auto" style={{ background: t.surfaceMuted, borderColor: t.border }}>
        {TABS.map(tab => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap"
              style={active
                ? { background: tab.color ? `${tab.color}22` : t.surface, color: tab.color || t.textPrimary, border: `1px solid ${tab.color ? `${tab.color}55` : t.border}` }
                : { background: "transparent", color: t.textMuted, border: "1px solid transparent" }
              }
            >
              {tab.label}
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: active ? (tab.color ? `${tab.color}33` : t.surfaceMuted) : t.surface, color: active ? (tab.color || t.textPrimary) : t.textMuted }}>
                {counts[tab.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {territories.length > 0 && (
        <select value={territoryFilter} onChange={e => setTerritoryFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}>
          <option value="all">All Territories</option>
          {territories.map(tt => <option key={tt} value={tt}>{tt}</option>)}
        </select>
      )}

      <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none" style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}>
        <option value="newest">Newest first</option>
        <option value="ending_soon">Ending soon</option>
        <option value="most_participants">Most participants</option>
        <option value="highest_reward">Highest reward</option>
      </select>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textMuted }} />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search title or description..."
          className="pl-9 rounded-lg text-sm w-full"
          style={{ background: t.surfaceMuted, borderColor: t.border, color: t.textPrimary }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition" style={{ color: t.textMuted }}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}