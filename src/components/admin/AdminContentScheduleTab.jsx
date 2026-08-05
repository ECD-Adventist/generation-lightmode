import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, CalendarDays, LayoutList, BarChart3, Pencil, Trash2, Lock, Unlock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ContentFormModal from "./content-schedule/ContentFormModal";
import ContentScheduleCalendar from "./content-schedule/ContentScheduleCalendar";
import ContentStatsPanel from "./content-schedule/ContentStatsPanel";
import { typeMeta } from "@/components/content-hub/contentConstants";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

export default function AdminContentScheduleTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const [view, setView] = useState("calendar");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [defaultDate, setDefaultDate] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["digital-content"],
    queryFn: () => base44.entities.DigitalContent.list("-scheduled_at", 500),
  });

  const { data: engagements = [] } = useQuery({
    queryKey: ["content-engagements"],
    queryFn: () => base44.entities.ContentEngagement.list("-created_date", 200),
    enabled: view === "stats",
  });

  const refresh = () => {
    sessionStorage.removeItem("all-things-new-items");
    queryClient.invalidateQueries({ queryKey: ["digital-content"] });
    queryClient.invalidateQueries({ queryKey: ["digital-content-public"] });
  };

  const openNew = (date = "") => { setEditItem(null); setDefaultDate(date); setModalOpen(true); };
  const openEdit = (item) => { setEditItem(item); setModalOpen(true); };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    await base44.entities.DigitalContent.delete(item.id);
    toast.success("Content deleted");
    refresh();
  };

  const now = Date.now();
  const views = [
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "list", label: "All Content", icon: LayoutList },
    { id: "stats", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>All Things New</h1>
          <p className="text-xs" style={{ color: t.textMuted }}>Schedule videos, posters & animations — they unlock automatically for users at the set day & time.</p>
        </div>
        <button onClick={() => openNew()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition active:scale-95"
          style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", color: "#0B0F1A" }}>
          <Plus size={14} /> Schedule Content
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {views.map(v => {
          const Icon = v.icon;
          const active = view === v.id;
          return (
            <button key={v.id} onClick={() => setView(v.id)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition"
              style={active
                ? { background: isDark ? "rgba(0,207,255,0.12)" : "rgba(11,63,217,0.1)", color: t.accent, border: `1px solid ${isDark ? "rgba(0,207,255,0.3)" : "rgba(11,63,217,0.25)"}` }
                : { color: t.textSecondary, background: "transparent", border: `1px solid ${t.border}` }}>
              <Icon size={13} /> {v.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: t.accent }} /></div>
      ) : view === "calendar" ? (
        <ContentScheduleCalendar items={items} onDayClick={openNew} onItemClick={openEdit} />
      ) : view === "stats" ? (
        <ContentStatsPanel items={items} engagements={engagements} />
      ) : (
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="rounded-2xl p-10 text-center" style={{ background: t.surface, border: `1px dashed ${t.border}` }}>
              <p className="text-sm font-bold mb-1" style={{ color: t.textPrimary }}>No content scheduled yet</p>
              <p className="text-xs" style={{ color: t.textMuted }}>Click "Schedule Content" to add your first video, poster or animation.</p>
            </div>
          )}
          {items.map(item => {
            const meta = typeMeta(item.content_type);
            const unlocked = new Date(item.scheduled_at).getTime() <= now;
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
                {item.thumbnail_url
                  ? <img src={item.thumbnail_url} className="w-14 h-14 rounded-xl object-cover shrink-0" alt="" />
                  : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${meta.color}15` }}>{meta.emoji}</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold truncate" style={{ color: t.textPrimary }}>{item.title}</p>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ background: `${meta.color}15`, color: meta.color }}>{meta.label}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: t.textSecondary }}>{item.language}</span>
                  </div>
                  <p className="text-[11px] mt-0.5 flex items-center gap-1.5" style={{ color: unlocked ? "#10B981" : t.textMuted }}>
                    {unlocked ? <Unlock size={10} /> : <Lock size={10} />}
                    {unlocked ? "Live" : "Locked"} · {new Date(item.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    <span style={{ color: t.textMuted }}>· {item.download_count || 0} downloads · {item.share_count || 0} shares</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(11,63,217,0.06)", color: t.textSecondary }}><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(item)} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ContentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
        item={editItem}
        defaultDate={defaultDate}
      />
    </div>
  );
}