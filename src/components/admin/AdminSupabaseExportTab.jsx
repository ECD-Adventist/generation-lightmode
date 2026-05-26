import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Database, Download, FileJson, FileSpreadsheet, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

const ENTITY_NAMES = [
  "User", "GlowDrop", "GlowDropLike", "GlowDropComment", "SavedDrop", "ReportedDrop", "ReportedComment",
  "Follow", "Notification", "Story", "StoryReaction", "StoryView", "GlowGroup", "GlowGroupMember",
  "GlowGroupJoinRequest", "GlowGroupMessage", "GlowGroupMessageReaction", "GlowGroupEvent", "GlowGroupEventRSVP",
  "GlowGroupResource", "GroupDevotional", "GroupDevotionalRead", "GroupSession", "GroupSessionMessage",
  "GroupSessionSignal", "Challenge", "ChallengeSubmission", "UserDailyChallenge", "PrayerRequest", "PrayerSupport",
  "PrayerComment", "StudyPlan", "GroupStudyPlan", "UserStudyProgress", "Certificate", "Badge", "CodeOfTruth",
  "CodeEngagement", "DailyCode", "DevotionEntry", "DirectConversation", "DirectMessage", "LiveSession",
  "LiveSignal", "LiveComment", "LiveReaction", "Institution", "InstitutionPage", "InstitutionApplication",
  "ComplianceAudit", "TerritoryMemberClaim", "TerritoryPhoto", "TerritoryPhotoReaction", "TerritoryLeaderboard",
  "TerritoryAlert", "CountryStats", "AdminLog", "AdminPermission", "AssistantKnowledge", "CommunityMoment",
  "ScheduledPost", "Kit100Settings", "LeaderboardSeason", "ManagedLeaderAccount", "BlockedUser"
];

export default function AdminSupabaseExportTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const [format, setFormat] = useState("json");
  const [selected, setSelected] = useState(ENTITY_NAMES);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggleEntity = (name) => {
    setSelected((prev) => prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]);
  };

  const downloadFile = (file) => {
    const blob = new Blob([file.content], { type: file.mime_type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    result?.files?.forEach(downloadFile);
    toast.success("Downloads started");
  };

  const handleExport = async () => {
    setLoading(true);
    setResult(null);
    const response = await base44.functions.invoke("exportSupabaseReadyData", {
      format,
      entity_names: selected
    });
    setResult(response.data);
    setLoading(false);
    toast.success("Export files are ready");
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 border text-xs font-bold rounded-full mb-3 uppercase tracking-widest"
          style={{ background: isDark ? "rgba(0,207,255,0.1)" : "#EAF7FF", borderColor: isDark ? "rgba(0,207,255,0.2)" : "#B8E5FF", color: isDark ? "#00CFFF" : "#0B3FD9" }}>
          <ShieldCheck size={12} /> Admin Export Tool
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] flex items-center gap-3" style={{ color: t.textPrimary }}>
          <Database className="w-7 h-7" style={{ color: t.accent }} /> Supabase Migration Export
        </h1>
        <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>
          Generate Supabase-ready JSON or CSV files from your Base44 database. Import these files into matching Supabase tables.
        </p>
      </div>

      <div className="border rounded-2xl p-5 space-y-5" style={{ background: t.surface, borderColor: t.border }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold" style={{ color: t.textPrimary }}>Export format</h3>
            <p className="text-xs mt-1" style={{ color: t.textMuted }}>JSON keeps nested fields intact. CSV is useful for table imports.</p>
          </div>
          <div className="flex gap-2">
            {[
              { id: "json", label: "JSON", icon: FileJson },
              { id: "csv", label: "CSV", icon: FileSpreadsheet }
            ].map((item) => {
              const Icon = item.icon;
              const active = format === item.id;
              return (
                <button key={item.id} onClick={() => setFormat(item.id)} className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition"
                  style={active ? { background: t.gradient, color: "#FFFFFF" } : { background: t.surfaceMuted, color: t.textSecondary, border: `1px solid ${t.border}` }}>
                  <Icon className="w-4 h-4" /> {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold" style={{ color: t.textPrimary }}>Entities to export</h3>
            <div className="flex gap-2">
              <button onClick={() => setSelected(ENTITY_NAMES)} className="text-xs font-bold" style={{ color: t.accent }}>Select all</button>
              <button onClick={() => setSelected([])} className="text-xs font-bold" style={{ color: t.textMuted }}>Clear</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
            {ENTITY_NAMES.map((name) => (
              <label key={name} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm cursor-pointer" style={{ background: selectedSet.has(name) ? t.accentSoft : t.surfaceMuted, border: `1px solid ${selectedSet.has(name) ? t.borderStrong : t.border}`, color: t.textPrimary }}>
                <input type="checkbox" checked={selectedSet.has(name)} onChange={() => toggleEntity(name)} />
                <span className="truncate">{name}</span>
              </label>
            ))}
          </div>
        </div>

        <Button disabled={loading || selected.length === 0} onClick={handleExport} className="w-full md:w-auto font-bold rounded-xl px-6" style={{ background: t.gradient, color: "#FFFFFF", border: "none" }}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          {loading ? "Preparing export..." : `Generate ${selected.length} export files`}
        </Button>
      </div>

      {result?.files?.length > 0 && (
        <div className="border rounded-2xl p-5 space-y-4" style={{ background: t.surface, borderColor: t.border }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold" style={{ color: t.textPrimary }}>Export ready</h3>
              <p className="text-xs mt-1" style={{ color: t.textMuted }}>{result.files.length} files generated, including a migration manifest.</p>
            </div>
            <Button onClick={downloadAll} className="font-bold rounded-xl" style={{ background: t.gradient, color: "#FFFFFF", border: "none" }}>
              <Download className="w-4 h-4 mr-2" /> Download all
            </Button>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {result.files.map((file) => (
              <div key={file.filename} className="flex items-center justify-between gap-3 rounded-xl p-3" style={{ background: t.surfaceMuted, border: `1px solid ${t.border}` }}>
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: t.textPrimary }}>{file.filename}</div>
                  <div className="text-xs" style={{ color: t.textMuted }}>{file.row_count} rows · table: {file.table_name}</div>
                </div>
                <button onClick={() => downloadFile(file)} className="text-xs font-bold shrink-0" style={{ color: t.accent }}>Download</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}