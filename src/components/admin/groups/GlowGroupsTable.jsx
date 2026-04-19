import React, { useState } from "react";
import { Users, MoreVertical, Globe2, Lock, Unlock, ArrowUp, ArrowDown, ChevronsUpDown, MessageSquare } from "lucide-react";
import { formatTimeAgo } from "./groupActivity";
import GroupQuickActionsMenu from "./GroupQuickActionsMenu";

function SortableTh({ label, sortKey, currentSort, onSort, t, align = "left", className = "" }) {
  const isActive = currentSort.key === sortKey;
  const dir = currentSort.dir;
  return (
    <th className={`p-4 font-semibold text-xs uppercase tracking-wider ${align === "right" ? "text-right" : ""} ${className}`} style={{ color: t.textSecondary }}>
      <button onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 uppercase tracking-wider font-semibold hover:opacity-80" style={{ color: isActive ? t.accent : t.textSecondary }}>
        {label}
        {isActive ? (dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ChevronsUpDown size={11} className="opacity-40" />}
      </button>
    </th>
  );
}

export default function GlowGroupsTable({ rows, sort, onSort, onViewGroup, onMessageLeader, onDeleteGroup, isDark, t }) {
  const [menuGroupId, setMenuGroupId] = useState(null);

  return (
    <div className="border rounded-2xl overflow-hidden shadow-xl" style={{ background: t.surface, borderColor: t.border }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b" style={{ borderColor: t.border, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(11,27,61,0.02)" }}>
              <SortableTh label="Group Details" sortKey="name"        currentSort={sort} onSort={onSort} t={t} />
              <SortableTh label="Leader"        sortKey="leader"      currentSort={sort} onSort={onSort} t={t} />
              <SortableTh label="Country"       sortKey="country"     currentSort={sort} onSort={onSort} t={t} />
              <SortableTh label="Members"       sortKey="members"     currentSort={sort} onSort={onSort} t={t} />
              <SortableTh label="Privacy"       sortKey="privacy"     currentSort={sort} onSort={onSort} t={t} />
              <SortableTh label="Activity"      sortKey="activityScore" currentSort={sort} onSort={onSort} t={t} />
              <SortableTh label="Last Message"  sortKey="lastMessageAt" currentSort={sort} onSort={onSort} t={t} />
              <SortableTh label="Created"       sortKey="created_date" currentSort={sort} onSort={onSort} t={t} />
              <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: t.textSecondary }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan="9" className="p-8 text-center" style={{ color: t.textMuted }}>No GlowGroups match your filters.</td></tr>
            ) : rows.map(r => {
              const g = r.group;
              const a = r.activity;
              const tags = (g.tags || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 2);
              return (
                <tr key={g.id} className="border-b transition" style={{ borderColor: t.border }}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {g.profile_picture_url ? (
                        <img src={g.profile_picture_url} alt="" className="w-10 h-10 rounded-xl object-cover border shrink-0" style={{ borderColor: t.border }} />
                      ) : (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border" style={{ background: isDark ? "rgba(138,92,255,0.1)" : "#f3e8ff", color: isDark ? "#8A5CFF" : "#7e22ce", borderColor: isDark ? "rgba(138,92,255,0.2)" : "#e9d5ff" }}>
                          <Users size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate max-w-[220px]" style={{ color: t.textPrimary }}>{g.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {tags.length > 0 ? tags.map(tg => (
                            <span key={tg} className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{ background: t.accentSoft, color: t.accent }}>#{tg}</span>
                          )) : (
                            <p className="text-xs truncate max-w-[220px]" style={{ color: t.textMuted }}>{g.description || "Community Group"}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium truncate max-w-[160px]" style={{ color: t.textSecondary }} title={g.leader_email}>{g.leader_email}</p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs" style={{ background: t.surfaceMuted, color: t.textSecondary }}>
                      <Globe2 size={12} style={{ color: t.accent }} /> {g.country || "Global"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: t.textPrimary }}>
                      <Users size={12} style={{ color: t.textMuted }} /> {r.memberCount}
                    </div>
                  </td>
                  <td className="p-4">
                    {g.privacy === "private" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(138,92,255,0.12)", color: "#8A5CFF", border: "1px solid rgba(138,92,255,0.25)" }}>
                        <Lock size={10} /> Private
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
                        <Unlock size={10} /> Public
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1" title={`${a.label} · score ${a.score}/100`}>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit" style={{ background: a.soft, color: a.color, border: `1px solid ${a.color}40` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.color }} />
                        {a.label}
                      </span>
                      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: t.surfaceMuted }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, a.score)}%`, background: a.color }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm" style={{ color: t.textSecondary }}>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={12} style={{ color: t.textMuted }} />
                      <span>{formatTimeAgo(r.lastMessageAt)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm" style={{ color: t.textSecondary }}>
                    {g.created_date ? new Date(g.created_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td className="p-4 text-right relative">
                    <button onClick={() => setMenuGroupId(menuGroupId === g.id ? null : g.id)} className="p-2 transition rounded-lg hover:opacity-70" title="More actions" style={{ color: t.textSecondary, background: t.surfaceMuted }}>
                      <MoreVertical size={16} />
                    </button>
                    {menuGroupId === g.id && (
                      <GroupQuickActionsMenu
                        group={g}
                        onClose={() => setMenuGroupId(null)}
                        onView={() => onViewGroup?.(g)}
                        onMessageLeader={() => onMessageLeader?.(g)}
                        onDelete={() => onDeleteGroup?.(g)}
                        t={t} isDark={isDark}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}