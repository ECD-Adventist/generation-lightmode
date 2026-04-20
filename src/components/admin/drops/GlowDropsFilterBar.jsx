import React from "react";
import { Search, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";

const TABS = [
  { key: "approved", label: "Approved", color: "#22c55e" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
  { key: "hidden",   label: "Hidden",   color: "#8A5CFF" },
  { key: "all",      label: "All",      color: null },
];

export default function GlowDropsFilterBar({
  filter, setFilter,
  search, setSearch,
  filterCategory, setFilterCategory,
  allCategories,
  counts,
  t, isDark,
}) {
  return (
    <div className="border rounded-2xl p-4 flex flex-wrap gap-3 items-center" style={{ background: t.surface, borderColor: t.border }}>
      {/* Status tabs */}
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

      {/* Category filter */}
      {allCategories.length > 0 && (
        <div className="flex items-center gap-2 border rounded-lg px-1 py-1" style={{ background: t.surfaceMuted, borderColor: t.border }}>
          <Tag size={14} className="ml-2" style={{ color: t.textMuted }} />
          <BottomSheetSelect
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { value: "all", label: "All Categories" },
              ...allCategories.map(c => ({ value: c, label: c }))
            ]}
            triggerClassName="!border-0 !bg-transparent !py-1 !px-2 !min-w-[140px] !text-sm"
            triggerStyle={{ color: t.textPrimary }}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textMuted }} />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search reflection, verse, author, hashtag..."
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