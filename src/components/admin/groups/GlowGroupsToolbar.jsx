import React from "react";
import { Search, Filter, Globe2, Activity, Lock, X } from "lucide-react";
import { Input } from "@/components/ui/input";

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
      <div className="flex items-center gap-2 border rounded-lg px-3 py-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
        <Activity size={14} style={{ color: t.textMuted }} />
        <select className="bg-transparent text-sm focus:outline-none" style={{ color: t.textPrimary }} value={filterActivity} onChange={e => setFilterActivity(e.target.value)}>
          <option value="all">All Activity</option>
          <option value="thriving">Thriving</option>
          <option value="active">Active</option>
          <option value="quiet">Quiet</option>
          <option value="dormant">Dormant</option>
        </select>
      </div>

      <div className="flex items-center gap-2 border rounded-lg px-3 py-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
        <Globe2 size={14} style={{ color: t.textMuted }} />
        <select className="bg-transparent text-sm focus:outline-none max-w-[140px]" style={{ color: t.textPrimary }} value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
          <option value="all">All Countries</option>
          {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2 border rounded-lg px-3 py-2" style={{ background: t.surfaceMuted, borderColor: t.border }}>
        <Lock size={14} style={{ color: t.textMuted }} />
        <select className="bg-transparent text-sm focus:outline-none" style={{ color: t.textPrimary }} value={filterPrivacy} onChange={e => setFilterPrivacy(e.target.value)}>
          <option value="all">All Privacy</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
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