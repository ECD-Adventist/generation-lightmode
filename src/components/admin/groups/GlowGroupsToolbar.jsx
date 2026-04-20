import React from "react";
import { Search, Filter, Globe2, Activity, Lock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";

export default function GlowGroupsToolbar({
  search, setSearch,
  filterCountry, setFilterCountry,
  filterActivity, setFilterActivity,
  filterPrivacy, setFilterPrivacy,
  allCountries,
  t,
}) {
  return (
    <div className="border rounded-2xl p-4 flex flex-wrap gap-3 items-center" style={{ background: t.surface, borderColor: t.border }}>
      <div className="flex items-center gap-2 border rounded-lg px-1 py-1" style={{ background: t.surfaceMuted, borderColor: t.border }}>
        <Activity size={14} className="ml-2" style={{ color: t.textMuted }} />
        <BottomSheetSelect
          value={filterActivity}
          onChange={setFilterActivity}
          options={[
            { value: "all", label: "All Activity" },
            { value: "thriving", label: "Thriving" },
            { value: "active", label: "Active" },
            { value: "quiet", label: "Quiet" },
            { value: "dormant", label: "Dormant" }
          ]}
          triggerClassName="!border-0 !bg-transparent !py-1 !px-2 !min-w-[120px] !text-sm"
          triggerStyle={{ color: t.textPrimary }}
        />
      </div>

      <div className="flex items-center gap-2 border rounded-lg px-1 py-1" style={{ background: t.surfaceMuted, borderColor: t.border }}>
        <Globe2 size={14} className="ml-2" style={{ color: t.textMuted }} />
        <BottomSheetSelect
          value={filterCountry}
          onChange={setFilterCountry}
          options={[
            { value: "all", label: "All Countries" },
            ...allCountries.map(c => ({ value: c, label: c }))
          ]}
          triggerClassName="!border-0 !bg-transparent !py-1 !px-2 !min-w-[140px] !text-sm"
          triggerStyle={{ color: t.textPrimary }}
        />
      </div>

      <div className="flex items-center gap-2 border rounded-lg px-1 py-1" style={{ background: t.surfaceMuted, borderColor: t.border }}>
        <Lock size={14} className="ml-2" style={{ color: t.textMuted }} />
        <BottomSheetSelect
          value={filterPrivacy}
          onChange={setFilterPrivacy}
          options={[
            { value: "all", label: "All Privacy" },
            { value: "public", label: "Public" },
            { value: "private", label: "Private" }
          ]}
          triggerClassName="!border-0 !bg-transparent !py-1 !px-2 !min-w-[120px] !text-sm"
          triggerStyle={{ color: t.textPrimary }}
        />
      </div>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textMuted }} />
        <Input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search group, leader, tag..."
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