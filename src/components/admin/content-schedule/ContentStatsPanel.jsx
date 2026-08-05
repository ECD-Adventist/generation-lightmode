import React, { useMemo } from "react";
import { Download, Share2 } from "lucide-react";
import { typeMeta } from "@/components/content-hub/contentConstants";
import { useAdminTheme, getAdminTokens } from "../AdminThemeContext";

export default function ContentStatsPanel({ items, engagements }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const totals = useMemo(() => ({
    downloads: items.reduce((s, i) => s + (i.download_count || 0), 0),
    shares: items.reduce((s, i) => s + (i.share_count || 0), 0),
  }), [items]);

  const ranked = useMemo(() =>
    [...items].sort((a, b) => ((b.download_count || 0) + (b.share_count || 0)) - ((a.download_count || 0) + (a.share_count || 0))),
  [items]);

  const card = { background: t.surface, border: `1px solid ${t.border}` };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4" style={card}>
          <div className="flex items-center gap-2 mb-1"><Download size={14} style={{ color: "#00CFFF" }} /><span className="text-[10px] font-black uppercase tracking-wider" style={{ color: t.textMuted }}>Total Downloads</span></div>
          <p className="text-2xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{totals.downloads}</p>
        </div>
        <div className="rounded-2xl p-4" style={card}>
          <div className="flex items-center gap-2 mb-1"><Share2 size={14} style={{ color: "#FFD000" }} /><span className="text-[10px] font-black uppercase tracking-wider" style={{ color: t.textMuted }}>Total Shares</span></div>
          <p className="text-2xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{totals.shares}</p>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={card}>
        <h3 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: t.textMuted }}>Performance by Content</h3>
        <div className="space-y-2">
          {ranked.length === 0 && <p className="text-xs" style={{ color: t.textMuted }}>No content yet.</p>}
          {ranked.map(item => {
            const meta = typeMeta(item.content_type);
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                {item.thumbnail_url
                  ? <img src={item.thumbnail_url} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                  : <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: `${meta.color}15` }}>{meta.emoji}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: t.textPrimary }}>{item.title}</p>
                  <p className="text-[10px]" style={{ color: t.textMuted }}>{meta.label} · {item.language}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[11px] font-bold">
                  <span className="flex items-center gap-1" style={{ color: "#00CFFF" }}><Download size={11} />{item.download_count || 0}</span>
                  <span className="flex items-center gap-1" style={{ color: "#FFD000" }}><Share2 size={11} />{item.share_count || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl p-4" style={card}>
        <h3 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: t.textMuted }}>Recent Activity (who downloaded / shared)</h3>
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {engagements.length === 0 && <p className="text-xs" style={{ color: t.textMuted }}>No activity recorded yet.</p>}
          {engagements.map(e => (
            <div key={e.id} className="flex items-center gap-2 text-[11px] rounded-lg px-2.5 py-2" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
              {e.action === "download" ? <Download size={11} style={{ color: "#00CFFF" }} className="shrink-0" /> : <Share2 size={11} style={{ color: "#FFD000" }} className="shrink-0" />}
              <span className="font-bold truncate" style={{ color: t.textPrimary }}>{e.user_name || e.user_email || "guest"}</span>
              <span style={{ color: t.textMuted }}>{e.action === "download" ? "downloaded" : `shared${e.platform ? ` on ${e.platform.replace("_", " ")}` : ""}`}</span>
              <span className="truncate flex-1" style={{ color: t.textSecondary }}>{e.content_title}</span>
              <span className="shrink-0" style={{ color: t.textMuted }}>{new Date(e.created_date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}