import React, { useMemo, useState } from "react";
import { Download, Share2, Eye, Repeat2, FileDown, TrendingUp } from "lucide-react";
import { typeMeta } from "@/components/content-hub/contentConstants";
import { useAdminTheme, getAdminTokens } from "../AdminThemeContext";
import ContentThumbnail from "@/components/content-hub/ContentThumbnail";
import { jsPDF } from "jspdf";

export default function ContentStatsPanel({ items, engagements }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const [exporting, setExporting] = useState(false);

  const repostEngagements = useMemo(() => engagements.filter(e => e.action === "share" && e.platform === "Base 1_feed"), [engagements]);

  const totals = useMemo(() => ({
    views: items.reduce((s, i) => s + (i.view_count || 0), 0),
    downloads: items.reduce((s, i) => s + (i.download_count || 0), 0),
    shares: items.reduce((s, i) => s + (i.share_count || 0), 0),
    reposts: repostEngagements.length,
  }), [items, repostEngagements]);

  const repostCountByItem = useMemo(() => {
    const map = {};
    repostEngagements.forEach(e => {
      const id = e.content_id;
      map[id] = (map[id] || 0) + 1;
    });
    return map;
  }, [repostEngagements]);

  const ranked = useMemo(() =>
    [...items].sort((a, b) => ((b.view_count || 0) + (b.download_count || 0) + (b.share_count || 0)) - ((a.view_count || 0) + (a.download_count || 0) + (a.share_count || 0))),
  [items]);

  const card = { background: t.surface, border: `1px solid ${t.border}` };

  const handleExportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 40;

      // Header band
      doc.setFillColor(11, 15, 26);
      doc.rect(0, 0, pageW, 80, "F");
      doc.setTextColor(0, 207, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("All Things New", margin, 35);
      doc.setFontSize(9);
      doc.setTextColor(200, 208, 224);
      doc.setFont("helvetica", "normal");
      doc.text("Content Performance Report", margin, 52);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 66);

      // Summary cards
      let y = 110;
      const cardW = (pageW - margin * 2 - 30) / 4;
      const stats = [
        { label: "Total Views", value: totals.views, color: [0, 207, 255] },
        { label: "Total Downloads", value: totals.downloads, color: [0, 207, 255] },
        { label: "Total Shares", value: totals.shares, color: [255, 208, 0] },
        { label: "Total Reposts", value: totals.reposts, color: [138, 92, 255] },
      ];
      stats.forEach((s, i) => {
        const x = margin + i * (cardW + 10);
        doc.setFillColor(18, 24, 38);
        doc.roundedRect(x, y, cardW, 60, 6, 6, "F");
        doc.setTextColor(...s.color);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(String(s.value), x + 10, y + 28);
        doc.setFontSize(7);
        doc.setTextColor(138, 155, 176);
        doc.setFont("helvetica", "normal");
        doc.text(s.label.toUpperCase(), x + 10, y + 48);
      });

      // Table header
      y = 210;
      doc.setFillColor(18, 24, 38);
      doc.rect(margin, y, pageW - margin * 2, 24, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(138, 155, 176);
      doc.text("CONTENT", margin + 10, y + 16);
      doc.text("VIEWS", pageW - margin - 200, y + 16);
      doc.text("DOWNLOADS", pageW - margin - 150, y + 16);
      doc.text("SHARES", pageW - margin - 95, y + 16);
      doc.text("REPOSTS", pageW - margin - 40, y + 16);

      // Table rows
      y += 24;
      doc.setFont("helvetica", "normal");
      ranked.forEach((item, idx) => {
        if (y > pageH - 40) {
          doc.addPage();
          y = margin;
        }
        if (idx % 2 === 0) {
          doc.setFillColor(18, 24, 38);
          doc.rect(margin, y, pageW - margin * 2, 20, "F");
        }
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        const title = item.title.length > 40 ? item.title.slice(0, 37) + "..." : item.title;
        doc.text(title, margin + 10, y + 13);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(138, 155, 176);
        doc.setFontSize(7);
        doc.text(`${typeMeta(item.content_type).label} · ${item.language || "—"}`, margin + 10, y + 19);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 207, 255);
        doc.text(String(item.view_count || 0), pageW - margin - 200, y + 15);
        doc.text(String(item.download_count || 0), pageW - margin - 150, y + 15);
        doc.setTextColor(255, 208, 0);
        doc.text(String(item.share_count || 0), pageW - margin - 95, y + 15);
        doc.setTextColor(138, 92, 255);
        doc.text(String(repostCountByItem[item.id] || 0), pageW - margin - 40, y + 15);
        y += 20;
      });

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(138, 155, 176);
      doc.text("© 2026 Generation LightMode. Faith. Always On.", margin, pageH - 20);

      doc.save(`all-things-new-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    }
    setExporting(false);
  };

  const statCards = [
    { label: "Total Views", value: totals.views, icon: <Eye size={14} />, color: "#00CFFF" },
    { label: "Total Downloads", value: totals.downloads, icon: <Download size={14} />, color: "#00CFFF" },
    { label: "Total Shares", value: totals.shares, icon: <Share2 size={14} />, color: "#FFD000" },
    { label: "Total Reposts", value: totals.reposts, icon: <Repeat2 size={14} />, color: "#8A5CFF" },
  ];

  return (
    <div className="space-y-4">
      {/* Header with export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} style={{ color: "#00CFFF" }} />
          <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: t.textPrimary }}>Performance Overview</h3>
        </div>
        <button onClick={handleExportPDF} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold transition active:scale-95 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #00CFFF, #8A5CFF)", color: "#0B0F1A" }}>
          <FileDown size={13} /> {exporting ? "Generating..." : "Download PDF Report"}
        </button>
      </div>

      {/* Stat cards — 4 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="rounded-2xl p-4 relative overflow-hidden" style={card}>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl pointer-events-none" style={{ background: s.color, opacity: 0.08 }} />
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: t.textMuted }}>{s.label}</span>
            </div>
            <p className="text-3xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Performance table */}
      <div className="rounded-2xl p-4" style={card}>
        <h3 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: t.textMuted }}>Performance by Content</h3>
        <div className="space-y-2">
          {ranked.length === 0 && <p className="text-xs" style={{ color: t.textMuted }}>No content yet.</p>}
          {ranked.map(item => {
            const meta = typeMeta(item.content_type);
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                  <ContentThumbnail item={{ ...item, unlocked: new Date(item.scheduled_at).getTime() <= Date.now() }} fallback={<div className="w-full h-full flex items-center justify-center text-sm" style={{ background: `${meta.color}15` }}><meta.icon className="w-4 h-4" style={{ color: meta.color }} /></div>} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: t.textPrimary }}>{item.title}</p>
                  <p className="text-[10px]" style={{ color: t.textMuted }}>{meta.label} · {item.language}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[11px] font-bold">
                  <span className="flex items-center gap-1" style={{ color: "#00CFFF" }}><Eye size={11} />{item.view_count || 0}</span>
                  <span className="flex items-center gap-1" style={{ color: "#00CFFF" }}><Download size={11} />{item.download_count || 0}</span>
                  <span className="flex items-center gap-1" style={{ color: "#FFD000" }}><Share2 size={11} />{item.share_count || 0}</span>
                  <span className="flex items-center gap-1" style={{ color: "#8A5CFF" }}><Repeat2 size={11} />{repostCountByItem[item.id] || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl p-4" style={card}>
        <h3 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: t.textMuted }}>Recent Activity (who viewed, downloaded, shared or reposted)</h3>
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {engagements.length === 0 && <p className="text-xs" style={{ color: t.textMuted }}>No activity recorded yet.</p>}
          {engagements.map(e => {
            const isRepost = e.action === "share" && e.platform === "Base 1_feed";
            const icon = e.action === "view" ? <Eye size={11} style={{ color: "#00CFFF" }} /> : e.action === "download" ? <Download size={11} style={{ color: "#00CFFF" }} /> : isRepost ? <Repeat2 size={11} style={{ color: "#8A5CFF" }} /> : <Share2 size={11} style={{ color: "#FFD000" }} />;
            const label = e.action === "view" ? "viewed" : e.action === "download" ? "downloaded" : isRepost ? "reposted to feed" : `shared${e.platform ? ` on ${e.platform.replace("_", " ")}` : ""}`;
            return (
              <div key={e.id} className="flex items-center gap-2 text-[11px] rounded-lg px-2.5 py-2" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                {icon}
                <span className="font-bold truncate" style={{ color: t.textPrimary }}>{e.user_name || e.user_email || "guest"}</span>
                <span style={{ color: t.textMuted }}>{label}</span>
                <span className="truncate flex-1" style={{ color: t.textSecondary }}>{e.content_title}</span>
                <span className="shrink-0" style={{ color: t.textMuted }}>{new Date(e.created_date).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}